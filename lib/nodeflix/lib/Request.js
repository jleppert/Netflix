var util         = require('util'),
    http         = require('http'),
    EventEmitter = require('events').EventEmitter,
    querystring  = require('querystring'),
    Response     = require('./Response');

var Request = function(auth, method, host, path, params) {
    this.auth   = auth;
    this.method = method;
    this.host   = host;
    this.params = params || {};
    console.dir(params);
    this.params.oauth_consumer_key = this.auth.config.consumer_key;
    this.path   = path + '?' + querystring.stringify(this.params);
    console.dir(this.params);
    EventEmitter.call(this);
};

util.inherits(Request, EventEmitter);

Request.prototype.end = function(callback) {
    this.request = this.performRequest(callback);

    return this;
};

Request.prototype.performRequest = function(callback) {
    var action = this.method.toLowerCase();
    
    switch(action) {
        case 'get':
            console.log('make request', this.host, this.path);
            var req = http.get({
                host: this.host,
                port: 80,
                path: this.path,
                method: 'GET'
            }, this.processResponse(callback));
            req.end();

            return req;
        break;

        default:
            throw new Error('Method: ' + this.method + ' not supported');
    }
};

Request.prototype.processResponse = function(callback) {
    var self = this;
    
    return function(response) {
        var respData = '';
        response.on('data', function(part) {
            console.log('got data', part);
        });

        var error = null;
        response.on('error', function(e) {
            error = e;
        });
        response.on('end', function() {
            callback.call(self, new Response(respData, { response: response, error: error, status: response.statusCode, headers: response.headers }));
        });
    };
};

module.exports = Request;
