/**
* LockedOperation.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		username:		{type: 'string', unique: true},
		operationId:	{type: 'string', unique: true},
		awb_no:			{type: 'string', required: true},
		department: 	{type: 'string', isIn: Object.values(sails.config.custom.department_name), required: true},
		station:		{type: 'string', required: true},
		opening_status: {type: 'string', required: true}
    }
};