netflix.ns(function(ns) {
    ns.$ = $;

    ns.provide('ui', 'App', ns.Object.extend({
        name: 'app',
        initialize: function(config) {
            this.config = config;
            this.ui = [];
            this._ui = {};
            this.inputHandlers = [];

            // content areas where we can put interface components
            this.contentAreas = {
                top:   $('#app div#top'),
                left:  $('#app div#left'),
                right: $('#app div#right')
            };

            if(config.ui && config.ui.length) {
                config.ui.forEach(this.createUI, this);
            }

            if(config.inputHandler && config.inputHandler.length) {
                config.inputHandler.forEach(this.createInputHandler, this);
            }

            // handle animations - should already be in browser's cache
            if(config.animations) {
                var source = $('#animations').attr('src');
                var styleTag = $('<link>');
                styleTag.attr('rel', 'stylesheet').attr('href', source);
                $('head').append(styleTag);
            }

            // TODO: regex/partial wildcard routes?
            this.on('nav:left nav:right nav:up nav:down nav:enter', function() {
                var args = arguments;
                this.ui.forEach(function(ui) {
                    if(ui.focus) {
                        ui.emit.apply(ui, args);
                    }
                });
            });

            this.on('bounce:left bounce:right bounce:top bounce:bottom', function(message, ui) {
                // stop sending events to this ui
                console.log('stopped getting events from', ui);
                ui.emit('blur');
                // activate ui where events should be sent to based off this ui's bounceing config
                this._ui[ui.bounces[message.replace('bounce:','')]].emit('focus');
            });
        },
        createUI: function(item) {
            // create each interface component
            var uiObj = ns.util.object.getObject(item.object);
            if(uiObj) {
                var instance = new uiObj(this.config.data, $('#' + item.template), this.contentAreas[item.position], item, this);
                this.ui.push(instance);
                // save for lookup
                this._ui[instance.id] = instance; 
            }
        },
        createInputHandler: function(item) {
            var handlerObj = ns.util.object.getObject(item.object);
            this.inputHandlers.push(new handlerObj(item.keyMap, item.interval, this));
        },
        render: function(item) {
            // render each interface component
            this.ui.forEach(function(ui) {
                ui.render();
            });
        }
    }));

    ns.provide('ui', 'List', ns.Object.extend({
        name: 'list',
        initialize: function(data, template, el, config, app) {
            this.data = data;
            this.el = el;
            this.id = config.id; 
            this.bounces = config.bounces;
            this.focus = config.focus;
            this.template = ns.util.template(template.html());

            this.on('nav:up nav:down', function(message) {
                if(message == 'nav:up') {
                    this.moveUp();
                } else if(message == 'nav:down') {
                    this.moveDown();
                }
            }, this);

            this.on('focus', function() {
                this.focus = true;
                this.$cursor.show();
            });

            this.on('blur', function() {
                this.focus = false;
                this.$cursor.hide();
            });

            this.on('navigate', function(message, activeObj) {
                history.pushState(activeObj, '', activeObj.action);
                app.emit('navigate', activeObj, activeObj.action);
            });

            this.on('nav:right nav:enter', function(message) {
                app.emit('bounce:right', this);
            }, this);

            this.data.every(function(item, index, arr) {
                if(item.active) {
                    history.replaceState(item, '', item.action);
                    return false;
                }
                return true;
            }, this);
        },
        moveDown: function() {
            this.data.every(function(item, index, arr) {
                if(item.active) {
                    var nextIndex = index + 1;
                    nextIndex = nextIndex > arr.length - 1 ? 0 : nextIndex;
                    item.active = false;
                    arr[nextIndex].active = true;
                    this.moveCursor(arr[nextIndex], nextIndex);
                    this.emit('navigate', arr[nextIndex]);
                    return false;
                }
                return true;
            }, this);
        },
        moveUp: function() {
            this.data.every(function(item, index, arr) {
                if(item.active) {
                    var nextIndex = index - 1;
                    nextIndex = nextIndex < 0 ? arr.length - 1 : nextIndex;
                    item.active = false;
                    arr[nextIndex].active = true;
                    this.moveCursor(arr[nextIndex], nextIndex);
                    this.emit('navigate', arr[nextIndex]);
                    return false;
                }
                return true;
            }, this);
        },
        moveCursor: function(item, index) {
            this.active = item;
            this.$cursor.css({
                top: ((index * 45) -5) + 'px'
            });
        },
        render: function() {
            this.el.html(this.template({ items: this.data }));
            this.$cursor = $(this.el).find('div.cursor');
            if(this.focus) this.$cursor.show(); 
            
            // dumb
            var self = this;
            var end = function() {
                $(self.el).find('li').removeClass('active');
                $(self.el).find('li#' + self.active.id).addClass('active');
            };
            
            this.$cursor[0].addEventListener('webkitTransitionEnd', end, false);
            this.$cursor[0].addEventListener('transitionend', end, false);
            
            this.emit('render');
        }
    }));

    ns.provide('ui', 'Grid', ns.Object.extend({
        name: 'grid',
        initialize: function(data, template, el, config, app) {
            this.data = data;
            this.el = el;
            this.id = data.id;
            this.active = data.active;
            this.rendered = false;
            this.template = template.html ? ns.util.template(template.html()) : template;
        },
        render: function(focus) {
            this.el.html(this.template({ item: this.data }));
            this.emit('render');
        }
    }));

    ns.provide('ui', 'Collection', ns.Object.extend({
        name: 'collection',
        initialize: function(data, template, el, config, app) {
            this.data = data;
            this.id = config.id;
            this.bounces = config.bounces;
            this.focus = config.focus;
            this.el = el;
            this.template = ns.util.template(template.html());
            this.ui = [];
            this._ui = {};
            this.app = app;
            this.cursor = {
                x: 0,
                y: 0
            };

            this.on('focus', function() {
                this.focus = true;
                this.ignore = true; // better way to handle this??
                this.$cursor.show();
            }, this);

            this.on('blur', function() {
                this.focus = false;
                this.$cursor.hide();
            }, this);

            this.on('nav:left nav:right nav:up nav:down', this.moveCursor, this);
            this.on('nav:enter', this.showFilename);
            this.data.forEach(function(section) {
                var uiObj = ns.util.object.getObject(config.contains);
                if(uiObj) this.add(new uiObj(section, this.template, this.el, config));
            }, this);

            app.on('navigate', function(message, obj) {
                this.render(this._ui[obj.id]);
            }, this);
            window.onpopstate = this.stateChange();
        },
        stateChange: function() {
            var self = this;

            return function(obj) {
                self.render(self._ui[obj.state.id]);
            }
        },
        moveCursor: function(message) {
            if(this.ignore) {
                this.ignore = false;
                return;
            }
            var cursor = this.cursor;
            switch(message) {
                case 'nav:up':
                    cursor.y++;
                    if(cursor.y > 1) cursor.y = 0;
                    break;
                case 'nav:down':
                    cursor.y--;
                    if(cursor.y < 0) cursor.y = 1;
                    break;
                case 'nav:right':
                    cursor.x++;
                    if(cursor.x > 3) cursor.x = 0;
                    break;
                case 'nav:left':
                    cursor.x--;
                    if(cursor.x < 0) {
                        cursor.x = 0;
                        this.app.emit('bounce:left', this);
                    }
                    break;
            }
            this.setCursor();
            console.log('cursor position', this.cursor);
        },
        setCursor: function() {
            this.$cursor.removeClass().addClass('cursor').addClass('r' + this.cursor.y).addClass('c' + this.cursor.x); 
        },
        add: function(uiObj) {
            this._ui[uiObj.id] = uiObj;
            this.ui.push(uiObj);
        },
        render: function(item, index) {
            index = index || 0;
            // render first UI
            if(!item) {
                this.activeGrid = this.ui[index].render();
            } else {
                this.activeGrid = item.render();
            }
            this.$cursor = $(this.el).find('div.cursor');
            if(this.focus) this.$cursor.show();
        }
    }));

    ns.provide('ui', 'input', 'Keyboard', ns.Object.extend({
        name: 'keyboard',
        initialize: function(keyMap, interval, app) {
            this.keyMap = keyMap || [];
            this.interval = interval || 150;
            
            // internal hashmap
            this._map = {
                messages: {}
            };
            // attached event handlers
            this.handlers = [];
            
            // create mappings
            this.keyMap.forEach(this.bindEvents, this);

            this.on('*', function() {
                app.emit.apply(app, arguments);
            });
        },
        bindEvents: function(key) {
            var message = this._map['messages'][key.emit] || (this._map['messages'][key.emit] = function() { return key.emit });
            
            var i = key.params.length;
            while(i--) {
                this._map[key.source] = this._map[key.source] || {};
                this._map[key.source][key.params[i]] = this._map['messages'][key.emit];
            }

            if(!this.handlers[key.source]) {
                this.handlers[key.source] = $(document)[key.source.toLowerCase()](this.keyEvent(key.source));
            }
        },
        keyEvent: function(source) {
            var self   = this;
            var source = source;
            return function(e) {
                if(self._map[source][e.keyCode]) {
                    self.emit(self._map[source][e.keyCode](), self, e);
                    e.preventDefault();
                }
            }
        }
    }));
        
});
