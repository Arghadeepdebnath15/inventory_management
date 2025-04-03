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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
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

const SalesHistory = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSales, setFilteredSales] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [products, setProducts] = useState([]);

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
    };
    loadSales();
  }, [navigate]);

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
      width: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      width: 200,
    },
    {
      field: 'customerPhone',
      headerName: 'Phone',
      width: 150,
    },
    {
      field: 'totalAmount',
      headerName: 'Amount',
      width: 130,
      valueFormatter: (params) => `₹${params.value}`,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <IconButton
          color="error"
          onClick={() => handleDeleteClick(params.row)}
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  // Transform sales data to include id field
  const rows = filteredSales.map(sale => ({
    id: sale._id, // Use MongoDB _id as the unique identifier
    ...sale
  }));

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sales History
          </Typography>
          <Button color="inherit" onClick={generateSalesReport}>
            Generate Report
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 2 }}>
          <TextField
            fullWidth
            label="Search by customer name or phone"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearch}
            sx={{ mb: 2 }}
          />

          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
              getRowId={(row) => row._id}
              autoHeight
            />
          </Box>
        </Paper>
      </Container>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Delete Sale</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this sale? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesHistory; 