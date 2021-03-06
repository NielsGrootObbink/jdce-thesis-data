// Generated by CoffeeScript 1.10.0
(function() {___jdce_logger("/js/app.js", 0);
  var TodoApp,
    bind = function(fn, me){___jdce_logger("/js/app.js", 1); return function(){___jdce_logger("/js/app.js", 2); return fn.apply(me, arguments); }; },
    extend = function(child, parent) {___jdce_logger("/js/app.js", 3); for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() {___jdce_logger("/js/app.js", 4); this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  TodoApp = (function(superClass) {___jdce_logger("/js/app.js", 5);
    var ENTER_KEY;

    extend(TodoApp, superClass);

    ENTER_KEY = 13;

    TodoApp.prototype.elements = {
      '#new-todo': 'newTodoInput',
      '#toggle-all': 'toggleAllElem',
      '#main': 'main',
      '#todo-list': 'todos',
      '#footer': 'footer',
      '#todo-count': 'count',
      '#filters a': 'filters',
      '#clear-completed': 'clearCompleted'
    };

    TodoApp.prototype.events = {
      'keyup #new-todo': 'new',
      'click #toggle-all': 'toggleAll',
      'click #clear-completed': 'clearCompletedItem'
    };

    function TodoApp() {___jdce_logger("/js/app.js", 6);
      this.renderFooter = bind(this.renderFooter, this);
      this.toggleElems = bind(this.toggleElems, this);
      this.addAll = bind(this.addAll, this);
      this.addNew = bind(this.addNew, this);
      TodoApp.__super__.constructor.apply(this, arguments);
      Todo.bind('create', this.addNew);
      Todo.bind('refresh change', this.addAll);
      Todo.bind('refresh change', this.toggleElems);
      Todo.bind('refresh change', this.renderFooter);
      Todo.fetch();
      this.routes({
        '/:filter': function(){___jdce_logger("/js/app.js", 7);}
      });
    }

    TodoApp.prototype["new"] = function(){___jdce_logger("/js/app.js", 8);};

    TodoApp.prototype.getByFilter = function() {___jdce_logger("/js/app.js", 9);
      switch (this.filter) {
        case 'active':
          return Todo.active();
        case 'completed':
          return Todo.completed();
        default:
          return Todo.all();
      }
    };

    TodoApp.prototype.addNew = function(){___jdce_logger("/js/app.js", 10);};

    TodoApp.prototype.addAll = function() {___jdce_logger("/js/app.js", 11);
      var i, len, ref, results, todo;
      this.todos.empty();
      ref = this.getByFilter();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        todo = ref[i];
        results.push(this.addNew(todo));
      }
      return results;
    };

    TodoApp.prototype.toggleAll = function(){___jdce_logger("/js/app.js", 12);};

    TodoApp.prototype.clearCompletedItem = function(){___jdce_logger("/js/app.js", 13);};

    TodoApp.prototype.toggleElems = function() {___jdce_logger("/js/app.js", 14);
      var completed, total;
      completed = Todo.completed().length;
      total = Todo.count();
      this.main.toggle(total !== 0);
      this.footer.toggle(total !== 0);
      this.toggleAllElem.prop('checked', completed === total);
      return this.clearCompleted.toggle(completed !== 0);
    };

    TodoApp.prototype.renderFooter = function() {___jdce_logger("/js/app.js", 15);
      var active, completed, text;
      text = function(count) {___jdce_logger("/js/app.js", 16);
        if (count === 1) {
          return 'item';
        } else {
          return 'items';
        }
      };
      active = Todo.active().length;
      completed = Todo.completed().length;
      return this.count.html("<strong>" + active + "</strong> " + (text(active)) + " left");
    };

    return TodoApp;

  })(Spine.Controller);

  $(function() {___jdce_logger("/js/app.js", 17);
    new TodoApp({
      el: $('#todoapp')
    });
    return Spine.Route.setup();
  });

}).call(this);
