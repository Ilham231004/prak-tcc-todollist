import models from '../models/index.js';

const { Category, Task } = models;

const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Task,
        as: 'tasks',
        attributes: ['id', 'title', 'is_done'],
        required: false // This ensures categories without tasks are still returned
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const category = await Category.create({
      name,
      user_id: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await category.update({ name });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has any tasks
    const taskCount = await Task.count({
      where: { category_id: id }
    });

    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because it contains ${taskCount} task${taskCount > 1 ? 's' : ''}. Please move or delete the tasks first.`
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

export {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
