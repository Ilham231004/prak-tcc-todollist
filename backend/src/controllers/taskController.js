import models from '../models/index.js';
import { Op } from 'sequelize';

const { Task, Category } = models;

const getTaskStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalTasks = await Task.count({
      where: { user_id: userId }
    });

    const completedTasks = await Task.count({
      where: { user_id: userId, is_done: true }
    });

    const pendingTasks = await Task.count({
      where: { user_id: userId, is_done: false }
    });

    res.json({
      success: true,
      data: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get task statistics',
      error: error.message
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const { category_id, is_done, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { user_id: req.user.id };

    if (category_id) where.category_id = category_id;
    if (is_done !== undefined) where.is_done = is_done === 'true';

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get tasks',
      error: error.message
    });
  }
};

const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, user_id: req.user.id },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get task',
      error: error.message
    });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, due_date, category_id } = req.body;

    // Validate category belongs to user if provided
    if (category_id) {
      const category = await Category.findOne({
        where: { id: category_id, user_id: req.user.id }
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      due_date,
      category_id,
      user_id: req.user.id
    });

    const taskWithCategory = await Task.findByPk(task.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task: taskWithCategory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Validate category belongs to user if provided
    if (updates.category_id) {
      const category = await Category.findOne({
        where: { id: updates.category_id, user_id: req.user.id }
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
    }

    await task.update(updates);

    const updatedTask = await Task.findByPk(task.id, {
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task: updatedTask }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
};

export {
  getTasks,
  getTask,
  getTaskStats,
  createTask,
  updateTask,
  deleteTask
};
