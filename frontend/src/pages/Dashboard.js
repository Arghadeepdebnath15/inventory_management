import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
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
  Menu,
  MenuItem,
  Select,
  FormControl,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    daily: 0,
    monthly: 0,
    yearly: 0,
    totalSales: 0,
    salesData: []
  });
  const [products, setProducts] = useState([]);
  const [todaySales, setTodaySales] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSalesView, setSelectedSalesView] = useState('today');

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/sales/stats');
      setStats({
        daily: response.data.daily || 0,
        monthly: response.data.monthly || 0,
        yearly: response.data.yearly || 0,
        totalSales: response.data.totalSales || 0,
        salesData: response.data.salesData || [],
      });
      setTodayTotal(response.data.daily || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const fetchTodaySales = useCallback(async () => {
    try {
      const response = await axios.get('/api/sales/today');
      setTodaySales(response.data.sales || []);
      setTodayTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching today\'s sales:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const fetchUniqueCustomers = useCallback(async () => {
    try {
      const response = await axios.get('/api/sales/unique-customers');
      setUniqueCustomers(response.data);
    } catch (error) {
      console.error('Error fetching unique customers:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        fetchProducts(),
        fetchStats(),
        fetchTodaySales(),
        fetchUniqueCustomers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchProducts, fetchStats, fetchTodaySales, fetchUniqueCustomers]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchData();

    // Set up event listener for real-time updates
    const eventSource = new EventSource(process.env.REACT_APP_EVENTS_URL);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'sale') {
          fetchData();
        }
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    };

    // Set up polling for stats updates every 30 seconds
    const statsInterval = setInterval(fetchData, 30000);

    return () => {
      eventSource.close();
      clearInterval(statsInterval);
    };
  }, [navigate, user, fetchData]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    handleClose();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileMenu = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleProfileNavigation = (path) => {
    handleProfileClose();
    navigate(path);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {isLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <AppBar position="static">
            <Toolbar>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={handleMenu}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Dashboard
              </Typography>
              <IconButton
                size="large"
                color="inherit"
                onClick={handleProfileMenu}
                sx={{ ml: 2 }}
              >
                <Avatar 
                  src={user?.profileImage || user?.photoURL}
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {!user?.profileImage && !user?.photoURL && user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={profileAnchorEl}
                open={Boolean(profileAnchorEl)}
                onClose={handleProfileClose}
              >
                <MenuItem onClick={() => handleProfileNavigation('/profile')}>
                  <PersonIcon sx={{ mr: 1 }} /> Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={() => handleNavigation('/products')}>
                  <InventoryIcon sx={{ mr: 1 }} /> Products
                </MenuItem>
                <MenuItem onClick={() => handleNavigation('/sales-history')}>
                  <SalesIcon sx={{ mr: 1 }} /> Sales History
                </MenuItem>
                <MenuItem onClick={() => handleNavigation('/sell-item')}>
                  <AddIcon sx={{ mr: 1 }} /> Sell Item
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Sales Overview
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={selectedSalesView}
                        onChange={(e) => setSelectedSalesView(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="today">Today's Sales</MenuItem>
                        <MenuItem value="total">Total Sales</MenuItem>
                        <MenuItem value="monthly">Monthly Sales</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="h4" color="primary">
                    ₹{(selectedSalesView === 'today' ? (todayTotal || 0) :
                      selectedSalesView === 'total' ? (stats.totalSales || 0) :
                      (stats.monthly || 0)).toFixed(2)}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {selectedSalesView === 'today' ? `${todaySales.length} sales today` :
                     selectedSalesView === 'total' ? 'All time total' :
                     'This month'}
                  </Typography>
                  {selectedSalesView === 'today' && todaySales.length > 0 && (
                    <TableContainer sx={{ mt: 2, flex: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {todaySales.map((sale) => (
                            <TableRow key={sale._id}>
                              <TableCell>
                                {new Date(sale.date).toLocaleTimeString()}
                              </TableCell>
                              <TableCell>₹{(sale.totalAmount || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                  <Typography variant="h6" gutterBottom>
                    Total Products
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {products.length}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Products in inventory
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                  <Typography variant="h6" gutterBottom>
                    Total Customers
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {uniqueCustomers}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Unique customers
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Sales Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stats.salesData || []}
                      margin={{
                        top: 16,
                        right: 16,
                        bottom: 0,
                        left: 24,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        stroke="#666"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={50}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis
                        stroke="#666"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                        width={80}
                        domain={['dataMin', 'dataMax']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          });
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        wrapperStyle={{
                          paddingTop: '10px',
                          fontSize: '12px'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        name="Daily Sales"
                        stroke="#2196f3"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2, stroke: '#2196f3' }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#2196f3' }}
                        isAnimationActive={false}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </>
      )}
    </Box>
  );
};

export default Dashboard; 