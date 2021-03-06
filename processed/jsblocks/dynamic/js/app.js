/*global blocks */

(function () {___jdce_logger("/js/app.js", 0);
	'use strict';

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var App = blocks.Application();

	var Todo = App.Model({
		title: App.Property(),

		completed: App.Property(),

		editing: blocks.observable(),

		init: function () {___jdce_logger("/js/app.js", 1);
			var collection = this.collection();

			// collection is undefined when a Todo is still not part of the Todos collection
			if (collection) {
				// save to Local Storage on each attribute change
				this.title.on('change', collection.save);
				this.completed.on('change', collection.save);
			}

			this.title.on('change', function(){___jdce_logger("/js/app.js", 2);});
		},

		toggleComplete: function(){___jdce_logger("/js/app.js", 3);},

		edit: function(){___jdce_logger("/js/app.js", 4);},

		closeEdit: function(){___jdce_logger("/js/app.js", 5);},

		handleAction: function(){___jdce_logger("/js/app.js", 6);}
	});

	var Todos = App.Collection(Todo, {
		remaining: blocks.observable(),

		init: function () {___jdce_logger("/js/app.js", 7);
			this
				// load the data from the Local Storage
				.reset(JSON.parse(localStorage.getItem('todos-jsblocks')) || [])
				// save to Local Storage on each item add or remove
				.on('add remove', this.save)
				.updateRemaining();
		},

		// set all todos as completed
		toggleAll: function(){___jdce_logger("/js/app.js", 8);},

		// remove all completed todos
		clearCompleted: function(){___jdce_logger("/js/app.js", 9);},

		// saves all data back to the Local Storage
		save: function(){___jdce_logger("/js/app.js", 10);},

		// updates the observable
		updateRemaining: function () {___jdce_logger("/js/app.js", 11);
			this.remaining(this.reduce(function(){___jdce_logger("/js/app.js", 12);}, 0));
		}
	});

	App.View('Todos', {
		options: {
			// creates a route for the View in order to handle
			// /all, /active, /completed filters
			route: blocks.route('{{filter}}').optional('filter')
		},

		filter: blocks.observable(),

		newTodo: new Todo(),

		// holds all todos for the current view
		// todos are filtered if "Active" or "Completed" is clicked
		todos: new Todos().extend('filter', function(){___jdce_logger("/js/app.js", 13);}),

		// filter the data when the route have changed
		// the callback is fired when "All", "Active" or "Completed" have been clicked
		routed: function (params) {___jdce_logger("/js/app.js", 14);
			if (params.filter !== 'active' && params.filter !== 'completed') {
				params.filter = 'all';
			}
			this.filter(params.filter);
		},

		addTodo: function(){___jdce_logger("/js/app.js", 15);}
	});
})();
