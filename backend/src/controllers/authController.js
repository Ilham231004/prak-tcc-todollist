import jwt from 'jsonwebtoken';
import models from '../models/index.js';

const { User } = models;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user.id);

    // Ambil ulang user tanpa field sensitif
    const safeUser = await User.findByPk(user.id, {
      attributes: ['id', 'name', 'email']
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: safeUser
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ where: { email } });
    // Pastikan user ditemukan dan method comparePassword ada
    if (!user || typeof user.comparePassword !== 'function' || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user.id);

    // Ambil ulang user tanpa field sensitif
    const safeUser = await User.findByPk(user.id, {
      attributes: ['id', 'name', 'email']
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: safeUser
      }
    });
  } catch (error) {
    console.error('Login error:', error); // Tambahkan log error detail
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'image', 'created_at']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          created_at: user.created_at
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

export { register, login, getProfile };
