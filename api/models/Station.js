/**
* Station.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		iata:				{type: 'string', required: true , unique: true },//both constrains are important to avoid null entry
		name:				{type: 'string', defaultsTo: 'unknown' },
		country:			{type: 'string', defaultsTo: 'unknown' },
		tz:					{type: 'string', defaultsTo: sails.config.custom.local_tz },
		is_outward:	 		{type: 'boolean', defaultsTo: false}
	},
};