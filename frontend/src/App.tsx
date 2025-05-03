import React, { createContext, useContext, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { User } from "./types";
import authService from "./services/authService";
import Login from "./pages/Login";
import MerchantDashboard from "./pages/MerchantDashboard";
import UserDashboard from "./pages/MerchantDashboard";
// Create Auth Context
interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

// Private Route Component
interface PrivateRouteProps {
  children: React.ReactNode;
  requireMerchant?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requireMerchant = false,
}) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (requireMerchant && !user.is_merchant) {
      navigate("/user-dashboard");
    }
  }, [user, requireMerchant, navigate]);

  if (!user) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (requireMerchant && !user.is_merchant) {
    return null;
  }

  return <>{children}</>;
};

// App Component
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          // Try to refresh token
          await authService.refreshToken();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/merchant-dashboard"
            element={
              <PrivateRoute requireMerchant>
                <MerchantDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/user-dashboard"
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
