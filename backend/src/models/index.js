import db from '../config/database.js';
import { Sequelize } from 'sequelize';

const sequelize = db;

const models = {};

models.Sequelize = Sequelize;
models.sequelize = sequelize;

import UserModel from './User.js';
import CategoryModel from './Category.js';
import TaskModel from './Task.js';

models.User = UserModel(sequelize, Sequelize);
models.Category = CategoryModel(sequelize, Sequelize);
models.Task = TaskModel(sequelize, Sequelize);

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export default models;
