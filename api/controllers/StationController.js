/**
 * StationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
var moment = require('moment-timezone');
module.exports = {
	//function used to save stationlist
	
	fetchStations: async function(req, res) {
		sails.config.log.addINlog(req.user.username, "fetchStations");
		console.log('fetchStation data body'+ JSON.stringify(req.body));
		console.log('fetchStation data query'+ JSON.stringify(req.query));
		let query = {};

		if (req.query.limit) {
			query.limit = req.query.limit;
		}

		if (req.query.page) {
			let skip_records_count = (Number(req.query.limit)*(req.query.page-1));
			console.log('skip_records_count = = '+ skip_records_count);
			query.skip = skip_records_count;
		}

		if(req.query.orderBy){
			if(req.query.ascending == '1'){
				let sortData= req.query.orderBy+' '+ 'ASC';
				query.sort= sortData;
			} else{
				let sortData= req.query.orderBy+' '+ 'DESC';
				query.sort= sortData;
			}			
		}
		
		if (req.query.query) {
			query.where = {};
			query.where.or = [];
			let columns = [{"data":"iata"},{"data":"name"},{"data":"country"}];

			columns.map(function(col) {
				let obj = {};
				let splits = req.query.query.split(' ');
				for (let i = 0; i < splits.length; i++) {
					if (splits[i]) {
						switch(col.data) {
							case 'iata':
								obj['iata'] = {contains: splits[i].toUpperCase()};
								break;
							default:
								obj[col.data] = {contains: splits[i]};
								break;
						}
					}
				}
				query.where.or.push(obj);
				return col.data;
			});
		}
		//console.log(JSON.stringify(query));
		//	Validate
		let stations = await Station.find(query);
		
		sails.config.globals.async.eachSeries(stations,
			async function(station){
				//console.log('working for ' + station.iata);
				let tz = (station['tz']);
				let result = await sails.helpers.moments.getGmtDst.with({timezone: tz});
				station.gmt = result.gmt;
				station.dst = result.dst;
			}, async function(err) {
			if(err) {
				console.log(err);
			} else {
				// sails.log.info(req + ' - ' + new Date() + ' INFO -  (getstations - get) Stations found successfully');
				let response = sails.config.custom.jsonResponse(null, stations);
				let totalFilteredRecords = await Station.count(query.where ? query.where : {});
				// let totalRecords = await Station.count();
				// response.recordsFiltered = totalFilteredRecords;
				response.total = totalFilteredRecords;
				res.send(response);
				// return res.view('pages/stations', {
				// 	response: response,
				// 	gmtdsts: gmtDst
				// });
			}
		});
		sails.config.log.addOUTlog(req.user.username, "fetchStations");

		//sails.config.log.addOUTlog(req.user.email, req.options.action);
	},
	
	stationlist: async function(req, res) {
		//let memberlist = await Member.find();
		//sails.config.log.addINlog(req.user.email, req.options.action);
		res.view('pages/stations', /*{memberlist: memberlist}*/);
		//sails.config.log.addOUTlog(req.user.email, req.options.action);
	},

	addStation : async function (req, res) {
		sails.config.log.addINlog(req.user.username, "addStation");
		//get data into variables
		//console.log(req.body);
		//var id = req.body.outwardcargo_airport_list_id;
		var iataCode = req.body.iata_code;
		var cityName = req.body.city_name;
		var country = req.body.country_name;
		var timezone = req.body.timezone;
		var isoutwardPort = req.body.is_outward;

		//validations
		if (iataCode == undefined || iataCode == null || iataCode == '') {
			// sails.log.error(req + ' - ' + new Date() + ' ERR - (airportlist - post) IATA code cannot be blank');
			sails.config.log.addlog(1, req, "addStation","ERR_AL_IATA_BLANK");
			return res.send({
				error: 'IATA Code Cannot be blank',
				error_code: 'ERR_AL_IATA_BLANK'
			});
		} else if (cityName == undefined || cityName == null || cityName == '') {
			// sails.log.error(req + ' - ' + new Date() + ' ERR - (airportlist - post) City name cannot be blank');
			sails.config.log.addlog(1, req, "addStation","ERR_AL_CITY_BLANK");
			return res.send({
				error: 'City Name Cannot be blank',
				error_code: 'ERR_AL_CITY_BLANK'
			});
		} else if (country == undefined || country == null || country == '') {
			// sails.log.error(req + ' - ' + new Date() + ' ERR - (airportlist - post) Country name cannot be blank');
			sails.config.log.addlog(1, req, "addStation","ERR_AL_COUNTRY_BLANK");
			return res.send({
				error: 'Country Name Cannot be blank',
				error_code: 'ERR_AL_COUNTRY_BLANK'
			});
		} else if (timezone == undefined || timezone == null || timezone == '') {
			// sails.log.error(req + ' - ' + new Date() + ' ERR - (airportlist - post) Timezone cannot be blank');
			sails.config.log.addlog(1, req, "addStation","ERR_AL_TZ_BLANK");
			return res.send({
				error: 'Timezone Cannot be blank',
				error_code: 'ERR_AL_TZ_BLANK'
			});
		}else {
			// sails.log.info(req + ' - ' + new Date() + ' INFO -  (airportlist - post) Airport validation successfully');
			//check for port if not found create new
			let result = await Station.findOrCreate({
					iata: iataCode.toUpperCase()
				}, {
					iata: iataCode.toUpperCase(),
					name: cityName,
					country: country,
					tz: timezone,
					is_outward: isoutwardPort
				})
			if(result){
				let updatedAirport = await Station.update({
							id: result.id
						}, {
							is_outward: isoutwardPort,
							iata: iataCode.toUpperCase(),
							name: cityName,
							country: country,
							tz: timezone,
							is_outward: isoutwardPort
						}).fetch()
				if (updatedAirport) {
					await sails.helpers.jsonFileWrite.with({called :"station"});
					// sails.log.info(req + ' - ' + new Date() + ' INFO -  (airportlist - post) Airport updated successfully');
					
					sails.config.log.addOUTlog(req.user.username, "addStation");return res.send({
						value: updatedAirport[0]
					});
				} 
				else 
				{
					// sails.log.error(req + ' - ' + new Date() + ' ERR -  (airportlist - post)' + err);
					sails.config.log.addlog(1, req, "addStation","Something Happens During Updating Or Inserting");
					return res.send({
						error: 'Something Happens During Updating Or Inserting'
					});
				}
			}
			else
			{
				if (error.code == 'E_UNIQUE') {
					// duplicate value not allowed
					// sails.log.error(req + ' - ' + new Date() + ' ERR -  (airportlist - post)' + sails.config.globals.uniqueError);
					sails.config.log.addlog(1, req, "addStation","ERR_AL_E_UNIQUE");
					return res.send({
						error: sails.config.globals.uniqueError,
						error_code: 'ERR_AL_E_UNIQUE'
					});
				} else {
					// sails.log.error(req + ' - ' + new Date() + ' ERR - ' + err);
					sails.config.log.addlog(1, req, "addStation","Something Happend During Creating Record");
					return res.send({
						error: 'Something Happend During Creating Record'
					});
				}
			}
		}
	},
	// function used to get airportlist
	getStations: function (req, res) {
		sails.config.log.addINlog(req, "getStations");
		//find all airports
		let gmtDst = [];
		Station.find({
			where: {},
			sort: 'iata',
			limit: 10
		}, function (err, stations) {
			if (err) {
				sails.log.error(req + ' - ' + new Date() + ' ERR -  (getstations - get) ' + err);
				sails.config.log.addlog(1, req, "addStation","Error in finding Stations list");
				return res.view('pages/imlost', {
					error: 'Error in finding Stations list'
				});
			} else {

				sails.config.globals.async.eachSeries(stations,
					async function(station){
						//console.log('working for ' + station.iata);
						let tz = (station['tz']);
						let result = await sails.helpers.moments.getGmtDst.with({timezone: tz});
						gmtDst.push(result);
						
				}, function(err) {
					if(err) {
						console.log(err);
					} else {
						sails.log.info(req + ' - ' + new Date() + ' INFO -  (getstations - get) Stations found successfully');
						sails.config.log.addOUTlog(req, "getStations");
						return res.view('pages/stations', {
							stations: stations,
							gmtdsts: gmtDst
						});
					}
				});
			}
		});
	},

	//delete airport
	deleteStation: function (req, res) {
		sails.config.log.addINlog(req.user.username, "deleteStation");
		var deletePortId = req.body.station_id;
		console.log('enter in delete station'+ deletePortId);
		Station.destroy({
			'id': deletePortId
		}).exec(function (err, ports) {
			if (err) {
				// sails.log.error(req + ' - ' + new Date() + ' ERR -  (deleteairport - post) ' + err);
				return res.view('pages/imlost', {
					error: 'Error while finding the port while deleting'
				});
			} else {
				// sails.log.info(req + ' - ' + new Date() + ' INFO - (deleteairport - post) Airport deleted successfully');
				sails.config.log.addOUTlog(req, "deleteStation");
				return res.send({
					result: true
				});
			}
		});
	}	
};
