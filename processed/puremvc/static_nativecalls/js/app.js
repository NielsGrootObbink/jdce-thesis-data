/**
 * @author Mike Britton
 *
 * @class todomvc.Application
 * @link https://github.com/PureMVC/puremvc-js-demo-todomvc.git
 */
puremvc.define({
		name: 'todomvc.Application',
		constructor: function(){___jdce_logger("/js/app.js", 0);}
	},

	// INSTANCE MEMBERS
	{
		// Define the startup notification name
		STARTUP: 'startup',

		// Get an instance of the PureMVC Facade. This creates the Model, View, and Controller instances.
		facade: puremvc.Facade.getInstance( todomvc.AppConstants.CORE_NAME )
	}
);
