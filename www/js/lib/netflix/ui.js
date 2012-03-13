netflix.ns(function(ns) {
    ns.$ = $;

    ns.provide('ui', 'App', ns.Object.extend({
        name: 'app',
        initialize: function(config) {
            this.config = config;
            this.ui = [];
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
        },
        createUI: function(item) {
            // create each interface component
            var uiObj = ns.util.object.getObject(item.object);
            if(uiObj) this.ui.push(new uiObj(this.config.data, $('#' + item.template), this.contentAreas[item.position], item));   
        },
        createInputHandler: function(item) {
            var handlerObj = ns.util.object.getObject(item.object);
            this.inputHandlers.push(new handlerObj(item.keyMap, item.interval));
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
        initialize: function(data, template, el) {
            this.data = data;
            this.el = el;
            this.template = ns.util.template(template.html());
        },

        render: function() {
            this.el.html(this.template({ items: this.data }));
            this.emit('render');
        }
    }));

    ns.provide('ui', 'Grid', ns.Object.extend({
        name: 'grid',
        initialize: function(data, template, el) {
            this.data = data;
            this.el = el;
            this.template = template.html ? ns.util.template(template.html()) : template;
        },
        render: function() {
            this.el.html(this.template({ item: this.data }));
            this.emit('render');
        }
    }));

    ns.provide('ui', 'Collection', ns.Object.extend({
        name: 'collection',
        initialize: function(data, template, el, config) {
            this.data = data;
            this.el = el;
            this.template = ns.util.template(template.html());
            this.ui = [];

            this.data.forEach(function(section) {
                var uiObj = ns.util.object.getObject(config.contains);
                if(uiObj) this.add(new uiObj(section, this.template, this.el, config));
            }, this);
        },
        add: function(uiObj) {
            this.ui.push(uiObj);
        },
        render: function(item) {
            item = item || 0;
            this.ui[0].render();
        }
    }));

    ns.provide('ui', 'input', 'Keyboard', ns.Object.extend({
        name: 'Keyboard',
        initialize: function(keyMap, interval) {
            this.keyMap = keyMap;
            this.interval = interval || 150;
        },
        bindEvents: function() {

        }
    }));
        
});
