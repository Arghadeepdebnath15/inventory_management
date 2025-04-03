import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import axios from '../utils/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSetPassword, setHasSetPassword] = useState(false);
  const [setPasswordDialogOpen, setSetPasswordDialogOpen] = useState(false);
  const [confirmPasswordDialogOpen, setConfirmPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to fetch products. Please try again.');
        setLoading(false);
      }
    }
  }, [navigate, user]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [fetchProducts, user]);

  const handleOpen = () => {
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

  const handleEditOpen = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category,
    });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      category: '',
    });
  };

  const handleDeleteOpen = (product) => {
    setSelectedProduct(product);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

      await axios.post('/api/products', productData);
      fetchProducts();
      handleClose();
      toast.success('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to add product. Please try again.');
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
      handleEditClose();
      toast.success('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to update product. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/products/${selectedProduct._id}`);
      setProducts(prevProducts => prevProducts.filter(p => p._id !== selectedProduct._id));
      handleDeleteClose();
      toast.success('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to delete product. Please try again.');
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
        toast.error('Error setting password. Please try again.');
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
        toast.error('Invalid password');
        setPassword('');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Error verifying password. Please try again.');
        setPassword('');
      }
    }
  };

  const handleEditClick = (product) => {
    setActionType('edit');
    setSelectedProduct(product);
    setConfirmPasswordDialogOpen(true);
  };

  const handleDeleteClick = (product) => {
    setActionType('delete');
    setSelectedProduct(product);
    setConfirmPasswordDialogOpen(true);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Products
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Product
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
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
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {product.name}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Category: {product.category}
                </Typography>
                <Typography variant="body2" component="p">
                  {product.description}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                  ₹{product.price}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Stock: {product.quantity}
                </Typography>
              </CardContent>
              <Box display="flex" justifyContent="flex-end" p={2}>
                <IconButton
                  color="primary"
                  onClick={() => handleEditClick(product)}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteClick(product)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Product Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Product Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
          <TextField
            margin="dense"
            name="price"
            label="Price"
            type="number"
            fullWidth
            value={formData.price}
            onChange={handleInputChange}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
          <TextField
            margin="dense"
            name="quantity"
            label="Quantity"
            type="number"
            fullWidth
            value={formData.quantity}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="category"
            label="Category"
            type="text"
            fullWidth
            value={formData.category}
            onChange={handleInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Product Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
          <TextField
            margin="dense"
            name="price"
            label="Price"
            type="number"
            fullWidth
            value={formData.price}
            onChange={handleInputChange}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
          <TextField
            margin="dense"
            name="quantity"
            label="Quantity"
            type="number"
            fullWidth
            value={formData.quantity}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="category"
            label="Category"
            type="text"
            fullWidth
            value={formData.category}
            onChange={handleInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSubmit} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={handleDeleteClose}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={setPasswordDialogOpen} onClose={() => setSetPasswordDialogOpen(false)}>
        <DialogTitle>Set Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSetPassword} color="primary">
            Set Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Password Dialog */}
      <Dialog open={confirmPasswordDialogOpen} onClose={() => setConfirmPasswordDialogOpen(false)}>
        <DialogTitle>Confirm Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePasswordConfirm} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Products;
