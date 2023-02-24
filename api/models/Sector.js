/**
 * Reasons.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
	attributes: {
		source: {
			type: 'string',
			required: true /*, unique: true*/
		},
		destination: {
			type: 'string',
			required: true
		},
		flight_no: {
			type: 'string',
			required: true
		},
		local_departure_time: {
			type: 'number',
			
		},
		local_arival_time: {
			type: 'number',
			
		},
		operational_days: {
			type: 'json',
		},
	}
};