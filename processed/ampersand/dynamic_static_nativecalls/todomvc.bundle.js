(function e(t,n,r){___jdce_logger("/todomvc.bundle.js", 0);function s(o,u){___jdce_logger("/todomvc.bundle.js", 1);if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){___jdce_logger("/todomvc.bundle.js", 2);var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 3);
'use strict';

var MainView = require('./views/main');
var Me = require('./models/me');
var Router = require('./router');


window.app = {
	init: function () {___jdce_logger("/todomvc.bundle.js", 4);
		// Model representing state for
		// user using the app. Calling it
		// 'me' is a bit of convention but
		// it's basically 'app state'.
		this.me = new Me();
		// Our main view
		this.view = new MainView({
			el: document.body,
			model: this.me
		});
		// Create and fire up the router
		this.router = new Router();
		this.router.history.start();
	}
};

window.app.init();

},{"./models/me":2,"./router":5,"./views/main":7}],2:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 5);
// typically we us a 'me' model to represent state for the
// user of the app. So in an app where you have a logged in
// user this is where we'd store username, etc.
// We also use it to store session properties, which is the
// non-persisted state that we use to track application
// state for this user in this session.
'use strict';

var State = require('ampersand-state');
var Todos = require('./todos');


module.exports = State.extend({
	initialize: function () {___jdce_logger("/todomvc.bundle.js", 6);
		// Listen to changes to the todos collection that will
		// affect lengths we want to calculate.
		this.listenTo(this.todos, 'change:completed add remove', this.handleTodosUpdate);
		// We also want to calculate these values once on init
		this.handleTodosUpdate();
		// Listen for changes to `mode` so we can update
		// the collection mode.
		this.listenTo(this, 'change:mode', this.handleModeChange);
	},
	collections: {
		todos: Todos
	},
	// We used only session properties here because there's
	// no API or persistance layer for these in this app.
	session: {
		activeCount: {
			type: 'number',
			default: 0
		},
		completedCount: {
			type: 'number',
			default: 0
		},
		totalCount:{
			type: 'number',
			default: 0
		},
		allCompleted: {
			type: 'boolean',
			default: false
		},
		mode: {
			type: 'string',
			values: [
				'all',
				'completed',
				'active'
			],
			default: 'all'
		}
	},
	derived: {
		// We produce this as an HTML snippet here
		// for convenience since it also has to be
		// pluralized it was easier this way.
		itemsLeftHtml: {
			deps: ['activeCount'],
			fn: function () {___jdce_logger("/todomvc.bundle.js", 7);
				var plural = (this.activeCount === 1) ? '' : 's';
				return '<strong>' + this.activeCount + '</strong> item' + plural + ' left';
			}
		}
	},
	// Calculate and set various lengths we're
	// tracking. We set them as session properties
	// so they're easy to listen to and bind to DOM
	// where needed.
	handleTodosUpdate: function () {___jdce_logger("/todomvc.bundle.js", 8);
		var total = this.todos.length;
		// use a method we defined on the collection itself
		// to count how many todos are completed
		var completed = this.todos.getCompletedCount();
		// We use `set` here in order to update multiple attributes at once
		// It's possible to set directely using `this.completedCount = completed` ...
		this.set({
			completedCount: completed,
			activeCount: total - completed,
			totalCount: total,
			allCompleted: total === completed
		});
	},
	handleModeChange: function () {___jdce_logger("/todomvc.bundle.js", 9);
		this.todos.setMode(this.mode);
	}
});

},{"./todos":4,"ampersand-state":22}],3:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 10);
'use strict';

// We're using 'ampersand-state' here instead of 'ampersand-model'
// because we don't need any of the RESTful
// methods for this app.
var State = require('ampersand-state');


module.exports = State.extend({
	// Properties this model will store
	props: {
		title: {
			type: 'string',
			default: ''
		},
		completed: {
			type: 'boolean',
			default: false
		}
	},
	// session properties work the same way as `props`
	// but will not be included when serializing.
	session: {
		editing: {
			type: 'boolean',
			default: false
		}
	},
	destroy: function(){___jdce_logger("/todomvc.bundle.js", 11);}
});

},{"ampersand-state":22}],4:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 12);
'use strict';

var Collection = require('ampersand-collection');
var SubCollection = require('ampersand-subcollection');
var debounce = require('debounce');
var Todo = require('./todo');
var STORAGE_KEY = 'todos-ampersand';


module.exports = Collection.extend({
	model: Todo,
	initialize: function () {___jdce_logger("/todomvc.bundle.js", 13);
		// Attempt to read from localStorage
		this.readFromLocalStorage();

		// This is what we'll actually render
		// it's a subcollection of the whole todo collection
		// that we'll add/remove filters to accordingly.
		this.subset = new SubCollection(this);

		// We put a slight debounce on this since it could possibly
		// be called in rapid succession.
		this.writeToLocalStorage = debounce(this.writeToLocalStorage, 100);

		// Listen for storage events on the window to keep multiple
		// tabs in sync
		window.addEventListener('storage', this.handleStorageEvent.bind(this));

		// We listen for changes to the collection
		// and persist on change
		this.on('all', this.writeToLocalStorage, this);
	},
	getCompletedCount: function() {___jdce_logger("/todomvc.bundle.js", 14);
		return this.reduce(function(total, todo){___jdce_logger("/todomvc.bundle.js", 15);
			return todo.completed ? ++total : total;
		}, 0);
	},
	// Helper for removing all completed items
	clearCompleted: function(){___jdce_logger("/todomvc.bundle.js", 16);},
	// Updates the collection to the appropriate mode.
	// mode can 'all', 'completed', or 'active'
	setMode: function (mode) {___jdce_logger("/todomvc.bundle.js", 17);
		if (mode === 'all') {
			this.subset.clearFilters();
		} else {
			this.subset.configure({
				where: {
					completed: mode === 'completed'
				}
			}, true);
		}
	},
	// The following two methods are all we need in order
	// to add persistance to localStorage
	writeToLocalStorage: function () {___jdce_logger("/todomvc.bundle.js", 18);
		localStorage[STORAGE_KEY] = JSON.stringify(this);
	},
	readFromLocalStorage: function () {___jdce_logger("/todomvc.bundle.js", 19);
		var existingData = localStorage[STORAGE_KEY];
		if (existingData) {
			this.set(JSON.parse(existingData));
		}
	},
	// Handles events from localStorage. Browsers will fire
	// this event in other tabs on the same domain.
	handleStorageEvent: function (e) {___jdce_logger("/todomvc.bundle.js", 20);
		if (e.key === STORAGE_KEY) {
			this.readFromLocalStorage();
		}
	}
});

},{"./todo":3,"ampersand-collection":9,"ampersand-subcollection":28,"debounce":53}],5:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 21);
'use strict';
/*global app */

var Router = require('ampersand-router');


module.exports = Router.extend({
	routes: {
		'*filter': 'setFilter'
	},
	setFilter: function (arg) {___jdce_logger("/todomvc.bundle.js", 22);
		app.me.mode = arg || 'all';
	}
});

},{"ampersand-router":16}],6:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 23);
var jade = require("jade/runtime");

module.exports = function(){___jdce_logger("/todomvc.bundle.js", 24);};
},{"jade/runtime":55}],7:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 25);
'use strict';
/*global app */

var View = require('ampersand-view');
var TodoView = require('./todo');
var ENTER_KEY = 13;


module.exports = View.extend({
	events: {
		'keypress [data-hook~=todo-input]': 'handleMainInput',
		'click [data-hook~=mark-all]': 'handleMarkAllClick',
		'click [data-hook~=clear-completed]': 'handleClearClick'
	},
	// Declaratively bind all our data to the template.
	// This means only changed data in the DOM is updated
	// with this approach we *only* ever touch the DOM with
	// appropriate dom methods. Not just `innerHTML` which
	// makes it about as fast as possible.
	// These get re-applied if the view's element is replaced
	// or if the model isn't there yet, etc.
	// Binding type reference:
	// http://ampersandjs.com/docs#ampersand-dom-bindings-binding-types
	bindings: {
		// Show hide main and footer
		// based on truthiness of totalCount
		'model.totalCount': {
			type: 'toggle',
			selector: '#main, #footer'
		},
		'model.completedCount': [
			// Hides when there are none
			{
				type: 'toggle',
				hook: 'clear-completed'
			},
			// Inserts completed count
			{
				type: 'text',
				hook: 'completed-count'
			}
		],
		// Inserts HTML from model that also
		// does pluralizing.
		'model.itemsLeftHtml': {
			type: 'innerHTML',
			hook: 'todo-count'
		},
		// Add 'selected' to right
		// element
		'model.mode': {
			type: 'switchClass',
			name: 'selected',
			cases: {
				'all': '[data-hook=all-mode]',
				'active': '[data-hook=active-mode]',
				'completed': '[data-hook=completed-mode]',
			}
		},
		// Bind 'checked' state of checkbox
		'model.allCompleted': {
			type: 'booleanAttribute',
			name: 'checked',
			hook: 'mark-all'
		}
	},
	// cache
	initialize: function () {___jdce_logger("/todomvc.bundle.js", 26);
		this.mainInput = this.queryByHook('todo-input');
		this.renderCollection(app.me.todos.subset, TodoView, this.queryByHook('todo-container'));
	},
	// handles DOM event from main input
	handleMainInput: function(){___jdce_logger("/todomvc.bundle.js", 27);},
	// Here we set all to state provided.
	handleMarkAllClick: function(){___jdce_logger("/todomvc.bundle.js", 28);},
	// Handler for clear click
	handleClearClick: function(){___jdce_logger("/todomvc.bundle.js", 29);}
});

},{"./todo":8,"ampersand-view":35}],8:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 30);
'use strict';

var View = require('ampersand-view');
var todoTemplate = require('../templates/todo.jade');
var ENTER_KEY = 13;
var ESC_KEY = 27;


module.exports = View.extend({
	// note that Ampersand is extrememly flexible with templating.
	// This template property can be:
	//   1. A plain HTML string
	//   2. A function that returns an HTML string
	//   3. A function that returns a DOM element
	//
	// Here we're using a jade template. A browserify transform
	// called 'jadeify' lets us require a ".jade" file as if
	// it were a module and it will compile it to a function
	// for us. This function returns HTML as per #2 above.
	template: todoTemplate,
	// Events work like backbone they're all delegated to
	// root element.
	events: {
		'change [data-hook=checkbox]': 'handleCheckboxChange',
		'click [data-hook=action-delete]': 'handleDeleteClick',
		'dblclick [data-hook=title]': 'handleDoubleClick',
		'keyup [data-hook=input]': 'handleKeypress',
		'blur [data-hook=input]': 'handleBlur'
	},
	// Declarative data bindings
	bindings: {
		'model.title': [
			{
				type: 'text',
				hook: 'title'
			},
			{
				type: 'value',
				hook: 'input'
			}
		],
		'model.editing': [
			{
				type: 'toggle',
				yes: '[data-hook=input]',
				no: '[data-hook=view]'
			},
			{
				type: 'booleanClass'
			}
		],
		'model.completed': [
			{
				type: 'booleanAttribute',
				name: 'checked',
				hook: 'checkbox'
			},
			{
				type: 'booleanClass'
			}
		]
	},
	render: function () {___jdce_logger("/todomvc.bundle.js", 31);
		// Render this with template provided.
		// Note that unlike backbone this includes the root element.
		this.renderWithTemplate();
		// cache reference to `input` for speed/convenience
		this.input = this.queryByHook('input');
	},
	handleCheckboxChange: function(){___jdce_logger("/todomvc.bundle.js", 32);},
	handleDeleteClick: function(){___jdce_logger("/todomvc.bundle.js", 33);},
	// Just put us in edit mode and focus
	handleDoubleClick: function(){___jdce_logger("/todomvc.bundle.js", 34);},
	handleKeypress: function(){___jdce_logger("/todomvc.bundle.js", 35);},
	// Since we always blur even in the other
	// scenarios we use this as a 'save' point.
	handleBlur: function(){___jdce_logger("/todomvc.bundle.js", 36);}
});

},{"../templates/todo.jade":6,"ampersand-view":35}],9:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 37);
var BackboneEvents = require('backbone-events-standalone');
var classExtend = require('ampersand-class-extend');
var isArray = require('is-array');
var extend = require('extend-object');
var slice = [].slice;


function Collection(models, options) {___jdce_logger("/todomvc.bundle.js", 38);
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator) this.comparator = options.comparator;
    if (options.parent) this.parent = options.parent;
    if (!this.mainIndex) {
        var idAttribute = this.model && this.model.prototype && this.model.prototype.idAttribute;
        this.mainIndex = idAttribute || 'id';
    }
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, extend({silent: true}, options));
}

extend(Collection.prototype, BackboneEvents, {
    initialize: function(){___jdce_logger("/todomvc.bundle.js", 39);},

    indexes: [],

    isModel: function (model) {___jdce_logger("/todomvc.bundle.js", 40);
        return this.model && model instanceof this.model;
    },

    add: function (models, options) {___jdce_logger("/todomvc.bundle.js", 41);
        return this.set(models, extend({merge: false, add: true, remove: false}, options));
    },

    // overridable parse method
    parse: function (res, options) {___jdce_logger("/todomvc.bundle.js", 42);
        return res;
    },

    // overridable serialize method
    serialize: function () {___jdce_logger("/todomvc.bundle.js", 43);
        return this.map(function (model) {___jdce_logger("/todomvc.bundle.js", 44);
            if (model.serialize) {
                return model.serialize();
            } else {
                var out = {};
                extend(out, model);
                delete out.collection;
                return out;
            }
        });
    },

    toJSON: function(){___jdce_logger("/todomvc.bundle.js", 45);},

    set: function (models, options) {___jdce_logger("/todomvc.bundle.js", 46);
        options = extend({add: true, remove: true, merge: true}, options);
        if (options.parse) models = this.parse(models, options);
        var singular = !isArray(models);
        models = singular ? (models ? [models] : []) : models.slice();
        var id, model, attrs, existing, sort, i, length;
        var at = options.at;
        var sortable = this.comparator && (at == null) && options.sort !== false;
        var sortAttr = ('string' === typeof this.comparator) ? this.comparator : null;
        var toAdd = [], toRemove = [], modelMap = {};
        var add = options.add, merge = options.merge, remove = options.remove;
        var order = !sortable && add && remove ? [] : false;
        var targetProto = this.model && this.model.prototype || Object.prototype;

        // Turn bare objects into model references, and prevent invalid models
        // from being added.
        for (i = 0, length = models.length; i < length; i++) {
            attrs = models[i] || {};
            if (this.isModel(attrs)) {
                id = model = attrs;
            } else if (targetProto.generateId) {
                id = targetProto.generateId(attrs);
            } else {
                id = attrs[targetProto.idAttribute || this.mainIndex];
            }

            // If a duplicate is found, prevent it from being added and
            // optionally merge it into the existing model.
            if (existing = this.get(id)) {
                if (remove) modelMap[existing.cid || existing[this.mainIndex]] = true;
                if (merge) {
                    attrs = attrs === model ? model.attributes : attrs;
                    if (options.parse) attrs = existing.parse(attrs, options);
                    // if this is model
                    if (existing.set) {
                        existing.set(attrs, options);
                        if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
                    } else {
                        // if not just update the properties
                        extend(existing, attrs);
                    }
                }
                models[i] = existing;

            // If this is a new, valid model, push it to the `toAdd` list.
            } else if (add) {
                model = models[i] = this._prepareModel(attrs, options);
                if (!model) continue;
                toAdd.push(model);
                this._addReference(model, options);
            }

            // Do not add multiple models with the same `id`.
            model = existing || model;
            if (!model) continue;
            if (order && ((model.isNew && model.isNew() || !model[this.mainIndex]) || !modelMap[model.cid || model[this.mainIndex]])) order.push(model);
            modelMap[model[this.mainIndex]] = true;
        }

        // Remove nonexistent models if appropriate.
        if (remove) {
            for (i = 0, length = this.length; i < length; i++) {
                model = this.models[i];
                if (!modelMap[model.cid || model[this.mainIndex]]) toRemove.push(model);
            }
            if (toRemove.length) this.remove(toRemove, options);
        }

        // See if sorting is needed, update `length` and splice in new models.
        if (toAdd.length || (order && order.length)) {
            if (sortable) sort = true;
            if (at != null) {
                for (i = 0, length = toAdd.length; i < length; i++) {
                    this.models.splice(at + i, 0, toAdd[i]);
                }
            } else {
                var orderedModels = order || toAdd;
                for (i = 0, length = orderedModels.length; i < length; i++) {
                    this.models.push(orderedModels[i]);
                }
            }
        }

        // Silently sort the collection if appropriate.
        if (sort) this.sort({silent: true});

        // Unless silenced, it's time to fire all appropriate add/sort events.
        if (!options.silent) {
            for (i = 0, length = toAdd.length; i < length; i++) {
                model = toAdd[i];
                if (model.trigger) {
                    model.trigger('add', model, this, options);
                } else {
                    this.trigger('add', model, this, options);
                }
            }
            if (sort || (order && order.length)) this.trigger('sort', this, options);
        }

        // Return the added (or merged) model (or models).
        return singular ? models[0] : models;
    },

    get: function (query, indexName) {___jdce_logger("/todomvc.bundle.js", 47);
        if (!query) return;
        var index = this._indexes[indexName || this.mainIndex];
        return index[query] || index[query[this.mainIndex]] || this._indexes.cid[query.cid];
    },

    // Get the model at the given index.
    at: function (index) {___jdce_logger("/todomvc.bundle.js", 48);
        return this.models[index];
    },

    remove: function (models, options) {___jdce_logger("/todomvc.bundle.js", 49);
        var singular = !isArray(models);
        var i, length, model, index;

        models = singular ? [models] : slice.call(models);
        options || (options = {});
        for (i = 0, length = models.length; i < length; i++) {
            model = models[i] = this.get(models[i]);
            if (!model) continue;
            this._deIndex(model);
            index = this.models.indexOf(model);
            this.models.splice(index, 1);
            if (!options.silent) {
                options.index = index;
                if (model.trigger) {
                    model.trigger('remove', model, this, options);
                } else {
                    this.trigger('remove', model, this, options);
                }
            }
            this._removeReference(model, options);
        }
        return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function (models, options) {___jdce_logger("/todomvc.bundle.js", 50);
        options || (options = {});
        for (var i = 0, length = this.models.length; i < length; i++) {
            this._removeReference(this.models[i], options);
        }
        options.previousModels = this.models;
        this._reset();
        models = this.add(models, extend({silent: true}, options));
        if (!options.silent) this.trigger('reset', this, options);
        return models;
    },

    sort: function (options) {___jdce_logger("/todomvc.bundle.js", 51);
        var self = this;
        if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
        options || (options = {});

        if (typeof this.comparator === 'string') {
            this.models.sort(function (left, right) {___jdce_logger("/todomvc.bundle.js", 52);
                if (left.get) {
                    left = left.get(self.comparator);
                    right = right.get(self.comparator);
                } else {
                    left = left[self.comparator];
                    right = right[self.comparator];
                }
                if (left > right || left === void 0) return 1;
                if (left < right || right === void 0) return -1;
                return 0;
            });
        } else if (this.comparator.length === 1) {
            this.models.sort(function (left, right) {___jdce_logger("/todomvc.bundle.js", 53);
                left = self.comparator(left);
                right = self.comparator(right);
                if (left > right || left === void 0) return 1;
                if (left < right || right === void 0) return -1;
                return 0;
            });
        } else {
            this.models.sort(this.comparator.bind(this));
        }

        if (!options.silent) this.trigger('sort', this, options);
        return this;
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function () {___jdce_logger("/todomvc.bundle.js", 54);
        var list = this.indexes || [];
        var i = 0;
        list.push(this.mainIndex);
        list.push('cid');
        var l = list.length;
        this.models = [];
        this._indexes = {};
        for (; i < l; i++) {
            this._indexes[list[i]] = {};
        }
    },

    _prepareModel: function (attrs, options) {___jdce_logger("/todomvc.bundle.js", 55);
        // if we haven't defined a constructor, skip this
        if (!this.model) return attrs;

        if (this.isModel(attrs)) {
            if (!attrs.collection) attrs.collection = this;
            return attrs;
        } else {
            options = options ? extend({}, options) : {};
            options.collection = this;
            var model = new this.model(attrs, options);
            if (!model.validationError) return model;
            this.trigger('invalid', this, model.validationError, options);
            return false;
        }
    },

    _deIndex: function (model) {___jdce_logger("/todomvc.bundle.js", 56);
        for (var name in this._indexes) {
            delete this._indexes[name][model[name] || (model.get && model.get(name))];
        }
    },

    _index: function (model) {___jdce_logger("/todomvc.bundle.js", 57);
        for (var name in this._indexes) {
            var indexVal = model[name] || (model.get && model.get(name));
            if (indexVal) this._indexes[name][indexVal] = model;
        }
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function (model, options) {___jdce_logger("/todomvc.bundle.js", 58);
        this._index(model);
        if (!model.collection) model.collection = this;
        if (model.on) model.on('all', this._onModelEvent, this);
    },

        // Internal method to sever a model's ties to a collection.
    _removeReference: function (model, options) {___jdce_logger("/todomvc.bundle.js", 59);
        if (this === model.collection) delete model.collection;
        this._deIndex(model);
        if (model.off) model.off('all', this._onModelEvent, this);
    },

    _onModelEvent: function (event, model, collection, options) {___jdce_logger("/todomvc.bundle.js", 60);
        if ((event === 'add' || event === 'remove') && collection !== this) return;
        if (event === 'destroy') this.remove(model, options);
        if (model && event === 'change:' + this.mainIndex) {
            this._deIndex(model);
            this._index(model);
        }
        this.trigger.apply(this, arguments);
    }
});

Object.defineProperties(Collection.prototype, {
    length: {
        get: function () {___jdce_logger("/todomvc.bundle.js", 61);
            return this.models.length;
        }
    },
    isCollection: {
        value: true
    }
});

var arrayMethods = [
    'indexOf',
    'lastIndexOf',
    'every',
    'some',
    'forEach',
    'map',
    'filter',
    'reduce',
    'reduceRight'
];

arrayMethods.forEach(function (method) {___jdce_logger("/todomvc.bundle.js", 62);
    Collection.prototype[method] = function () {___jdce_logger("/todomvc.bundle.js", 63);
        return this.models[method].apply(this.models, arguments);
    };
});

// alias each/forEach for maximum compatibility
Collection.prototype.each = Collection.prototype.forEach;

Collection.extend = classExtend;

module.exports = Collection;

},{"ampersand-class-extend":10,"backbone-events-standalone":12,"extend-object":13,"is-array":14}],10:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 64);
var objectExtend = require('extend-object');


/// Following code is largely pasted from Backbone.js

// Helper function to correctly set up the prototype chain, for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
var extend = function(protoProps) {___jdce_logger("/todomvc.bundle.js", 65);
    var parent = this;
    var child;
    var args = [].slice.call(arguments);

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
        child = protoProps.constructor;
    } else {
        child = function () {___jdce_logger("/todomvc.bundle.js", 66);
            return parent.apply(this, arguments);
        };
    }

    // Add static properties to the constructor function from parent
    objectExtend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){___jdce_logger("/todomvc.bundle.js", 67); this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // Mix in all prototype properties to the subclass if supplied.
    if (protoProps) {
        args.unshift(child.prototype);
        objectExtend.apply(null, args);
    }

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
};

// Expose the extend function
module.exports = extend;

},{"extend-object":13}],11:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 68);
/**
 * Standalone extraction of Backbone.Events, no external dependency required.
 * Degrades nicely when Backone/underscore are already available in the current
 * global context.
 *
 * Note that docs suggest to use underscore's `_.extend()` method to add Events
 * support to some given object. A `mixin()` method has been added to the Events
 * prototype to avoid using underscore for that sole purpose:
 *
 *     var myEventEmitter = BackboneEvents.mixin({});
 *
 * Or for a function constructor:
 *
 *     function MyConstructor(){}
 *     MyConstructor.prototype.foo = function(){}
 *     BackboneEvents.mixin(MyConstructor.prototype);
 *
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * (c) 2013 Nicolas Perriault
 */
/* global exports:true, define, module */
(function() {___jdce_logger("/todomvc.bundle.js", 69);
  var root = this,
      breaker = {},
      nativeForEach = Array.prototype.forEach,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      slice = Array.prototype.slice,
      idCounter = 0;

  // Returns a partial implementation matching the minimal API subset required
  // by Backbone.Events
  function miniscore() {___jdce_logger("/todomvc.bundle.js", 70);
    return {
      keys: Object.keys,

      uniqueId: function(prefix) {___jdce_logger("/todomvc.bundle.js", 71);
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
      },

      has: function(obj, key) {___jdce_logger("/todomvc.bundle.js", 72);
        return hasOwnProperty.call(obj, key);
      },

      each: function(obj, iterator, context) {___jdce_logger("/todomvc.bundle.js", 73);
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
          obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0, l = obj.length; i < l; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) return;
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              if (iterator.call(context, obj[key], key, obj) === breaker) return;
            }
          }
        }
      },

      once: function(){___jdce_logger("/todomvc.bundle.js", 74);}
    };
  }

  var _ = miniscore(), Events;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {___jdce_logger("/todomvc.bundle.js", 75);
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(){___jdce_logger("/todomvc.bundle.js", 76);},

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {___jdce_logger("/todomvc.bundle.js", 77);
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {___jdce_logger("/todomvc.bundle.js", 78);
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {___jdce_logger("/todomvc.bundle.js", 79);
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {___jdce_logger("/todomvc.bundle.js", 80);
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {___jdce_logger("/todomvc.bundle.js", 81);
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {___jdce_logger("/todomvc.bundle.js", 82);
    Events[method] = function(obj, name, callback) {___jdce_logger("/todomvc.bundle.js", 83);
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Mixin utility
  Events.mixin = function(proto) {___jdce_logger("/todomvc.bundle.js", 84);
    var exports = ['on', 'once', 'off', 'trigger', 'stopListening', 'listenTo',
                   'listenToOnce', 'bind', 'unbind'];
    _.each(exports, function(name) {___jdce_logger("/todomvc.bundle.js", 85);
      proto[name] = this[name];
    }, this);
    return proto;
  };

  // Export Events as BackboneEvents depending on current context
  if (typeof define === "function") {
    define(function(){___jdce_logger("/todomvc.bundle.js", 86);});
  } else if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  } else {
    root.BackboneEvents = Events;
  }
})(this);

},{}],12:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 87);
module.exports = require('./backbone-events-standalone');

},{"./backbone-events-standalone":11}],13:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 88);
var arr = [];
var each = arr.forEach;
var slice = arr.slice;


module.exports = function(obj) {___jdce_logger("/todomvc.bundle.js", 89);
    each.call(slice.call(arguments, 1), function(source) {___jdce_logger("/todomvc.bundle.js", 90);
        if (source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};

},{}],14:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 91);

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function(){___jdce_logger("/todomvc.bundle.js", 92);};

},{}],15:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 93);
var Events = require('backbone-events-standalone');
var _ = require('underscore');


// Handles cross-browser history management, based on either
// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
// and URL fragments. If the browser supports neither.
var History = function () {___jdce_logger("/todomvc.bundle.js", 94);
    this.handlers = [];
    this.checkUrl = _.bind(this.checkUrl, this);

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
        this.location = window.location;
        this.history = window.history;
    }
};

// Cached regex for stripping a leading hash/slash and trailing space.
var routeStripper = /^[#\/]|\s+$/g;

// Cached regex for stripping leading and trailing slashes.
var rootStripper = /^\/+|\/+$/g;

// Cached regex for stripping urls of hash.
var pathStripper = /#.*$/;

// Has the history handling already been started?
History.started = false;

// Set up all inheritable **Backbone.History** properties and methods.
_.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function () {___jdce_logger("/todomvc.bundle.js", 95);
        var path = this.location.pathname.replace(/[^\/]$/, '$&/');
        return path === this.root && !this.location.search;
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function (window) {___jdce_logger("/todomvc.bundle.js", 96);
        var match = (window || this).location.href.match(/#(.*)$/);
        return match ? match[1] : '';
    },

    // Get the pathname and search params, without the root.
    getPath: function () {___jdce_logger("/todomvc.bundle.js", 97);
        var path = decodeURI(this.location.pathname + this.location.search);
        var root = this.root.slice(0, -1);
        if (!path.indexOf(root)) path = path.slice(root.length);
        return path.slice(1);
    },

    // Get the cross-browser normalized URL fragment from the path or hash.
    getFragment: function (fragment) {___jdce_logger("/todomvc.bundle.js", 98);
        if (fragment == null) {
            if (this._hasPushState || !this._wantsHashChange) {
                fragment = this.getPath();
            } else {
                fragment = this.getHash();
            }
        }
        return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function (options) {___jdce_logger("/todomvc.bundle.js", 99);
        if (History.started) throw new Error("Backbone.history has already been started");
        History.started = true;

        // Figure out the initial configuration.
        // Is pushState desired ... is it available?
        this.options          = _.extend({root: '/'}, this.options, options);
        this.root             = this.options.root;
        this._wantsHashChange = this.options.hashChange !== false;
        this._hasHashChange   = 'onhashchange' in window;
        this._wantsPushState  = !!this.options.pushState;
        this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
        this.fragment         = this.getFragment();

        // Add a cross-platform `addEventListener` shim for older browsers.
        var addEventListener = window.addEventListener;

        // Normalize root to always include a leading and trailing slash.
        this.root = ('/' + this.root + '/').replace(rootStripper, '/');

        // Depending on whether we're using pushState or hashes, and whether
        // 'onhashchange' is supported, determine how we check the URL state.
        if (this._hasPushState) {
            addEventListener('popstate', this.checkUrl, false);
        } else if (this._wantsHashChange && this._hasHashChange) {
            addEventListener('hashchange', this.checkUrl, false);
        } else if (this._wantsHashChange) {
            this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
        }

        // Transition from hashChange to pushState or vice versa if both are
        // requested.
        if (this._wantsHashChange && this._wantsPushState) {

            // If we've started off with a route from a `pushState`-enabled
            // browser, but we're currently in a browser that doesn't support it...
            if (!this._hasPushState && !this.atRoot()) {
                this.location.replace(this.root + '#' + this.getPath());
                // Return immediately as browser will do redirect to new url
                return true;

            // Or if we've started out with a hash-based route, but we're currently
            // in a browser where it could be `pushState`-based instead...
            } else if (this._hasPushState && this.atRoot()) {
                this.navigate(this.getHash(), {replace: true});
            }
        }

        if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function(){___jdce_logger("/todomvc.bundle.js", 100);},

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function (route, callback) {___jdce_logger("/todomvc.bundle.js", 101);
        this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`.
    checkUrl: function(){___jdce_logger("/todomvc.bundle.js", 102);},

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function (fragment) {___jdce_logger("/todomvc.bundle.js", 103);
        fragment = this.fragment = this.getFragment(fragment);
        return this.handlers.some(function (handler) {___jdce_logger("/todomvc.bundle.js", 104);
            if (handler.route.test(fragment)) {
                handler.callback(fragment);
                return true;
            }
        });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function (fragment, options) {___jdce_logger("/todomvc.bundle.js", 105);
        if (!History.started) return false;
        if (!options || options === true) options = {trigger: !!options};

        var url = this.root + (fragment = this.getFragment(fragment || ''));

        // Strip the hash and decode for matching.
        fragment = decodeURI(fragment.replace(pathStripper, ''));

        if (this.fragment === fragment) return;
        this.fragment = fragment;

        // Don't include a trailing slash on the root.
        if (fragment === '' && url !== '/') url = url.slice(0, -1);

        // If pushState is available, we use it to set the fragment as a real URL.
        if (this._hasPushState) {
            this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

            // If hash changes haven't been explicitly disabled, update the hash
            // fragment to store history.
        } else if (this._wantsHashChange) {
            this._updateHash(this.location, fragment, options.replace);
            // If you've told us that you explicitly don't want fallback hashchange-
            // based history, then `navigate` becomes a page refresh.
        } else {
            return this.location.assign(url);
        }
        if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function (location, fragment, replace) {___jdce_logger("/todomvc.bundle.js", 106);
        if (replace) {
            var href = location.href.replace(/(javascript:|#).*$/, '');
            location.replace(href + '#' + fragment);
        } else {
            // Some browsers require that `hash` contains a leading #.
            location.hash = '#' + fragment;
        }
    }

});

module.exports = new History();

},{"backbone-events-standalone":20,"underscore":21}],16:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 107);
;window.ampersand = window.ampersand || {};window.ampersand["ampersand-router"] = window.ampersand["ampersand-router"] || [];window.ampersand["ampersand-router"].push("1.0.6");
var classExtend = require('ampersand-class-extend');
var Events = require('backbone-events-standalone');
var ampHistory = require('./ampersand-history');
var _ = require('underscore');


// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.
var Router = module.exports = function (options) {___jdce_logger("/todomvc.bundle.js", 108);
    options || (options = {});
    this.history = options.history || ampHistory;
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
};

// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
var optionalParam = /\((.*?)\)/g;
var namedParam    = /(\(\?)?:\w+/g;
var splatParam    = /\*\w+/g;
var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

// Set up all inheritable **Backbone.Router** properties and methods.
_.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function () {___jdce_logger("/todomvc.bundle.js", 109);},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function (query, num) {
    //       ...
    //     });
    //
    route: function (route, name, callback) {___jdce_logger("/todomvc.bundle.js", 110);
        if (!_.isRegExp(route)) route = this._routeToRegExp(route);
        if (_.isFunction(name)) {
            callback = name;
            name = '';
        }
        if (!callback) callback = this[name];
        var router = this;
        this.history.route(route, function (fragment) {___jdce_logger("/todomvc.bundle.js", 111);
            var args = router._extractParameters(route, fragment);
            if (router.execute(callback, args, name) !== false) {
                router.trigger.apply(router, ['route:' + name].concat(args));
                router.trigger('route', name, args);
                router.history.trigger('route', router, name, args);
            }
        });
        return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function (callback, args, name) {___jdce_logger("/todomvc.bundle.js", 112);
        if (callback) callback.apply(this, args);
    },

    // Simple proxy to `ampHistory` to save a fragment into the history.
    navigate: function (fragment, options) {___jdce_logger("/todomvc.bundle.js", 113);
        this.history.navigate(fragment, options);
        return this;
    },

    // Helper for doing `internal` redirects without adding to history
    // and thereby breaking backbutton functionality.
    redirectTo: function(){___jdce_logger("/todomvc.bundle.js", 114);},

    // Bind all defined routes to `history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function () {___jdce_logger("/todomvc.bundle.js", 115);
        if (!this.routes) return;
        this.routes = _.result(this, 'routes');
        var route, routes = Object.keys(this.routes);
        while ((route = routes.pop()) != null) {
            this.route(route, this.routes[route]);
        }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function (route) {___jdce_logger("/todomvc.bundle.js", 116);
        route = route
            .replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function (match, optional) {___jdce_logger("/todomvc.bundle.js", 117);
                return optional ? match : '([^/?]+)';
            })
            .replace(splatParam, '([^?]*?)');
        return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function (route, fragment) {___jdce_logger("/todomvc.bundle.js", 118);
        var params = route.exec(fragment).slice(1);
        return params.map(function (param, i) {___jdce_logger("/todomvc.bundle.js", 119);
            // Don't decode the search params.
            if (i === params.length - 1) return param || null;
            return param ? decodeURIComponent(param) : null;
        });
    }

});

Router.extend = classExtend;

},{"./ampersand-history":15,"ampersand-class-extend":17,"backbone-events-standalone":20,"underscore":21}],17:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 120);
module.exports=require(10)
},{"extend-object":18}],18:[function(){___jdce_logger("/todomvc.bundle.js", 121);},{}],19:[function(){___jdce_logger("/todomvc.bundle.js", 122);},{}],20:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 123);
module.exports=require(12)
},{"./backbone-events-standalone":19}],21:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 124);
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {___jdce_logger("/todomvc.bundle.js", 125);

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {___jdce_logger("/todomvc.bundle.js", 126);
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {___jdce_logger("/todomvc.bundle.js", 127);
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {___jdce_logger("/todomvc.bundle.js", 128);
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(){___jdce_logger("/todomvc.bundle.js", 129);});
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {___jdce_logger("/todomvc.bundle.js", 130);
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(){___jdce_logger("/todomvc.bundle.js", 131);});
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(){___jdce_logger("/todomvc.bundle.js", 132);};

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {___jdce_logger("/todomvc.bundle.js", 133);
    var result;
    any(obj, function(){___jdce_logger("/todomvc.bundle.js", 134);});
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {___jdce_logger("/todomvc.bundle.js", 135);
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(){___jdce_logger("/todomvc.bundle.js", 136);});
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(){___jdce_logger("/todomvc.bundle.js", 137);};

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {___jdce_logger("/todomvc.bundle.js", 138);
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(){___jdce_logger("/todomvc.bundle.js", 139);});
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {___jdce_logger("/todomvc.bundle.js", 140);
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(){___jdce_logger("/todomvc.bundle.js", 141);});
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {___jdce_logger("/todomvc.bundle.js", 142);
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(){___jdce_logger("/todomvc.bundle.js", 143);});
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {___jdce_logger("/todomvc.bundle.js", 144);
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {___jdce_logger("/todomvc.bundle.js", 145);
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {___jdce_logger("/todomvc.bundle.js", 146);
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(){___jdce_logger("/todomvc.bundle.js", 147);};

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(){___jdce_logger("/todomvc.bundle.js", 148);};

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {___jdce_logger("/todomvc.bundle.js", 149);
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(){___jdce_logger("/todomvc.bundle.js", 150);});
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(){___jdce_logger("/todomvc.bundle.js", 151);};

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(){___jdce_logger("/todomvc.bundle.js", 152);};

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(){___jdce_logger("/todomvc.bundle.js", 153);};

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {___jdce_logger("/todomvc.bundle.js", 154);
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {___jdce_logger("/todomvc.bundle.js", 155);
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {___jdce_logger("/todomvc.bundle.js", 156);
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {___jdce_logger("/todomvc.bundle.js", 157);
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {___jdce_logger("/todomvc.bundle.js", 158);
    return function(){___jdce_logger("/todomvc.bundle.js", 159);};
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(){___jdce_logger("/todomvc.bundle.js", 160);});

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(){___jdce_logger("/todomvc.bundle.js", 161);});

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(){___jdce_logger("/todomvc.bundle.js", 162);});

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {___jdce_logger("/todomvc.bundle.js", 163);
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(){___jdce_logger("/todomvc.bundle.js", 164);};

  // Return the number of elements in an object.
  _.size = function(){___jdce_logger("/todomvc.bundle.js", 165);};

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(){___jdce_logger("/todomvc.bundle.js", 166);};

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(){___jdce_logger("/todomvc.bundle.js", 167);};

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {___jdce_logger("/todomvc.bundle.js", 168);
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(){___jdce_logger("/todomvc.bundle.js", 169);};

  // Trim out all falsy values from an array.
  _.compact = function(){___jdce_logger("/todomvc.bundle.js", 170);};

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {___jdce_logger("/todomvc.bundle.js", 171);
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(){___jdce_logger("/todomvc.bundle.js", 172);});
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {___jdce_logger("/todomvc.bundle.js", 173);
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(){___jdce_logger("/todomvc.bundle.js", 174);};

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(){___jdce_logger("/todomvc.bundle.js", 175);};

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {___jdce_logger("/todomvc.bundle.js", 176);
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(){___jdce_logger("/todomvc.bundle.js", 177);});
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {___jdce_logger("/todomvc.bundle.js", 178);
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(){___jdce_logger("/todomvc.bundle.js", 179);};

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {___jdce_logger("/todomvc.bundle.js", 180);
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){___jdce_logger("/todomvc.bundle.js", 181); return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(){___jdce_logger("/todomvc.bundle.js", 182);};

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(){___jdce_logger("/todomvc.bundle.js", 183);};

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {___jdce_logger("/todomvc.bundle.js", 184);
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(){___jdce_logger("/todomvc.bundle.js", 185);};

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(){___jdce_logger("/todomvc.bundle.js", 186);};

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){___jdce_logger("/todomvc.bundle.js", 187);};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {___jdce_logger("/todomvc.bundle.js", 188);
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {___jdce_logger("/todomvc.bundle.js", 189);
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {___jdce_logger("/todomvc.bundle.js", 190);
    var boundArgs = slice.call(arguments, 1);
    return function(){___jdce_logger("/todomvc.bundle.js", 191);};
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(){___jdce_logger("/todomvc.bundle.js", 192);};

  // Memoize an expensive function by storing its results.
  _.memoize = function(){___jdce_logger("/todomvc.bundle.js", 193);};

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(){___jdce_logger("/todomvc.bundle.js", 194);};

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(){___jdce_logger("/todomvc.bundle.js", 195);};

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(){___jdce_logger("/todomvc.bundle.js", 196);};

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(){___jdce_logger("/todomvc.bundle.js", 197);};

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(){___jdce_logger("/todomvc.bundle.js", 198);};

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(){___jdce_logger("/todomvc.bundle.js", 199);};

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function(){___jdce_logger("/todomvc.bundle.js", 200);};

  // Returns a function that will only be executed after being called N times.
  _.after = function(){___jdce_logger("/todomvc.bundle.js", 201);};

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {___jdce_logger("/todomvc.bundle.js", 202);
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {___jdce_logger("/todomvc.bundle.js", 203);
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {___jdce_logger("/todomvc.bundle.js", 204);
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {___jdce_logger("/todomvc.bundle.js", 205);
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {___jdce_logger("/todomvc.bundle.js", 206);
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {___jdce_logger("/todomvc.bundle.js", 207);
    each(slice.call(arguments, 1), function(source) {___jdce_logger("/todomvc.bundle.js", 208);
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {___jdce_logger("/todomvc.bundle.js", 209);
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {___jdce_logger("/todomvc.bundle.js", 210);
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(){___jdce_logger("/todomvc.bundle.js", 211);};

  // Fill in a given object with default properties.
  _.defaults = function(obj) {___jdce_logger("/todomvc.bundle.js", 212);
    each(slice.call(arguments, 1), function(){___jdce_logger("/todomvc.bundle.js", 213);});
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(){___jdce_logger("/todomvc.bundle.js", 214);};

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(){___jdce_logger("/todomvc.bundle.js", 215);};

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {___jdce_logger("/todomvc.bundle.js", 216);
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {___jdce_logger("/todomvc.bundle.js", 217);
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {___jdce_logger("/todomvc.bundle.js", 218);
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(){___jdce_logger("/todomvc.bundle.js", 219);};

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {___jdce_logger("/todomvc.bundle.js", 220);
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {___jdce_logger("/todomvc.bundle.js", 221);
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {___jdce_logger("/todomvc.bundle.js", 222);
    _['is' + name] = function(obj) {___jdce_logger("/todomvc.bundle.js", 223);
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {___jdce_logger("/todomvc.bundle.js", 224);
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {___jdce_logger("/todomvc.bundle.js", 225);
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(){___jdce_logger("/todomvc.bundle.js", 226);};

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {___jdce_logger("/todomvc.bundle.js", 227);
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {___jdce_logger("/todomvc.bundle.js", 228);
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {___jdce_logger("/todomvc.bundle.js", 229);
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {___jdce_logger("/todomvc.bundle.js", 230);
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {___jdce_logger("/todomvc.bundle.js", 231);
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function(){___jdce_logger("/todomvc.bundle.js", 232);};

  // Keep the identity function around for default iterators.
  _.identity = function(value) {___jdce_logger("/todomvc.bundle.js", 233);
    return value;
  };

  _.constant = function(){___jdce_logger("/todomvc.bundle.js", 234);};

  _.property = function(key) {___jdce_logger("/todomvc.bundle.js", 235);
    return function(obj) {___jdce_logger("/todomvc.bundle.js", 236);
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {___jdce_logger("/todomvc.bundle.js", 237);
    return function(obj) {___jdce_logger("/todomvc.bundle.js", 238);
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(){___jdce_logger("/todomvc.bundle.js", 239);};

  // Return a random integer between min and max (inclusive).
  _.random = function(){___jdce_logger("/todomvc.bundle.js", 240);};

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function(){___jdce_logger("/todomvc.bundle.js", 241);};

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {___jdce_logger("/todomvc.bundle.js", 242);
    _[method] = function(){___jdce_logger("/todomvc.bundle.js", 243);};
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {___jdce_logger("/todomvc.bundle.js", 244);
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {___jdce_logger("/todomvc.bundle.js", 245);
    each(_.functions(obj), function(name) {___jdce_logger("/todomvc.bundle.js", 246);
      var func = _[name] = obj[name];
      _.prototype[name] = function(){___jdce_logger("/todomvc.bundle.js", 247);};
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {___jdce_logger("/todomvc.bundle.js", 248);
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {___jdce_logger("/todomvc.bundle.js", 249);
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {___jdce_logger("/todomvc.bundle.js", 250);
      source += text.slice(index, offset)
        .replace(escaper, function(match) {___jdce_logger("/todomvc.bundle.js", 251); return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(){___jdce_logger("/todomvc.bundle.js", 252);};

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {___jdce_logger("/todomvc.bundle.js", 253);
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(){___jdce_logger("/todomvc.bundle.js", 254);};

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {___jdce_logger("/todomvc.bundle.js", 255);
    var method = ArrayProto[name];
    _.prototype[name] = function(){___jdce_logger("/todomvc.bundle.js", 256);};
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {___jdce_logger("/todomvc.bundle.js", 257);
    var method = ArrayProto[name];
    _.prototype[name] = function(){___jdce_logger("/todomvc.bundle.js", 258);};
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {___jdce_logger("/todomvc.bundle.js", 259);
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function(){___jdce_logger("/todomvc.bundle.js", 260);}

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function(){___jdce_logger("/todomvc.bundle.js", 261);});
  }
}).call(this);

},{}],22:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 262);
;window.ampersand = window.ampersand || {};window.ampersand["ampersand-state"] = window.ampersand["ampersand-state"] || [];window.ampersand["ampersand-state"].push("4.3.14");
var _ = require('underscore');
var BBEvents = require('backbone-events-standalone');
var KeyTree = require('key-tree-store');
var arrayNext = require('array-next');
var changeRE = /^change:/;

function Base(attrs, options) {___jdce_logger("/todomvc.bundle.js", 263);
    options || (options = {});
    this.cid || (this.cid = _.uniqueId('state'));
    this._events = {};
    this._values = {};
    this._definition = Object.create(this._definition);
    if (options.parse) attrs = this.parse(attrs, options);
    this.parent = options.parent;
    this.collection = options.collection;
    this._keyTree = new KeyTree();
    this._initCollections();
    this._initChildren();
    this._cache = {};
    this._previousAttributes = {};
    if (attrs) this.set(attrs, _.extend({silent: true, initial: true}, options));
    this._changed = {};
    if (this._derived) this._initDerived();
    if (options.init !== false) this.initialize.apply(this, arguments);
}


_.extend(Base.prototype, BBEvents, {
    // can be allow, ignore, reject
    extraProperties: 'ignore',

    idAttribute: 'id',

    namespaceAttribute: 'namespace',

    typeAttribute: 'modelType',

    // Stubbed out to be overwritten
    initialize: function(){___jdce_logger("/todomvc.bundle.js", 264);},

    // Get ID of model per configuration.
    // Should *always* be how ID is determined by other code.
    getId: function () {___jdce_logger("/todomvc.bundle.js", 265);
        return this[this.idAttribute];
    },

    // Get namespace of model per configuration.
    // Should *always* be how namespace is determined by other code.
    getNamespace: function(){___jdce_logger("/todomvc.bundle.js", 266);},

    // Get type of model per configuration.
    // Should *always* be how type is determined by other code.
    getType: function(){___jdce_logger("/todomvc.bundle.js", 267);},

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function () {___jdce_logger("/todomvc.bundle.js", 268);
        return this.getId() == null;
    },

    // get HTML-escaped value of attribute
    escape: function(){___jdce_logger("/todomvc.bundle.js", 269);},

    // Check if the model is currently in a valid state.
    isValid: function(){___jdce_logger("/todomvc.bundle.js", 270);},

    // Parse can be used remap/restructure/rename incoming properties
    // before they are applied to attributes.
    parse: function (resp, options) {___jdce_logger("/todomvc.bundle.js", 271);
        return resp;
    },

    // Serialize is the inverse of `parse` it lets you massage data
    // on the way out. Before, sending to server, for example.
    serialize: function () {___jdce_logger("/todomvc.bundle.js", 272);
        var res = this.getAttributes({props: true}, true);
        _.each(this._children, function (value, key) {___jdce_logger("/todomvc.bundle.js", 273);
            res[key] = this[key].serialize();
        }, this);
        _.each(this._collections, function (value, key) {___jdce_logger("/todomvc.bundle.js", 274);
            res[key] = this[key].serialize();
        }, this);
        return res;
    },

    // Main set method used by generated setters/getters and can
    // be used directly if you need to pass options or set multiple
    // properties at once.
    set: function (key, value, options) {___jdce_logger("/todomvc.bundle.js", 275);
        var self = this;
        var extraProperties = this.extraProperties;
        var triggers = [];
        var changing, changes, newType, newVal, def, cast, err, attr,
            attrs, dataType, silent, unset, currentVal, initial, hasChanged, isEqual;

        // Handle both `"key", value` and `{key: value}` -style arguments.
        if (_.isObject(key) || key === null) {
            attrs = key;
            options = value;
        } else {
            attrs = {};
            attrs[key] = value;
        }

        options = options || {};

        if (!this._validate(attrs, options)) return false;

        // Extract attributes and options.
        unset = options.unset;
        silent = options.silent;
        initial = options.initial;

        changes = [];
        changing = this._changing;
        this._changing = true;

        // if not already changing, store previous
        if (!changing) {
            this._previousAttributes = this.attributes;
            this._changed = {};
        }

        // For each `set` attribute...
        for (attr in attrs) {
            newVal = attrs[attr];
            newType = typeof newVal;
            currentVal = this._values[attr];
            def = this._definition[attr];


            if (!def) {
                // if this is a child model or collection
                if (this._children[attr] || this._collections[attr]) {
                    this[attr].set(newVal, options);
                    continue;
                } else if (extraProperties === 'ignore') {
                    continue;
                } else if (extraProperties === 'reject') {
                    throw new TypeError('No "' + attr + '" property defined on ' + (this.type || 'this') + ' model and extraProperties not set to "ignore" or "allow"');
                } else if (extraProperties === 'allow') {
                    def = this._createPropertyDefinition(attr, 'any');
                }
            }

            isEqual = this._getCompareForType(def.type);
            dataType = this._dataTypes[def.type];

            // check type if we have one
            if (dataType && dataType.set) {
                cast = dataType.set(newVal);
                newVal = cast.val;
                newType = cast.type;
            }

            // If we've defined a test, run it
            if (def.test) {
                err = def.test.call(this, newVal, newType);
                if (err) {
                    throw new TypeError('Property \'' + attr + '\' failed validation with error: ' + err);
                }
            }

            // If we are required but undefined, throw error.
            // If we are null and are not allowing null, throw error
            // If we have a defined type and the new type doesn't match, and we are not null, throw error.

            if (_.isUndefined(newVal) && def.required) {
                throw new TypeError('Required property \'' + attr + '\' must be of type ' + def.type + '. Tried to set ' + newVal);
            }
            if (_.isNull(newVal) && def.required && !def.allowNull) {
                throw new TypeError('Property \'' + attr + '\' must be of type ' + def.type + ' (cannot be null). Tried to set ' + newVal);
            }
            if ((def.type && def.type !== 'any' && def.type !== newType) && !_.isNull(newVal) && !_.isUndefined(newVal)) {
                throw new TypeError('Property \'' + attr + '\' must be of type ' + def.type + '. Tried to set ' + newVal);
            }
            if (def.values && !_.contains(def.values, newVal)) {
                throw new TypeError('Property \'' + attr + '\' must be one of values: ' + def.values.join(', '));
            }

            hasChanged = !isEqual(currentVal, newVal, attr);

            // enforce `setOnce` for properties if set
            if (def.setOnce && currentVal !== undefined && hasChanged) {
                throw new TypeError('Property \'' + key + '\' can only be set once.');
            }

            // keep track of changed attributes
            // and push to changes array
            if (hasChanged) {
                changes.push({prev: currentVal, val: newVal, key: attr});
                self._changed[attr] = newVal;
            } else {
                delete self._changed[attr];
            }
        }

        // actually update our values
        _.each(changes, function (change) {___jdce_logger("/todomvc.bundle.js", 276);
            self._previousAttributes[change.key] = change.prev;
            if (unset) {
                delete self._values[change.key];
            } else {
                self._values[change.key] = change.val;
            }
        });

        if (!silent && changes.length) self._pending = true;
        if (!silent) {
            _.each(changes, function (change) {___jdce_logger("/todomvc.bundle.js", 277);
                self.trigger('change:' + change.key, self, change.val, options);
            });
        }

        // You might be wondering why there's a `while` loop here. Changes can
        // be recursively nested within `"change"` events.
        if (changing) return this;
        if (!silent) {
            while (this._pending) {
                this._pending = false;
                this.trigger('change', this, options);
            }
        }
        this._pending = false;
        this._changing = false;
        return this;
    },

    get: function (attr) {___jdce_logger("/todomvc.bundle.js", 278);
        return this[attr];
    },

    // Toggle boolean properties or properties that have a `values`
    // array in its definition.
    toggle: function(){___jdce_logger("/todomvc.bundle.js", 279);},

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function(){___jdce_logger("/todomvc.bundle.js", 280);},

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function (attr) {___jdce_logger("/todomvc.bundle.js", 281);
        if (attr == null) return !_.isEmpty(this._changed);
        return _.has(this._changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(){___jdce_logger("/todomvc.bundle.js", 282);},

    toJSON: function(){___jdce_logger("/todomvc.bundle.js", 283);},

    unset: function (attr, options) {___jdce_logger("/todomvc.bundle.js", 284);
        var def = this._definition[attr];
        var type = def.type;
        var val;
        if (def.required) {
            val = _.result(def, 'default');
            return this.set(attr, val, options);
        } else {
            return this.set(attr, val, _.extend({}, options, {unset: true}));
        }
    },

    clear: function(){___jdce_logger("/todomvc.bundle.js", 285);},

    previous: function(){___jdce_logger("/todomvc.bundle.js", 286);},

    // Get default values for a certain type
    _getDefaultForType: function (type) {___jdce_logger("/todomvc.bundle.js", 287);
        var dataType = this._dataTypes[type];
        return dataType && dataType.default;
    },

    // Determine which comparison algorithm to use for comparing a property
    _getCompareForType: function (type) {___jdce_logger("/todomvc.bundle.js", 288);
        var dataType = this._dataTypes[type];
        if (dataType && dataType.compare) return _.bind(dataType.compare, this);
        return _.isEqual;
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function (attrs, options) {___jdce_logger("/todomvc.bundle.js", 289);
        if (!options.validate || !this.validate) return true;
        attrs = _.extend({}, this.attributes, attrs);
        var error = this.validationError = this.validate(attrs, options) || null;
        if (!error) return true;
        this.trigger('invalid', this, error, _.extend(options || {}, {validationError: error}));
        return false;
    },

    _createPropertyDefinition: function (name, desc, isSession) {___jdce_logger("/todomvc.bundle.js", 290);
        return createPropertyDefinition(this, name, desc, isSession);
    },

    // just makes friendlier errors when trying to define a new model
    // only used when setting up original property definitions
    _ensureValidType: function (type) {___jdce_logger("/todomvc.bundle.js", 291);
        return _.contains(['string', 'number', 'boolean', 'array', 'object', 'date', 'any'].concat(_.keys(this._dataTypes)), type) ? type : undefined;
    },

    getAttributes: function (options, raw) {___jdce_logger("/todomvc.bundle.js", 292);
        options || (options = {});
        _.defaults(options, {
            session: false,
            props: false,
            derived: false
        });
        var res = {};
        var val, item, def;
        for (item in this._definition) {
            def = this._definition[item];
            if ((options.session && def.session) || (options.props && !def.session)) {
                val = (raw) ? this._values[item] : this[item];
                if (typeof val === 'undefined') val = _.result(def, 'default');
                if (typeof val !== 'undefined') res[item] = val;
            }
        }
        if (options.derived) {
            for (item in this._derived) res[item] = this[item];
        }
        return res;
    },

    _initDerived: function () {___jdce_logger("/todomvc.bundle.js", 293);
        var self = this;

        _.each(this._derived, function (value, name) {___jdce_logger("/todomvc.bundle.js", 294);
            var def = self._derived[name];
            def.deps = def.depList;

            var update = function (options) {___jdce_logger("/todomvc.bundle.js", 295);
                options = options || {};

                var newVal = def.fn.call(self);

                if (self._cache[name] !== newVal || !def.cache) {
                    if (def.cache) {
                        self._previousAttributes[name] = self._cache[name];
                    }
                    self._cache[name] = newVal;
                    self.trigger('change:' + name, self, self._cache[name]);
                }
            };

            def.deps.forEach(function (propString) {___jdce_logger("/todomvc.bundle.js", 296);
                self._keyTree.add(propString, update);
            });
        });

        this.on('all', function (eventName) {___jdce_logger("/todomvc.bundle.js", 297);
            if (changeRE.test(eventName)) {
                self._keyTree.get(eventName.split(':')[1]).forEach(function (fn) {___jdce_logger("/todomvc.bundle.js", 298);
                    fn();
                });
            }
        }, this);
    },

    _getDerivedProperty: function (name, flushCache) {___jdce_logger("/todomvc.bundle.js", 299);
        // is this a derived property that is cached
        if (this._derived[name].cache) {
            //set if this is the first time, or flushCache is set
            if (flushCache || !this._cache.hasOwnProperty(name)) {
                this._cache[name] = this._derived[name].fn.apply(this);
            }
            return this._cache[name];
        } else {
            return this._derived[name].fn.apply(this);
        }
    },

    _initCollections: function () {___jdce_logger("/todomvc.bundle.js", 300);
        var coll;
        if (!this._collections) return;
        for (coll in this._collections) {
            this[coll] = new this._collections[coll](null, {parent: this});
        }
    },

    _initChildren: function () {___jdce_logger("/todomvc.bundle.js", 301);
        var child;
        if (!this._children) return;
        for (child in this._children) {
            this[child] = new this._children[child]({}, {parent: this});
            this.listenTo(this[child], 'all', this._getEventBubblingHandler(child));
        }
    },

    // Returns a bound handler for doing event bubbling while
    // adding a name to the change string.
    _getEventBubblingHandler: function (propertyName) {___jdce_logger("/todomvc.bundle.js", 302);
        return _.bind(function (name, model, newValue) {___jdce_logger("/todomvc.bundle.js", 303);
            if (changeRE.test(name)) {
                this.trigger('change:' + propertyName + '.' + name.split(':')[1], model, newValue);
            } else if (name === 'change') {
                this.trigger('change', this);
            }
        }, this);
    },

    // Check that all required attributes are present
    _verifyRequired: function(){___jdce_logger("/todomvc.bundle.js", 304);}
});

// getter for attributes
Object.defineProperties(Base.prototype, {
    attributes: {
        get: function () {___jdce_logger("/todomvc.bundle.js", 305);
            return this.getAttributes({props: true, session: true});
        }
    },
    all: {
        get: function () {___jdce_logger("/todomvc.bundle.js", 306);
            return this.getAttributes({
                session: true,
                props: true,
                derived: true
            });
        }
    },
    isState: {
        get: function () {___jdce_logger("/todomvc.bundle.js", 307); return true; },
        set: function () {___jdce_logger("/todomvc.bundle.js", 308); }
    }
});

// helper for creating/storing property definitions and creating
// appropriate getters/setters
function createPropertyDefinition(object, name, desc, isSession) {___jdce_logger("/todomvc.bundle.js", 309);
    var def = object._definition[name] = {};
    var type, descArray;

    if (_.isString(desc)) {
        // grab our type if all we've got is a string
        type = object._ensureValidType(desc);
        if (type) def.type = type;
    } else {

        //Transform array of ['type', required, default] to object form
        if (_.isArray(desc)) {
            descArray = desc;
            desc = {
                type: descArray[0],
                required: descArray[1],
                default: descArray[2]
            };
        }

        type = object._ensureValidType(desc.type);
        if (type) def.type = type;

        if (desc.required) def.required = true;

        if (desc.default && typeof desc.default === 'object') {
            throw new TypeError('The default value for ' + name + ' cannot be an object/array, must be a value or a function which returns a value/object/array');
        }
        def.default = desc.default;

        def.allowNull = desc.allowNull ? desc.allowNull : false;
        if (desc.setOnce) def.setOnce = true;
        if (def.required && _.isUndefined(def.default)) def.default = object._getDefaultForType(type);
        def.test = desc.test;
        def.values = desc.values;
    }
    if (isSession) def.session = true;

    // define a getter/setter on the prototype
    // but they get/set on the instance
    Object.defineProperty(object, name, {
        set: function (val) {___jdce_logger("/todomvc.bundle.js", 310);
            this.set(name, val);
        },
        get: function () {___jdce_logger("/todomvc.bundle.js", 311);
            var result = this._values[name];
            var typeDef = this._dataTypes[def.type];
            if (typeof result !== 'undefined') {
                if (typeDef && typeDef.get) {
                    result = typeDef.get(result);
                }
                return result;
            }
            return _.result(def, 'default');
        }
    });

    return def;
}

// helper for creating derived property definitions
function createDerivedProperty(modelProto, name, definition) {___jdce_logger("/todomvc.bundle.js", 312);
    var def = modelProto._derived[name] = {
        fn: _.isFunction(definition) ? definition : definition.fn,
        cache: (definition.cache !== false),
        depList: definition.deps || []
    };

    // add to our shared dependency list
    _.each(def.depList, function (dep) {___jdce_logger("/todomvc.bundle.js", 313);
        modelProto._deps[dep] = _(modelProto._deps[dep] || []).union([name]);
    });

    // defined a top-level getter for derived names
    Object.defineProperty(modelProto, name, {
        get: function () {___jdce_logger("/todomvc.bundle.js", 314);
            return this._getDerivedProperty(name);
        },
        set: function () {___jdce_logger("/todomvc.bundle.js", 315);
            throw new TypeError('"' + name + '" is a derived property, it can\'t be set directly.');
        }
    });
}

var dataTypes = {
    string: {
        default: function(){___jdce_logger("/todomvc.bundle.js", 316);}
    },
    date: {
        set: function (newVal) {___jdce_logger("/todomvc.bundle.js", 317);
            var newType;
            if (!_.isDate(newVal)) {
                try {
                    newVal = new Date(parseInt(newVal, 10));
                    if (!_.isDate(newVal)) throw TypeError;
                    newVal = newVal.valueOf();
                    if (_.isNaN(newVal)) throw TypeError;
                    newType = 'date';
                } catch (e) {
                    newType = typeof newVal;
                }
            } else {
                newType = 'date';
                newVal = newVal.valueOf();
            }
            return {
                val: newVal,
                type: newType
            };
        },
        get: function (val) {___jdce_logger("/todomvc.bundle.js", 318);
            return new Date(val);
        },
        default: function(){___jdce_logger("/todomvc.bundle.js", 319);}
    },
    array: {
        set: function (newVal) {___jdce_logger("/todomvc.bundle.js", 320);
            return {
                val: newVal,
                type: _.isArray(newVal) ? 'array' : typeof newVal
            };
        },
        default: function(){___jdce_logger("/todomvc.bundle.js", 321);}
    },
    object: {
        set: function (newVal) {___jdce_logger("/todomvc.bundle.js", 322);
            var newType = typeof newVal;
            // we have to have a way of supporting "missing" objects.
            // Null is an object, but setting a value to undefined
            // should work too, IMO. We just override it, in that case.
            if (newType !== 'object' && _.isUndefined(newVal)) {
                newVal = null;
                newType = 'object';
            }
            return {
                val: newVal,
                type: newType
            };
        },
        default: function(){___jdce_logger("/todomvc.bundle.js", 323);}
    },
    // the `state` data type is a bit special in that setting it should
    // also bubble events
    state: {
        set: function (newVal) {___jdce_logger("/todomvc.bundle.js", 324);
            var isInstance = newVal instanceof Base || (newVal && newVal.isState);
            if (isInstance) {
                return {
                    val: newVal,
                    type: 'state'
                };
            } else {
                return {
                    val: newVal,
                    type: typeof newVal
                };
            }
        },
        compare: function (currentVal, newVal, attributeName) {___jdce_logger("/todomvc.bundle.js", 325);
            var isSame = currentVal === newVal;

            // if this has changed we want to also handle
            // event propagation
            if (!isSame) {
                if (currentVal) {
                    this.stopListening(currentVal);
                }

                if (newVal != null) {
                    this.listenTo(newVal, 'all', this._getEventBubblingHandler(attributeName));
                }
            }

            return isSame;
        }
    }
};

// the extend method used to extend prototypes, maintain inheritance chains for instanceof
// and allow for additions to the model definitions.
function extend(protoProps) {___jdce_logger("/todomvc.bundle.js", 326);
    var parent = this;
    var child;
    var args = [].slice.call(arguments);
    var prop, item;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
        child = protoProps.constructor;
    } else {
        child = function () {___jdce_logger("/todomvc.bundle.js", 327);
            return parent.apply(this, arguments);
        };
    }

    // Add static properties to the constructor function from parent
    _.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function () {___jdce_logger("/todomvc.bundle.js", 328); this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // set prototype level objects
    child.prototype._derived =  _.extend({}, parent.prototype._derived);
    child.prototype._deps = _.extend({}, parent.prototype._deps);
    child.prototype._definition = _.extend({}, parent.prototype._definition);
    child.prototype._collections = _.extend({}, parent.prototype._collections);
    child.prototype._children = _.extend({}, parent.prototype._children);
    child.prototype._dataTypes = _.extend({}, parent.prototype._dataTypes || dataTypes);

    // Mix in all prototype properties to the subclass if supplied.
    if (protoProps) {
        args.forEach(function processArg(def) {___jdce_logger("/todomvc.bundle.js", 329);
            if (def.dataTypes) {
                _.each(def.dataTypes, function (def, name) {___jdce_logger("/todomvc.bundle.js", 330);
                    child.prototype._dataTypes[name] = def;
                });
                delete def.dataTypes;
            }
            if (def.props) {
                _.each(def.props, function (def, name) {___jdce_logger("/todomvc.bundle.js", 331);
                    createPropertyDefinition(child.prototype, name, def);
                });
                delete def.props;
            }
            if (def.session) {
                _.each(def.session, function (def, name) {___jdce_logger("/todomvc.bundle.js", 332);
                    createPropertyDefinition(child.prototype, name, def, true);
                });
                delete def.session;
            }
            if (def.derived) {
                _.each(def.derived, function (def, name) {___jdce_logger("/todomvc.bundle.js", 333);
                    createDerivedProperty(child.prototype, name, def);
                });
                delete def.derived;
            }
            if (def.collections) {
                _.each(def.collections, function (constructor, name) {___jdce_logger("/todomvc.bundle.js", 334);
                    child.prototype._collections[name] = constructor;
                });
                delete def.collections;
            }
            if (def.children) {
                _.each(def.children, function (constructor, name) {___jdce_logger("/todomvc.bundle.js", 335);
                    child.prototype._children[name] = constructor;
                });
                delete def.children;
            }
            _.extend(child.prototype, def);
        });
    }

    var toString = Object.prototype.toString;

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
}

Base.extend = extend;

// Our main exports
module.exports = Base;

},{"array-next":23,"backbone-events-standalone":25,"key-tree-store":26,"underscore":27}],23:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 336);
module.exports = function(){___jdce_logger("/todomvc.bundle.js", 337);};

},{}],24:[function(){___jdce_logger("/todomvc.bundle.js", 338);},{}],25:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 339);
module.exports=require(12)
},{"./backbone-events-standalone":24}],26:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 340);
function KeyTreeStore() {___jdce_logger("/todomvc.bundle.js", 341);
    this.storage = {};
}

// add an object to the store
KeyTreeStore.prototype.add = function (keypath, obj) {___jdce_logger("/todomvc.bundle.js", 342);
    var arr = this.storage[keypath] || (this.storage[keypath] = []);
    arr.push(obj);
};

// remove an object
KeyTreeStore.prototype.remove = function (obj) {___jdce_logger("/todomvc.bundle.js", 343);
    var path, arr;
    for (path in this.storage) {
        arr = this.storage[path];
        arr.some(function (item, index) {___jdce_logger("/todomvc.bundle.js", 344);
            if (item === obj) {
                arr.splice(index, 1);
                return true;
            }
        });
    }
};

// grab all relevant objects
KeyTreeStore.prototype.get = function (keypath) {___jdce_logger("/todomvc.bundle.js", 345);
    var res = [];
    var key;

    for (key in this.storage) {
        if (keypath === key || key.indexOf(keypath + '.') === 0) {
            res = res.concat(this.storage[key]);
        }
    }

    return res;
};

module.exports = KeyTreeStore;

},{}],27:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 346);
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {___jdce_logger("/todomvc.bundle.js", 347);

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {___jdce_logger("/todomvc.bundle.js", 348);
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {___jdce_logger("/todomvc.bundle.js", 349);
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {___jdce_logger("/todomvc.bundle.js", 350);
        return func.call(context, value);
      };
      case 2: return function(value, other) {___jdce_logger("/todomvc.bundle.js", 351);
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {___jdce_logger("/todomvc.bundle.js", 352);
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {___jdce_logger("/todomvc.bundle.js", 353);
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {___jdce_logger("/todomvc.bundle.js", 354);
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {___jdce_logger("/todomvc.bundle.js", 355);
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {___jdce_logger("/todomvc.bundle.js", 356);
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {___jdce_logger("/todomvc.bundle.js", 357);
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {___jdce_logger("/todomvc.bundle.js", 358);
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(){___jdce_logger("/todomvc.bundle.js", 359);};

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {___jdce_logger("/todomvc.bundle.js", 360);
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {___jdce_logger("/todomvc.bundle.js", 361);
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {___jdce_logger("/todomvc.bundle.js", 362);
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {___jdce_logger("/todomvc.bundle.js", 363);
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(){___jdce_logger("/todomvc.bundle.js", 364);};

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {___jdce_logger("/todomvc.bundle.js", 365);
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {___jdce_logger("/todomvc.bundle.js", 366);
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {___jdce_logger("/todomvc.bundle.js", 367);
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {___jdce_logger("/todomvc.bundle.js", 368);
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {___jdce_logger("/todomvc.bundle.js", 369);
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {___jdce_logger("/todomvc.bundle.js", 370);
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(){___jdce_logger("/todomvc.bundle.js", 371);};

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(){___jdce_logger("/todomvc.bundle.js", 372);};

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {___jdce_logger("/todomvc.bundle.js", 373);
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {___jdce_logger("/todomvc.bundle.js", 374);
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(){___jdce_logger("/todomvc.bundle.js", 375);};

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(){___jdce_logger("/todomvc.bundle.js", 376);};

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(){___jdce_logger("/todomvc.bundle.js", 377);};

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {___jdce_logger("/todomvc.bundle.js", 378);
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {___jdce_logger("/todomvc.bundle.js", 379);
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {___jdce_logger("/todomvc.bundle.js", 380);
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {___jdce_logger("/todomvc.bundle.js", 381);
    return function(){___jdce_logger("/todomvc.bundle.js", 382);};
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {___jdce_logger("/todomvc.bundle.js", 383);
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {___jdce_logger("/todomvc.bundle.js", 384);
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {___jdce_logger("/todomvc.bundle.js", 385);
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {___jdce_logger("/todomvc.bundle.js", 386);
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(){___jdce_logger("/todomvc.bundle.js", 387);};

  // Return the number of elements in an object.
  _.size = function(){___jdce_logger("/todomvc.bundle.js", 388);};

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(){___jdce_logger("/todomvc.bundle.js", 389);};

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(){___jdce_logger("/todomvc.bundle.js", 390);};

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(){___jdce_logger("/todomvc.bundle.js", 391);};

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {___jdce_logger("/todomvc.bundle.js", 392);
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(){___jdce_logger("/todomvc.bundle.js", 393);};

  // Trim out all falsy values from an array.
  _.compact = function(){___jdce_logger("/todomvc.bundle.js", 394);};

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {___jdce_logger("/todomvc.bundle.js", 395);
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {___jdce_logger("/todomvc.bundle.js", 396);
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(){___jdce_logger("/todomvc.bundle.js", 397);};

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {___jdce_logger("/todomvc.bundle.js", 398);
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {___jdce_logger("/todomvc.bundle.js", 399);
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(){___jdce_logger("/todomvc.bundle.js", 400);};

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {___jdce_logger("/todomvc.bundle.js", 401);
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){___jdce_logger("/todomvc.bundle.js", 402);
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(){___jdce_logger("/todomvc.bundle.js", 403);};

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(){___jdce_logger("/todomvc.bundle.js", 404);};

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {___jdce_logger("/todomvc.bundle.js", 405);
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(){___jdce_logger("/todomvc.bundle.js", 406);};

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(){___jdce_logger("/todomvc.bundle.js", 407);};

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){___jdce_logger("/todomvc.bundle.js", 408);};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {___jdce_logger("/todomvc.bundle.js", 409);
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {___jdce_logger("/todomvc.bundle.js", 410);
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {___jdce_logger("/todomvc.bundle.js", 411);
    var boundArgs = slice.call(arguments, 1);
    return function(){___jdce_logger("/todomvc.bundle.js", 412);};
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(){___jdce_logger("/todomvc.bundle.js", 413);};

  // Memoize an expensive function by storing its results.
  _.memoize = function(){___jdce_logger("/todomvc.bundle.js", 414);};

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(){___jdce_logger("/todomvc.bundle.js", 415);};

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(){___jdce_logger("/todomvc.bundle.js", 416);};

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(){___jdce_logger("/todomvc.bundle.js", 417);};

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(){___jdce_logger("/todomvc.bundle.js", 418);};

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(){___jdce_logger("/todomvc.bundle.js", 419);};

  // Returns a negated version of the passed-in predicate.
  _.negate = function(){___jdce_logger("/todomvc.bundle.js", 420);};

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function(){___jdce_logger("/todomvc.bundle.js", 421);};

  // Returns a function that will only be executed after being called N times.
  _.after = function(){___jdce_logger("/todomvc.bundle.js", 422);};

  // Returns a function that will only be executed before being called N times.
  _.before = function(){___jdce_logger("/todomvc.bundle.js", 423);};

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {___jdce_logger("/todomvc.bundle.js", 424);
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {___jdce_logger("/todomvc.bundle.js", 425);
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {___jdce_logger("/todomvc.bundle.js", 426);
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {___jdce_logger("/todomvc.bundle.js", 427);
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {___jdce_logger("/todomvc.bundle.js", 428);
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {___jdce_logger("/todomvc.bundle.js", 429);
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {___jdce_logger("/todomvc.bundle.js", 430);
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(){___jdce_logger("/todomvc.bundle.js", 431);};

  // Fill in a given object with default properties.
  _.defaults = function(obj) {___jdce_logger("/todomvc.bundle.js", 432);
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(){___jdce_logger("/todomvc.bundle.js", 433);};

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(){___jdce_logger("/todomvc.bundle.js", 434);};

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {___jdce_logger("/todomvc.bundle.js", 435);
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {___jdce_logger("/todomvc.bundle.js", 436);
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {___jdce_logger("/todomvc.bundle.js", 437);
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(){___jdce_logger("/todomvc.bundle.js", 438);};

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {___jdce_logger("/todomvc.bundle.js", 439);
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {___jdce_logger("/todomvc.bundle.js", 440);
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {___jdce_logger("/todomvc.bundle.js", 441);
    _['is' + name] = function(obj) {___jdce_logger("/todomvc.bundle.js", 442);
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {___jdce_logger("/todomvc.bundle.js", 443);
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {___jdce_logger("/todomvc.bundle.js", 444);
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(){___jdce_logger("/todomvc.bundle.js", 445);};

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {___jdce_logger("/todomvc.bundle.js", 446);
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {___jdce_logger("/todomvc.bundle.js", 447);
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {___jdce_logger("/todomvc.bundle.js", 448);
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {___jdce_logger("/todomvc.bundle.js", 449);
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {___jdce_logger("/todomvc.bundle.js", 450);
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function(){___jdce_logger("/todomvc.bundle.js", 451);};

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {___jdce_logger("/todomvc.bundle.js", 452);
    return value;
  };

  _.constant = function(){___jdce_logger("/todomvc.bundle.js", 453);};

  _.noop = function(){___jdce_logger("/todomvc.bundle.js", 454);};

  _.property = function(key) {___jdce_logger("/todomvc.bundle.js", 455);
    return function(obj) {___jdce_logger("/todomvc.bundle.js", 456);
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {___jdce_logger("/todomvc.bundle.js", 457);
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {___jdce_logger("/todomvc.bundle.js", 458);
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(){___jdce_logger("/todomvc.bundle.js", 459);};

  // Return a random integer between min and max (inclusive).
  _.random = function(){___jdce_logger("/todomvc.bundle.js", 460);};

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function(){___jdce_logger("/todomvc.bundle.js", 461);};

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {___jdce_logger("/todomvc.bundle.js", 462);
    var escaper = function(){___jdce_logger("/todomvc.bundle.js", 463);};
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(){___jdce_logger("/todomvc.bundle.js", 464);};
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {___jdce_logger("/todomvc.bundle.js", 465);
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {___jdce_logger("/todomvc.bundle.js", 466);
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(){___jdce_logger("/todomvc.bundle.js", 467);};

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {___jdce_logger("/todomvc.bundle.js", 468);
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {___jdce_logger("/todomvc.bundle.js", 469);
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(){___jdce_logger("/todomvc.bundle.js", 470);};

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {___jdce_logger("/todomvc.bundle.js", 471);
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {___jdce_logger("/todomvc.bundle.js", 472);
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {___jdce_logger("/todomvc.bundle.js", 473);
    _.each(_.functions(obj), function(name) {___jdce_logger("/todomvc.bundle.js", 474);
      var func = _[name] = obj[name];
      _.prototype[name] = function() {___jdce_logger("/todomvc.bundle.js", 475);
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {___jdce_logger("/todomvc.bundle.js", 476);
    var method = ArrayProto[name];
    _.prototype[name] = function(){___jdce_logger("/todomvc.bundle.js", 477);};
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {___jdce_logger("/todomvc.bundle.js", 478);
    var method = ArrayProto[name];
    _.prototype[name] = function(){___jdce_logger("/todomvc.bundle.js", 479);};
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function(){___jdce_logger("/todomvc.bundle.js", 480);};

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function(){___jdce_logger("/todomvc.bundle.js", 481);});
  }
}.call(this));

},{}],28:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 482);
var _ = require('underscore');
var Events = require('backbone-events-standalone');
var classExtend = require('ampersand-class-extend');
var underscoreMixins = require('ampersand-collection-underscore-mixin');
var slice = Array.prototype.slice;


function SubCollection(collection, spec) {___jdce_logger("/todomvc.bundle.js", 483);
    spec || (spec = {});
    this.collection = collection;
    this._reset();
    this._watched = spec.watched || [];
    this._parseFilters(spec);
    this._runFilters();
    this.listenTo(this.collection, 'all', this._onCollectionEvent);
}


_.extend(SubCollection.prototype, Events, underscoreMixins, {
    // add a filter function directly
    addFilter: function(){___jdce_logger("/todomvc.bundle.js", 484);},

    // remove filter function directly
    removeFilter: function(){___jdce_logger("/todomvc.bundle.js", 485);},

    // clears filters fires events for changes
    clearFilters: function () {___jdce_logger("/todomvc.bundle.js", 486);
        this._reset();
        this._runFilters();
    },

    // Update sub collection config, if `clear`
    // then clear existing filters before start.
    // This takes all the same filter arguments
    // as the init function. So you can pass:
    // {
    //   where: {
    //      name: 'something'
    //   },
    //   limit: 20
    // }
    configure: function (opts, clear) {___jdce_logger("/todomvc.bundle.js", 487);
        if (clear) this._resetFilters();
        this._parseFilters(opts);
        this._runFilters();
    },

    // gets a model at a given index
    at: function (index) {___jdce_logger("/todomvc.bundle.js", 488);
        return this.models[index];
    },

    // proxy `get` method to the underlying collection
    get: function (query, indexName) {___jdce_logger("/todomvc.bundle.js", 489);
        var model = this.collection.get(query, indexName);
        if (model && this.contains(model)) return model;
    },

    // remove filter if found
    _removeFilter: function(){___jdce_logger("/todomvc.bundle.js", 490);},

    // clear all filters, reset everything
    _reset: function () {___jdce_logger("/todomvc.bundle.js", 491);
        this.models = [];
        this._resetFilters();
    },

    // just reset filters, no model changes
    _resetFilters: function () {___jdce_logger("/todomvc.bundle.js", 492);
        this._filters = [];
        this._watched = [];
        this.limit = undefined;
        this.offset = undefined;
    },

    // internal method registering new filter function
    _addFilter: function (filter) {___jdce_logger("/todomvc.bundle.js", 493);
        this._filters.push(filter);
    },

    // adds a property or array of properties to watch, ensures uniquness.
    _watch: function (item) {___jdce_logger("/todomvc.bundle.js", 494);
        this._watched = _.union(this._watched, _.isArray(item) ? item : [item]);
    },

    // removes a watched property
    _unwatch: function(){___jdce_logger("/todomvc.bundle.js", 495);},

    _parseFilters: function (spec) {___jdce_logger("/todomvc.bundle.js", 496);
        if (spec.where) {
            _.each(spec.where, function (value, item) {___jdce_logger("/todomvc.bundle.js", 497);
                this._addFilter(function(){___jdce_logger("/todomvc.bundle.js", 498);});
            }, this);
            // also make sure we watch all `where` keys
            this._watch(_.keys(spec.where));
        }
        if (spec.hasOwnProperty('limit')) this.limit = spec.limit;
        if (spec.hasOwnProperty('offset')) this.offset = spec.offset;
        if (spec.filter) {
            this._addFilter(spec.filter, false);
        }
        if (spec.filters) {
            spec.filters.forEach(this._addFilter, this);
        }
        if (spec.comparator) {
            this.comparator = spec.comparator;
        }
    },

    _runFilters: function () {___jdce_logger("/todomvc.bundle.js", 499);
        // make a copy of the array for comparisons
        var existingModels = slice.call(this.models);
        var rootModels = slice.call(this.collection.models);
        var offset = (this.offset || 0);
        var newModels, toAdd, toRemove;

        // reduce base model set by applying filters
        if (this._filters.length) {
            newModels = _.reduce(this._filters, function (startingArray, filterFunc) {___jdce_logger("/todomvc.bundle.js", 500);
                return startingArray.filter(filterFunc);
            }, rootModels);
        } else {
            newModels = slice.call(rootModels);
        }

        // sort it
        if (this.comparator) newModels = _.sortBy(newModels, this.comparator);

        // trim it to length
        if (this.limit || this.offset) newModels = newModels.slice(offset, this.limit + offset);

        // now we've got our new models time to compare
        toAdd = _.difference(newModels, existingModels);
        toRemove = _.difference(existingModels, newModels);

        // save 'em
        this.models = newModels;
        
        _.each(toRemove, function (model) {___jdce_logger("/todomvc.bundle.js", 501);
            this.trigger('remove', model, this);
        }, this);

        _.each(toAdd, function (model) {___jdce_logger("/todomvc.bundle.js", 502);
            this.trigger('add', model, this);
        }, this);

        // if they contain the same models, but in new order, trigger sort
        if (!_.isEqual(existingModels, newModels)) {
            this.trigger('sort', this);
        }
    },

    _onCollectionEvent: function(){___jdce_logger("/todomvc.bundle.js", 503);}
});

Object.defineProperty(SubCollection.prototype, 'length', {
    get: function () {___jdce_logger("/todomvc.bundle.js", 504);
        return this.models.length;
    }
});

Object.defineProperty(SubCollection.prototype, 'isCollection', {
    get: function () {___jdce_logger("/todomvc.bundle.js", 505);
        return true;
    }
});

SubCollection.extend = classExtend;

module.exports = SubCollection;

},{"ampersand-class-extend":29,"ampersand-collection-underscore-mixin":31,"backbone-events-standalone":33,"underscore":34}],29:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 506);
module.exports=require(10)
},{"extend-object":30}],30:[function(){___jdce_logger("/todomvc.bundle.js", 507);},{}],31:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 508);
var _ = require('underscore');
var slice = [].slice;
var mixins = {};


// Underscore methods that we want to implement on the Collection.
var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample', 'partition'
];

// Mix in each Underscore method as a proxy to `Collection#models`.
_.each(methods, function (method) {___jdce_logger("/todomvc.bundle.js", 509);
    if (!_[method]) return;
    mixins[method] = function () {___jdce_logger("/todomvc.bundle.js", 510);
        var args = slice.call(arguments);
        args.unshift(this.models);
        return _[method].apply(_, args);
    };
});

// Underscore methods that take a property name as an argument.
var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

// Use attributes instead of properties.
_.each(attributeMethods, function (method) {___jdce_logger("/todomvc.bundle.js", 511);
    if (!_[method]) return;
    mixins[method] = function(){___jdce_logger("/todomvc.bundle.js", 512);};
});

// Return models with matching attributes. Useful for simple cases of
// `filter`.
mixins.where = function(){___jdce_logger("/todomvc.bundle.js", 513);};

// Return the first model with matching attributes. Useful for simple cases
// of `find`.
mixins.findWhere = function(){___jdce_logger("/todomvc.bundle.js", 514);};

// Plucks an attribute from each model in the collection.
mixins.pluck = function (attr) {___jdce_logger("/todomvc.bundle.js", 515);
    return _.invoke(this.models, 'get', attr);
};

module.exports = mixins;

},{"underscore":34}],32:[function(){___jdce_logger("/todomvc.bundle.js", 516);},{}],33:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 517);
module.exports=require(12)
},{"./backbone-events-standalone":32}],34:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 518);
module.exports=require(27)
},{}],35:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 519);
var State = require('ampersand-state');
var CollectionView = require('ampersand-collection-view');
var domify = require('domify');
var _ = require('underscore');
var events = require('events-mixin');
var matches = require('matches-selector');
var bindings = require('ampersand-dom-bindings');
var getPath = require('get-object-path');


function View(attrs) {___jdce_logger("/todomvc.bundle.js", 520);
    this.cid = _.uniqueId('view');
    attrs || (attrs = {});
    var parent = attrs.parent;
    delete attrs.parent;
    BaseState.call(this, attrs, {init: false, parent: parent});
    this.on('change:el', this._handleElementChange, this);
    this._parsedBindings = bindings(this.bindings);
    this._initializeBindings();
    if (attrs.el && !this.autoRender) {
        this._handleElementChange();
    }
    this._initializeSubviews();
    this.initialize.apply(this, arguments);
    this.set(_.pick(attrs, viewOptions));
    if (this.autoRender && this.template) {
        this.render();
    }
}

var BaseState = State.extend({
    dataTypes: {
        element: {
            set: function (newVal) {___jdce_logger("/todomvc.bundle.js", 521);
                return {
                    val: newVal,
                    type: newVal instanceof Element ? 'element' : typeof newVal
                };
            },
            compare: function (el1, el2) {___jdce_logger("/todomvc.bundle.js", 522);
                return el1 === el2;
            }
        },
        collection: {
            set: function (newVal) {___jdce_logger("/todomvc.bundle.js", 523);
                return {
                    val: newVal,
                    type: newVal && newVal.isCollection ? 'collection' : typeof newVal
                };
            },
            compare: function (currentVal, newVal) {___jdce_logger("/todomvc.bundle.js", 524);
                return currentVal === newVal;
            }
        }
    },
    props: {
        model: 'state',
        el: 'element',
        collection: 'collection'
    },
    derived: {
        rendered: {
            deps: ['el'],
            fn: function(){___jdce_logger("/todomvc.bundle.js", 525);}
        },
        hasData: {
            deps: ['model'],
            fn: function(){___jdce_logger("/todomvc.bundle.js", 526);}
        }
    }
});

// Cached regex to split keys for `delegate`.
var delegateEventSplitter = /^(\S+)\s*(.*)$/;

// List of view options to be merged as properties.
var viewOptions = ['model', 'collection', 'el'];

View.prototype = Object.create(BaseState.prototype);

// Set up all inheritable properties and methods.
_.extend(View.prototype, {
    // ## query
    // Get an single element based on CSS selector scoped to this.el
    // if you pass an empty string it return `this.el`.
    // If you pass an element we just return it back.
    // This lets us use `get` to handle cases where users
    // can pass a selector or an already selected element.
    query: function (selector) {___jdce_logger("/todomvc.bundle.js", 527);
        if (!selector) return this.el;
        if (typeof selector === 'string') {
            if (matches(this.el, selector)) return this.el;
            return this.el.querySelector(selector) || undefined;
        }
        return selector;
    },

    // ## queryAll
    // Returns an array of elements based on CSS selector scoped to this.el
    // if you pass an empty string it return `this.el`. Also includes root
    // element.
    queryAll: function(){___jdce_logger("/todomvc.bundle.js", 528);},

    // ## queryByHook
    // Convenience method for fetching element by it's `data-hook` attribute.
    // Also tries to match against root element.
    // Also supports matching 'one' of several space separated hooks.
    queryByHook: function (hook) {___jdce_logger("/todomvc.bundle.js", 529);
        return this.query('[data-hook~="' + hook + '"]');
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){___jdce_logger("/todomvc.bundle.js", 530);},

    // **render** is the core function that your view can override, its job is
    // to populate its element (`this.el`), with the appropriate HTML.
    render: function () {___jdce_logger("/todomvc.bundle.js", 531);
        this.renderWithTemplate(this);
        return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable events listeners.
    remove: function () {___jdce_logger("/todomvc.bundle.js", 532);
        var parsedBindings = this._parsedBindings;
        if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
        if (this._subviews) _.chain(this._subviews).flatten().invoke('remove');
        this.stopListening();
        // TODO: Not sure if this is actually necessary.
        // Just trying to de-reference this potentially large
        // amount of generated functions to avoid memory leaks.
        _.each(parsedBindings, function (properties, modelName) {___jdce_logger("/todomvc.bundle.js", 533);
            _.each(properties, function (value, key) {___jdce_logger("/todomvc.bundle.js", 534);
                delete parsedBindings[modelName][key];
            });
            delete parsedBindings[modelName];
        });
        this.trigger('remove', this);
        return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    _handleElementChange: function (element, delegate) {___jdce_logger("/todomvc.bundle.js", 535);
        if (this.eventManager) this.eventManager.unbind();
        this.eventManager = events(this.el, this);
        this.delegateEvents();
        this._applyBindingsForKey();
        return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function (e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function (events) {___jdce_logger("/todomvc.bundle.js", 536);
        if (!(events || (events = _.result(this, 'events')))) return this;
        this.undelegateEvents();
        for (var key in events) {
            this.eventManager.bind(key, events[key]);
        }
        return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function () {___jdce_logger("/todomvc.bundle.js", 537);
        this.eventManager.unbind();
        return this;
    },

    // ## registerSubview
    // Pass it a view. This can be anything with a `remove` method
    registerSubview: function (view) {___jdce_logger("/todomvc.bundle.js", 538);
        // Storage for our subviews.
        this._subviews || (this._subviews = []);
        this._subviews.push(view);
        // If view has an 'el' it's a single view not
        // an array of views registered by renderCollection
        // so we store a reference to the parent view.
        if (view.el) view.parent = this;
        return view;
    },

    // ## renderSubview
    // Pass it a view instance and a container element
    // to render it in. It's `remove` method will be called
    // when the parent view is destroyed.
    renderSubview: function(){___jdce_logger("/todomvc.bundle.js", 539);},

    _applyBindingsForKey: function (name) {___jdce_logger("/todomvc.bundle.js", 540);
        if (!this.el) return;
        var fns = this._parsedBindings.getGrouped(name);
        var item;
        for (item in fns) {
            fns[item].forEach(function (fn) {___jdce_logger("/todomvc.bundle.js", 541);
                fn(this.el, getPath(this, item), _.last(item.split('.')));
            }, this);
        }
    },

    _initializeBindings: function () {___jdce_logger("/todomvc.bundle.js", 542);
        if (!this.bindings) return;
        this.on('all', function (eventName) {___jdce_logger("/todomvc.bundle.js", 543);
            if (eventName.slice(0, 7) === 'change:') {
                this._applyBindingsForKey(eventName.split(':')[1]);
            }
        }, this);
    },

    // ## _initializeSubviews
    // this is called at setup and grabs declared subviews
    _initializeSubviews: function () {___jdce_logger("/todomvc.bundle.js", 544);
        if (!this.subviews) return;
        for (var item in this.subviews) {
            this._parseSubview(this.subviews[item], item);
        }
    },

    // ## _parseSubview
    // helper for parsing out the subview declaration and registering
    // the `waitFor` if need be.
    _parseSubview: function (subview, name) {___jdce_logger("/todomvc.bundle.js", 545);
        var self = this;
        var opts = {
            selector: subview.container || '[data-hook="' + subview.hook + '"]',
            waitFor: subview.waitFor || '',
            prepareView: subview.prepareView || function(){___jdce_logger("/todomvc.bundle.js", 546);}
        };
        function action() {___jdce_logger("/todomvc.bundle.js", 547);
            var el, subview;
            // if not rendered or we can't find our element, stop here.
            if (!this.el || !(el = this.query(opts.selector))) return;
            if (!opts.waitFor || getPath(this, opts.waitFor)) {
                subview = this[name] = opts.prepareView.call(this, el);
                subview.render();
                this.registerSubview(subview);
                this.off('change', action);
            }
        }
        // we listen for main `change` items
        this.on('change', action, this);
    },


    // Shortcut for doing everything we need to do to
    // render and fully replace current root element.
    // Either define a `template` property of your view
    // or pass in a template directly.
    // The template can either be a string or a function.
    // If it's a function it will be passed the `context`
    // argument.
    renderWithTemplate: function (context, templateArg) {___jdce_logger("/todomvc.bundle.js", 548);
        var template = templateArg || this.template;
        if (!template) throw new Error('Template string or function needed.');
        var newDom = _.isString(template) ? template : template(context || this);
        if (_.isString(newDom)) newDom = domify(newDom);
        var parent = this.el && this.el.parentNode;
        if (parent) parent.replaceChild(newDom, this.el);
        if (newDom.nodeName === '#document-fragment') throw new Error('Views can only have one root element.');
        this.el = newDom;
        return this;
    },

    // ## cacheElements
    // This is a shortcut for adding reference to specific elements within your view for
    // access later. This avoids excessive DOM queries and makes it easier to update
    // your view if your template changes.
    //
    // In your `render` method. Use it like so:
    //
    //     render: function () {
    //       this.basicRender();
    //       this.cacheElements({
    //         pages: '#pages',
    //         chat: '#teamChat',
    //         nav: 'nav#views ul',
    //         me: '#me',
    //         cheatSheet: '#cheatSheet',
    //         omniBox: '#awesomeSauce'
    //       });
    //     }
    //
    // Then later you can access elements by reference like so: `this.pages`, or `this.chat`.
    cacheElements: function(){___jdce_logger("/todomvc.bundle.js", 549);},

    // ## listenToAndRun
    // Shortcut for registering a listener for a model
    // and also triggering it right away.
    listenToAndRun: function(){___jdce_logger("/todomvc.bundle.js", 550);},

    // ## animateRemove
    // Placeholder for if you want to do something special when they're removed.
    // For example fade it out, etc.
    // Any override here should call `.remove()` when done.
    animateRemove: function(){___jdce_logger("/todomvc.bundle.js", 551);},

    // ## renderCollection
    // Method for rendering a collections with individual views.
    // Just pass it the collection, and the view to use for the items in the
    // collection. The collectionView is returned.
    renderCollection: function (collection, ViewClass, container, opts) {___jdce_logger("/todomvc.bundle.js", 552);
        var containerEl = (typeof container === 'string') ? this.query(container) : container;
        var config = _.extend({
            collection: collection,
            el: containerEl || this.el,
            view: ViewClass,
            parent: this,
            viewOptions: {
                parent: this
            }
        }, opts);
        var collectionView = new CollectionView(config);
        collectionView.render();
        return this.registerSubview(collectionView);
    }
});

View.extend = BaseState.extend;
module.exports = View;

},{"ampersand-collection-view":36,"ampersand-dom-bindings":41,"ampersand-state":22,"domify":44,"events-mixin":45,"get-object-path":50,"matches-selector":51,"underscore":52}],36:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 553);
var _ = require('underscore');
var BBEvents = require('backbone-events-standalone');
var ampExtend = require('ampersand-class-extend');

// options
var options = ['collection', 'el', 'viewOptions', 'view', 'filter', 'reverse', 'parent'];


function CollectionView(spec) {___jdce_logger("/todomvc.bundle.js", 554);
    if (!spec) {
        throw new ReferenceError('Collection view missing required parameters: collection, el');
    }
    if (!spec.collection) {
        throw new ReferenceError('Collection view requires a collection');
    }
    if (!spec.el) {
        throw new ReferenceError('Collection view requires an el');
    }
    _.extend(this, _.pick(spec, options));
    this.views = [];
    this.listenTo(this.collection, 'add', this._addViewForModel);
    this.listenTo(this.collection, 'remove', this._removeViewForModel);
    this.listenTo(this.collection, 'sort', this._rerenderAll);
    this.listenTo(this.collection, 'refresh reset', this._reset);
}

_.extend(CollectionView.prototype, BBEvents, {
    // for view contract compliance
    render: function () {___jdce_logger("/todomvc.bundle.js", 555);
        this._renderAll();
        return this;
    },
    remove: function () {___jdce_logger("/todomvc.bundle.js", 556);
        _.invoke(this.views, 'remove');
        this.stopListening();
    },
    _getViewByModel: function (model) {___jdce_logger("/todomvc.bundle.js", 557);
        return _.find(this.views, function (view) {___jdce_logger("/todomvc.bundle.js", 558);
            return model === view.model;
        });
    },
    _createViewForModel: function(){___jdce_logger("/todomvc.bundle.js", 559);},
    _getOrCreateByModel: function(){___jdce_logger("/todomvc.bundle.js", 560);},
    _addViewForModel: function (model, collection, options) {___jdce_logger("/todomvc.bundle.js", 561);
        var view = this._getViewByModel(model);
        var matches = this.filter ? this.filter(model) : true;
        if (!matches) {
            return;
        }
        if (!view) {
            view = new this.view(_({model: model, collection: this.collection}).extend(this.viewOptions));
            this.views.push(view);
            view.parent = this;
            view.renderedByParentView = true;
            view.render({containerEl: this.el});
        }
        if (options && options.rerender) {
            this._insertView(view);
        } else {
            this._insertViewAtIndex(view);
        }
    },
    _insertViewAtIndex: function (view) {___jdce_logger("/todomvc.bundle.js", 562);
        if (!view.insertSelf) {
            var pos = this.collection.indexOf(view.model);
            var modelToInsertBefore, viewToInsertBefore;

            if (this.reverse) {
                modelToInsertBefore = this.collection.at(pos - 1);
            } else {
                modelToInsertBefore = this.collection.at(pos + 1);
            }

            viewToInsertBefore = this._getViewByModel(modelToInsertBefore);

            // FIX IE bug (https://developer.mozilla.org/en-US/docs/Web/API/Node.insertBefore)
            // "In Internet Explorer an undefined value as referenceElement will throw errors, while in rest of the modern browsers, this works fine."
            if(viewToInsertBefore) {
                this.el.insertBefore(view.el, viewToInsertBefore && viewToInsertBefore.el);
            } else {
                this.el.appendChild(view.el);
            }
        }
    },
    _insertView: function (view) {___jdce_logger("/todomvc.bundle.js", 563);
        if (!view.insertSelf) {
            if (this.reverse && this.el.firstChild) {
                this.el.insertBefore(view.el, this.el.firstChild);
            } else {
                this.el.appendChild(view.el);
            }
        }
    },
    _removeViewForModel: function(){___jdce_logger("/todomvc.bundle.js", 564);},
    _removeView: function(){___jdce_logger("/todomvc.bundle.js", 565);},
    _renderAll: function () {___jdce_logger("/todomvc.bundle.js", 566);
        this.collection.each(this._addViewForModel, this);
    },
    _rerenderAll: function (collection, options) {___jdce_logger("/todomvc.bundle.js", 567);
        options = options || {};
        this.collection.each(function (model) {___jdce_logger("/todomvc.bundle.js", 568);
            this._addViewForModel(model, this, _.extend(options, {rerender: true}));
        }, this);
    },
    _reset: function () {___jdce_logger("/todomvc.bundle.js", 569);
        var newViews = this.collection.map(this._getOrCreateByModel, this);

        //Remove existing views from the ui
        var toRemove = _.difference(this.views, newViews);
        toRemove.forEach(this._removeView, this);

        //Rerender the full list with the new views
        this.views = newViews;
        this._rerenderAll();
    }
});

CollectionView.extend = ampExtend;

module.exports = CollectionView;

},{"ampersand-class-extend":37,"backbone-events-standalone":40,"underscore":52}],37:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 570);
module.exports=require(10)
},{"extend-object":38}],38:[function(){___jdce_logger("/todomvc.bundle.js", 571);},{}],39:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 572);
/**
 * Standalone extraction of Backbone.Events, no external dependency required.
 * Degrades nicely when Backone/underscore are already available in the current
 * global context.
 *
 * Note that docs suggest to use underscore's `_.extend()` method to add Events
 * support to some given object. A `mixin()` method has been added to the Events
 * prototype to avoid using underscore for that sole purpose:
 *
 *     var myEventEmitter = BackboneEvents.mixin({});
 *
 * Or for a function constructor:
 *
 *     function MyConstructor(){}
 *     MyConstructor.prototype.foo = function(){}
 *     BackboneEvents.mixin(MyConstructor.prototype);
 *
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * (c) 2013 Nicolas Perriault
 */
/* global exports:true, define, module */
(function() {___jdce_logger("/todomvc.bundle.js", 573);
  var root = this,
      breaker = {},
      nativeForEach = Array.prototype.forEach,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      slice = Array.prototype.slice,
      idCounter = 0;

  // Returns a partial implementation matching the minimal API subset required
  // by Backbone.Events
  function miniscore() {___jdce_logger("/todomvc.bundle.js", 574);
    return {
      keys: Object.keys || function (obj) {___jdce_logger("/todomvc.bundle.js", 575);
        if (typeof obj !== "object" && typeof obj !== "function" || obj === null) {
          throw new TypeError("keys() called on a non-object");
        }
        var key, keys = [];
        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            keys[keys.length] = key;
          }
        }
        return keys;
      },

      uniqueId: function(prefix) {___jdce_logger("/todomvc.bundle.js", 576);
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
      },

      has: function(obj, key) {___jdce_logger("/todomvc.bundle.js", 577);
        return hasOwnProperty.call(obj, key);
      },

      each: function(obj, iterator, context) {___jdce_logger("/todomvc.bundle.js", 578);
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
          obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0, l = obj.length; i < l; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) return;
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              if (iterator.call(context, obj[key], key, obj) === breaker) return;
            }
          }
        }
      },

      once: function(){___jdce_logger("/todomvc.bundle.js", 579);}
    };
  }

  var _ = miniscore(), Events;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {___jdce_logger("/todomvc.bundle.js", 580);
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(){___jdce_logger("/todomvc.bundle.js", 581);},

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {___jdce_logger("/todomvc.bundle.js", 582);
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {___jdce_logger("/todomvc.bundle.js", 583);
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {___jdce_logger("/todomvc.bundle.js", 584);
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {___jdce_logger("/todomvc.bundle.js", 585);
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {___jdce_logger("/todomvc.bundle.js", 586);
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {___jdce_logger("/todomvc.bundle.js", 587);
    Events[method] = function(obj, name, callback) {___jdce_logger("/todomvc.bundle.js", 588);
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Mixin utility
  Events.mixin = function(proto) {___jdce_logger("/todomvc.bundle.js", 589);
    var exports = ['on', 'once', 'off', 'trigger', 'stopListening', 'listenTo',
                   'listenToOnce', 'bind', 'unbind'];
    _.each(exports, function(name) {___jdce_logger("/todomvc.bundle.js", 590);
      proto[name] = this[name];
    }, this);
    return proto;
  };

  // Export Events as BackboneEvents depending on current context
  if (typeof define === "function") {
    define(function(){___jdce_logger("/todomvc.bundle.js", 591);});
  } else if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  } else {
    root.BackboneEvents = Events;
  }
})(this);

},{}],40:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 592);
arguments[4][12][0].apply(exports,arguments)
},{"./backbone-events-standalone":39}],41:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 593);
var Store = require('key-tree-store');
var dom = require('ampersand-dom');
var matchesSelector = require('matches-selector');


// returns a key-tree-store of functions
// that can be applied to any element/model.

// all resulting functions should be called
// like func(el, value, lastKeyName)
module.exports = function (bindings) {___jdce_logger("/todomvc.bundle.js", 594);
    var store = new Store();
    var key, current;

    for (key in bindings) {
        current = bindings[key];
        if (typeof current === 'string') {
            store.add(key, getBindingFunc({
                type: 'text',
                selector: current
            }));
        } else if (current.forEach) {
            current.forEach(function (binding) {___jdce_logger("/todomvc.bundle.js", 595);
                store.add(key, getBindingFunc(binding));
            });
        } else {
            store.add(key, getBindingFunc(current));
        }
    }

    return store;
};


var slice = Array.prototype.slice;

function getMatches(el, selector) {___jdce_logger("/todomvc.bundle.js", 596);
    if (selector === '') return [el];
    var matches = [];
    if (matchesSelector(el, selector)) matches.push(el);
    return matches.concat(slice.call(el.querySelectorAll(selector)));
}

function makeArray(val) {___jdce_logger("/todomvc.bundle.js", 597);
    return Array.isArray(val) ? val : [val];
}

function getBindingFunc(binding) {___jdce_logger("/todomvc.bundle.js", 598);
    var type = binding.type || 'text';
    var isCustomBinding = typeof type === 'function';
    var selector = (function () {___jdce_logger("/todomvc.bundle.js", 599);
        if (typeof binding.selector === 'string') {
            return binding.selector;
        } else if (binding.hook) {
            return '[data-hook~="' + binding.hook + '"]';
        } else {
            return '';
        }
    })();
    var yes = binding.yes;
    var no = binding.no;
    var hasYesNo = !!(yes || no);

    // storage variable for previous if relevant
    var previousValue;

    if (isCustomBinding) {
        return function(){___jdce_logger("/todomvc.bundle.js", 600);};
    } else if (type === 'text') {
        return function (el, value) {___jdce_logger("/todomvc.bundle.js", 601);
            getMatches(el, selector).forEach(function (match) {___jdce_logger("/todomvc.bundle.js", 602);
                dom.text(match, value);
            });
        };
    } else if (type === 'class') {
        return function(){___jdce_logger("/todomvc.bundle.js", 603);};
    } else if (type === 'attribute') {
        if (!binding.name) throw Error('attribute bindings must have a "name"');
        return function(){___jdce_logger("/todomvc.bundle.js", 604);};
    } else if (type === 'value') {
        return function(){___jdce_logger("/todomvc.bundle.js", 605);};
    } else if (type === 'booleanClass') {
        // if there's a `no` case this is actually a switch
        if (hasYesNo) {
            yes = makeArray(yes || '');
            no = makeArray(no || '');
            return function(){___jdce_logger("/todomvc.bundle.js", 606);};
        } else {
            return function(){___jdce_logger("/todomvc.bundle.js", 607);};
        }
    } else if (type === 'booleanAttribute') {
        return function (el, value, keyName) {___jdce_logger("/todomvc.bundle.js", 608);
            var name = makeArray(binding.name || keyName);
            getMatches(el, selector).forEach(function (match) {___jdce_logger("/todomvc.bundle.js", 609);
                name.forEach(function (attr) {___jdce_logger("/todomvc.bundle.js", 610);
                    dom[value ? 'addAttribute' : 'removeAttribute'](match, attr);
                });
            });
        };
    } else if (type === 'toggle') {
        // this doesn't require a selector since we can pass yes/no selectors
        if (hasYesNo) {
            return function(){___jdce_logger("/todomvc.bundle.js", 611);};
        } else {
            return function (el, value) {___jdce_logger("/todomvc.bundle.js", 612);
                getMatches(el, selector).forEach(function (match) {___jdce_logger("/todomvc.bundle.js", 613);
                    dom[value ? 'show' : 'hide'](match);
                });
            };
        }
    } else if (type === 'switch') {
        if (!binding.cases) throw Error('switch bindings must have "cases"');
        return function(){___jdce_logger("/todomvc.bundle.js", 614);};
    } else if (type === 'innerHTML') {
        return function (el, value) {___jdce_logger("/todomvc.bundle.js", 615);
            getMatches(el, selector).forEach(function (match) {___jdce_logger("/todomvc.bundle.js", 616);
                dom.html(match, value);
            });
        };
    } else if (type === 'switchClass') {
        if (!binding.cases) throw Error('switchClass bindings must have "cases"');
        return function (el, value, keyName) {___jdce_logger("/todomvc.bundle.js", 617);
            var name = makeArray(binding.name || keyName);
            for (var item in binding.cases) {
                getMatches(el, binding.cases[item]).forEach(function (match) {___jdce_logger("/todomvc.bundle.js", 618);
                    name.forEach(function (className) {___jdce_logger("/todomvc.bundle.js", 619);
                        dom[value === item ? 'addClass' : 'removeClass'](match, className);
                    });
                });
            }
        };
    } else {
        throw new Error('no such binding type: ' + type);
    }
}

},{"ampersand-dom":42,"key-tree-store":43,"matches-selector":51}],42:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 620);
;window.ampersand = window.ampersand || {};window.ampersand["ampersand-dom"] = window.ampersand["ampersand-dom"] || [];window.ampersand["ampersand-dom"].push("1.2.6");
var dom = module.exports = {
    text: function (el, val) {___jdce_logger("/todomvc.bundle.js", 621);
        el.textContent = getString(val);
    },
    // optimize if we have classList
    addClass: function (el, cls) {___jdce_logger("/todomvc.bundle.js", 622);
        cls = getString(cls);
        if (!cls) return;
        if (el.classList) {
            el.classList.add(cls);
        } else {
            if (!hasClass(el, cls)) {
                if (el.classList) {
                    el.classList.add(cls);
                } else {
                    el.className += ' ' + cls;
                }
            }
        }
    },
    removeClass: function (el, cls) {___jdce_logger("/todomvc.bundle.js", 623);
        if (el.classList) {
            cls = getString(cls);
            if (cls) el.classList.remove(cls);
        } else {
            // may be faster to not edit unless we know we have it?
            el.className = el.className.replace(new RegExp('(^|\\b)' + cls.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    },
    hasClass: hasClass,
    switchClass: function(){___jdce_logger("/todomvc.bundle.js", 624);},
    // makes sure attribute (with no content) is added
    // if exists it will be cleared of content
    addAttribute: function (el, attr) {___jdce_logger("/todomvc.bundle.js", 625);
        // setting to empty string does same
        el.setAttribute(attr, '');
        // Some browsers won't update UI for boolean attributes unless you
        // set it directly. So we do both
        if (hasBooleanProperty(el, attr)) el[attr] = true;
    },
    // completely removes attribute
    removeAttribute: function(){___jdce_logger("/todomvc.bundle.js", 626);},
    // sets attribute to string value given, clearing any current value
    setAttribute: function (el, attr, value) {___jdce_logger("/todomvc.bundle.js", 627);
        el.setAttribute(attr, getString(value));
    },
    getAttribute: function (el, attr) {___jdce_logger("/todomvc.bundle.js", 628);
        return el.getAttribute(attr);
    },
    hide: function (el) {___jdce_logger("/todomvc.bundle.js", 629);
        if (!isHidden(el)) {
            storeDisplayStyle(el);
            hide(el);
        }
    },
    // show element
    show: function(){___jdce_logger("/todomvc.bundle.js", 630);},
    html: function (el, content) {___jdce_logger("/todomvc.bundle.js", 631);
        el.innerHTML = content;
    }
};

// helpers
function getString(val) {___jdce_logger("/todomvc.bundle.js", 632);
    if (!val && val !== 0) {
        return '';
    } else {
        return val;
    }
}

function hasClass(el, cls) {___jdce_logger("/todomvc.bundle.js", 633);
    if (el.classList) {
        return el.classList.contains(cls);
    } else {
        return new RegExp('(^| )' + cls + '( |$)', 'gi').test(el.className);
    }
}

function hasBooleanProperty(el, prop) {___jdce_logger("/todomvc.bundle.js", 634);
    var val = el[prop];
    return prop in el && (val === true || val === false);
}

function isHidden (el) {___jdce_logger("/todomvc.bundle.js", 635);
    return dom.getAttribute(el, 'data-anddom-hidden') === 'true';
}

function storeDisplayStyle (el) {___jdce_logger("/todomvc.bundle.js", 636);
    dom.setAttribute(el, 'data-anddom-display', el.style.display);
}

function show(){___jdce_logger("/todomvc.bundle.js", 637);}

function hide (el) {___jdce_logger("/todomvc.bundle.js", 638);
    dom.setAttribute(el, 'data-anddom-hidden', 'true');
    el.style.display = 'none';
}

},{}],43:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 639);
var slice = Array.prototype.slice;

// our constructor
function KeyTreeStore() {___jdce_logger("/todomvc.bundle.js", 640);
    this.storage = {};
}

// add an object to the store
KeyTreeStore.prototype.add = function (keypath, obj) {___jdce_logger("/todomvc.bundle.js", 641);
    var arr = this.storage[keypath] || (this.storage[keypath] = []);
    arr.push(obj);
};

// remove an object
KeyTreeStore.prototype.remove = function (obj) {___jdce_logger("/todomvc.bundle.js", 642);
    var path, arr;
    for (path in this.storage) {
        arr = this.storage[path];
        arr.some(function (item, index) {___jdce_logger("/todomvc.bundle.js", 643);
            if (item === obj) {
                arr.splice(index, 1);
                return true;
            }
        });
    }
};

// get array of all all relevant functions, without keys
KeyTreeStore.prototype.get = function (keypath) {___jdce_logger("/todomvc.bundle.js", 644);
    var res = [];
    var key;

    for (key in this.storage) {
        if (!keypath || keypath === key || key.indexOf(keypath + '.') === 0) {
            res = res.concat(this.storage[key]);
        }
    }

    return res;
};

// get all results that match keypath but still grouped by key
KeyTreeStore.prototype.getGrouped = function (keypath) {___jdce_logger("/todomvc.bundle.js", 645);
    var res = {};
    var key;

    for (key in this.storage) {
        if (!keypath || keypath === key || key.indexOf(keypath + '.') === 0) {
            res[key] = slice.call(this.storage[key]);
        }
    }

    return res;
};

// get all results that match keypath but still grouped by key
KeyTreeStore.prototype.getAll = function(){___jdce_logger("/todomvc.bundle.js", 646);};

// run all matches with optional context
KeyTreeStore.prototype.run = function(){___jdce_logger("/todomvc.bundle.js", 647);};



module.exports = KeyTreeStore;

},{}],44:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 648);

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var div = document.createElement('div');
// Setup
div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
// Make sure that link elements get serialized correctly by innerHTML
// This requires a wrapper element in IE
var innerHTMLBug = !div.getElementsByTagName('link').length;
div = undefined;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  // for script/link/style tags to work in IE6-8, you have to wrap
  // in a div with a non-whitespace character in front, ha!
  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.text =
map.circle =
map.ellipse =
map.line =
map.path =
map.polygon =
map.polyline =
map.rect = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return a DOM Node instance, which could be a TextNode,
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
 * instance, depending on the contents of the `html` string.
 *
 * @param {String} html - HTML string to "domify"
 * @param {Document} doc - The `document` instance to create the Node for
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
 * @api private
 */

function parse(){___jdce_logger("/todomvc.bundle.js", 649);}

},{}],45:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 650);

/**
 * Module dependencies.
 */

var events = require('component-event');
var delegate = require('delegate-events');
var forceCaptureEvents = ['focus', 'blur'];

/**
 * Expose `Events`.
 */

module.exports = Events;

/**
 * Initialize an `Events` with the given
 * `el` object which events will be bound to,
 * and the `obj` which will receive method calls.
 *
 * @param {Object} el
 * @param {Object} obj
 * @api public
 */

function Events(el, obj) {___jdce_logger("/todomvc.bundle.js", 651);
  if (!(this instanceof Events)) return new Events(el, obj);
  if (!el) throw new Error('element required');
  if (!obj) throw new Error('object required');
  this.el = el;
  this.obj = obj;
  this._events = {};
}

/**
 * Subscription helper.
 */

Events.prototype.sub = function(event, method, cb){___jdce_logger("/todomvc.bundle.js", 652);
  this._events[event] = this._events[event] || {};
  this._events[event][method] = cb;
};

/**
 * Bind to `event` with optional `method` name.
 * When `method` is undefined it becomes `event`
 * with the "on" prefix.
 *
 * Examples:
 *
 *  Direct event handling:
 *
 *    events.bind('click') // implies "onclick"
 *    events.bind('click', 'remove')
 *    events.bind('click', 'sort', 'asc')
 *
 *  Delegated event handling:
 *
 *    events.bind('click li > a')
 *    events.bind('click li > a', 'remove')
 *    events.bind('click a.sort-ascending', 'sort', 'asc')
 *    events.bind('click a.sort-descending', 'sort', 'desc')
 *
 * @param {String} event
 * @param {String|function} [method]
 * @return {Function} callback
 * @api public
 */

Events.prototype.bind = function(event, method){___jdce_logger("/todomvc.bundle.js", 653);
  var e = parse(event);
  var el = this.el;
  var obj = this.obj;
  var name = e.name;
  var method = method || 'on' + name;
  var args = [].slice.call(arguments, 2);

  // callback
  function cb(){___jdce_logger("/todomvc.bundle.js", 654);
    var a = [].slice.call(arguments).concat(args);
    obj[method].apply(obj, a);
  }

  // bind
  if (e.selector) {
    cb = delegate.bind(el, e.selector, name, cb);
  } else {
    events.bind(el, name, cb);
  }

  // subscription for unbinding
  this.sub(name, method, cb);

  return cb;
};

/**
 * Unbind a single binding, all bindings for `event`,
 * or all bindings within the manager.
 *
 * Examples:
 *
 *  Unbind direct handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * Unbind delegate handlers:
 *
 *     events.unbind('click', 'remove')
 *     events.unbind('click')
 *     events.unbind()
 *
 * @param {String|Function} [event]
 * @param {String|Function} [method]
 * @api public
 */

Events.prototype.unbind = function(event, method){___jdce_logger("/todomvc.bundle.js", 655);
  if (0 == arguments.length) return this.unbindAll();
  if (1 == arguments.length) return this.unbindAllOf(event);

  // no bindings for this event
  var bindings = this._events[event];
  var capture = (forceCaptureEvents.indexOf(event) !== -1);
  if (!bindings) return;

  // no bindings for this method
  var cb = bindings[method];
  if (!cb) return;

  events.unbind(this.el, event, cb, capture);
};

/**
 * Unbind all events.
 *
 * @api private
 */

Events.prototype.unbindAll = function(){___jdce_logger("/todomvc.bundle.js", 656);
  for (var event in this._events) {
    this.unbindAllOf(event);
  }
};

/**
 * Unbind all events for `event`.
 *
 * @param {String} event
 * @api private
 */

Events.prototype.unbindAllOf = function(event){___jdce_logger("/todomvc.bundle.js", 657);
  var bindings = this._events[event];
  if (!bindings) return;

  for (var method in bindings) {
    this.unbind(event, method);
  }
};

/**
 * Parse `event`.
 *
 * @param {String} event
 * @return {Object}
 * @api private
 */

function parse(event) {___jdce_logger("/todomvc.bundle.js", 658);
  var parts = event.split(/ +/);
  return {
    name: parts.shift(),
    selector: parts.join(' ')
  }
}

},{"component-event":46,"delegate-events":47}],46:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 659);
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){___jdce_logger("/todomvc.bundle.js", 660);
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){___jdce_logger("/todomvc.bundle.js", 661);
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
},{}],47:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 662);
/**
 * Module dependencies.
 */

var closest = require('closest')
  , event = require('event');

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

// Some events don't bubble, so we want to bind to the capture phase instead
// when delegating.
var forceCaptureEvents = ['focus', 'blur'];

exports.bind = function(el, selector, type, fn, capture){___jdce_logger("/todomvc.bundle.js", 663);
  if (forceCaptureEvents.indexOf(type) !== -1) capture = true;

  return event.bind(el, type, function(e){___jdce_logger("/todomvc.bundle.js", 664);
    var target = e.target || e.srcElement;
    e.delegateTarget = closest(target, selector, true, el);
    if (e.delegateTarget) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){___jdce_logger("/todomvc.bundle.js", 665);
  if (forceCaptureEvents.indexOf(type) !== -1) capture = true;

  event.unbind(el, type, fn, capture);
};

},{"closest":48,"event":46}],48:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 666);
var matches = require('matches-selector')

module.exports = function(){___jdce_logger("/todomvc.bundle.js", 667);}

},{"matches-selector":49}],49:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 668);

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(){___jdce_logger("/todomvc.bundle.js", 669);}
},{}],50:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 670);
module.exports = get;

function get (context, path) {___jdce_logger("/todomvc.bundle.js", 671);
  if (path.indexOf('.') == -1 && path.indexOf('[') == -1) {
    return context[path];
  }

  var crumbs = path.split(/\.|\[|\]/g);
  var i = -1;
  var len = crumbs.length;
  var result;

  while (++i < len) {
    if (i == 0) result = context;
    if (!crumbs[i]) continue;
    if (result == undefined) break;
    result = result[crumbs[i]];
  }

  return result;
}

},{}],51:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 672);
'use strict';

var proto = Element.prototype;
var vendor = proto.matches
  || proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {___jdce_logger("/todomvc.bundle.js", 673);
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == el) return true;
  }
  return false;
}
},{}],52:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 674);
module.exports=require(21)
},{}],53:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 675);

/**
 * Module dependencies.
 */

var now = require('date-now');

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */

module.exports = function debounce(func, wait, immediate){___jdce_logger("/todomvc.bundle.js", 676);
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later(){___jdce_logger("/todomvc.bundle.js", 677);};

  return function(){___jdce_logger("/todomvc.bundle.js", 678);};
};

},{"date-now":54}],54:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 679);
module.exports = Date.now || now

function now(){___jdce_logger("/todomvc.bundle.js", 680);}

},{}],55:[function(require,module,exports){___jdce_logger("/todomvc.bundle.js", 681);
(function (global){___jdce_logger("/todomvc.bundle.js", 682);
!function(e){___jdce_logger("/todomvc.bundle.js", 683);if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.jade=e()}}(function(){___jdce_logger("/todomvc.bundle.js", 684);var define,module,exports;return (function e(t,n,r){___jdce_logger("/todomvc.bundle.js", 685);function s(o,u){___jdce_logger("/todomvc.bundle.js", 686);if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){___jdce_logger("/todomvc.bundle.js", 687);var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){___jdce_logger("/todomvc.bundle.js", 688);
'use strict';

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function(){___jdce_logger("/todomvc.bundle.js", 689);};

/**
 * Filter null `val`s.
 *
 * @param {*} val
 * @return {Boolean}
 * @api private
 */

function nulls(){___jdce_logger("/todomvc.bundle.js", 690);}

/**
 * join array as classes.
 *
 * @param {*} val
 * @return {String}
 */
exports.joinClasses = joinClasses;
function joinClasses(){___jdce_logger("/todomvc.bundle.js", 691);}

/**
 * Render the given classes.
 *
 * @param {Array} classes
 * @param {Array.<Boolean>} escaped
 * @return {String}
 */
exports.cls = function(){___jdce_logger("/todomvc.bundle.js", 692);};

/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = function(){___jdce_logger("/todomvc.bundle.js", 693);};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 */
exports.attrs = function(){___jdce_logger("/todomvc.bundle.js", 694);};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function(){___jdce_logger("/todomvc.bundle.js", 695);};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function(){___jdce_logger("/todomvc.bundle.js", 696);};

},{"fs":2}],2:[function(){___jdce_logger("/todomvc.bundle.js", 697);},{}]},{},[1])
(1)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
