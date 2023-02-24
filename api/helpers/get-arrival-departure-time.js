let moment = require('moment-timezone');

module.exports = {

	friendlyName: 'Get Arrival Departure Time',

	description: 'Obtain the arrival and departure time at the source, destination and at the operating station',

	inputs: {
		flight_no: {type: "string"},
		flight_date: {type: "number"},// YYYY-MM-DD or timestamp in milliseconds
		from: {type: 'string'}
	},

	exits: {
		success: {
			description: 'All done.',
		},
	},

	fn: async function (inputs, exits) {
		sails.config.log.addINlog("helper", "get-arrival-departure-time");
		sails.config.log.addlog(3, "helper", "get-arrival-departure-time", `inputs`, JSON.stringify(inputs));
		let from = await Station.findOne({iata: inputs.from});

		let flight_date = new moment.tz(inputs.flight_date, from.tz);

		let query = {
			src: inputs.from,
			flight_no: inputs.flight_no,
			start_date: {'<=': flight_date.startOf('day').valueOf()},
			end_date: {'>=': flight_date.endOf('day').valueOf()}
		};

		let dayOfFlight = flight_date.weekday();

		switch(dayOfFlight){
            case 0: query.sunday = true; break;
            case 1: query.monday = true; break;
            case 2: query.tuesday = true; break;
            case 3: query.wednesday = true; break;
            case 4: query.thursday = true; break;
            case 5: query.friday = true; break;
            case 6: query.saturday = true; break;
        }

		let flight = await Flight.findOne(query);

		if(!flight) {
			return exits.success(sails.config.custom.jsonResponse("Unable to find a flight", null));
		}

		let to = await Station.findOne({iata: flight.dest});

		let departure_time = `${sails.config.custom.leftPad(Math.floor(flight.departure_time / 100), 2)}:${sails.config.custom.leftPad(flight.departure_time % 100, 2)}`;
		let arrival_time = `${Math.floor(flight.arrival_time / 100)}:${sails.config.custom.leftPad(flight.arrival_time % 100, 2)}`;

		let departure_date = new moment.tz(`${flight_date.format('YYYY-MM-DD')} ${departure_time}`, from.tz);
		flight_date.add(flight.arrival_day, 'day');
		let arrival_date = new moment.tz(`${flight_date.format('YYYY-MM-DD')} ${arrival_time}`, to.tz);

		exits.success(sails.config.custom.jsonResponse(null, {
			// departure_timestamp: departure_date.valueOf(),
			// arrival_timestamp: arrival_date.valueOf(),
			// flight_no: inputs.flight_no,
			// from: inputs.from,
			// to: inputs.to,
			dayOfFlight: dayOfFlight,
			src: inputs.from,
			departure: departure_date.valueOf(),
			destination: inputs.to,
			arrival: arrival_date.valueOf(),
		}));
	}

};

