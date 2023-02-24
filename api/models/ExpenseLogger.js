/**
 * ExpenseLogger.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		//the date on which you expend money
		dateOfExpense: {
			type: 'number',
			required: true
		},
		//the type of expense
		natureOfExpense: {
			type: 'String',
			required: true
		},
		//the amount expended
		amountExpend: {
			type: 'number',
			required: true
		},
		additionalNote: {
			type: 'string'
		},
		//the department name under which you are spending money
		departmentName: {
			type: 'string',
			required: true,
		},
		//Name of logged in user
		createdBy: {
			type: 'string',
			required: true
		},

		
	},
};