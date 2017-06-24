
const path = require('path');

const logger = {
    
    request: function (request) {
        console.log((new Date()).toISOString() + ' ' + request.ip + ' ' + request.method + ' ' + request.originalUrl);
    },
    
    exception: function (err) {
        console.log('ERROR', err);
    },

    sendNotFound: function (response) {
        response.status(404).sendFile(path.join(__dirname, 'error/404.html'));
    },

    sendError: function (response) {
        response.status(500).sendFile(path.join(__dirname, 'error/500.html'));
    }
    
};

module.exports = logger;
