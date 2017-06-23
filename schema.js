
const Promise = require('promise');
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
    }
});

const db = {
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
        CreateDate: Sequelize.DATE
    }),
    Ingredient: connection.define('Ingredient', {
        IngredientId: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        RecipeId: {
            type: Sequelize.INTEGER,
            references: 'Recipe',
            referencesKey: 'RecipeId'
        },
        Name: Sequelize.STRING,
        UnitCode: {
            type: Sequelize.STRING,
            references: 'Unit',
            referencesKey: 'Code'
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
            references: 'Recipe',
            referencesKey: 'RecipeId'
        },
        Step: Sequelize.INTEGER,
        Description: Sequelize.STRING
    })
};
db.Recipe.hasMany(db.Ingredient, { foreignKey: 'RecipeId' });
db.Recipe.hasMany(db.Direction, { foreignKey: 'RecipeId' });
db.Ingredient.hasOne(db.Recipe, { foreignKey: 'RecipeId' });
db.Ingredient.hasOne(db.Unit, { foreignKey: 'Code', targetKey: 'UnitCode' });
db.Direction.hasOne(db.Recipe, { foreignKey: 'RecipeId' });
db.Unit.hasMany(db.Ingredient, { foreignKey: 'UnitCode' });

module.exports = {
    connection: connection,
    model: db,
    
    getRecipes: function () {
        return new Promise(function (resolve, reject) {
            db.Unit.findAll({
                order: ['Name']
            }).then(function (units) {
                units = units.map((node) => node.dataValues);
                db.Recipe.findAll({
                    include: [db.Ingredient, db.Direction]
                }).then(function (result) {
                    var recipes = result.map((node) => node.dataValues);
                    var dataFolders = fs.readdirSync(__dirname + '/data');
                    recipes.forEach(function (row) {
                        row.CreateDate = row.CreateDate.toLocaleString();
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
                        
                        var images = dataFolders.indexOf(key) >= 0 ? fs.readdirSync(__dirname + '/data/' + key).filter(function (file) {
                            return /^.*.(.jpg|.jpeg|.png|.gif|.bmp|.ico|.svg|.svgz|.tif|.tiff)$/.test(file);
                        }) : [];
                        var info = {};
                        var infoPath = __dirname + '/data/' + key + '/imageinfo.json';
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
                    
                    resolve({
                        Recipes: recipes,
                        Units: units    
                    });
                }).catch(function (err) {
                    logger.exception(err);
                    reject();
                });
            }).catch(function (err) {
                logger.exception(err);
                reject();
            });
        });
    }
    
};
