import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from "@mui/material";
import authService from "../services/authService";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    is_merchant: false,
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "is_merchant" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.register(
        formData.username,
        formData.email,
        formData.password,
        formData.password2,
        formData.is_merchant
      );
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Register
          </Typography>
          {error && (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="password2"
              type="password"
              value={formData.password2}
              onChange={handleChange}
              margin="normal"
              required
            />
            <FormGroup sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_merchant}
                    onChange={handleChange}
                    name="is_merchant"
                  />
                }
                label="Register as a merchant"
              />
            </FormGroup>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
            >
              Register
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
