!(function(Zepto, undefined) {
    'use strict';
    var exports = this;

    function Netflix() {
        this.name = 'Netflix UI Example';
        this.version = 0.1;
        this.provide('$', Zepto);
    };

    Netflix.prototype = {
        toString: function() {
            return this.name + ' ' + this.version;
        },
        provide: function() {
            var args = Array.prototype.slice.call(arguments);
            var ns = this;
            args.forEach(function(val, index) {
                if(typeof(val) === 'string') {
                    if(ns[val] === undefined) {
                        if(typeof(args[index+1]) !== 'string') {
                            ns[val] = args[index+1];
                        } else {
                            ns[val] = {};
                        }
                    }
                    ns = ns[val];
                }
            });

            return this;
        },
        ns: function(cb, scope) {
            cb.call(scope || this, this, Netflix);
        }
    };
    
    // export main netflix object
    if(undefined === exports.netflix) exports.netflix = new Netflix();
}).call(this, Zepto);
