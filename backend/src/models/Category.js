export default (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    underscored: true
  });

  Category.associate = (models) => {
    Category.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    Category.hasMany(models.Task, {
      foreignKey: 'category_id',
      as: 'tasks'
    });
  };

  return Category;
};
