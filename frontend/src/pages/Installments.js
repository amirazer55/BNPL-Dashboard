import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
} from "@mui/material";
import bnplService from "../services/bnplService";

const Installments = () => {
  const [installments, setInstallments] = useState([]);

  useEffect(() => {
    fetchInstallments();
  }, []);

  const fetchInstallments = async () => {
    try {
      const data = await bnplService.getInstallments();
      setInstallments(data);
    } catch (error) {
      console.error("Error fetching installments:", error);
    }
  };

  const handleMarkAsPaid = async (installmentId) => {
    try {
      await bnplService.markInstallmentAsPaid(installmentId);
      fetchInstallments();
    } catch (error) {
      console.error("Error marking installment as paid:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "success";
      case "OVERDUE":
        return "error";
      default:
        return "warning";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h1" variant="h4">
              My Installments
            </Typography>
          </Paper>
        </Grid>
        {installments.map((installment) => (
          <Grid item xs={12} md={6} lg={4} key={installment.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div" gutterBottom>
                  Payment Plan: {installment.payment_plan.name}
                </Typography>
                <Typography variant="body1">
                  Amount: ${installment.amount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Due Date:{" "}
                  {new Date(installment.due_date).toLocaleDateString()}
                </Typography>
                <Chip
                  label={installment.status}
                  color={getStatusColor(installment.status)}
                  sx={{ mt: 1 }}
                />
              </CardContent>
              <CardActions>
                {installment.status === "PENDING" && (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => handleMarkAsPaid(installment.id)}
                  >
                    Mark as Paid
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Installments;
