/**
 * AirportListController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	//function used to save airportlist
	airportlist: function (req, res) {
		sails.config.log.addINlog(req, "airportlist");
		//get data into variables
		var id = req.body.inwardcargo_airport_list_id;
		var iataCode = req.body.inwardcargo_airport_list_iata_code_input;
		var cityName = req.body.inwardcargo_airport_list_city_name_input;
		var isInwardPort = req.body.inwardcargo_airport_list_is_inward_destination;

		//validations
		if (iataCode == undefined || iataCode == null || iataCode == '') {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (airportlist - post) IATA code cannot be blank');
			sails.config.log.addlog(1, req, "airportlist","ERR_AL_IATA_BLANK");
			return res.send({
				error: 'IATA Code Cannot be blank',
				error_code: 'ERR_AL_IATA_BLANK'
			});
		} else if (cityName == undefined || cityName == null || cityName == '') {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (airportlist - post) City name cannot be blank');
			sails.config.log.addlog(1, req, "airportlist","ERR_AL_CITY_BLANK");
			return res.send({
				error: 'City Name Cannot be blank',
				error_code: 'ERR_AL_CITY_BLANK'
			});
		} else {
			sails.log.info(req + ' - ' + new Date() + ' INFO -  (airportlist - post) Airport validation successfully');
			//check for port if not found create new
			Ports.findOrCreate({
					id: id
				}, {
					iata_code: iataCode.toUpperCase(),
					city_name: cityName
				})
				.exec(async (err, ports, wasCreated) => {
					if (err) {
						if (err.code == 'E_UNIQUE') {
							sails.config.log.addlog(1, req, "airportlist","ERR_AL_E_UNIQUE");
							// duplicate value not allowed
							sails.log.error(req + ' - ' + new Date() + ' ERR -  (airportlist - post)' + sails.config.globals.uniqueError);
							return res.send({
								error: sails.config.globals.uniqueError,
								error_code: 'ERR_AL_E_UNIQUE'
							});
						} else {
							sails.log.error(req + ' - ' + new Date() + ' ERR - ' + err);
							sails.config.log.addlog(1, req, "airportlist","Something Happend During Creating Record");
							return res.send({
								error: 'Something Happend During Creating Record'
							});
						}
					} else {
						sails.log.info(req + ' - ' + new Date() + ' INFO -  (airportlist - post) Airport found or created new if not found');
						//update airport
						Ports.update({
								id: ports.id
							}, {
								is_inward_port: isInwardPort,
								iata_code: iataCode.toUpperCase(),
								city_name: cityName
							}).fetch()
							.exec(function (err, updatedAirport) {
								if (err) {
									sails.log.error(req + ' - ' + new Date() + ' ERR -  (airportlist - post)' + err);
									sails.config.log.addlog(1, req, "airportlist","Something Happens During Updating Or Inserting");
									return res.send({
										error: 'Something Happens During Updating Or Inserting'
									});
								} else {
									sails.log.info(req + ' - ' + new Date() + ' INFO -  (airportlist - post) Airport updated successfully');
									sails.config.log.addOUTlog(req, "airportlist");
									return res.send({
										value: updatedAirport[0]
									});
								}
							});
					}
				});
		}
	},
	// function used to get airportlist
	getairportlist: function (req, res) {
		sails.config.log.addINlog(req, "getairportlist");
		//find all airports
		Ports.find({
			where: {},
			sort: 'iata_code'
		}, function (err, ports) {
			if (err) {
				sails.log.error(req + ' - ' + new Date() + ' ERR -  (getairportlist - get) ' + err);
				sails.config.log.addlog(1, req, "getairportlist","Error in finding airport list");
				return res.view('pages/imlost', {
					error: 'Error in finding airport list'
				});
			} else {
				sails.log.info(req + ' - ' + new Date() + ' INFO -  (getairportlist - get) Airport found successfully');
				sails.config.log.addOUTlog(req, "getairportlist");
				return res.view('pages/airport-list', {
					airportlistdetails: ports
				});
			}
		});
	},
	//delete airport
	deleteairport: function (req, res) {
		sails.config.log.addINlog(req, "deleteairport");
		var deletePortId = req.body.inwardcargo_airport_list_delete_airport;
		Ports.destroy({
			'id': deletePortId
		}).exec(function (err, ports) {
			if (err) {
				sails.log.error(req + ' - ' + new Date() + ' ERR -  (deleteairport - post) ' + err);
				sails.config.log.addlog(1, req, "getairportlist","Error while finding the port while deleting");
				return res.view('pages/imlost', {
					error: 'Error while finding the port while deleting'
				});
			} else {
				sails.log.info(req + ' - ' + new Date() + ' INFO - (deleteairport - post) Airport deleted successfully');
				sails.config.log.addOUTlog(req, "deleteairport");
				return res.send({
					result: true
				});
			}
		});
	}	
};