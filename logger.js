
module.exports = {
    
    request: function (request) {
        console.log((new Date()).toISOString() + ' ' + request.ip + ' ' + request.method + ' ' + request.originalUrl);
    },
    
    exception: function (err) {
        console.log('ERROR', err);
    }
    
};
