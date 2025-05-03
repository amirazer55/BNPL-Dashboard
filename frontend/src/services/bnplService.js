import axios from "axios";
import authHeader from "../utils/authHeader";
import authService from "./authService";

const API_URL = "http://localhost:8000/api/bnpl";

// Create axios instance with interceptor
const axiosInstance = axios.create();

// Add response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await authService.refreshToken();

        // Retry the original request with new token
        originalRequest.headers = authHeader();
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const bnplService = {
  // Payment Plan endpoints
  getPaymentPlans: async () => {
    const response = await axiosInstance.get(`${API_URL}/payment-plans/`, {
      headers: authHeader(),
    });
    return response.data;
  },

  createPaymentPlan: async (data) => {
    const response = await axiosInstance.post(
      `${API_URL}/payment-plans/`,
      data,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },

  getMerchantAnalytics: async () => {
    const response = await axiosInstance.get(
      `${API_URL}/payment-plans/analytics/`,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },

  // Installment endpoints
  getInstallments: async () => {
    const response = await axiosInstance.get(`${API_URL}/installments/`, {
      headers: authHeader(),
    });
    return response.data;
  },

  getUpcomingInstallments: async () => {
    const response = await axiosInstance.get(
      `${API_URL}/installments/upcoming/`,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },

  getOverdueInstallments: async () => {
    const response = await axiosInstance.get(
      `${API_URL}/installments/overdue/`,
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },

  markInstallmentAsPaid: async (installmentId) => {
    const response = await axiosInstance.post(
      `${API_URL}/installments/${installmentId}/mark_as_paid/`,
      {},
      {
        headers: authHeader(),
      }
    );
    return response.data;
  },
};

export default bnplService;
