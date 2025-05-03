import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  CssBaseline,
} from "@mui/material";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MerchantDashboard from "./pages/MerchantDashboard";
import Installments from "./pages/Installments";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const PrivateRoute = ({ children, merchantOnly = false }) => {
  const { user, isMerchant } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (merchantOnly && !isMerchant()) {
    return <Navigate to="/installments" />;
  }
  return children;
};

function AppContent() {
  const { user, logout, isMerchant } = useAuth();

  return (
    <Router>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BNPL Dashboard
          </Typography>
          {user ? (
            <>
              {isMerchant() && (
                <Button color="inherit" component={Link} to="/dashboard">
                  Dashboard
                </Button>
              )}
              <Button color="inherit" component={Link} to="/installments">
                Installments
              </Button>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute merchantOnly>
                <MerchantDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/installments"
            element={
              <PrivateRoute>
                <Installments />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              user ? (
                isMerchant() ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Navigate to="/installments" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Container>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
