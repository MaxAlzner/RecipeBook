'use strict';

const http = require('http');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const formidable = require('formidable');

const Promise = require('promise');
const fs = require('fs');
const uuid = require('uuid/v1');

const jsrender = require('jsrender');
const Fraction = require('fraction.js');
const groupArray = require('group-array');

const app = express();

const whitelist = require('./whitelist.json');

const logger = require('./logger');
const schema = require('./schema.js');
const connection = schema.connection;
const db = schema.model;

if (!fs.existsSync(__dirname + '/data')) {
    fs.mkdirSync(__dirname + '/data');
}

jsrender.views.tags({
    json: function (val) {
        return JSON.stringify(val).replace(/"/g, '&#34;').replace(/'/g, '&#39;');
    },
    template: function (file, name) {
        var data = fs.readFileSync(__dirname + '/client/templates/' + file, 'utf8');
        return '<script id="' + name + '" type="text/x-jsrender">' + data + '</script>';
    }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (err, request, response, next) {
    logger.exception(err);
    response.status(500).send('An error has occurred.').end();
});

app.get('/', function (request, response) {
    logger.request(request);
    schema.getRecipes().then(function (data) {
        fs.readFile(__dirname + '/client/index.html', 'utf8', function (err, file) {
            if (err) {
                logger.exception(err);
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

app.get('/recipes', function (request, response) {
    logger.request(request);
    schema.getRecipes().then(function (data) {
        response.json(data.Recipes);
    }).catch(function (err) {
        logger.exception(err);
        response.redirect('/error');
    });
});

app.post('/recipe', function (request, response) {
    logger.request(request);
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
            logger.exception(err);
            response.redirect('/error');
        });
    }).catch(function (err) {
        logger.exception(err);
        response.redirect('/error');
    });
});

app.get('/data/:uid/photo/:image', function(request, response) {
    logger.request(request);
    response.sendFile(__dirname + '/data/' + request.params.uid + '/' + request.params.image);
});

app.delete('/data/:uid/photo/:image', function(request, response) {
    logger.request(request);
    var path = __dirname + '/data/' + request.params.uid + '/' + request.params.image;
    if (fs.existsSync(path)) {
        fs.unlink(path, function (err) {
            if (err ) {
                logger.exception(err);
            }
            
            response.end();
        });
    }
});

app.put('/data/:uid/photo', function (request, response) {
    logger.request(request);
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
        logger.request(request);
        fs.rename(file.path, path.join(form.uploadDir, file.name));
    });
    form.on('error', function(err) {
        logger.exception(err);
    });
    form.on('end', function() {
        response.end();
    });
    form.parse(request);
});

app.post('/data/:uid/info', function (request, response) {
    logger.request(request);
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
    logger.request(request);
    response.sendFile(__dirname + '/client' + request.originalUrl);
});

var server = app.listen(process.env.PORT || 3000, process.env.IP || '127.0.0.1', function() {
  var addr = server.address();
  console.log('Server running at ' + addr.address + ':' + addr.port + '\n');
});
