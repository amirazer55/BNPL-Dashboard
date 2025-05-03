import axios from "axios";
import { PaymentPlan, Installment, Analytics } from "../types";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const bnplService = {
  // Payment Plans
  getPaymentPlans: async (): Promise<PaymentPlan[]> => {
    const response = await axios.get(`${API_URL}/bnpl/payment-plans/`);
    return response.data;
  },

  getPaymentPlan: async (id: number): Promise<PaymentPlan> => {
    const response = await axios.get(`${API_URL}/bnpl/payment-plans/${id}/`);
    return response.data;
  },

  createPaymentPlan: async (
    data: Partial<PaymentPlan>
  ): Promise<PaymentPlan> => {
    const response = await axios.post(`${API_URL}/bnpl/payment-plans/`, data);
    return response.data;
  },

  updatePaymentPlan: async (
    id: number,
    data: Partial<PaymentPlan>
  ): Promise<PaymentPlan> => {
    const response = await axios.put(
      `${API_URL}/bnpl/payment-plans/${id}/`,
      data
    );
    return response.data;
  },

  deletePaymentPlan: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/bnpl/payment-plans/${id}/`);
  },

  // Installments
  getInstallments: async (planId: number): Promise<Installment[]> => {
    const response = await axios.get(
      `${API_URL}/bnpl/payment-plans/${planId}/installments/`
    );
    return response.data;
  },

  createInstallment: async (
    planId: number,
    data: Partial<Installment>
  ): Promise<Installment> => {
    const response = await axios.post(
      `${API_URL}/bnpl/payment-plans/${planId}/installments/`,
      data
    );
    return response.data;
  },

  updateInstallment: async (
    planId: number,
    installmentId: number,
    data: Partial<Installment>
  ): Promise<Installment> => {
    const response = await axios.put(
      `${API_URL}/bnpl/payment-plans/${planId}/installments/${installmentId}/`,
      data
    );
    return response.data;
  },

  deleteInstallment: async (
    planId: number,
    installmentId: number
  ): Promise<void> => {
    await axios.delete(
      `${API_URL}/bnpl/payment-plans/${planId}/installments/${installmentId}/`
    );
  },

  // Analytics
  getMerchantAnalytics: async (): Promise<Analytics> => {
    const response = await axios.get(
      `${API_URL}/bnpl/payment-plans/analytics/`
    );
    return response.data;
  },
};

export default bnplService;
