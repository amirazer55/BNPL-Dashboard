from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from time import sleep

User = get_user_model()

class PaymentPlan(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('OVERDUE', 'Overdue'),
    ]

    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='merchant_plans')
    users = models.ManyToManyField(User, related_name='user_plans')
    name = models.CharField(max_length=100)
    description = models.TextField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    number_of_installments = models.PositiveIntegerField()
    start_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.merchant.username}"

    def verify_installments(self):
        """Verify that all installments are correctly created for all users."""
        try:
            # First check if there are any users
            if not self.users.exists():
                return False, "No users assigned to this payment plan"

            # Check if all users have installments
            for user in self.users.all():
                user_installments = self.installments.filter(user=user)
                if user_installments.count() != self.number_of_installments:
                    # Try to create missing installments
                    try:
                        self._create_missing_installments(user)
                        # Recheck after creation
                        user_installments = self.installments.filter(user=user)
                        if user_installments.count() != self.number_of_installments:
                            return False, f"User {user.email} has {user_installments.count()} installments, expected {self.number_of_installments}"
                    except Exception as e:
                        return False, f"Failed to create missing installments for user {user.email}: {str(e)}"

                # Check each user's total installment amount matches plan amount
                user_total = sum(float(i.amount) for i in user_installments)
                if abs(user_total - float(self.total_amount)) > 0.01:  # Allow for small floating point differences
                    return False, f"User {user.email}'s total installment amount ({user_total}) does not match plan amount ({self.total_amount})"

            # Check all installments have a user
            if self.installments.filter(user__isnull=True).exists():
                return False, "Some installments have no user assigned"

            return True, "All installments verified successfully"
        except Exception as e:
            return False, f"Error verifying installments: {str(e)}"

    def _create_missing_installments(self, user):
        """Create missing installments for a user."""
        existing_installments = self.installments.filter(user=user).count()
        if existing_installments >= self.number_of_installments:
            return

        # Calculate installment amount (full amount per user)
        installment_amount = self.total_amount / self.number_of_installments
        
        # Create missing installments
        for i in range(existing_installments, self.number_of_installments):
            due_date = self.start_date + timedelta(days=30 * (i + 1))
            Installment.objects.create(
                payment_plan=self,
                user=user,
                amount=installment_amount,
                due_date=due_date
            )

    def update_status(self):
        all_users_completed = True
        any_user_overdue = False

        for user in self.users.all():
            user_installments = self.installments.filter(user=user)
            if not all(i.status == 'PAID' for i in user_installments):
                all_users_completed = False
            if any(i.status == 'OVERDUE' for i in user_installments):
                any_user_overdue = True

        if all_users_completed:
            self.status = 'COMPLETED'
        elif any_user_overdue:
            self.status = 'OVERDUE'
        else:
            self.status = 'ACTIVE'
        self.save()

class Installment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]

    payment_plan = models.ForeignKey(PaymentPlan, on_delete=models.CASCADE, related_name='installments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='installments', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Installment {self.id} - {self.payment_plan.name} - {self.amount}"

    def check_overdue(self):
        if self.status == 'PENDING' and self.due_date < timezone.now().date():
            self.status = 'OVERDUE'
            self.save()
            self.payment_plan.update_status()

@receiver(post_save, sender=PaymentPlan)
def create_installments(sender, instance, created, **kwargs):
    if created:
        try:
            # Wait a moment to ensure users are set
            sleep(0.1)  # Small delay to ensure users are set
            
            # Validate the payment plan has users
            if not instance.users.exists():
                print("Warning: Payment plan created without users. Waiting for users to be set...")
                return

            # Calculate installment amount (full amount per user)
            installment_amount = instance.total_amount / instance.number_of_installments
            
            # Create installments for each user
            for user in instance.users.all():
                for i in range(instance.number_of_installments):
                    due_date = instance.start_date + timedelta(days=30 * (i + 1))
                    installment = Installment.objects.create(
                        payment_plan=instance,
                        user=user,
                        amount=installment_amount,
                        due_date=due_date
                    )
                    # Verify the installment was created correctly
                    if not installment.id:
                        raise ValueError(f"Failed to create installment for user {user.email}")

            # Verify all installments were created
            total_expected_installments = instance.users.count() * instance.number_of_installments
            actual_installments = instance.installments.count()
            
            if total_expected_installments != actual_installments:
                raise ValueError(
                    f"Installment count mismatch. Expected: {total_expected_installments}, "
                    f"Created: {actual_installments}"
                )

            # Verify each user has the correct number of installments
            for user in instance.users.all():
                user_installments = instance.installments.filter(user=user).count()
                if user_installments != instance.number_of_installments:
                    raise ValueError(
                        f"User {user.email} has {user_installments} installments, "
                        f"expected {instance.number_of_installments}"
                    )

            print(f"Successfully created {actual_installments} installments for payment plan {instance.name}")

        except Exception as e:
            # Log the error and raise it
            print(f"Error creating installments: {str(e)}")
            raise e
