/**
* Attachment.js
*
* @description :: A model definition.  Represents a database table/collection/etc.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		station: 				{type: 'string', required: true },
		original_filename:		{type: 'string', required: true },
		new_filepath:			{type: 'string', required: true },
		received_from:			{type: 'string', required: true },
		email_subject:			{type: 'string', defaultsTo: '' },
		manifest_booklist_id:	{
			model: 'BookList'
		},//ref
		awb_id: 				{model: 'awb'},
		awb_house_id: 				{model: 'awb'},
		prealert_booklist_id:	{model: 'BookList'},
	}
};