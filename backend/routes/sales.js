const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Create a new sale
router.post('/', auth, async (req, res) => {
  try {
    const { items, customerName, customerPhone } = req.body;

    // Calculate total amount and update product quantities
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findOne({
        _id: item.product,
        owner: req.user.userId
      });

      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      totalAmount += product.price * item.quantity;
      product.quantity -= item.quantity;
      await product.save();
    }

    const sale = new Sale({
      owner: req.user.userId,
      items,
      totalAmount,
      customerName,
      customerPhone
    });

    await sale.save();
    res.status(201).json(sale);
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all sales for a specific owner
router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find({ owner: req.user.userId })
      .populate('items.product')
      .sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sales statistics for a specific owner
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's sales
    const todaySales = await Sale.find({
      owner: req.user.userId,
      date: { 
        $gte: today,
        $lt: tomorrow
      } 
    });

    // Get this month's sales
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthlySales = await Sale.find({
      owner: req.user.userId,
      date: {
        $gte: monthStart,
        $lte: monthEnd
      }
    });

    // Get this year's sales
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = new Date(today.getFullYear(), 11, 31);
    const yearlySales = await Sale.find({
      owner: req.user.userId,
      date: {
        $gte: yearStart,
        $lte: yearEnd
      }
    });

    // Calculate totals
    const daily = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const monthly = monthlySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const yearly = yearlySales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Get all-time total sales
    const allSales = await Sale.find({ owner: req.user.userId });
    const totalSales = allSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Get last 7 days of sales for the graph
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const salesData = await Promise.all(
      last7Days.map(async (date) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const daySales = await Sale.find({
          owner: req.user.userId,
          date: {
            $gte: dayStart,
            $lte: dayEnd
          }
        });

        const amount = daySales.reduce((sum, sale) => sum + sale.totalAmount, 0);

        return {
          date: dayStart.toISOString(),
          amount
        };
      })
    );

    res.json({
      daily,
      monthly,
      yearly,
      totalSales,
      salesData
    });
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    res.status(500).json({ message: 'Error fetching sales stats' });
  }
});

// Get today's sales for the authenticated user
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await Sale.find({
      owner: req.user.userId,
      date: { 
        $gte: today,
        $lt: tomorrow
      }
    }).populate('items.product');

    const total = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    res.json({
      sales: sales.map(sale => ({
        _id: sale._id,
        date: sale.date,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        totalAmount: sale.totalAmount,
        items: sale.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price
        }))
      })),
      total
    });
  } catch (error) {
    console.error('Error fetching today\'s sales:', error);
    res.status(500).json({ message: 'Error fetching today\'s sales' });
  }
});

// Get unique customers count for the authenticated user
router.get('/unique-customers', auth, async (req, res) => {
  try {
    const uniqueCustomers = await Sale.distinct('customerPhone', { owner: req.user.userId });
    res.json(uniqueCustomers.length);
  } catch (error) {
    console.error('Error fetching unique customers:', error);
    res.status(500).json({ message: 'Error fetching unique customers' });
  }
});

module.exports = router; 