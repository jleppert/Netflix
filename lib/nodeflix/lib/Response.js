var crack = require('crack');
var libxmljs = require('libxmljs');

var Response = function(data, meta) {
    this.meta = meta;
    this.data = data;
    
    this.document = libxmljs.parseXmlString(this.data);
};

Response.prototype.find = function(element, callback) {
    this.document.find(element, callback);
};

module.exports = Response;
