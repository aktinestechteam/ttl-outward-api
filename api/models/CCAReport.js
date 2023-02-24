/**
* CCAReport.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		date_of_issue:		{type:'number', required:true },
		place_of_issue:		{type: 'string', required:true},
		cca_ref:			{type: 'string', required:true},
		to_flight_date:		{type: 'json', required:true },// contains the data of sector-flight_no-Date using kababcase for each row
		consignors_name_and_address:	{type: 'string', required: true },
		consignee_address:				{type: 'string', required: true },
		notify:							{type: 'string' },
		awbno_from_to_date_received_from:	{type: 'string', required:true },// contains the data of awbNo-from_to-Date_recivedFrom using kababcase for this
		weight_charge:					{type: 'json' },
		valuation_charge:				{type: 'json' },
		tax:							{type: 'json' },
		clearance_and_handling:			{type: 'json' },
		disbursements:					{type: 'json' },
		disbursements_fee:				{type: 'json' },
		other_charges:					{type: 'json' },
		amendment_fee:					{type: 'json' },
		total:							{type: 'json' },
		remarks:						{type: 'json' },
		station:						{type: 'string', required: true },
		authority_name:					{type: 'string', required: true },
		designation:					{type: 'string', required: true },
		cca:	{
			model: 'CCA'
		},//ref
	},
};