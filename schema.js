
const Promise = require('promise');
const path = require('path');
const fs = require('fs');
const groupArray = require('group-array');

const logger = require('./logger');

const dbconfig = require('./db-config.json');
if (!dbconfig) {
    console.error('Failed to find database connection settings.');
}

const Sequelize = require('sequelize');

const connection = new Sequelize(dbconfig.database, dbconfig.user, dbconfig.password, {
    host: dbconfig.host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    define: {
        freezeTableName: true,
        timestamps: false
    },
    logging: dbconfig.logging
});

const db = {
    User: connection.define('User', {
        UserId: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        Name: Sequelize.STRING,
        EmailAddress: Sequelize.STRING,
        CreatedAt: Sequelize.DATE,
        LastUpdated: Sequelize.DATE,
        LastLogIn: Sequelize.DATE
    }),
    Password: connection.define('Password', {
        PasswordId: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        UserId: {
            type: Sequelize.INTEGER,
            references: {
                model: 'User',
                key: 'UserId'
            }
        },
        Hash: Sequelize.STRING,
        Salt: Sequelize.STRING,
        CreatedAt: Sequelize.DATE
    }),
    Permission: connection.define('Permission', {
        PermissionId: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        Name: Sequelize.STRING,
        Description: Sequelize.STRING
    }),
    UserPermission: connection.define('UserPermission', {
        UserId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            references: {
                model: 'User',
                key: 'UserId'
            }
        },
        PermissionId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            references: {
                model: 'Permission',
                key: 'PermissionId'
            }
        }
    }),
    
    Unit: connection.define('Unit', {
        Code: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        Name: Sequelize.STRING,
        ShortName: Sequelize.STRING
    }),
    Recipe: connection.define('Recipe', {
        RecipeId: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        UniqueId: Sequelize.UUID,
        Name: Sequelize.STRING,
        PrepTime: Sequelize.INTEGER,
        CookTime: Sequelize.INTEGER,
        TotalTime: Sequelize.INTEGER,
        Servings: Sequelize.INTEGER,
        Calories: Sequelize.INTEGER,
        Notes: Sequelize.STRING,
        Revision: Sequelize.INTEGER,
        CreatedAt: Sequelize.DATE,
        CreatedBy: {
            type: Sequelize.INTEGER,
            references: {
                model: 'User',
                key: 'UserId'
            }
        }
    }),
    Ingredient: connection.define('Ingredient', {
        IngredientId: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        RecipeId: {
            type: Sequelize.INTEGER,
            references: {
                model: 'Recipe',
                key: 'RecipeId'
            }
        },
        Name: Sequelize.STRING,
        UnitCode: {
            type: Sequelize.STRING,
            references: {
                model: 'Unit',
                key: 'Code'
            }
        },
        Quantity: Sequelize.STRING,
        Section: Sequelize.STRING
    }),
    Direction: connection.define('Direction', {
        DirectionId: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        RecipeId: {
            type: Sequelize.INTEGER,
            references: {
                model: 'Recipe',
                key: 'RecipeId'
            }
        },
        Step: Sequelize.INTEGER,
        Description: Sequelize.STRING
    })
};

db.User.hasMany(db.Password, { foreignKey: 'UserId' });
db.Password.hasOne(db.User, { foreignKey: 'UserId' });
db.User.belongsToMany(db.Permission, { foreignKey: 'UserId', through: db.UserPermission });
db.Permission.belongsToMany(db.User, { foreignKey: 'PermissionId', through: db.UserPermission });

// db.Recipe.hasOne(db.User, { foreignKey: 'CreatedBy', targetKey: 'UserId' });
db.Recipe.hasMany(db.Ingredient, { foreignKey: 'RecipeId' });
db.Recipe.hasMany(db.Direction, { foreignKey: 'RecipeId' });
db.Ingredient.hasOne(db.Recipe, { foreignKey: 'RecipeId' });
// db.Ingredient.hasOne(db.Unit, { foreignKey: 'Code', targetKey: 'UnitCode' });
db.Direction.hasOne(db.Recipe, { foreignKey: 'RecipeId' });
db.Unit.hasMany(db.Ingredient, { foreignKey: 'UnitCode' });

const _ext = {
    connection: connection,
    model: db,
    
    now: function () {
        return (new Date()).toISOString().slice(0, 19).replace('T', ' ');
    },
    
    getUnits: function () {
        return new Promise(function (resolve, reject) {
            db.Unit.findAll({
                order: ['Name']
            }).then(function (result) {
                resolve(result.map(node => node.dataValues));
            }).catch(function (err) {
                logger.exception(err);
                reject();
            });
        });
    },

    getPermissions: function () {
        return new Promise(function (resolve, reject) {
            db.Permission.findAll().then(function (result) {
                resolve(result.map(node => node.dataValues));
            }).catch(function (err) {
                logger.exception(err);
                reject();
            });
        });
    },

    getRecipe: function (id) {
        return new Promise(function (resolve, reject) {
            db.Unit.findAll({
                order: ['Name']
            }).then(function (units) {
                units = units.map((node) => node.dataValues);
                db.Recipe.findOne({
                    where: {
                        RecipeId: id   
                    },
                    include: [db.Ingredient, db.Direction]
                }).then(function (result) {
                    var recipe = result.dataValues;
                    recipe.CreatedAt = recipe.CreatedAt.toLocaleString();
                    recipe.Ingredients = recipe.Ingredients.map(function (ingredient) {
                        ingredient = ingredient.dataValues;
                        ingredient.Section = ingredient.Section === null ? 0 : ingredient.Section;
                        ingredient.Unit = units.find((unit) => unit.Code === ingredient.UnitCode);
                        return ingredient;
                    });
                    
                    recipe.IngredientGroups = groupArray(recipe.Ingredients, 'Section');
                    recipe.Directions = recipe.Directions
                        .map((direction) => direction.dataValues)
                        .sort(function (a, b) { return a.Step - b.Step; });
                    
                    recipe.Ingredients.forEach(function (ingredient) {
                        ingredient.Section = !isNaN(ingredient.Section) ? null : ingredient.Section;
                    });
                    
                    recipe.Images = [];
                    recipe.DataInfo = {};
                    if (fs.existsSync(path.join(__dirname, 'data', recipe.UniqueId))) {
                        var images = fs.readdirSync(path.join(__dirname, 'data', recipe.UniqueId)).filter(function (file) {
                            return /^.*.(.jpg|.jpeg|.png|.gif|.bmp|.ico|.svg|.svgz|.tif|.tiff)$/.test(file);
                        });
                        var info = {};
                        var infoPath = path.join(__dirname, 'data', recipe.UniqueId, 'info.json');
                        if (fs.existsSync(infoPath)) {
                            info = JSON.parse(fs.readFileSync(infoPath));
                            var index = images.indexOf(info.primary);
                            if (info.primary && index >= 0) {
                                var primary = images[index];
                                images.splice(index, 1);
                                images.unshift(primary);
                            }
                        }
                        
                        recipe.Images = images;
                        recipe.DataInfo = info;
                    }

                    resolve(recipe);
                }).catch(function (err) {
                    logger.exception(err);
                    reject();
                });
            }).catch(function (err) {
                logger.exception(err);
                reject();
            });
        });
    },
    
    getRecipes: function () {
        return new Promise(function (resolve, reject) {
            _ext.getUnits().then(function (units) {
                db.Recipe.findAll({
                    include: [db.Ingredient, db.Direction]
                }).then(function (result) {
                    var recipes = result.map((node) => node.dataValues);
                    var dataFolders = fs.readdirSync(path.join(__dirname, 'data'));
                    recipes.forEach(function (row) {
                        row.CreatedAt = row.CreatedAt.toLocaleString();
                        row.Ingredients = row.Ingredients.map(function (ingredient) {
                            ingredient = ingredient.dataValues;
                            ingredient.Section = ingredient.Section === null ? 0 : ingredient.Section;
                            ingredient.Unit = units.find((unit) => unit.Code === ingredient.UnitCode);
                            return ingredient;
                        });
                        
                        row.IngredientGroups = groupArray(row.Ingredients, 'Section');
                        row.Directions = row.Directions
                            .map((direction) => direction.dataValues)
                            .sort(function (a, b) { return a.Step - b.Step; });
                        
                        row.Ingredients.forEach(function (ingredient) {
                            ingredient.Section = !isNaN(ingredient.Section) ? null : ingredient.Section;
                        });
                    });
                    recipes = groupArray(recipes.sort((a, b) => { return a.Name.localeCompare(b.Name); }), 'UniqueId');
                    
                    for (var key in recipes) {
                        recipes[key] = recipes[key].sort((a, b) => a.Revision - b.Revision);
                        
                        var images = dataFolders.indexOf(key) >= 0 ? fs.readdirSync(path.join(__dirname, 'data', key)).filter(function (file) {
                            return /^.*.(.jpg|.jpeg|.png|.gif|.bmp|.ico|.svg|.svgz|.tif|.tiff)$/.test(file);
                        }) : [];
                        var info = {};
                        var infoPath = path.join(__dirname, 'data', key, 'info.json');
                        if (fs.existsSync(infoPath)) {
                            info = JSON.parse(fs.readFileSync(infoPath));
                            var index = images.indexOf(info.primary);
                            if (info.primary && index >= 0) {
                                var primary = images[index];
                                images.splice(index, 1);
                                images.unshift(primary);
                            }
                        }
                        
                        recipes[key].forEach(function (row) {
                            row.Images = images;
                            row.DataInfo = info;
                        });
                    }
                    
                    resolve(recipes);
                }).catch(function (err) {
                    logger.exception(err);
                    reject();
                });
            });
        });
    }
    
};

module.exports = _ext;
