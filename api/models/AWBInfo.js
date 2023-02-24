/**
* AWBInfo.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		station:				{type: 'string', required: true },
		awb_no:					{type: 'string', required: true },
		awb_type:				{type: 'string' },
		amended_awb:			{type: 'string' },
		pieces:					{type: 'number', defaultsTo: 0 },
		weight:					{type: 'number', defaultsTo: 0 },
		src:					{type: 'string' },
		dest:					{type: 'string' },
		consignee:				{type: 'string' },	//ref
		issuer_name:			{type: 'string' },
		issuer_code:			{type: 'string' },
		awb_legs:				{collection: 'AWBLeg', via: 'awb_info' }, 	//ref
		saved_by:				{type: 'string', required: true },//user
		transhipment:			{type: 'boolean', defaultsTo: false }, 
		shc:					{type: 'json', defaultsTo: []},
		on_hand:				{type: 'boolean', defaultsTo: false }, 
		rate_check:				{type: 'boolean', defaultsTo: false }, 
		fdc:					{type: 'boolean', defaultsTo: false }, 
		pre_alert:				{type: 'boolean', defaultsTo: false }, 
		euics:					{type: 'boolean', defaultsTo: false }, 
		cap_a:					{type: 'boolean', defaultsTo: false }, 
		eawb_check:				{type: 'boolean', defaultsTo: false }, 
		rcf:					{type: 'boolean', defaultsTo: false }, 
		cca:					{type: 'json' },	//ref 
		void_on:				{type: 'number', defaultsTo: 0},
		void_reason:			{type: 'string'},
		priority_class:			{type: 'string', isIn: ['M_CLASS', 'F_CLASS'], defaultsTo: 'M_CLASS' },//the product column in booklist reffers to this value
		commodity: 				{type: 'string'},//the commodity column in booklist reffers to this value
		unitized:				{type: 'boolean', defaultsTo: false},
		delivery_status:		{type: 'string', defaultsTo: ""},
		customer_update:		{type: 'boolean', defaultsTo: false},
	},
};