
var http = require('http');
var path = require('path');

var express = require('express');
var bodyParser = require('body-parser');

var fs = require('fs');
var uuid = require('uuid/v1');

var jsrender = require('jsrender');
var Fraction = require('fraction.js');
var groupArray = require('group-array');

var app = express();

var whitelist = require('./whitelist.json');

var dbconfig = require('./db-config.json');
if (!dbconfig) {
    console.error('Failed to find database connection settings.');
}

var Sequelize = require('sequelize');

var connection = new Sequelize(dbconfig.database, dbconfig.user, dbconfig.password, {
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
        Quantity: Sequelize.DECIMAL,
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

jsrender.views.tags({
    json: function (val) {
        return JSON.stringify(val).replace(/"/g, '&#34;').replace(/'/g, '&#39;');
    },
    template: function (file, name) {
        var data = fs.readFileSync(__dirname + '/client/templates/' + file, 'utf8');
        return '<script id="' + name + '" type="text/x-jsrender">' + data + '</script>';
    }
});

app.get('/', function (request, response) {
    db.Unit.findAll({
        order: ['Name']
    }).done(function (units) {
        units = units.map((node) => node.dataValues);
        db.Recipe.findAll({
            include: [db.Ingredient, db.Direction]
        }).done(function (result) {
            var recipes = result.map((node) => node.dataValues);
            recipes.forEach(function (row) {
                row.CreateDate = row.CreateDate.toLocaleString();
                row.Ingredients = row.Ingredients.map(function (ingredient) {
                    ingredient = ingredient.dataValues;

                    ingredient.Quantity = parseFloat(ingredient.Quantity);
                    var f = new Fraction(ingredient.Quantity);
                    if (f.d === 10000) {
                        var q = ingredient.Quantity;
                        var whole = Math.trunc(q);
                        var part = Math.round((q - whole) * 10000);
                        if (part === 3333) {
                            f = new Fraction((whole * 3) + 1, 3);
                        }
                        else if (part === 6667) {
                            f = new Fraction((whole * 3) + 2, 3);
                        }
                    }

                    ingredient.QuantityFraction = f.toFraction(true);
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
            
            fs.readFile(__dirname + '/client/index.html', 'utf8', function (err, data) {
                if (err) {
                    console.log('ERROR', err);
                    response.status(err.statusCode);
                }

                var tmpl = jsrender.templates(data);
                var html = tmpl.render({
                    Units: units,
                    Recipes: recipes
                });
                
                console.log('SEND', __dirname + '/client/index.html');
                response
                    .status(200)
                    .set('Content-Type', 'text/html')
                    .send(html)
                    .end();
            });
        });
    });
});

app.post('/saverecipe', bodyParser.urlencoded({ extended: true }), function (request, response) {
    var recipe = request.body.recipe;
    if (!recipe) {
        response.status(500).send('No data sent.').end();
    }
    
    if (!recipe.Name) {
        response.status(500).send('Recipe name is a required field.').end();
    }
    
    if (!recipe.UniqueId) {
        recipe.UniqueId = uuid();
    }
    
    recipe.PrepTime = recipe.PrepTime || null;
    recipe.CookTime = recipe.CookTime || null;
    recipe.TotalTime = recipe.TotalTime || null;
    recipe.Servings = recipe.Servings || null;
    recipe.Calories = recipe.Calories || null;
    recipe.Notes = recipe.Notes || null;
    recipe.CreateDate = (new Date()).toISOString().slice(0, 19).replace('T', ' ');
    recipe.Ingredients = recipe.Ingredients || [];
    recipe.Directions = recipe.Directions || [];

    recipe.Ingredients.forEach((ingredient) => {
        if (!ingredient.Name) {
            response.status(500).send('Ingredient name is a required field.').end();
        }
        
        if (!ingredient.UnitCode) {
            response.status(500).send('Ingredient unit is a required field.').end();
        }
        
        if (!ingredient.Quantity) {
            response.status(500).send('Ingredient quantity is a required field.').end();
        }

        ingredient.Section = ingredient.Section || null;
    });

    recipe.Directions.forEach((direction) => {
        if (!direction.Step) {
            response.status(500).send('Direction step is a required field.').end();
        }
        
        if (!direction.Description) {
            response.status(500).send('Direction description is a required field.').end();
        }
    });

    // console.log(JSON.stringify(recipe));

    db.Recipe.findOne({
        attributes: ['Revision'],
        where: { UniqueId: recipe.UniqueId },
        order: [['Revision', 'DESC']]
    }).done(function (rev) {
        rev = (rev ? rev.dataValues.Revision : 0) + 1;
        // console.log('Saving Recipe', 'Revision: ', rev);
        recipe.Revision = rev;
        
        connection.transaction(function (t) {
            return db.Recipe.create(recipe, { transaction: t }).then(function (result) {
                console.log('New Recipe ID: ', result.null);
                recipe.Ingredients.forEach((ingredient) => ingredient.RecipeId = result.null);
                recipe.Directions.forEach((direction) => direction.RecipeId = result.null);
                
                return db.Ingredient.bulkCreate(recipe.Ingredients, { transaction: t }).then(function () {
                    return db.Direction.bulkCreate(recipe.Directions, { transaction: t });
                });
            });
        }).then(function (result) {
            response.json(recipe);
        }).catch(function (err) {
            console.log('ERROR', err);
        });
    });
});

app.get(new RegExp('^.*\.(' + whitelist.join('|') + ')$'), function (request, response) {
  console.log('SEND', __dirname + '/client' + request.originalUrl);
  response.sendFile(__dirname + '/client' + request.originalUrl, function (err) {
      if (err) {
          console.log('ERROR', err);
          response.status(err.statusCode);
      }
      
      response.end();
  });
});

var server = app.listen(process.env.PORT || 3000, process.env.IP || '127.0.0.1', function() {
  var addr = server.address();
  console.log('Server running at', addr.address + ':' + addr.port);
});
