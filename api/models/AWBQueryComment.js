/**
* AWBQueryComment.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		awb_query: {model: 'AWBQuery'},
		awb_no:			{type: 'string', required: true },
		station:		{type: 'string', required: true },
		comment_text: 	{type: 'string', required: true },
		comment_by: 	{type: 'string', required: true },
	},
};