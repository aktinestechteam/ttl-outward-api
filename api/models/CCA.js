/**
* CCA.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	// attributes: {
	// 	cca_no:				{type: 'string', required: true, unique: true },
	// 	station:			{type: 'string', required: true },
	// 	awb_no:				{type: 'string', required: true },
	// 	priority:			{type: 'number', defaultsTo: 0 },
	// 	created_by:			{type: 'string', required: true },//user
	// 	status:				{type: 'string', isIn: [
	// 		sails.config.custom.cca_status.pending,
	// 		sails.config.custom.cca_status.approved,
	// 		sails.config.custom.cca_status.declined
	// 	], required: true },
	// 	raised_by:			{type: 'json' },
	// 	raised_by_dept:		{type: 'json' },
	// 	reason:				{type: 'json' },
	// 	reason_text:		{type: 'json' },
	// 	closed_by:			{type: 'string' },
	// 	closed_at:			{type: 'string' },
	// 	cca_request:		{collection: 'CCARequest', via: 'cca' },
	// 	including_cca_requests: {type: 'json'},
	// 	cca_report:					{collection: 'CCAReport', via: 'cca' },	//ref
	// },
};