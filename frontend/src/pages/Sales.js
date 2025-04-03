import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import jsPDF from 'jspdf';

const generateSalesSlip = (sale, products) => {
  const doc = new jsPDF();
  const lineHeight = 10;
  let yPos = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Helper function to add centered text
  const addCenteredText = (text, y) => {
    const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
    return y + lineHeight;
  };

  // Helper function to add left-aligned text
  const addText = (text, y) => {
    doc.text(text, margin, y);
    return y + lineHeight;
  };

  // Add header
  doc.setFontSize(16);
  yPos = addCenteredText('SALES RECEIPT', yPos);
  doc.setFontSize(12);
  yPos += 5;

  // Add separator line
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);

  // Add sale details
  const date = new Date().toLocaleString();
  yPos = addText(`Date: ${date}`, yPos + 5);
  yPos = addText(`Customer: ${sale.customerName}`, yPos);
  yPos = addText(`Phone: ${sale.customerPhone}`, yPos);
  yPos += 5;

  // Add separator line
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);

  // Add items header
  yPos = addText('Items:', yPos);
  yPos += 5;

  let total = 0;
  // Add items
  sale.items.forEach(item => {
    const product = products.find(p => p._id === item.product);
    if (product) {
      const subtotal = item.quantity * (item.price || product.price);
      total += subtotal;
      yPos = addText(`${product.name}`, yPos);
      yPos = addText(`Quantity: ${item.quantity}`, yPos);
      yPos = addText(`Price: $${(item.price || product.price).toFixed(2)}`, yPos);
      yPos = addText(`Subtotal: $${subtotal.toFixed(2)}`, yPos);
      yPos += 5;
    } else {
      const subtotal = item.quantity * item.price;
      total += subtotal;
      yPos = addText(`Product (ID: ${item.product})`, yPos);
      yPos = addText(`Quantity: ${item.quantity}`, yPos);
      yPos = addText(`Price: $${item.price.toFixed(2)}`, yPos);
      yPos = addText(`Subtotal: $${subtotal.toFixed(2)}`, yPos);
      yPos += 5;
    }

    // Add separator line between items
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
  });

  // Add total
  yPos += 5;
  doc.setFontSize(14);
  yPos = addText(`Total Amount: $${total.toFixed(2)}`, yPos);
  doc.setFontSize(12);
  yPos += 5;

  // Add separator line
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);

  // Add thank you message
  yPos += 5;
  yPos = addCenteredText('Thank you for your purchase!', yPos);

  return doc;
};

const downloadSalesSlip = (sale, products, customerName) => {
  const doc = generateSalesSlip(sale, products);
  doc.save(`sale_${customerName}_${new Date().getTime()}.pdf`);
};

const SalesHistory = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [todaySales, setTodaySales] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSales = useCallback(async () => {
    try {
      const response = await axios.get('/api/sales');
      setSales(response.data);
      // Calculate total sales
      const total = response.data.reduce((sum, sale) => sum + sale.totalAmount, 0);
      setTotalSales(total);
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }, []);

  const fetchTodaySales = useCallback(async () => {
    try {
      await axios.get('/api/sales/stats');
      
      // Get today's sales from the stats endpoint
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaySalesResponse = await axios.get('/api/sales');

      const todaySalesData = todaySalesResponse.data.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= today && saleDate < tomorrow;
      });

      // Calculate total for today's sales
      const todayTotalAmount = todaySalesData.reduce((sum, sale) => sum + sale.totalAmount, 0);

      setTodaySales(todaySalesData);
      setTodayTotal(todayTotalAmount);
    } catch (error) {
      console.error('Error fetching today\'s sales:', error);
      throw error;
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchSales(),
        fetchProducts(),
        fetchTodaySales()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchSales, fetchProducts, fetchTodaySales]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography variant="h6">Loading sales data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => navigate('/')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sales History
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => navigate('/sell-item')}
          >
            New Sale
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Today's Sales Summary
                </Typography>
                <Typography variant="h4" color="primary">
                  ${todayTotal.toFixed(2)}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {todaySales.length} sales today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Total Sales
                </Typography>
                <Typography variant="h4" color="primary">
                  ${totalSales.toFixed(2)}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {sales.length} total sales
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Today's Sales
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todaySales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No sales today
                      </TableCell>
                    </TableRow>
                  ) : (
                    todaySales.map((sale) => (
                      <TableRow key={sale._id}>
                        <TableCell>
                          {new Date(sale.date).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{sale.customerPhone}</TableCell>
                        <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              All Sales
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell>{new Date(sale.date).toLocaleString()}</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>{sale.customerPhone}</TableCell>
                      <TableCell>
                        <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                          {sale.items.map((item, index) => (
                            <Typography key={index} variant="body2">
                              {item.product?.name || 'Unknown Product'} x {item.quantity} (${item.price.toFixed(2)} each)
                            </Typography>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => {
                            downloadSalesSlip(sale, products, sale.customerName);
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SalesHistory; 