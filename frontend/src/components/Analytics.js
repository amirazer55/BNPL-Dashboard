import React, { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import bnplService from "../services/bnplService";

const StatCard = ({ title, value, subtitle }) => (
  <Paper sx={{ p: 3, height: "100%" }}>
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" component="div" sx={{ mb: 1 }}>
      {value}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Paper>
);

const getStatusColor = (status) => {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "OVERDUE":
      return "error";
    default:
      return "warning";
  }
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await bnplService.getMerchantAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(err.message || "Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  if (!analytics) return null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <StatCard
          title="Total Revenue"
          value={`$${analytics.total_revenue.toLocaleString()}`}
          subtitle="From completed payments"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          title="Overdue Plans"
          value={analytics.overdue_plans}
          subtitle={`out of ${analytics.total_plans} total plans`}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          title="Success Rate"
          value={`${analytics.success_rate}%`}
          subtitle={`${analytics.completed_plans} completed plans`}
        />
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Completion Progress
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress
                variant="determinate"
                value={analytics.success_rate}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {analytics.completed_plans} / {analytics.total_plans} plans
              completed
            </Typography>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            User Payment Statistics
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User Email</TableCell>
                  <TableCell>Plan Name</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Paid Amount</TableCell>
                  <TableCell>Remaining</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.user_statistics.map((stat) => (
                  <TableRow key={`${stat.user_id}-${stat.plan_id}`}>
                    <TableCell>{stat.user_email}</TableCell>
                    <TableCell>{stat.plan_name}</TableCell>
                    <TableCell>${stat.total_amount.toLocaleString()}</TableCell>
                    <TableCell>${stat.paid_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      ${stat.remaining_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={stat.payment_progress}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round(stat.payment_progress)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stat.status}
                        color={getStatusColor(stat.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Analytics;
