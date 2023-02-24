/**
* Flight.js
*
* @description :: A model definition represents a database table/collection.
* @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
*/

module.exports = {

	attributes: {
		flight_no:			{type: 'string', required: true },
		createdby :			{type: 'string' },
		season:				{type: 'string', required: true },
		src:				{type: 'string', required: true },
		dest:				{type: 'string', required: true },
		//leg:				{type: 'number', required: true },
		route:				{type: 'string', required: true },
		vehicle:			{type: 'string' },
		monday:				{type: 'boolean', defaultsTo: false },
		tuesday:			{type: 'boolean', defaultsTo: false },	
		wednesday:			{type: 'boolean', defaultsTo: false },	
		thursday:			{type: 'boolean', defaultsTo: false },	
		friday:				{type: 'boolean', defaultsTo: false },
		saturday:			{type: 'boolean', defaultsTo: false },	
		sunday:				{type: 'boolean', defaultsTo: false },
		departure_time:		{type: 'number', required: true },		
		arrival_time:		{type: 'number', required: true },		
		tz_src:				{type: 'string', required: true },
		tz_dest:			{type: 'string', required: true },
		start_date:			{type: 'number', required: true },
		end_date:			{type: 'number', required: true },
		arrival_day:		{type:'number',}	
	},
};
