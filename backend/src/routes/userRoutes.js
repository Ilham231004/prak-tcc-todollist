import express from 'express';
import {
    getUserSettings,
    updateUserSettings,
    uploadProfileImage,
    deleteProfileImage
} from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/settings', auth, getUserSettings);
router.put('/settings', auth, updateUserSettings);
router.post('/upload-image', auth, upload.single('image'), uploadProfileImage);
router.delete('/delete-image', auth, deleteProfileImage);

export default router;
