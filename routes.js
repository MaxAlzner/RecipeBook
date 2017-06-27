
const path = require('path');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const formidable = require('formidable');
const session = require('express-session');

const fs = require('fs');
const uuid = require('uuid/v1');
const bcrypt = require('bcryptjs');

const jsrender = require('jsrender');

const whitelist = require('./whitelist.json');

const logger = require('./logger');
const schema = require('./schema.js');
const connection = schema.connection;
const db = schema.model;

const appconfig = require('./app-config.json');
if (!appconfig) {
    console.error('Failed to find application config settings.');
}

const router = {
    render: function (response, page, data) {
        var tmpl = jsrender.templates(fs.readFileSync(path.join(__dirname, 'client', page), 'utf8'));
        var html = tmpl.render(data || {});
        response
            .status(200)
            .set('Content-Type', 'text/html')
            .send(html)
            .end();
    }
};

module.exports = function (app) {
    
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(function (err, request, response, next) {
        logger.exception(err);
        logger.sendError(response);
    });
    
    app.set('trust proxy', 1);
    app.use(session({
        genid: function() {
            return uuid();
        },
        resave: false,
        saveUninitialized: true,
        secret: appconfig.session_secret,
        cookie: {
            secure: true,
            maxAge: (1000 * 60 * 60) // 1 hour
        }
    }));
    
    app.get('/', function (request, response) {
        logger.request(request);
        console.log('session', request.session);
        schema.getUnits().then(function (units) {
            schema.getRecipes().then(function (recipes) {
                router.render(response, 'list.html', {
                    User: request.session.user,
                    Recipes: recipes,
                    Units: units
                });
            }).catch(function () {
                logger.sendError(response);
            });
        }).catch(function () {
            logger.sendError(response);
        });
    });
    
    app.get('/login', function(request, response) {
        logger.request(request);
        router.render(response, 'login.html', {
            User: request.session.user
        });
    });
    
    app.post('/login', function(request, response) {
        logger.request(request);
        if (!request.body.email || !request.body.password) {
            router.render(response, 'register.html', {
                Message: 'Parameters are invalid.'
            });
        }
        
        db.User.findOne({
            where: {
                EmailAddress: request.body.email
            },
            include: [db.Password]
        }).then(function (result) {
            if (result !== null) {
                var user = result.dataValues;
                user.Passwords = user.Passwords.map(node => node.dataValues);
                var password = user.Passwords.sort((a, b) => (new Date(a.CreatedAt)) - (new Date(b.CreatedAt)))[0];
                if (bcrypt.hashSync(request.body.password, password.Salt) === password.Hash) {
                    request.session.user = {
                        UserId: user.UserId,
                        Name: user.Name,
                        EmailAddress: user.EmailAddress
                    };
                    response.redirect('/');
                }
                else {
                    router.render(response, 'login.html', {
                        User: request.session.user,
                        Message: 'Login failed.'
                    });
                }
            }
            else {
                router.render(response, 'login.html', {
                    User: request.session.user,
                    Message: 'Login failed.'
                });
            }
        }).catch(function (err) {
            logger.exception(err);
            logger.sendError(response);
        });
    });
    
    app.get('/logout', function(request, response) {
        logger.request(request);
        delete request.session.user;
        response.redirect('/');
    });
    
    app.get('/register', function(request, response) {
        logger.request(request);
        router.render(response, 'register.html', {
            User: request.session.user
        });
    });
    
    app.post('/register', function(request, response) {
        logger.request(request);
        if (!request.body.name || !request.body.email || !request.body.password) {
            router.render(response, 'register.html', {
                User: request.session.user,
                Message: 'Parameters are invalid.'
            });
        }
        
        db.User.findOne({
            where: {
                Name: request.body.name
            }
        }).then(function (result) {
            if (result === null) {
                var user = {
                    Name: request.body.name,
                    EmailAddress: request.body.email,
                    CreatedAt: (new Date()).toISOString().slice(0, 19).replace('T', ' ')
                };
                
                connection.transaction(function (t) {
                    return db.User.create(user, { transaction: t }).then(function (result) {
                        user.UserId = result.null;
                        var salt = bcrypt.genSaltSync(10);
                        var hash = bcrypt.hashSync(request.body.password, salt);
                        var password = {
                            UserId: result.null,
                            Hash: hash,
                            Salt: salt,
                            CreatedAt: (new Date()).toISOString().slice(0, 19).replace('T', ' ')
                        };
                        
                        return db.Password.create(password, { transaction: t });
                    });
                }).then(function (result) {
                    request.session.user = {
                        UserId: user.UserId,
                        Name: user.Name,
                        EmailAddress: user.EmailAddress
                    };
                    response.redirect('/');
                }).catch(function (err) {
                    logger.exception(err);
                    logger.sendError(response);
                });
            }
            else {
                router.render(response, 'register.html', {
                    User: request.session.user,
                    Message: 'User with that name already exists.'
                });
            }
        }).catch(function (err) {
            logger.exception(err);
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
            router.render(response, 'view.html', {
                User: request.session.user,
                Recipe: data
            });
        }).catch(function () {
            logger.sendError(response);
        });
    });
    
    app.get('/api/recipes', function (request, response) {
        logger.request(request);
        schema.getRecipes().then(function (data) {
            response.json(data);
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
        recipe.CreatedBy = request.session.user ? request.session.user.UserId : 1;
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
};