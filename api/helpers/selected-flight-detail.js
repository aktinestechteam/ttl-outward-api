var moment = require('moment-timezone');

module.exports = {

	friendlyName: 'selectedFlightDetail',

	description: 'To fetch the exact departue and arrival of the flights available for 20 days (10days previous and 10 days forward) duration w.r.t source and destination ',

	inputs: {
		source: {type: 'string'},
		destination: {type: 'string'},
		upComingDaysCount: {type: 'number', defaultsTo: 7},
		previousDaysCount: {type: 'number', defaultsTo: 2}
	},

	exits: {
		success: {
			outputDescription: "flight is processed.",
		}
	},

	fn: async function (inputs, exits) {

		sails.config.log.addINlog("helper", "selected-flight-detail");
		sails.config.log.addlog(3, "helper", "selected-flight-detail", `inputs`, JSON.stringify(inputs));

		let result = [];

		let source = await Station.findOne({iata: inputs.source});
		let destination = await Station.findOne({iata: inputs.destination})

		let dateIterator = new moment.tz(source.tz);	//	create date in the source timezone
		dateIterator.startOf('day');	//	Move the date to midnight
		dateIterator.subtract(inputs.previousDaysCount, 'day');

		for(let i = 0; i <= (inputs.upComingDaysCount + inputs.previousDaysCount) ; i++) {
			//console.log(`------------------ ${dateIterator.toLocaleString()}`);
			dateIterator.startOf('day');

			//let display = [];
			let dayOfFlight = dateIterator.weekday();
			let query = {
				src: inputs.source,
				dest: inputs.destination,
				start_date: {'<=': dateIterator.startOf('day').valueOf()},
				end_date: {'>=': dateIterator.endOf('day').valueOf()}
			};
			
			switch(dayOfFlight){
				case 0: query.sunday = true; break;
				case 1: query.monday = true; break;
				case 2: query.tuesday = true; break;
				case 3: query.wednesday = true; break;
				case 4: query.thursday = true; break;
				case 5: query.friday = true; break;
				case 6: query.saturday = true; break;
			}

			let flights = await Flight.find(query)

			//console.log('no. of flights = ', flights.length)

			for(let j = 0; j < flights.length; j++) {

				let departure_time = `${sails.config.custom.leftPad(Math.floor(flights[j].departure_time / 100), 2)}:${sails.config.custom.leftPad(flights[j].departure_time % 100, 2)}`;
				let arrival_time = `${sails.config.custom.leftPad(Math.floor(flights[j].arrival_time / 100), 2)}:${sails.config.custom.leftPad(flights[j].arrival_time % 100, 2)}`;

				let departure_date = new moment.tz(`${dateIterator.format('YYYY-MM-DD')} ${departure_time}`, source.tz);

				let arrival = departure_date.clone();
				arrival.add(flights[j].arrival_day, 'day');
				
				let arrival_date = new moment.tz(`${arrival.format('YYYY-MM-DD')} ${arrival_time}`, destination.tz);

				/*display.push({
					flight_no: flights[j].flight_no,
					from: flights[j].src,
					to: flights[j].dest,
					departure_time: flights[j].departure_time,
					arrival_time: flights[j].arrival_time,
					departure: departure_date,
					arrival: arrival_date
				})*/

				flights[j].exactdeparturetime = departure_date.valueOf();
				flights[j].exactarrivaltime = arrival_date.valueOf();
				flights[j].flightDate = dateIterator.startOf('day').valueOf();

				//result.push(flights[j])
				result.push({
					flight_no: flights[j].flight_no,
					exactdeparturetime: departure_date.valueOf(),
					exactarrivaltime: arrival_date.valueOf(),
					flightDate: dateIterator.startOf('day').valueOf(),
				})
			}

			//console.table(display);

			dateIterator.add(1, 'day');
		}

		exits.success(result);
		sails.config.log.addOUTlog("helper", "selected-flight-detail");
	}
};
