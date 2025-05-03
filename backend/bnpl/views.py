from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import PaymentPlan, Installment
from .serializers import PaymentPlanSerializer, InstallmentSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework import serializers

User = get_user_model()

# Create your views here.

class IsMerchant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return obj.merchant == request.user

class IsPlanUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, PaymentPlan):
            return request.user in obj.users.all()
        elif isinstance(obj, Installment):
            return request.user == obj.user and request.user in obj.payment_plan.users.all()
        return False

class PaymentPlanViewSet(viewsets.ModelViewSet):
    queryset = PaymentPlan.objects.all()
    serializer_class = PaymentPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_merchant:
            # Merchants can see their own plans
            return PaymentPlan.objects.filter(merchant=self.request.user)
        else:
            # Regular users can only see plans they're part of
            return PaymentPlan.objects.filter(users=self.request.user)

    def perform_create(self, serializer):
        payment_plan = serializer.save(merchant=self.request.user)
        # Verify installments after creation
        is_valid, message = payment_plan.verify_installments()
        if not is_valid:
            raise serializers.ValidationError(message)

    @action(detail=True, methods=['get'])
    def verify_installments(self, request, pk=None):
        payment_plan = self.get_object()
        # Check if user has permission to verify
        if not (request.user.is_merchant and payment_plan.merchant == request.user) and request.user not in payment_plan.users.all():
            return Response(
                {'error': 'You do not have permission to verify this plan'},
                status=status.HTTP_403_FORBIDDEN
            )
        is_valid, message = payment_plan.verify_installments()
        if is_valid:
            return Response({'status': 'success', 'message': message})
        return Response({'status': 'error', 'message': message}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        if not request.user.is_merchant:
            return Response(
                {'error': 'Only merchants can access analytics'},
                status=status.HTTP_403_FORBIDDEN
            )

        merchant_plans = PaymentPlan.objects.filter(merchant=request.user)
        total_plans = merchant_plans.count()
        
        # Calculate total revenue from paid installments
        total_revenue = Installment.objects.filter(
            payment_plan__in=merchant_plans,
            status='PAID'
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Count overdue plans
        overdue_plans = merchant_plans.filter(status='OVERDUE').count()

        # Calculate success rate (completed plans / total plans)
        completed_plans = merchant_plans.filter(status='COMPLETED').count()
        success_rate = (completed_plans / total_plans * 100) if total_plans > 0 else 0

        # Get user statistics
        user_stats = []
        for plan in merchant_plans:
            for user in plan.users.all():
                # Get only the installments for this specific user
                user_installments = plan.installments.filter(user=user)
                paid_installments = user_installments.filter(status='PAID').count()
                total_installments = user_installments.count()
                paid_amount = user_installments.filter(status='PAID').aggregate(total=Sum('amount'))['total'] or 0
                
                user_stats.append({
                    'user_id': user.id,
                    'user_email': user.email,
                    'plan_id': plan.id,
                    'plan_name': plan.name,
                    'total_amount': plan.total_amount,
                    'paid_amount': paid_amount,
                    'remaining_amount': plan.total_amount - paid_amount,
                    'paid_installments': paid_installments,
                    'total_installments': total_installments,
                    'payment_progress': (paid_installments / total_installments * 100) if total_installments > 0 else 0,
                    'status': plan.status
                })

        return Response({
            'total_revenue': total_revenue,
            'overdue_plans': overdue_plans,
            'success_rate': round(success_rate, 2),
            'total_plans': total_plans,
            'completed_plans': completed_plans,
            'user_statistics': user_stats
        })

class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlanUser]

    def get_queryset(self):
        # Users can only see their own installments
        return Installment.objects.filter(
            payment_plan__users=self.request.user,
            user=self.request.user
        )

    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        # Get the specific installment for this user
        installment = Installment.objects.filter(
            id=pk,
            payment_plan__users=request.user,
            user=request.user
        ).first()
        
        if not installment:
            return Response(
                {'error': 'Installment not found or you do not have permission to modify it'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        if installment.status == 'PAID':
            return Response(
                {'error': 'Installment is already paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        installment.status = 'PAID'
        installment.save()
        installment.payment_plan.update_status()
        return Response({'status': 'Installment marked as paid'})

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        upcoming = Installment.objects.filter(
            payment_plan__users=request.user,
            user=request.user,
            status='PENDING',
            due_date__gte=timezone.now().date()
        ).order_by('due_date')
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        overdue = Installment.objects.filter(
            payment_plan__users=request.user,
            user=request.user,
            status='OVERDUE'
        ).order_by('due_date')
        serializer = self.get_serializer(overdue, many=True)
        return Response(serializer.data)

class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_merchant:
            return Response(
                {'error': 'Only merchants can view the user list'},
                status=status.HTTP_403_FORBIDDEN
            )
        users = User.objects.filter(is_merchant=False)
        return Response([{'id': user.id, 'email': user.email} for user in users])
