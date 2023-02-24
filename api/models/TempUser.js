const bcrypt = require('bcrypt-nodejs');
module.exports = {
	attributes: {
		username: {
			type: 'string',
			unique: true
		},
		email: {
			type: 'string',
			unique: true
		},
		stations: {
			type: 'json',
			columnType: 'array'
		},
		departments: {
			type: 'json',
			columnType: 'array'
		},
		password: {
			type: 'string'
		},
		allow_edit: {
			type: 'boolean',
            defaultsTo: false
		},
	},
};

/*
{
    "username": "naval",
    "email": "naval@mobigic.com",
    "stations": [
      "BLR",
      "BOM",
      "DEL",
      "HYD",
      "MAA"
    ],
    "departments": [
      "PLANNER OPS",
      "AIRPORT OPS",
      "CENTRAL OPS",
      "CENTRAL FIN",
      "CENTRAL REC"
    ],
    "password": "123456",
    "allow_edit": true
}
 */