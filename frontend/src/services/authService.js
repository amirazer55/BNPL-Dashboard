import axios from "axios";

const API_URL = "http://localhost:8000/api";

const authService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/accounts/token/`, {
        email,
        password,
      });

      if (response.data.access) {
        // Store token and user data
        const userData = {
          access: response.data.access,
          refresh: response.data.refresh,
          user: {
            email: response.data.email,
            is_merchant: response.data.is_merchant,
          },
        };
        localStorage.setItem("user", JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          if (error.response.data.detail) {
            throw new Error(error.response.data.detail);
          } else {
            throw new Error("Invalid email or password");
          }
        } else if (error.response.status === 401) {
          throw new Error("Unauthorized access");
        } else if (error.response.status === 404) {
          throw new Error("Login service is currently unavailable");
        } else {
          throw new Error("An error occurred during login");
        }
      } else if (error.request) {
        throw new Error("No response from server");
      } else {
        throw new Error("Error setting up the request");
      }
    }
  },

  refreshToken: async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.refresh) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await axios.post(`${API_URL}/accounts/token/refresh/`, {
        refresh: user.refresh,
      });

      if (response.data.access) {
        const newUserData = {
          ...user,
          access: response.data.access,
        };
        localStorage.setItem("user", JSON.stringify(newUserData));
        return newUserData;
      }
    } catch (error) {
      // If refresh fails, log out the user
      authService.logout();
      throw new Error("Session expired. Please log in again.");
    }
  },

  logout: () => {
    localStorage.removeItem("user");
  },

  register: async (username, email, password, password2, is_merchant) => {
    try {
      const response = await axios.post(`${API_URL}/accounts/register/`, {
        username,
        email,
        password,
        password2,
        is_merchant,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.detail || "Registration failed");
      }
      throw error;
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  isMerchant: () => {
    const user = authService.getCurrentUser();
    return user && user.user && user.user.is_merchant;
  },

  getToken: () => {
    const user = authService.getCurrentUser();
    return user ? user.access : null;
  },
};

export default authService;
