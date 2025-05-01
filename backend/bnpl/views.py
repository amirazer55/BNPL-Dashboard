from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import PaymentPlan, Installment
from .serializers import PaymentPlanSerializer, InstallmentSerializer

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
        return obj.payment_plan.user == request.user

class PaymentPlanViewSet(viewsets.ModelViewSet):
    queryset = PaymentPlan.objects.all()
    serializer_class = PaymentPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_merchant:
            return PaymentPlan.objects.filter(merchant=self.request.user)
        return PaymentPlan.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(merchant=self.request.user)

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        payment_plan = self.get_object()
        installments = payment_plan.installments.all()
        
        total_revenue = installments.filter(status='PAID').aggregate(
            total=Sum('amount')
        )['total'] or 0

        overdue_count = installments.filter(status='OVERDUE').count()
        total_count = installments.count()
        success_rate = (total_count - overdue_count) / total_count * 100 if total_count > 0 else 0

        return Response({
            'total_revenue': total_revenue,
            'overdue_count': overdue_count,
            'success_rate': success_rate,
        })

class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.all()
    serializer_class = InstallmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlanUser]

    def get_queryset(self):
        return Installment.objects.filter(payment_plan__user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        installment = self.get_object()
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
            payment_plan__user=request.user,
            status='PENDING',
            due_date__gte=timezone.now().date()
        ).order_by('due_date')
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        overdue = Installment.objects.filter(
            payment_plan__user=request.user,
            status='OVERDUE'
        ).order_by('due_date')
        serializer = self.get_serializer(overdue, many=True)
        return Response(serializer.data)
