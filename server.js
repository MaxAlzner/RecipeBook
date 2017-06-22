
var http = require('http');
var path = require('path');

var express = require('express');
var bodyParser = require('body-parser');
var formidable = require('formidable');

var Promise = require('promise');
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

jsrender.views.tags({
    json: function (val) {
        return JSON.stringify(val).replace(/"/g, '&#34;').replace(/'/g, '&#39;');
    },
    template: function (file, name) {
        var data = fs.readFileSync(__dirname + '/client/templates/' + file, 'utf8');
        return '<script id="' + name + '" type="text/x-jsrender">' + data + '</script>';
    }
});

function LogRequest(request) {
    console.log((new Date()).toISOString() + ' ' + request.ip + ' ' + request.method + ' ' + request.originalUrl);
}

function LogException(err) {
    console.log('ERROR', err);
}

function GetRecipes() {
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
                        info = require(infoPath);
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
                LogException(err);
                reject();
            });
        }).catch(function (err) {
            LogException(err);
            reject();
        });
    });
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (err, request, response, next) {
    LogException(err);
    response.status(500).send('An error has occurred.').end();
});

app.get('/', function (request, response) {
    LogRequest(request);
    GetRecipes().then(function (data) {
        fs.readFile(__dirname + '/client/index.html', 'utf8', function (err, file) {
            if (err) {
                LogException(err);
                response.status(404).end();
                return;
            }

            var tmpl = jsrender.templates(file);
            var html = tmpl.render(data);
            response
                .status(200)
                .set('Content-Type', 'text/html')
                .send(html)
                .end();
        });
    }).catch(function () {
        response.redirect('/error');
    });
});

app.get('/error', function(request, response) {
    response.status(500).sendFile(__dirname + '/error/500.html');
});

app.post('/saverecipe', function (request, response) {
    LogRequest(request);
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
    
    db.Recipe.findOne({
        attributes: ['Revision'],
        where: { UniqueId: recipe.UniqueId },
        order: [['Revision', 'DESC']]
    }).then(function (rev) {
        rev = (rev ? rev.dataValues.Revision : 0) + 1;
        recipe.Revision = rev;
        
        connection.transaction(function (t) {
            return db.Recipe.create(recipe, { transaction: t }).then(function (result) {
                recipe.Ingredients.forEach((ingredient) => ingredient.RecipeId = result.null);
                recipe.Directions.forEach((direction) => direction.RecipeId = result.null);
                
                return db.Ingredient.bulkCreate(recipe.Ingredients, { transaction: t }).then(function () {
                    return db.Direction.bulkCreate(recipe.Directions, { transaction: t });
                });
            });
        }).then(function (result) {
            response.json(recipe);
        }).catch(function (err) {
            LogException(err);
            response.redirect('/error');
        });
    }).catch(function (err) {
        LogException(err);
        response.redirect('/error');
    });
});

app.get('/getrecipes', function (request, response) {
    LogRequest(request);
    GetRecipes().then(function (data) {
        response.json(data.Recipes);
    }).catch(function (err) {
        LogException(err);
        response.redirect('/error');
    });
});

app.get('/data/:uid/photo/:image', function(request, response) {
    LogRequest(request);
    response.sendFile(__dirname + '/data/' + request.params.uid + '/' + request.params.image);
});

app.delete('/data/:uid/photo/:image', function(request, response) {
    LogRequest(request);
    var path = __dirname + '/data/' + request.params.uid + '/' + request.params.image;
    if (fs.existsSync(path)) {
        fs.unlink(path, function (err) {
            if (err ) {
                LogException(err);
            }
            
            response.end();
        });
    }
});

app.put('/data/:uid/photo', function (request, response) {
    LogRequest(request);
    if (!request.params.uid) {
        response.status(500).send('Recipe unique ID is required.').end();
    }
    
    var folder = __dirname + '/data/' + request.params.uid;
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    
    var form = new formidable.IncomingForm();
    form.multiples = true;
    form.uploadDir = folder;
    form.on('file', function(field, file) {
        LogRequest(request);
        fs.rename(file.path, path.join(form.uploadDir, file.name));
    });
    form.on('error', function(err) {
        LogException(err);
    });
    form.on('end', function() {
        response.end();
    });
    form.parse(request);
});

app.post('/data/:uid/photo', function (request, response) {
    LogRequest(request);
    if (!request.params.uid) {
        response.status(500).send('Recipe unique ID is required.').end();
    }
    
    var folder = __dirname + '/data/' + request.params.uid;
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    
    fs.writeFileSync(folder + '/imageinfo.json', JSON.stringify(request.body));
    
    response.end();
});

app.get(new RegExp('^.*\.(' + whitelist.join('|') + ')$'), function (request, response) {
    LogRequest(request);
    response.sendFile(__dirname + '/client' + request.originalUrl);
});

var server = app.listen(process.env.PORT || 3000, process.env.IP || '127.0.0.1', function() {
  var addr = server.address();
  console.log('Server running at', addr.address + ':' + addr.port + '\n');
});
