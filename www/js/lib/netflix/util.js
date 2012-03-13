netflix.ns(function(ns, Netflix) {
    ns.provide('util', 'object', {
        toString: function() {
            return this.name || this.constructor.toString().match(new RegExp("^function\\s+([^\\s\\(]+)", "i"))[1];
        },
        toJSON: function() {
            return this.attributes || {};
        },
        inherits: function(sub, _super) {
            sub._super = _super;
            sub.prototype = Object.create(_super.prototype, {
                constructor: { 
                    value: sub, 
                    enumerable: false, 
                    writable: true, 
                    configurable: true 
                }
            });
        },
        extend: function() {
            var args = Array.prototype.slice.call(arguments);
            var origin = args.shift();
            if(!args.length) return origin;
            
            var add;
            while(add = args.pop()) {
                var keys = Object.keys(add);
                var i = keys.length;
                while(i--) {
                    origin[keys[i]] = add[keys[i]];
                }
            }

            return origin;
        },
        getObject: function(namespace) {
            var args = namespace.split(/\./);
            
            var obj;
            var _ns = ns;
            while(_ns = _ns[args.shift()]) {
                obj = _ns;    
            }

            return obj;
        }
    });

    ns.util.object.extend(Netflix.prototype, {
        toString: ns.util.object.toString
    });
   
    ns.provide('util', 'events', {
        on: function(events, callback, scope) {
            events = events.split(/\s+/);
            var cbs = this._callbacks || (this._callbacks = {});
            
            while(event = events.shift()) {
                cbs[event] = cbs[event] || [];
                cbs[event].push([callback, scope]);
            }
        },
        emit: function(events) {
            if(!this._callbacks) return;
            events = events.split(/\s+/);
            var cbs = this._callbacks;
            while(event = events.shift()) {
                if(cbs[event] && cbs[event].length) {
                    for(var i = 0, l = cbs[event].length; i < l; i++) {
                        cbs[event][0].apply(this, slice.call(arguments, 1));
                    }
                }
            }
        }
    });

    // John Resig/underscore templates
    ns.provide('util', 'template', function(str, data) {
        var c  = {
            evaluate: /<%([\s\S]+?)%>/g,
            interpolate: /<%=([\s\S]+?)%>/g,
            escape: /<%-([\s\S]+?)%>/g
        };
        var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
          'with(obj||{}){__p.push(\'' +
          str.replace(/\\/g, '\\\\')
             .replace(/'/g, "\\'")
             .replace(c.escape || noMatch, function(match, code) {
               return "',_.escape(" + unescape(code) + "),'";
             })
             .replace(c.interpolate || noMatch, function(match, code) {
               return "'," + unescape(code) + ",'";
             })
             .replace(c.evaluate || noMatch, function(match, code) {
               return "');" + unescape(code).replace(/[\r\n\t]/g, ' ') + ";__p.push('";
             })
             .replace(/\r/g, '\\r')
             .replace(/\n/g, '\\n')
             .replace(/\t/g, '\\t')
             + "');}return __p.join('');";
        var func = new Function('obj', tmpl);
        if (data) return func(data);
        return function(data) {
          return func.call(this, data);
        };
    });

    ns.provide('Object', (function() {
        function Obj() { };
        
        ns.util.object.extend(Obj.prototype, ns.util.object);
        ns.util.object.extend(Obj.prototype, ns.util.events);
        
        Obj.prototype.extend = function(p) {
            var keys = Object.keys(p);
            var i = keys.length;
            var sub = p.initialize || function() {};
            ns.util.object.inherits.call(this, sub, this.constructor == Function ? this : this.constructor);
            while(i--) {
                sub.prototype[keys[i]] = p[keys[i]];
            }
            sub.extend = this.extend;
            sub.prototype._super =  sub._super; 
            return sub;
        };
        Obj.extend = Obj.prototype.extend;
        
        return Obj;
    }()));

});
