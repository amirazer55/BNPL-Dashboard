from rest_framework import serializers
from .models import PaymentPlan, Installment
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class InstallmentSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    payment_plan_name = serializers.CharField(source='payment_plan.name', read_only=True)
    payment_plan_id = serializers.IntegerField(source='payment_plan.id', read_only=True)
    
    class Meta:
        model = Installment
        fields = ['id', 'payment_plan', 'payment_plan_id', 'payment_plan_name', 'user', 'user_email', 'amount', 'due_date', 'status', 'created_at', 'updated_at']
        read_only_fields = ['status', 'user_email', 'payment_plan_name', 'payment_plan_id']

    def validate(self, attrs):
        if self.instance and self.instance.status == 'PAID':
            raise serializers.ValidationError("Cannot modify a paid installment")
        return attrs

class PaymentPlanSerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    paid_installments = serializers.SerializerMethodField()
    total_installments = serializers.SerializerMethodField()
    user_emails = serializers.ListField(
        child=serializers.EmailField(),
        write_only=True,
        required=True
    )

    class Meta:
        model = PaymentPlan
        fields = ['id', 'merchant', 'users', 'user_emails', 'name', 'description', 'total_amount', 
                 'number_of_installments', 'start_date', 'status',
                 'created_at', 'updated_at', 'installments', 'paid_installments', 
                 'total_installments']
        read_only_fields = ['merchant', 'status', 'users']

    def get_paid_installments(self, obj):
        return obj.installments.filter(status='PAID').count()

    def get_total_installments(self, obj):
        return obj.installments.count()

    def validate_total_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Total amount must be greater than 0")
        return value

    def validate_number_of_installments(self, value):
        if value <= 0:
            raise serializers.ValidationError("Number of installments must be greater than 0")
        return value

    def validate_start_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Start date cannot be in the past")
        return value

    def validate_user_emails(self, value):
        users = []
        for email in value:
            try:
                user = User.objects.get(email=email)
                if user.is_merchant:
                    raise serializers.ValidationError(f"User {email} is a merchant and cannot be added to a payment plan")
                users.append(user)
            except User.DoesNotExist:
                raise serializers.ValidationError(f"User with email {email} does not exist")
        return users

    def validate(self, attrs):
        if not attrs.get('name'):
            raise serializers.ValidationError({"name": "Name is required"})
        if not attrs.get('description'):
            raise serializers.ValidationError({"description": "Description is required"})
        if not attrs.get('user_emails'):
            raise serializers.ValidationError({"user_emails": "At least one user email is required"})
        return attrs

    def create(self, validated_data):
        user_emails = validated_data.pop('user_emails')
        # Create the payment plan without merchant (it's set in the view)
        payment_plan = PaymentPlan.objects.create(**validated_data)
        payment_plan.users.set(user_emails)
        return payment_plan 