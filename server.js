'use strict';

// const http = require('http');
const path = require('path');

const express = require('express');
// const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
// const formidable = require('formidable');

// const Promise = require('promise');
const fs = require('fs');
// const uuid = require('uuid/v1');

const jsrender = require('jsrender');
// const Fraction = require('fraction.js');
// const groupArray = require('group-array');

// const whitelist = require('./whitelist.json');

// const logger = require('./logger');
// const schema = require('./schema.js');

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

const app = express();
const router = require('./routes.js');
router(app);

const env = process.env;
const server = app.listen(env.PORT || 3000, env.IP || '127.0.0.1', function() {
    var addr = server.address();
    console.log('Server running at ' + addr.address + ':' + addr.port + '\n');
});
