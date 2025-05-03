# BNPL Dashboard

A comprehensive Buy Now Pay Later (BNPL) dashboard application that allows merchants to create payment plans and users to manage their installments.

## Table of Contents

- [Features](#features)
- [Security Measures](#security-measures)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
- [Technologies Used](#technologies-used)
- [Technical Implementation Details](#technical-implementation-details)
- [Example Flows](#example-flows)

## Features

### Merchant Features

- **Payment Plan Management**

  - Create payment plans with customizable parameters
    - Set total amount (e.g., 1000)
    - Configure number of installments (e.g., 4 monthly payments)
    - Set start date
    - Add multiple users via email
  - Automatic installment creation
    - Equal split of total amount
    - Monthly due dates calculation
    - Validation of total amounts
  - View and manage all created payment plans
  - Payment plan status tracking (Active, Completed, Overdue)

- **Analytics Dashboard**

  - View total revenue from all paid installments
  - Track overdue payment plans
  - Monitor success rate of payment plans
  - Detailed user statistics per payment plan
    - Individual user payment progress
    - Paid vs total installments
    - Remaining amount calculations
  - Payment progress tracking per user

- **User Management**
  - View list of all non-merchant users
  - Add users to payment plans
  - Monitor user payment progress

### User Features

- **Installment Management**

  - View all assigned installments
  - Mark installments as paid
  - Track payment progress
  - View upcoming and overdue installments
  - Automatic status updates (Pending, Paid, Overdue)

- **Payment Plan Overview**
  - View all payment plans assigned to the user
  - Track total amount and remaining balance
  - Monitor installment status and due dates
  - Progress visualization with progress bars

## Example Flows

### 1. Merchant Creates a Payment Plan

1. Merchant logs in and navigates to the dashboard
2. Clicks "Create Plan" button
3. Enters plan details:
   ```
   Name: "Summer Collection"
   Total Amount: 1000
   Number of Installments: 4
   Start Date: 2024-06-01
   Users: [user1@example.com, user2@example.com]
   ```
4. System automatically:
   - Creates the payment plan
   - Generates 4 installments of 250 each
   - Sets due dates (monthly from start date)
   - Assigns installments to each user

### 2. User Manages Installments

1. User logs in and sees their dashboard
2. Views all payment plans they're part of
3. For each plan:
   - Sees progress bar (e.g., "2/4 installments paid")
   - Views list of installments with:
     - Amount (250)
     - Due date
     - Status (Pending/Paid/Overdue)
4. Can mark pending installments as paid
5. System automatically:
   - Updates installment status
   - Updates payment plan status
   - Recalculates progress

### 3. Merchant Monitors Progress

1. Merchant views analytics dashboard
2. Sees overview of all plans:
   ```
   Total Revenue: 500 
   Active Plans: 3
   Overdue Plans: 1
   Success Rate: 75%
   ```
3. Drills down to specific plan:
   ```
   Plan: "Summer Collection"
   Total Amount: 1000 
   Paid Amount: 500
   Remaining: 500 
   Status: Active
   User Progress:
   - user1@example.com: 2/4 paid
   - user2@example.com: 0/4 paid
   ```

## Security Measures

### Authentication & Authorization

- **JWT-based Authentication**

  - Secure token-based authentication
  - Token refresh mechanism
  - Automatic token blacklisting for logged-out users
  - Axios interceptors for automatic token refresh

- **Role-Based Access Control**
  - Merchant-specific routes and actions
  - User-specific data access
  - Permission-based API endpoints
  - Custom permission classes:
    ```python
    class IsMerchant(permissions.BasePermission):
        def has_permission(self, request, view):
            return request.user and request.user.is_authenticated
        def has_object_permission(self, request, view, obj):
            return obj.merchant == request.user
    ```

### Route Protection

- **Backend Protection**

  - Custom permission classes:
    - `IsMerchant`: Ensures only merchants can access merchant-specific features
    - `IsPlanUser`: Verifies users can only access their own payment plans and installments
  - View-level permission checks
  - Object-level permission validation
  - Query filtering in get_queryset methods:
    ```python
    def get_queryset(self):
        if self.request.user.is_merchant:
            return PaymentPlan.objects.filter(merchant=self.request.user)
        else:
            return PaymentPlan.objects.filter(users=self.request.user)
    ```

- **Frontend Protection**
  - Protected route components
  - Role-based navigation
  - Automatic redirection for unauthorized access
  - Context-based authentication checks

### Data Security

- **Data Filtering**

  - Users can only view their own installments
  - Merchants can only view their created payment plans
  - Installment modifications restricted to owners
  - Payment plan verification restricted to authorized users
  - Automatic installment status updates

- **Input Validation**
  - Comprehensive form validation
  - Data type checking
  - Amount verification
  - Date validation
  - User email validation
  - Merchant validation in payment plans

## Project Structure

### Backend Structure

```
backend/
├── accounts/                 # User authentication and management
│   ├── models.py            # Custom user model
│   ├── serializers.py       # User serializers
│   └── views.py             # Authentication views
├── bnpl/                    # Core BNPL functionality
│   ├── models.py            # PaymentPlan and Installment models
│   ├── serializers.py       # Data serialization
│   ├── views.py             # API endpoints
│   └── urls.py              # URL routing
└── config/                  # Project configuration
    ├── settings.py          # Django settings
    └── urls.py              # Main URL configuration
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React context providers
│   ├── pages/              # Main application pages
│   ├── services/           # API service functions
│   └── utils/              # Utility functions
└── public/                 # Static assets
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Token refresh

### Payment Plan Endpoints

- `GET /api/bnpl/plans/` - List payment plans
- `POST /api/bnpl/plans/` - Create payment plan
- `GET /api/bnpl/plans/{id}/` - Get plan details
- `GET /api/bnpl/plans/analytics/` - Get merchant analytics
- `GET /api/bnpl/plans/{id}/verify_installments/` - Verify plan installments

### Installment Endpoints

- `GET /api/bnpl/installments/` - List installments
- `POST /api/bnpl/installments/{id}/mark_as_paid/` - Mark installment as paid
- `GET /api/bnpl/installments/upcoming/` - Get upcoming installments
- `GET /api/bnpl/installments/overdue/` - Get overdue installments

## Technical Implementation Details

### Models

#### PaymentPlan Model

```python
class PaymentPlan(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('OVERDUE', 'Overdue'),
    ]

    merchant = models.ForeignKey(User, on_delete=models.CASCADE)
    users = models.ManyToManyField(User)
    name = models.CharField(max_length=100)
    description = models.TextField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    number_of_installments = models.PositiveIntegerField()
    start_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
```

#### Installment Model

```python
class Installment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]

    payment_plan = models.ForeignKey(PaymentPlan, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
```

### Key Features Implementation

#### Automatic Installment Creation

- Post-save signal handler for PaymentPlan
- Creates installments for each user
- Calculates due dates based on start date
- Validates installment creation

#### Status Management

- Automatic status updates for installments
- Payment plan status updates based on installments
- Overdue detection and status changes

#### Analytics Calculation

- Revenue calculation from paid installments
- Success rate calculation
- User-specific statistics
- Progress tracking

## Setup Instructions

### Backend Setup

1. Create and activate virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run migrations:

   ```bash
   python manage.py migrate
   ```

4. Create superuser:

   ```bash
   python manage.py createsuperuser
   ```

5. Run development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

## Technologies Used

### Backend

- Django
- Django REST Framework
- Django REST Framework Simple JWT
- SQLite (Development)
- PostgreSQL (Production-ready)

### Frontend

- React
- Material-UI
- Axios
- React Router
- Context API

### Development Tools

- Git
- VS Code
- Postman (API testing)
