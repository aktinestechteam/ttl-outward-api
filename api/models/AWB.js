/**
* AWB.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		awb_no:			{type: 'string', required: true , unique: true },	//both constrains are important to avoid null entry
		// on_hand:		{type: 'boolean',defaultsTo: false },
		// booklist_entry:	{type: 'boolean',defaultsTo: false },
		outward:		{type: 'boolean', defaultsTo: true },
		file_awb:		{collection: 'attachment', via: "awb_id"},	//ref
		file_house:		{collection: 'attachment', via: "awb_house_id"},	//ref
		awb_info:		{ model: 'AWBInfo' }	//ref
},
};