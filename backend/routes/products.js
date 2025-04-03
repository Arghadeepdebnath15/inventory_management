const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Get all products for a specific owner
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user.userId });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new product
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, quantity, category } = req.body;

    const product = new Product({
      owner: req.user.userId,
      name,
      description,
      price,
      quantity,
      category,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a product
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, price, quantity, category } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      { name, description, price, quantity, category },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 