'use strict';

const http = require('http');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
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

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

jsrender.views.tags({
    json: function (val) {
        return JSON.stringify(val).replace(/"/g, '&#34;').replace(/'/g, '&#39;');
    },
    template: function (file, name) {
        var data = fs.readFileSync(path.join(__dirname, 'client', file), 'utf8');
        return '<script id="' + name + '" type="text/x-jsrender">' + data + '</script>';
    },
    partial: function (file, data) {
        var tmpl = jsrender.templates(fs.readFileSync(path.join(__dirname, 'client', file), 'utf8'));
        var html = tmpl.render(data);
        return html;
    },
    scriptBundle: function () {
        var scripts = [];
        Array.from(arguments).forEach(function (file) {
            scripts.push(fs.readFileSync(path.join(__dirname, 'client', file), 'utf8'));
        });
        
        return '<script type="text/javascript">' + scripts.join('\n') + '</script>';
    },
    styleBundle: function () {
        var styles = [];
        Array.from(arguments).forEach(function (file) {
            styles.push(fs.readFileSync(path.join(__dirname, 'client', file), 'utf8'));
        });
        
        return '<style type="text/css">' + styles.join('\n') + '</style>';
    }
});
jsrender.views.helpers({
    loggedIn: function () {
        return false;
    }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (err, request, response, next) {
    logger.exception(err);
    logger.sendError(response);
});

app.get('/', function (request, response) {
    logger.request(request);
    schema.getRecipes().then(function (data) {
        fs.readFile(path.join(__dirname, 'client/list.html'), 'utf8', function (err, file) {
            if (err) {
                logger.exception(err);
                logger.sendNotFound(response);
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
        logger.sendError(response);
    });
});

app.get('/recipe/:id', function (request, response) {
    logger.request(request);
    var id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
        response.status(500).send('Recipe ID is not valid.').end();
    }

    schema.getRecipe(id).then(function (data) {
        fs.readFile(path.join(__dirname, 'client/view.html'), 'utf8', function (err, file) {
            if (err) {
                logger.exception(err);
                logger.sendNotFound(response);
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
        logger.sendError(response);
    });
});

app.get('/api/recipes', function (request, response) {
    logger.request(request);
    schema.getRecipes().then(function (data) {
        response.json(data.Recipes);
    }).catch(function (err) {
        logger.exception(err);
        logger.sendError(response);
    });
});

app.get('/api/recipe/:id', function (request, response) {
    logger.request(request);
    var id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
        response.status(500).send('Recipe ID is not valid.').end();
    }
    
    schema.getRecipe(id).then(function (data) {
        response.json(data);
    }).catch(function (err) {
        logger.exception(err);
        logger.sendError(response);
    });
});

app.delete('/api/recipe/:id', function (request, response) {
    logger.request(request);
    var id = parseInt(request.params.id, 10);
    if (isNaN(id)) {
        response.status(500).send('Recipe ID is not valid.').end();
    }
    db.Recipe.destroy({
        where: {
            RecipeId: id
        }
    }).then(function () {
        response.end();
    }).catch(function (err) {
        logger.exception(err);
        logger.sendError(response);
    });
});

app.post('/api/recipe', function (request, response) {
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
    recipe.CreatedAt = (new Date()).toISOString().slice(0, 19).replace('T', ' ');
    recipe.CreatedBy = 1;// TODO: Use current user.
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
            logger.sendError(response);
        });
    }).catch(function (err) {
        logger.exception(err);
        logger.sendError(response);
    });
});

app.get('/photo/:uid', function(request, response) {
    logger.request(request);
    if (!request.params.uid) {
        response.status(500).send('Recipe unique ID is required.').end();
    }
    
    var folder = path.join(__dirname, 'data', request.params.uid);
    response.json(fs.existsSync(folder) ? fs.readdirSync(folder).filter(function (file) {
        return /^.*.(.jpg|.jpeg|.png|.gif|.bmp|.ico|.svg|.svgz|.tif|.tiff)$/.test(file);
    }) : null);
});

app.get('/photo/:uid/:image', function(request, response) {
    logger.request(request);
    if (!request.params.uid) {
        response.status(500).send('Recipe unique ID is required.').end();
    }
    
    if (!request.params.image) {
        response.status(500).send('Image name is required.').end();
    }
    
    var file = path.join(__dirname, 'data', request.params.uid, request.params.image);
    if (fs.existsSync(file)) {
        response.sendFile(path.join(__dirname, 'data', request.params.uid, request.params.image));
    }
    else {
        response.status(404).send('Image does not exist.').end();
    }
});

app.delete('/photo/:uid/:image', function(request, response) {
    logger.request(request);
    if (!request.params.uid) {
        response.status(500).send('Recipe unique ID is required.').end();
    }
    
    if (!request.params.image) {
        response.status(500).send('Image name is required.').end();
    }
    
    var file = path.join(__dirname, 'data', request.params.uid, request.params.image);
    if (fs.existsSync(file)) {
        fs.unlink(file, function (err) {
            if (err ) {
                logger.exception(err);
            }
            
            response.end();
        });
    }
    else {
        response.status(404).send('Image does not exist.').end();
    }
});

app.put('/photo/:uid', function (request, response) {
    logger.request(request);
    if (!request.params.uid) {
        response.status(500).send('Recipe unique ID is required.').end();
    }
    
    var folder = path.join(__dirname, 'data', request.params.uid);
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

app.get('/photoinfo/:uid', function(request, response) {
    logger.request(request);
    if (!request.params.uid) {
        response.status(500).send('Recipe unique ID is required.').end();
    }
    
    var file = path.join(__dirname, 'data', request.params.uid, 'info.json');
    response.json(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);
});

app.post('/photoinfo/:uid', function (request, response) {
    logger.request(request);
    if (!request.params.uid) {
        response.status(500).send('Recipe unique ID is required.').end();
    }
    
    var folder = path.join(__dirname, 'data', request.params.uid);
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    
    fs.writeFileSync(path.join(folder, 'info.json'), JSON.stringify(request.body));
    response.end();
});

app.get(new RegExp('^.*\.(' + whitelist.join('|') + ')$'), function (request, response) {
    logger.request(request);
    response.sendFile(path.join(__dirname, 'client', request.originalUrl));
});

const env = process.env;
const server = app.listen(env.PORT || 3000, env.IP || '127.0.0.1', function() {
    var addr = server.address();
    console.log('Server running at ' + addr.address + ':' + addr.port + '\n');
});
