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
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Inventory2 as Inventory2Icon,
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
  const theme = useTheme();

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
    <Box sx={{ flexGrow: 1, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
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
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2, '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.1) } }}
                onClick={handleMenu}
              >
                <MenuIcon />
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
                Dashboard
              </Typography>
              <IconButton
                size="large"
                color="inherit"
                onClick={handleProfileMenu}
                sx={{ 
                  ml: 2,
                  '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.1) }
                }}
              >
                <Avatar 
                  src={user?.profileImage || user?.photoURL}
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'white',
                    color: theme.palette.primary.main,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
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
                <Paper 
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: 240,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    },
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Sales Overview
                      </Typography>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={selectedSalesView}
                        onChange={(e) => setSelectedSalesView(e.target.value)}
                        displayEmpty
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                          },
                        }}
                      >
                        <MenuItem value="today">Today's Sales</MenuItem>
                        <MenuItem value="total">Total Sales</MenuItem>
                        <MenuItem value="monthly">Monthly Sales</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography 
                    variant="h4" 
                    color="primary"
                    sx={{ 
                      fontWeight: 700,
                      mb: 1
                    }}
                  >
                    ₹{(selectedSalesView === 'today' ? (todayTotal || 0) :
                      selectedSalesView === 'total' ? (stats.totalSales || 0) :
                      (stats.monthly || 0)).toFixed(2)}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedSalesView === 'today' ? `${todaySales.length} sales today` :
                     selectedSalesView === 'total' ? 'All time total' :
                     'This month'}
                  </Typography>
                  {selectedSalesView === 'today' && todaySales.length > 0 && (
                    <TableContainer sx={{ mt: 2, flex: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {todaySales.map((sale) => (
                            <TableRow 
                              key={sale._id}
                              sx={{
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.04)
                                }
                              }}
                            >
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
                <Paper 
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: 240,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    },
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Inventory2Icon color="success" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Total Products
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
                    {products.length}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Products in inventory
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: 240,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    },
                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <PeopleIcon color="info" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Total Customers
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h4" 
                    color="info.main"
                    sx={{ 
                      fontWeight: 700,
                      mb: 1
                    }}
                  >
                    {uniqueCustomers}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Unique customers
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: 400,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    },
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <TrendingUpIcon color="primary" />
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
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                      <XAxis
                        dataKey="date"
                        stroke={theme.palette.text.secondary}
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
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                        width={80}
                        domain={['dataMin', 'dataMax']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                          borderRadius: theme.shape.borderRadius,
                          boxShadow: theme.shadows[4]
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
                        stroke={theme.palette.primary.main}
                        strokeWidth={2}
                        dot={{ 
                          r: 4, 
                          strokeWidth: 2, 
                          stroke: theme.palette.primary.main,
                          fill: theme.palette.background.paper
                        }}
                        activeDot={{ 
                          r: 6, 
                          strokeWidth: 2, 
                          stroke: theme.palette.primary.main,
                          fill: theme.palette.background.paper
                        }}
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