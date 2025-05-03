from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentPlanViewSet, InstallmentViewSet, UserListView

router = DefaultRouter()
router.register(r'plans', PaymentPlanViewSet, basename='payment-plan')
router.register(r'installments', InstallmentViewSet, basename='installment')

urlpatterns = [
    path('', include(router.urls)),
    path('users/', UserListView.as_view(), name='user-list'),
] 