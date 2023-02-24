/**
 * Vendor.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {
		//Name of vendor
		name: {
			type: 'string',
			required: true,
		},
		//Emails fo vendor
		email: {
			type: 'json',
			columnType: 'array'
		},
		//Phone Number of vendor
		phone: {
			type: 'number',
			required: true,
		},
		//Address of vendor
		address: {
			type: 'string',
			required: true,
		},
		//Reason for which vendor have to sign the contract
		contractFor: {
			type: 'string',
			required: true,
		},
		//The date of vendor enrollment, it should be today's or future date 
		enrollmentDate: {
			type: 'number',
			required: true,
		},
		//The contract start date , it should be today's or future date
		contractStartDate: {
			type: 'number',
			required: true,
		},
		//The contract end date , it should be greater than or equal to contract start date
		contractEndDate: {
			type: 'number',
			required: true,
		},
		budgetCode: {
			type: 'string'
		},
		//Station for which manager going to assign budget
		station: {
			type: 'string'
		},
		//Logged in user
		owner: {
			type: 'string'
		}
	},

};