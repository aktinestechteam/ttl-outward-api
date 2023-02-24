/**
* AWBLegOp.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		awb_leg: {
			model: 'AWBLeg'
		},
		station:				{type: 'string', required: true },
		awb_no:					{type: 'string', required: true },
		// awb_leg:				{type: 'string', required: true },	//ref
		op_name:				{type: 'string' },
		department:				{type: 'string', required: true },
		opening_status:			{type: 'string', required: true },
		closing_status:			{type: 'string'},
		prev_leg_op:			{type: 'string' },	//origin legop's id

		trigger_time:			{type: 'number', required: true },
		cut_off_time:			{type: 'number', defaultsTo: 0 },
		start_time:				{type: 'number', defaultsTo: 0 },
		acted_at_time:			{type: 'number', defaultsTo: 0 },	//	Timestamp representing saving or closing of the AWBLegOp
		
		acted_by:				{type: 'string' },//user
		released_by:			{type: 'string' },//user
		release_notes:			{type: 'string' },
		ba80_notes:				{type: 'string' },
		cca_request_leg_op:		{collection: 'CCARequest', via: 'cca_leg_op' }, 	//ref
		cca_request:			{collection: 'CCARequest', via: 'awb_leg_op' },	//ref
	},
};