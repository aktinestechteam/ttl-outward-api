var moment = require('moment-timezone');

module.exports = {

	friendlyName: 'getGMTDST',

	description: 'To get GMT and DST for a given Timezone',

	inputs: {
		timezone: {type: 'string', defaultsTo: sails.config.custom.local_tz}
	},

	exits: {
		success: {
			outputDescription: "Moment is processed.",
		}
	},

	fn: function (inputs, exits, req, res) {
		let timezone = inputs.timezone;

		let north_longest_day = '2019-06-21T00:00:00';
		let south_longest_day = '2019-12-22T00:00:00';

		let gmt,dst;

		let south_dst = (moment(south_longest_day).tz(timezone).isDST());
		let north_dst = (moment(north_longest_day).tz(timezone).isDST());
		if(south_dst == false && north_dst == true){
			dst = (moment(north_longest_day).tz(timezone).format('Z'));
			gmt = (moment(south_longest_day).tz(timezone).format('Z'));
		}else if(south_dst == true && north_dst == false){
			dst = (moment(south_longest_day).tz(timezone).format('Z'));
			gmt = (moment(north_longest_day).tz(timezone).format('Z'));
		} else {
			gmt = (moment(south_longest_day).tz(timezone).format('Z'));
			dst = 'X';
		}
		//console.log('DST '+ dst);
		//console.log('GMT  '+ gmt);

		exits.success({gmt: gmt, dst: dst});
	}
};