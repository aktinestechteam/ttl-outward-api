/**
 * Agent.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

	attributes: {

		//  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
		//  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
		//  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

		country_code: {type: 'string'},
		billing_code: {type: 'string', unique: true},
		account_no: {type: 'string'},
		uk_company_no: {type: 'number'},
		name: {type: 'string', required: true},
		location: {type: 'string'},
		iata: {type: 'boolean', defaultsTo: true},
		cass: {type: 'boolean', defaultsTo: true},
		billing_method: {type: 'string'},
		billing_station: {type: 'string'},
		station: {type: 'string'},
		currency: {type: 'string'},
		start_date: {type: 'number'},
		end_date: {type: 'number'},
		updated_terminal: {type: 'string'},
		updated_date: {type: 'number'},


		//  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
		//  ║╣ ║║║╠╩╗║╣  ║║╚═╗
		//  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


		//  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
		//  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
		//  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

	},

};

