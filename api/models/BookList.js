/**
* BookList.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		booklist_id:					{type: 'string', required: true , unique: true },	//both constrains are important to avoid null entry
		station:						{type: 'string', required: true },
		flight_no:						{type: 'string', required: true },
		flight_time:					{type: 'number', required: true },
		awb_legs:						{collection: 'AWBLeg', via: 'booklist' },	//ref
		egm_awbs:						{type: 'json'},
		file_manifest:					{collection: 'Attachment', via: 'manifest_booklist_id' },	//ref
		file_prealert:					{collection: 'Attachment', via: 'prealert_booklist_id' },	//ref		
	},
};