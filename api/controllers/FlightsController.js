/**
 * FlightsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

let fs = require('fs');
let { promisify } = require('util');
let xlstojson = require("xls-to-json");
let moment = require('moment-timezone');
let _ = require('lodash');

module.exports = {

	fetchFlights: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(4, req.user.username, req.options.action, `fetchFlight data body = ${JSON.stringify(req.body)}`);
		sails.config.log.addlog(4, req.user.username, req.options.action, `fetchFlight data query = ${JSON.stringify(req.query)}`);

		let query = {};
		query.where = { 'season': req.query.where };
		
		if (req.query.limit) {
			query.limit = req.query.limit;
		}

		if (req.query.page) {
			let skip_records_count = (Number(req.query.limit) * (req.query.page - 1));
			sails.config.log.addlog(4, req.user.username, req.options.action, `skip_records_count = ${skip_records_count}`);
			query.skip = skip_records_count;
		}

		if (req.query.orderBy) {
			if (req.query.ascending == '1') {
				let sortData = req.query.orderBy + ' ' + 'ASC';
				query.sort = sortData;
			} else {
				let sortData = req.query.orderBy + ' ' + 'DESC';
				query.sort = sortData;
			}
		}

		if (req.query.query) {
			query.where = {};
			query.where.or = [];
			let columns = [{ "data": "flight_no" }, { "data": "src" }, { "data": "dest" }];

			columns.map(function (col) {
				let obj = {};
				let splits = req.query.query.split(' ');
				for (let i = 0; i < splits.length; i++) {
					if (splits[i]) {
						switch (col.data) {
							case 'flight_no':
								obj['flight_no'] = { contains: splits[i].toUpperCase() };
								break;
							default:
								obj[col.data] = { contains: splits[i].toUpperCase() };
								break;
						}
					}
				}
				query.where.or.push(obj);
				return col.data;
			});
		}

		sails.config.log.addlog(4, req.user.username, req.options.action, JSON.stringify(query));
		
		//	Validate
		let flights = await Flight.find(query);

		let response = sails.config.custom.jsonResponse(null, flights);
		let totalFilteredRecords = await Flight.count(query.where ? query.where : {})
		// let totalRecords = await Flight.count();
		// response.recordsFiltered = totalFilteredRecords;
		response.total = totalFilteredRecords;
		// console.log("response  =  ="+JSON.stringify(response));
		sails.config.log.addOUTlog(req.user.username, "fetchFlights");
		res.send(response);
		//sails.config.log.addOUTlog(req.user.email, req.options.action);
	},

	getFlights: async function (req, res) {

		sails.config.log.addINlog(req.user.username, req.options.action);

		sails.config.log.addlog(4, req.user.username, req.options.action, `getFlights data body = ${JSON.stringify(req.body)}`);
		sails.config.log.addlog(4, req.user.username, req.options.action, `getFlights data query = ${JSON.stringify(req.query)}`);

		let stationNames = await Station.find().sort('iata ASC');

		// var users = await User.find({}).sort('age ASC');

		Flight.find({
			where: {},
			sort: 'start_date'
		}, function (err, flights) {
			if (err) {
				sails.config.log.addlog(0, req.user.username, req.options.action, `Error while finding the Flights`);
				sails.config.log.addlog(0, req.user.username, req.options.action, `${err}`);
				
				// sails.config.log.addOUTlog(req, "getFlights");
				return res.view('pages/imlost', {
					error: 'Error while finding the Flights'
				});
			} else {
				sails.config.log.addlog(3, req.user.username, req.options.action, `Flights found successfully`);
				
				return res.view('pages/flights', {
					//flightsdetails: flights 
					stationList: stationNames
				});
			}
		});
	},

	uploadFlightsFile: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);

		sails.config.globals.getdumppath('Flights', async function (err, path) {
			if(err) {sails.config.log.addlog(0, req.user.username, req.options.action, err);}
			if(path) {sails.config.log.addlog(3, req.user.username, req.options.action, path);}

			req.file('flightsUpload').upload({
				dirname: ('.' + path),
				// You can apply a file upload limit (in bytes)
			}, async function whenDone(err, uploaded_files) {
				if (err) {
					sails.config.log.addlog(0, req.user.username, req.options.action, err);
					return res.json(sails.config.custom.jsonResponse(err, null));
				}

				sails.config.globals.async.each(
					uploaded_files,
					function (uploaded_file, cb) {
						//let json_file_name = uploaded_file.filename ;
						//console.log('======='+JSON.stringify(uploaded_file));
						let moveFile = async () => {
							let mv = promisify(fs.rename);
							await mv(uploaded_file.fd, '.' + path + uploaded_file.filename);
							//to convert csv file in json format
							let json_file_name = uploaded_file.filename.split('.')
							xlstojson({
								input: ('.' + path + uploaded_file.filename), // input csv 
								output: ('.' + path + json_file_name[0] + '.json'), // output json 
								sheet: "SCHEDULE"
							}, async function (err, result) {
								if (err) {
									sails.config.log.addlog(0, req.user.username, req.options.action, err);
									cb(err);
								} else {
									//	let result_string = JSON.stringify(result);
									let count = Object.keys(result).length;
									console.log(count);
									let crtfltCount = 0;

									let missing_stations = [];
									let affected_flights = [];
									let incorrect_date_data = [];

									let season = req.body.season;

									await Flight.destroy({ 'createdby': '', 'season': req.body.season }).exec(function (err, flight) {
										if (err) {
											console.log(err);
										} else {
											console.log('destroyed ');
										}
									});
									
									//count-1 bcs excel file is having one extra line
									for (let i = 0; i < (count); i++) {
										let number = result[i].Flt;//Flight;
										let targetLength = 4;
										let fourDigitNo = sails.config.custom.leftPad(number, targetLength);
										let flight_no = (result[i]['Carrier'/*'Org Unit'*/] + fourDigitNo /*+ result[i].Sfx*/ /*Suffix*/);
										let src = result[i].Boardpoint//['Departure Station Code'];
										//let dest = (result[i]['Route']).match(/.{1,3}/g);
										//let leg = Number(result[i].Leg);
										let destination = result[i].Offpoint;//dest[leg];
										let route = src + '-' + destination;//(_.kebabCase(dest).toUpperCase());
										let vehicle = result[i]['AC Type'];//.Vehicle;

										let monday = (result[i].Day/*Doop*/).includes('1');
										let tuesday = (result[i].Day/*Doop*/).includes('2');
										let wednesday = (result[i].Day/*Doop*/).includes('3');
										let thursday = (result[i].Day/*Doop*/).includes('4');
										let friday = (result[i].Day/*Doop*/).includes('5');
										let saturday = (result[i].Day/*Doop*/).includes('6');
										let sunday = (result[i].Day/*Doop*/).includes('7');

										let departure_time = result[i]['Dep. Time'].replace(':', '');//['Depart Time'];
										let arrival_time = result[i]['Arr. Time'].replace(':', '');//['Arrive Time'];

										let src_station = await Station.findOne({ where: { iata: src }, select: ["tz"] }).catch(err => console.log(err.message));
									
										if (!src_station) {
											//	If the missing station is already captured and is present in the array, we should not add it again.
											if (_.indexOf(missing_stations, src) == -1)
												missing_stations.push(src);

											if (_.indexOf(affected_flights, flight_no))
												affected_flights.push(flight_no);
										}

										let dest_station = await Station.findOne({ where: { iata: destination }, select: ["tz"] }).catch(err => console.log(err.message));
									
										if (!dest_station) {
											//	If the missing station is already captured and is present in the array, we should not add it again.
											if (_.indexOf(missing_stations, destination) == -1)
												missing_stations.push(destination);

											if (_.indexOf(affected_flights, flight_no))
												affected_flights.push(flight_no);
										}

										let tz_src = src_station ? src_station.tz : sails.config.custom.local_tz; // get the timezone from database of iata
										let tz_dest = dest_station ? dest_station.tz : sails.config.custom.local_tz; // get the timezone from database of iata

										//	The new date format is dd/MM/YYYY and we want it in MM/dd/YYYY so that it parses
										let xlsStartDate = result[i]['StartDate'/*'Local Start Date'*/].split(' ')[0].split('/');
										if(xlsStartDate.length !== 3) {
											xlsStartDate = result[i]['StartDate'/*'Local Start Date'*/].split(' ')[0].split('-');
										}
									
										let xlsEndDate = result[i]['EndDate'/*'Local End Date'*/].split(' ')[0].split('/');
										if(xlsEndDate.length !== 3) {
											xlsEndDate = result[i]['EndDate'/*'Local End Date'*/].split(' ')[0].split('-');
										}

										sails.config.log.addlog(3, req.user.username, req.options.action, `xlsStartDate = ${xlsStartDate}`);
										sails.config.log.addlog(3, req.user.username, req.options.action, `xlsEndDate = ${xlsEndDate}`);

										let start_date = moment.tz(new Date(xlsStartDate[sails.config.custom.xlsx_date_from_windows ? 0 : 1] + '/' + xlsStartDate[sails.config.custom.xlsx_date_from_windows ? 1 : 0] + (xlsStartDate[2].length == 2 ? '/20' : '/') + xlsStartDate[2]), tz_src).startOf('day').valueOf(); // use moment library with start_date and tz_src 
										let end_date = moment.tz(new Date(xlsEndDate[sails.config.custom.xlsx_date_from_windows ? 0 : 1] + '/' + xlsEndDate[sails.config.custom.xlsx_date_from_windows ? 1 : 0] + (xlsEndDate[2].length == 2 ? '/20' : '/') + xlsEndDate[2]), tz_src).endOf('day').valueOf(); // use moment library with end_date and tz_dest

										if(end_date < start_date) {
											sails.config.log.addlog(0, req.user.username, req.options.action, `"incorrect_date_data index ${i+2}`);
											incorrect_date_data.push(i+2);
										}

										//console.log('-----------', i);
										//console.log("new Date(result[i]['EndDate'])", new Date(result[i]['EndDate']));
										//console.log("moment(new Date(result[i]['EndDate']))", moment(new Date(result[i]['EndDate'])));
										//console.log("tz_dest", tz_dest);

										let arrival_day = Number(result[i]['Date Offset'/*'Days From Origin'*/]);

										let data = await Flight.create({
											flight_no: flight_no,
											season: season,
											createdby: '',
											src: src,
											//leg: leg,
											dest: destination,
											route: route,
											vehicle: vehicle,
											monday: monday,
											tuesday: tuesday,
											wednesday: wednesday,
											thursday: thursday,
											friday: friday,
											saturday: saturday,
											sunday: sunday,
											departure_time: departure_time,
											arrival_time: arrival_time,
											tz_src: tz_src,
											tz_dest: tz_dest,
											start_date: start_date,
											end_date: end_date,
											arrival_day: arrival_day
										}).fetch().catch(err => console.log(err.message));

										if (data) {
											crtfltCount = crtfltCount + 1;
										}

										//console.log((crtfltCount) + '\t' + flight_no + '\t' + src + '\t' + leg + '\t' + destination + '\t' + route + '\t' + vehicle + '\t' + monday + '\t' + tuesday + '\t' + wednesday + '\t' + thursday + '\t' + friday + '\t' + saturday + '\t' + sunday + '\t' + departure_time + '\t' + arrival_time + '\t' + tz_src + '\t' + tz_dest + '\t' + start_date + '\t' + end_date + '\t' + arrival_day ) ;
									}
									
									sails.config.log.addlog(1, req.user.username, req.options.action, `missing_stations = ${missing_stations}`);
									sails.config.log.addlog(1, req.user.username, req.options.action, `affected_flights = ${affected_flights}`);
									sails.config.log.addlog(1, req.user.username, req.options.action, `incorrect_date_data = ${incorrect_date_data}`);

									if (missing_stations || affected_flights) {
										sails.helpers.sendEmail.with({
											to: 'medha.halbe@ba.com',
											subject: 'Report - Missing IATA stations',
											html: '<p>Following IATA stations have missing entries in the system:<br><strong>' + missing_stations + '</strong></p><p>Not having their entries is directly affecting the flight schedules:<br><strong>' + affected_flights + '</strong></p>'
										}, function (err) {
											if (err) {
												sails.config.log.addlog(1, req, "uploadFlightsFile",err);
												sails.config.log.addlog(0, req.user.username, req.options.action, err);
											}
										});
									}
									sails.config.log.addlog(3, req.user.username, req.options.action, `flights added = ${crtfltCount}`);
								}
							});
							cb();
						}
						moveFile();
					},
					function (err) {
						if (err){
							sails.config.log.addlog(0, req.user.username, req.options.action, err);
							sails.config.log.addOUTlog(req.user.username, req.options.action);
							res.json(sails.config.custom.jsonResponse(err, null));
						} else {
							res.json(sails.config.custom.jsonResponse(null, true));
						}
					}
				);
			});
		});
	},

	addFlight: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, JSON.stringify(req.body));

		if (req.body.flight_no && req.body.arr_time_hrs && req.body.start_date && req.body.arr_time_min &&
			req.body.source_station && req.body.destination_station && req.body.season) {
			// console.log(typeof + (req.body.dep_time_hrs + "" + req.body.dep_time_min));
			let arrival_time_in_string = req.body.arr_time_hrs + "" + req.body.arr_time_min;
			let arrival_time_in_number = parseInt(arrival_time_in_string);
			let departure_time_in_string = req.body.dep_time_hrs + "" + req.body.dep_time_min;
			let departure_time_in_number = parseInt(departure_time_in_string);

			let source = await Station.findOne({
				where: { iata: req.body.source_station },
				select: ['tz']
			});

			let destination = await Station.findOne({
				where: { iata: req.body.destination_station },
				select: ['tz']
			});

			let start_date = new moment.tz(parseInt(req.body.start_date), source.tz);
			let weekday = start_date.weekday();

			sails.config.log.addlog(3, req.user.username, req.options.action, `start date ${start_date} ${weekday}`);
		
			let createdFlight;
			try {
				createdFlight = await Flight.create({
					season: req.body.season,
					createdby: req.body.createdby,
					leg: 1, //default
					route: req.body.source_station + "-" + req.body.destination_station,
					tz_src: source.tz,
					tz_dest: destination.tz,
					start_date: start_date.startOf('day').valueOf(),
					end_date: start_date.endOf('day').valueOf(),
					flight_no: req.body.flight_no,
					src: req.body.source_station,
					dest: req.body.destination_station,
					departure_time: departure_time_in_number,
					arrival_time: arrival_time_in_number,
					arrival_day: req.body.arrival_day,
					sunday: (weekday == 0),
					monday: (weekday == 1),
					tuesday: (weekday == 2),
					wednesday: (weekday == 3),
					thursday: (weekday == 4),
					friday: (weekday == 5),
					saturday: (weekday == 6),
					vehicle: req.body.vehicle_no
				}).fetch();
			} catch (err) {
				sails.config.log.addlog(0, req.user.username, req.options.action, err.message);
			}
			if (createdFlight) {
				return res.json(sails.config.custom.jsonResponse(null, { value: createdFlight }));
			} else {

				return res.json(sails.config.custom.jsonResponse('Unable to save the flight data,try again !', null));
			}
		} else {
			sails.config.log.addlog(0, req.user.username, req.options.action, "Required fields are missing");
			return res.json(sails.config.custom.jsonResponse('Required fields are missing', null));
		}
	},

	createFlightSeasons: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);

		let date = Date.now();
		let formatedDate = sails.config.custom.getReadableDate(date);
		let seasonFlight = await FlightSeason.findOne({ date: formatedDate });
		
		if (!seasonFlight) {
			let flightSeason = await FlightSeason.create({
				date: formatedDate
			}).fetch().catch(err => {
				sails.config.log.addlog(0, req.user.username, req.options.action, err.message);
			});
			if (!flightSeason) {
				sails.config.log.addlog(0, req.user.username, req.options.action, "Data is missing");
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				return res.json(sails.config.custom.jsonResponse("Data is missing", null));
			} else {
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				return res.json(sails.config.custom.jsonResponse(null, true));
			}
		} else {
			sails.config.log.addlog(0, req.user.username, req.options.action, `flight date is already in data base`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			return res.json(sails.config.custom.jsonResponse("flight date is already in data base", null))
		}
	},

	seasonsFlights: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);

		let flightSeasons = await FlightSeason.find({ where: {}, select: ["date"] }).sort('createdAt DESC').limit(10);
		
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.json(sails.config.custom.jsonResponse(null, flightSeasons));
	}
};
