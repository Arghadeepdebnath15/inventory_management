const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      shopName,
      firebaseUid: req.body.firebaseUid // Add Firebase UID
    });

    await user.save();

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, firebaseUid, name, shopName } = req.body;

    // Find user by email or create new user if not exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user with Firebase data
      user = new User({
        email,
        firebaseUid,
        name: name,
        shopName: shopName
      });
      await user.save();
    } else if (!user.firebaseUid) {
      // Update existing user with Firebase UID
      user.firebaseUid = firebaseUid;
      // Only update name and shopName if they are not set
      if (!user.name) {
        user.name = name;
      }
      if (!user.shopName) {
        user.shopName = shopName;
      }
      await user.save();
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify password
router.post('/verify-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findOne({ firebaseUid: req.user.userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'Password not set. Please set a password first.' });
    }

    const isMatch = await user.comparePassword(password);
    res.json({ valid: isMatch });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ message: 'Error verifying password', error: error.message });
  }
});

// Set password
router.post('/set-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ firebaseUid: req.user.userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    res.json({ message: 'Password set successfully' });
  } catch (error) {
    console.error('Error setting password:', error);
    res.status(500).json({ message: 'Error setting password', error: error.message });
  }
});

// Create or update user profile
router.post('/profile', auth, async (req, res) => {
  try {
    const { name, email, shopName } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ firebaseUid: req.user.userId });
    
    if (!user) {
      // Create new user
      user = new User({
        firebaseUid: req.user.userId,
        name,
        email,
        shopName
      });
    } else {
      // Update existing user
      user.name = name;
      user.email = email;
      user.shopName = shopName;
    }
    
    await user.save();
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      shopName: user.shopName,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      shopName: user.shopName,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, shopName } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.userId },
      { name, email, shopName },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      shopName: user.shopName,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 