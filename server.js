
var http = require('http');
var path = require('path');

var express = require('express');
var fs = require('fs');
var jsrender = require('jsrender');
var Fraction = require('fraction.js');
var groupArray = require('group-array');

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

/*
var q = Fraction.FromDecimal(this.Quantity);

if (q.Denominator == 10000)
{
    var whole = Math.Truncate(this.Quantity);
    if ((this.Quantity - whole) == 0.3333m)
    {
        q = new Fraction(((int)whole * 3) + 1, 3);
    }
    else if ((this.Quantity - whole) == 0.6667m)
    {
        q = new Fraction(((int)whole * 3) + 2, 3);
    }
}

return q;
*/
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

                    var f = new Fraction(ingredient.Quantity);
                    if (f.d === 10000) {
                        var q = parseFloat(ingredient.Quantity);
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
                row.IngredientGroups = groupArray(row.Ingredients, 'Section')
                row.Directions = row.Directions
                    .map((direction) => direction.dataValues)
                    .sort(function (a, b) { return a.Step - b.Step; });
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
  
var server = app.listen(process.env.PORT || 3000, function() {
  var addr = server.address();
  console.log('Server running at', addr.address + ':' + addr.port);
});
