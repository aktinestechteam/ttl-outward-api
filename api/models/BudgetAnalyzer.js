/**
 * BudgetAnalyzer.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		//Department name for which we are assigning budget.
		departmentName: {
			type: 'string',
			required: true,
		},
		//The amount of budget we are assigning to particular department and it should not be less than zero.
		budget: {
			type: 'string',
			required: true,
		},
		//Select month for above budget,month should not be less than current month and should not be greater than > 12
		month: {
			type: 'string',
			required: true
		},
		//Select year for above budget,year should not be less than current year
		year: {
			type: 'string',
			required: true
		},
		//Name of logged in user
		createdBy: {
			type: 'string',
			required: true
		},
		
	},

};