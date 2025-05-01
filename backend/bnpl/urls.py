from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentPlanViewSet, InstallmentViewSet

router = DefaultRouter()
router.register(r'payment-plans', PaymentPlanViewSet, basename='payment-plan')
router.register(r'installments', InstallmentViewSet, basename='installment')

urlpatterns = [
    path('', include(router.urls)),
] 