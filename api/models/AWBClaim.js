/**
* AWBClaim.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		station:						{type: 'string', required: true },
		awb_no:							{type: 'string', unique: true },
		
		hawb_no:						{type: 'string'},
		house_pieces:					{type: 'number', defaultsTo: 0 },
		house_weight:					{type: 'number', defaultsTo: 0 },
		
		claim_amount:					{type: 'number' },
		declared_value_for_carriage:	{type: 'boolean', defaultsTo: false },
		
		claim_loss:						{type: 'boolean', defaultsTo: false},
		claim_delay:					{type: 'boolean', defaultsTo: false},
		claim_damage:					{type: 'boolean', defaultsTo: false},
		claim_others:					{type: 'boolean', defaultsTo: false},
		
		commodity: 						{type: 'string'},//the commodity column in booklist reffers to this value
		detailed_comments:				{type: 'string' },
		
		documents:						{type: 'json' },

		created_by:						{type: 'string'},
		status:							{type: 'string', isIn: [
			sails.config.custom.awb_claim_status.provisional,
			sails.config.custom.awb_claim_status.allocated,
			sails.config.custom.awb_claim_status.hold,
			sails.config.custom.awb_claim_status.offer,
			sails.config.custom.awb_claim_status.barred,
			sails.config.custom.awb_claim_status.closed,
		]},

		void_on:						{type: 'number', defaultsTo: 0},
		void_reason:					{type: 'string'},
	},
};