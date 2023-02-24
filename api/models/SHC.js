/**
* SHC.js
*
* @description :: A model definition.  Represents a database table/collection/etc.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		code:				{type: 'string', required: true , unique: true },	//both constrains are important to avoid null entry
		explanation:		{type: 'string', required: true },
		make_it_visible: 	{type: 'boolean', defaultsTo: true },
	}
};