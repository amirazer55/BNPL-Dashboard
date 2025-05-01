from rest_framework import serializers
from .models import PaymentPlan, Installment
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = ['id', 'payment_plan', 'amount', 'due_date', 'status', 'created_at', 'updated_at']
        read_only_fields = ['status']

    def validate(self, attrs):
        if self.instance and self.instance.status == 'PAID':
            raise serializers.ValidationError("Cannot modify a paid installment")
        return attrs

class PaymentPlanSerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    paid_installments = serializers.SerializerMethodField()
    total_installments = serializers.SerializerMethodField()
    user_email = serializers.EmailField(write_only=True, required=True)

    class Meta:
        model = PaymentPlan
        fields = ['id', 'merchant', 'user', 'user_email', 'name', 'description', 'total_amount', 
                 'number_of_installments', 'interest_rate', 'start_date', 'status',
                 'created_at', 'updated_at', 'installments', 'paid_installments', 
                 'total_installments']
        read_only_fields = ['merchant', 'status', 'user']

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

    def validate_user_email(self, value):
        try:
            user = User.objects.get(email=value)
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist")

    def validate(self, attrs):
        if not attrs.get('name'):
            raise serializers.ValidationError({"name": "Name is required"})
        if not attrs.get('description'):
            raise serializers.ValidationError({"description": "Description is required"})
        if not attrs.get('user_email'):
            raise serializers.ValidationError({"user_email": "User email is required"})
        return attrs

    def create(self, validated_data):
        user_email = validated_data.pop('user_email')
        user = User.objects.get(email=user_email)
        validated_data['user'] = user
        return super().create(validated_data) 