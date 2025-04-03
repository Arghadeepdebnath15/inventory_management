import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import jsPDF from 'jspdf';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

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

const SellItem = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(true);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    items: [{ product: '', quantity: 1 }],
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Error fetching products. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleClose = () => {
    setOpen(false);
    navigate('/sales-history');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      items: newItems,
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity: 1 }],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate that at least one item has a product selected
      if (formData.items.some(item => !item.product)) {
        alert('Please select a product for all items');
        return;
      }

      // Format the data for the API
      const saleData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        items: formData.items.map(item => {
          const selectedProduct = products.find(p => p._id === item.product);
          return {
            product: item.product,
            quantity: parseInt(item.quantity),
            price: selectedProduct.price
          };
        })
      };

      const response = await axios.post('/api/sales', saleData);

      if (response.status === 201) {
        // Generate and download sales slip as PDF
        downloadSalesSlip(response.data, products, response.data.customerName);
        
        // Dispatch event to update today's sales with the new sale data
        const event = new CustomEvent('updateTodaySales', {
          detail: response.data
        });
        window.dispatchEvent(event);
        
        handleClose();
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Error creating sale. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography variant="h6">Loading products...</Typography>
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
            Sell Item
          </Typography>
        </Toolbar>
      </AppBar>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>New Sale</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="customerName"
                label="Customer Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="customerPhone"
                label="Customer Phone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
              />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Items
              </Typography>
              {formData.items.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Product</InputLabel>
                    <Select
                      value={item.product}
                      label="Product"
                      onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                    >
                      {products.map((product) => (
                        <MenuItem key={product._id} value={product._id}>
                          {product.name} - ₹{product.price}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    required
                    type="number"
                    label="Quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    sx={{ width: 150 }}
                  />
                  <Button
                    color="error"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button
                onClick={addItem}
                sx={{ mt: 1 }}
              >
                Add Item
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              Complete Sale
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default SellItem; 