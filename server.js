
var http = require('http');
var path = require('path');

var express = require('express');
var fs = require('fs');
var jsrender = require('jsrender');

var app = express();

var whitelist = [
  'html', 'htm', 'js', 'css', 'map',
  'jpg', 'jpeg', 'png', 'gif',
  'json', 'csv', 'doc', 'docx', 'pdf'
];

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
// connection.authenticate().then(() => {
//     console.log('Connection has been established successfully.');
// }).catch(err => {
//     console.error('Unable to connect to the database:', err);
// });

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
        Quantity: Sequelize.FLOAT,
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

app.get('/', function (request, response) {
    db.Unit.findAll().done(function (units) {
        units = units.map((node) => node.dataValues);
        db.Recipe.findAll({
            include: [db.Ingredient, db.Direction]
        }).done(function (result) {
            var recipes = result.map((node) => node.dataValues);
            recipes.forEach(function (row) {
                row.Ingredients = row.Ingredients.map(function (ingredient) {
                    ingredient = ingredient.dataValues;
                    ingredient.Unit = units.find((unit) => unit.Code === ingredient.UnitCode);
                    return ingredient;
                });
                row.Directions = row.Directions.map((direction) => direction.dataValues);
            });
            
            fs.readFile(__dirname + '/client/index.html', 'utf8', function (err, data) {
                if (err) {
                    console.log('ERROR', err);
                    response.status(err.statusCode);
                }

                var tmpl = jsrender.templates(data);
                var html = tmpl.render({
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
