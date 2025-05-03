import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  CardActions,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import bnplService from "../services/bnplService";
import authHeader from "../utils/authHeader";

const Dashboard = () => {
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    total_amount: "",
    number_of_installments: "",
    interest_rate: "0",
    user_email: "",
    start_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    // Debug authentication
    const user = JSON.parse(localStorage.getItem("user"));
    console.log("Current user data:", user);
    console.log("Auth header:", authHeader());

    fetchPaymentPlans();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCloseError = () => {
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchPaymentPlans = async () => {
    try {
      const data = await bnplService.getPaymentPlans();
      setPaymentPlans(data);
    } catch (error) {
      console.error("Error fetching payment plans:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.response?.data && JSON.stringify(error.response.data)) ||
        "Failed to fetch payment plans";
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        number_of_installments: parseInt(formData.number_of_installments),
        interest_rate: parseFloat(formData.interest_rate),
      };

      await bnplService.createPaymentPlan(formattedData);
      handleClose();
      fetchPaymentPlans();
      setFormData({
        name: "",
        description: "",
        total_amount: "",
        number_of_installments: "",
        interest_rate: "0",
        user_email: "",
        start_date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error creating payment plan:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.response?.data && JSON.stringify(error.response.data)) ||
        "Failed to create payment plan";
      setError(errorMessage);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              width: "100%",
            }}
          >
            <Typography component="h1" variant="h4">
              Payment Plans
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpen}
              sx={{
                height: "fit-content",
                position: "absolute",
                right: 16,
              }}
            >
              Create Plan
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {paymentPlans.map((plan) => (
          <Grid item xs={12} md={6} lg={4} key={plan.id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">
                  {plan.name}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {plan.description}
                </Typography>
                <Typography variant="body2">
                  Total Amount: ${plan.total_amount}
                </Typography>
                <Typography variant="body2">
                  Installments: {plan.number_of_installments}
                </Typography>
                <Typography variant="body2">
                  Interest Rate: {plan.interest_rate}%
                </Typography>
                <Typography variant="body2">User: {plan.user.email}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small">View Details</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New Payment Plan</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <TextField
              fullWidth
              label="Total Amount"
              name="total_amount"
              type="number"
              value={formData.total_amount}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Number of Installments"
              name="number_of_installments"
              type="number"
              value={formData.number_of_installments}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Interest Rate (%)"
              name="interest_rate"
              type="number"
              value={formData.interest_rate}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              fullWidth
              label="User Email"
              name="user_email"
              type="email"
              value={formData.user_email}
              onChange={handleChange}
              margin="normal"
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard;
