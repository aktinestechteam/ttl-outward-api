/**
* AWBLeg.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		awb_info: {
			model: 'AWBInfo'
		},
		booklist: {
			model: 'BookList'
		},
		station:					{type: 'string', required: true },
		awb_no:						{type: 'string', required: true },
		from:						{type: 'string', required: true },
		to:							{type: 'string'},
		pieces:						{type: 'number', defaultsTo: 0 },
		weight:						{type: 'number', defaultsTo: 0 },
		from_tz:					{type: 'string', required: true },
		to_tz:						{type: 'string' },
		flight_no:					{type: 'string' },
		planned_departure:			{type: 'number', defaultsTo: 0 },
		planned_arrival:			{type: 'number', defaultsTo: 0 },
		actual_departure:			{type: 'number' },
		actual_arrival:				{type: 'number' },
		created_by:					{type: 'string', required: true },//user
		transhipment:				{type: 'boolean', defaultsTo: false },
		status:						{type: 'string', isIn: [
			sails.config.custom.database_model_enums.awb_leg_status.pending,
			sails.config.custom.database_model_enums.awb_leg_status.completed,
			sails.config.custom.database_model_enums.awb_leg_status.discarded
		]},
		//awb_leg_ops:				{type: 'json' },	//ref
		awb_leg_ops:				{collection: 'AWBLegOp', via: 'awb_leg' }, 	//ref
		actual_pieces_flown:		{type: 'number', defaultsTo: 0},
		actual_weight_flown:		{type: 'number', defaultsTo: 0},
		void_on:					{type: 'number', defaultsTo: 0 },
		void_reason:				{type: 'string' },
		//product:					{type: 'string' },
		value_added_product:		{type: 'string' },
		volume:						{type: 'number', defaultsTo: 0 },
		dimensions:					{type: 'string' },
	},
};