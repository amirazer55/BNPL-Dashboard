import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Box,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import bnplService from "../services/bnplService";

const Installments = () => {
  const [installments, setInstallments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInstallments();
  }, []);

  const handleCloseError = () => {
    setError(null);
  };

  const fetchInstallments = async () => {
    try {
      const data = await bnplService.getInstallments();
      setInstallments(data);
    } catch (error) {
      console.error("Error fetching installments:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.response?.data && JSON.stringify(error.response.data)) ||
        "Failed to fetch installments";
      setError(errorMessage);
    }
  };

  const handleMarkAsPaid = async (installmentId) => {
    try {
      await bnplService.markInstallmentAsPaid(installmentId);
      fetchInstallments();
    } catch (error) {
      console.error("Error marking installment as paid:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.response?.data && JSON.stringify(error.response.data)) ||
        "Failed to mark installment as paid";
      setError(errorMessage);
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

  // Group installments by payment plan
  const groupedInstallments = installments.reduce((acc, installment) => {
    const planId = installment.payment_plan;
    if (!acc[planId]) {
      acc[planId] = [];
    }
    acc[planId].push(installment);
    return acc;
  }, {});

  // Calculate progress for each payment plan
  const getPlanProgress = (planInstallments) => {
    const total = planInstallments.length;
    const paid = planInstallments.filter((i) => i.status === "PAID").length;
    return (paid / total) * 100;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography component="h1" variant="h4">
            My Installments
          </Typography>
        </Grid>
      </Grid>
      {Object.entries(groupedInstallments).map(([planId, planInstallments]) => (
        <Grid item xs={12} key={planId}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Payment Plan #{planId}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress:{" "}
                {planInstallments.filter((i) => i.status === "PAID").length} /{" "}
                {planInstallments.length} installments paid
              </Typography>
              <LinearProgress
                variant="determinate"
                value={getPlanProgress(planInstallments)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Amount</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {planInstallments.map((installment) => (
                    <TableRow key={installment.id}>
                      <TableCell>${installment.amount}</TableCell>
                      <TableCell>
                        {new Date(installment.due_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={installment.status}
                          color={getStatusColor(installment.status)}
                        />
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      ))}

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

export default Installments;
