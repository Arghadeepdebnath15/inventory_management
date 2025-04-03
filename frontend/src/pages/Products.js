import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  AppBar,
  Toolbar,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon,
  AttachMoney as PriceIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
  });
  const [confirmPasswordDialogOpen, setConfirmPasswordDialogOpen] = useState(false);
  const [setPasswordDialogOpen, setSetPasswordDialogOpen] = useState(false);
  const [hasSetPassword, setHasSetPassword] = useState(() => {
    return localStorage.getItem('hasSetPassword') === 'true';
  });
  const [password, setPassword] = useState('');
  const [actionType, setActionType] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products');
      setProducts(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpen = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      category: '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      category: '',
    });
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
    });
    setActionType('edit');
    setPassword('');
    if (!hasSetPassword) {
      setSetPasswordDialogOpen(true);
    } else {
      setConfirmPasswordDialogOpen(true);
    }
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setActionType('delete');
    setPassword('');
    if (!hasSetPassword) {
      setSetPasswordDialogOpen(true);
    } else {
      setConfirmPasswordDialogOpen(true);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
      };

      const response = await axios.post('/api/products', productData);
      setProducts(prevProducts => [...prevProducts, response.data]);
      handleClose();
    } catch (error) {
      console.error('Error creating product:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
      };

      const response = await axios.put(`/api/products/${selectedProduct._id}`, productData);
      setProducts(prevProducts => 
        prevProducts.map(p => p._id === selectedProduct._id ? response.data : p)
      );
      setEditOpen(false);
    } catch (error) {
      console.error('Error updating product:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Error updating product. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/products/${selectedProduct._id}`);
      setProducts(prevProducts => prevProducts.filter(p => p._id !== selectedProduct._id));
      setDeleteOpen(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Error deleting product. Please try again.');
      }
    }
  };

  const handleSetPassword = async () => {
    try {
      const response = await axios.post('/api/auth/set-password', { password });
      if (response.status === 200) {
        setHasSetPassword(true);
        localStorage.setItem('hasSetPassword', 'true');
        setSetPasswordDialogOpen(false);
        setPassword('');
        setConfirmPasswordDialogOpen(true);
      }
    } catch (error) {
      console.error('Error setting password:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Error setting password. Please try again.');
      }
    }
  };

  const handlePasswordConfirm = async () => {
    try {
      const response = await axios.post('/api/auth/verify-password', { password });
      if (response.data.valid) {
        setConfirmPasswordDialogOpen(false);
        setPassword('');
        if (actionType === 'edit') {
          setEditOpen(true);
        } else if (actionType === 'delete') {
          setDeleteOpen(true);
        }
      } else {
        alert('Invalid password');
        setPassword('');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Error verifying password. Please try again.');
        setPassword('');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Products
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Add Product
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Grid container spacing={3}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {product.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      icon={<CategoryIcon />}
                      label={product.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<PriceIcon />}
                      label={`₹${product.price.toFixed(2)}`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      icon={<InventoryIcon />}
                      label={`${product.quantity} in stock`}
                      size="small"
                      color={product.quantity <= 5 ? "error" : "default"}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditClick(product)}
                    sx={{ textTransform: 'none' }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick(product)}
                    color="error"
                    sx={{ textTransform: 'none' }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Add Product Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Product Name"
              type="text"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="price"
              label="Price"
              type="number"
              fullWidth
              value={formData.price}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="quantity"
              label="Quantity"
              type="number"
              fullWidth
              value={formData.quantity}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="category"
              label="Category"
              type="text"
              fullWidth
              value={formData.category}
              onChange={handleChange}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Add Product</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Product</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Product Name"
              type="text"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="price"
              label="Price"
              type="number"
              fullWidth
              value={formData.price}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="quantity"
              label="Quantity"
              type="number"
              fullWidth
              value={formData.quantity}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="category"
              label="Category"
              type="text"
              fullWidth
              value={formData.category}
              onChange={handleChange}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Update Product</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog 
        open={setPasswordDialogOpen} 
        onClose={() => setSetPasswordDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
        aria-labelledby="set-password-dialog-title"
        aria-describedby="set-password-dialog-description"
      >
        <DialogTitle 
          id="set-password-dialog-title"
          sx={{ 
            backgroundColor: 'primary.main',
            color: 'white',
            fontWeight: 600,
          }}
        >
          Set Password
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText id="set-password-dialog-description">
            Please set a password to secure your product management actions. This password will be required for editing and deleting products.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Set Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': { borderRadius: 2 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setSetPasswordDialogOpen(false)}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSetPassword} 
            variant="contained"
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            Set Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Confirmation Dialog */}
      <Dialog 
        open={confirmPasswordDialogOpen} 
        onClose={() => setConfirmPasswordDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
        aria-labelledby="confirm-password-dialog-title"
        aria-describedby="confirm-password-dialog-description"
      >
        <DialogTitle 
          id="confirm-password-dialog-title"
          sx={{ 
            backgroundColor: 'primary.main',
            color: 'white',
            fontWeight: 600,
          }}
        >
          Confirm Password
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText id="confirm-password-dialog-description">
            Please enter your password to {actionType} this product.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': { borderRadius: 2 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setConfirmPasswordDialogOpen(false)}
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordConfirm} 
            variant="contained"
            sx={{
              textTransform: 'none',
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products; 