import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme,
  alpha,
  Card,
  CardContent,
  Grid,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import jsPDF from 'jspdf';
import { DataGrid } from '@mui/x-data-grid';

const fetchSalesData = async (navigate) => {
  try {
    const response = await axios.get('/api/sales');
    return response.data;
  } catch (error) {
    console.error('Error fetching sales:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
    }
    return [];
  }
};

const downloadSalesSlip = (sale, products, customerName) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.text('Sales Slip', 105, 20, { align: 'center' });
  
  // Add date and time
  doc.setFontSize(12);
  doc.text(`Date: ${new Date(sale.date).toLocaleDateString()}`, 20, 30);
  doc.text(`Time: ${new Date(sale.date).toLocaleTimeString()}`, 20, 40);
  
  // Add customer details
  doc.text(`Customer: ${customerName}`, 20, 50);
  doc.text(`Phone: ${sale.customerPhone}`, 20, 60);
  
  // Add items
  let y = 80;
  doc.setFontSize(14);
  doc.text('Items:', 20, y);
  
  doc.setFontSize(12);
  sale.items.forEach((item) => {
    const product = products.find(p => p._id === item.product);
    const productName = product ? product.name : 'Unknown Product';
    doc.text(`${productName} x ${item.quantity}`, 30, y + 10);
    doc.text(`₹${item.price.toFixed(2)} each`, 30, y + 20);
    y += 30;
  });
  
  // Add total
  doc.setFontSize(14);
  doc.text(`Total Amount: ₹${sale.totalAmount.toFixed(2)}`, 20, y + 10);
  
  // Add footer
  doc.setFontSize(10);
  doc.text('Thank you for your business!', 105, y + 30, { align: 'center' });
  
  // Save the PDF
  doc.save(`sales-slip-${customerName}-${new Date(sale.date).toLocaleDateString()}.pdf`);
};

const SalesHistory = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [products, setProducts] = useState([]);
  const [todaySales, setTodaySales] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  const fetchSales = useCallback(async () => {
    try {
      const response = await axios.get('/api/sales');
      setSales(response.data);
      // Calculate total sales
      const total = response.data.reduce((sum, sale) => sum + sale.totalAmount, 0);
      setTotalSales(total);
    } catch (error) {
      console.error('Error fetching sales:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      throw error;
    }
  }, [navigate]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      throw error;
    }
  }, [navigate]);

  useEffect(() => {
    const loadSales = async () => {
      const data = await fetchSalesData(navigate);
      setSales(data);
      setFilteredSales(data);
      
      // Calculate today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySalesData = data.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= today;
      });
      setTodaySales(todaySalesData);
      
      // Calculate today's total
      const todayTotalAmount = todaySalesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
      setTodayTotal(todayTotalAmount);
    };
    loadSales();
  }, [navigate]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSearch = useCallback((event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = sales.filter(
      (sale) =>
        sale.customerName.toLowerCase().includes(term) ||
        sale.customerPhone.toLowerCase().includes(term)
    );
    setFilteredSales(filtered);
  }, [sales]);

  const handleDeleteClick = useCallback((sale) => {
    setSelectedSale(sale);
    setOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    try {
      await axios.delete(`/api/sales/${selectedSale._id}`);
      setOpen(false);
      const data = await fetchSalesData(navigate);
      setSales(data);
      setFilteredSales(data);
    } catch (error) {
      console.error('Error deleting sale:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  }, [selectedSale, navigate]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedSale(null);
  }, []);

  const generateSalesReport = useCallback(() => {
    const doc = new jsPDF();
    doc.text('Sales Report', 20, 20);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

    let y = 40;
    filteredSales.forEach((sale) => {
      doc.text(`Customer: ${sale.customerName}`, 20, y);
      doc.text(`Phone: ${sale.customerPhone}`, 20, y + 10);
      doc.text(`Amount: ₹${sale.totalAmount}`, 20, y + 20);
      doc.text(`Date: ${new Date(sale.date).toLocaleDateString()}`, 20, y + 30);
      y += 50;

      if (y > 250) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('sales-report.pdf');
  }, [filteredSales]);

  const columns = [
    {
      field: 'date',
      headerName: 'Date',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
          {new Date(params.value).toLocaleString()}
        </Box>
      ),
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'customerPhone',
      headerName: 'Phone',
      width: 150,
    },
    {
      field: 'totalAmount',
      headerName: 'Amount',
      width: 150,
      valueFormatter: (params) => `₹${params.value}`,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
          <Typography sx={{ fontWeight: 600, color: theme.palette.success.main }}>
            ₹{params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            color="primary"
            onClick={() => downloadSalesSlip(params.row, products, params.row.customerName)}
            sx={{
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
            title="Download Sales Slip"
          >
            <DownloadIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteClick(params.row)}
            sx={{
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.1)
              }
            }}
            title="Delete Sale"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Transform sales data to include id field
  const rows = filteredSales.map(sale => ({
    id: sale._id,
    ...sale
  }));

  return (
    <Box sx={{ flexGrow: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ 
              mr: 2,
              '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.1) }
            }}
            title="Back to Dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              letterSpacing: 0.5
            }}
          >
            Sales History
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {!isOnline && (
              <Chip
                label="Offline Mode"
                color="warning"
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            <Button 
              color="inherit" 
              onClick={generateSalesReport}
              startIcon={<DownloadIcon />}
              sx={{
                '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.1) }
              }}
              title="Generate Sales Report"
              disabled={!isOnline}
            >
              Generate Report
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                p: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Today's Sales
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  color="primary"
                  sx={{ 
                    fontWeight: 700,
                    mb: 1
                  }}
                >
                  ₹{todayTotal.toFixed(2)}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {todaySales.length} sales today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                p: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <MoneyIcon color="success" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Sales
                  </Typography>
                </Box>
                <Typography 
                  variant="h4" 
                  color="success.main"
                  sx={{ 
                    fontWeight: 700,
                    mb: 1
                  }}
                >
                  ₹{totalSales.toFixed(2)}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {sales.length} total sales
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SearchIcon color="primary" />
                <TextField
                  fullWidth
                  label="Search by customer name or phone"
                  variant="outlined"
                  value={searchTerm}
                  onChange={handleSearch}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  }}
                />
              </Box>

              <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10]}
                  disableSelectionOnClick
                  getRowId={(row) => row._id}
                  autoHeight
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': {
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Dialog 
        open={open} 
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8]
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          pb: 2
        }}>
          Delete Sale
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText>
            Are you sure you want to delete this sale? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          pt: 2,
          px: 3
        }}>
          <Button 
            onClick={handleClose}
            sx={{
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={!isOnline}
            sx={{
              '&:hover': {
                bgcolor: theme.palette.error.dark
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={6000}
        onClose={() => setShowOfflineAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowOfflineAlert(false)} 
          severity="warning" 
          sx={{ width: '100%' }}
        >
          You are currently offline. Some features may be limited.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesHistory; 