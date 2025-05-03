from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class PaymentPlan(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('OVERDUE', 'Overdue'),
    ]

    merchant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='merchant_plans')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_plans', default=1)
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

    def update_status(self):
        installments = self.installments.all()
        if all(i.status == 'PAID' for i in installments):
            self.status = 'COMPLETED'
        elif any(i.status == 'OVERDUE' for i in installments):
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
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Installment {self.id} - {self.payment_plan.user.email} - {self.amount}"

    def check_overdue(self):
        if self.status == 'PENDING' and self.due_date < timezone.now().date():
            self.status = 'OVERDUE'
            self.save()
            self.payment_plan.update_status()

@receiver(post_save, sender=PaymentPlan)
def create_installments(sender, instance, created, **kwargs):
    if created:
        installment_amount = (instance.total_amount) / instance.number_of_installments
        for i in range(instance.number_of_installments):
            due_date = instance.start_date + timedelta(days=30 * (i + 1))
            Installment.objects.create(
                payment_plan=instance,
                amount=installment_amount,
                due_date=due_date
            )
