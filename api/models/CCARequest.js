/**
* CCARequest.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		//cca_no:				{type: 'string', required: true, unique: true },
		awb_no:				{type: 'string', required: true },
		station:			{type: 'string', required: true },
		priority:			{type: 'number', defaultsTo: 0 },
		raised_by:			{type: 'string', required: true },//user
		raised_by_dept:		{type: 'string', required: true },
		reason:				{type: 'json', required: true },
		reason_text:		{type: 'string', required: true },
		closed_by:			{type: 'string' },
		closed_at:			{type: 'string' },
		cca_approval: 		{model: 'CCAApproval'},
		cca_leg_op:			{model : 'AWBLegOp'},
		awb_leg_op:			{model : 'AWBLegOp'},
		is_included:		{type: 'boolean', defaultsTo: false }
	},
};