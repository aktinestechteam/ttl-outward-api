/**
* AWBQuery.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		query_no: 		{type: 'string', required: true, unique: true },
		awb_no:			{type: 'string', required: true },
		station:		{type: 'string', required: true },
		query_text: 	{type: 'string', required: true },
		raised_by: 		{type: 'string', required: true },
		closed_by: 		{type: 'string' },
		closed_on: 		{type: 'number', defaultsTo: 0 },
		comments: 		{collection: 'AWBQueryComment', via: 'awb_query' },
	},
};