/**
 * CCAApproval.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
	attributes: {
		cca_no:					{type: 'string', required: true, unique: true },
		awb_no: 				{type: 'string', required: true},
		awb_leg_id:				{type: 'string', required: true},
		station: 				{type: 'string', required: true},
		issuer_name:			{type: 'string' },
		cca_records_included: 	{type: 'json', required: true},
		cca_form_data: 			{type: 'json', required: true},
		status:	{type: 'string', isIn: [
			sails.config.custom.cca_approval_status.pending,
			sails.config.custom.cca_approval_status.approved,
			sails.config.custom.cca_approval_status.rejected
		]},
		cca_request:			{collection: 'CCARequest', via: 'cca_approval' },
	},
  };
  