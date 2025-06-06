import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTask,
  getTaskStats
} from '../controllers/taskController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getTasks);
router.get('/stats', auth, getTaskStats);
router.get('/:id', auth, getTask);
router.post('/', auth, createTask);
router.put('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);

export default router;
