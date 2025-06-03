import models from '../models/index.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { User } = models;

const getUserSettings = async (req, res) => {
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
            data: { user }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get user settings',
            error: error.message
        });
    }
};

const updateUserSettings = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({
                where: { email },
                attributes: ['id']
            });

            if (existingUser && existingUser.id !== user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken'
                });
            }
        }

        // Update user data
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;

        await user.update(updateData);

        const updatedUser = await User.findByPk(user.id, {
            attributes: ['id', 'name', 'email', 'image', 'created_at']
        });

        res.json({
            success: true,
            message: 'User settings updated successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update user settings',
            error: error.message
        });
    }
};

const uploadProfileImage = async (req, res) => {
    try {
        console.log('Upload request received');
        console.log('File:', req.file);
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const user = await User.findByPk(req.user.id);
        console.log('User found:', user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete old image if exists
        if (user.image) {
            // Extract filename from old URL
            const oldFilename = user.image.split('/').pop();
            const oldImagePath = path.join(__dirname, '../uploads', oldFilename);
            console.log('Deleting old image:', oldImagePath);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
                console.log('Old image deleted');
            }
        }

        // Create full URL for the uploaded image
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
        console.log('New image URL:', imageUrl);
        
        await user.update({ image: imageUrl });
        console.log('User updated with new image URL');

        const updatedUser = await User.findByPk(user.id, {
            attributes: ['id', 'name', 'email', 'image', 'created_at']
        });

        console.log('Updated user data:', updatedUser.toJSON());

        res.json({
            success: true,
            message: 'Profile image uploaded successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Upload error:', error);
        
        // Delete uploaded file if there's an error
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload profile image',
            error: error.message
        });
    }
};

const deleteProfileImage = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.image) {
            return res.status(400).json({
                success: false,
                message: 'No profile image to delete'
            });
        }

        // Extract filename from URL
        const filename = user.image.split('/').pop();
        const imagePath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Update user to remove image
        await user.update({ image: null });

        const updatedUser = await User.findByPk(user.id, {
            attributes: ['id', 'name', 'email', 'image', 'created_at']
        });

        res.json({
            success: true,
            message: 'Profile image deleted successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete profile image',
            error: error.message
        });
    }
};

const deleteImage = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.image) {
      return res.status(404).json({
        success: false,
        message: 'No image to delete'
      });
    }

    // Ambil path file dari URL
    const imageUrl = user.image;
    const filename = imageUrl.split('/uploads/')[1];
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image path'
      });
    }

    const filePath = path.join(__dirname, '../uploads', filename);

    // Hapus file jika ada
    fs.unlink(filePath, (err) => {
      // Jika file tidak ditemukan, tetap lanjut update user
      user.update({ image: null }).then(() => {
        if (err && err.code !== 'ENOENT') {
          return res.status(500).json({
            success: false,
            message: 'Failed to delete image file',
            error: err.message
          });
        }
        return res.json({
          success: true,
          message: 'Image deleted successfully'
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

export {
    getUserSettings,
    updateUserSettings,
    uploadProfileImage,
    deleteProfileImage,
    deleteImage
};
