export interface User {
  id: number;
  email: string;
  username: string;
  is_merchant: boolean;
  is_active: boolean;
}

export interface PaymentPlan {
  id: number;
  name: string;
  description: string;
  total_amount: number;
  number_of_installments: number;
  start_date: string;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
  merchant: User;
  user: User;
  created_at: string;
  updated_at: string;
}

export interface Installment {
  id: number;
  payment_plan: number;
  amount: number;
  due_date: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  created_at: string;
  updated_at: string;
}

export interface UserStatistic {
  user_id: number;
  user_email: string;
  plan_id: number;
  plan_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  paid_installments: number;
  total_installments: number;
  payment_progress: number;
  status: string;
}

export interface Analytics {
  total_revenue: number;
  overdue_plans: number;
  success_rate: number;
  total_plans: number;
  completed_plans: number;
  user_statistics: UserStatistic[];
}

export interface AuthResponse {
  refresh: string;
  access: string;
  user: User;
}
