/**
 * VendorController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	//create vendor record
	createsector: async function (req, res) {
		sails.config.log.addINlog(req, "createsector");
		var outwardcargo_sector_source = req.body.outwardcargo_sector_source;
		var outwardcargo_sector_destination = req.body.outwardcargo_sector_destination;
		var outwardcargo_sector_flight_no = req.body.outwardcargo_sector_flight_no;
		var outwardcargo_sector_local_departure_time = req.body.outwardcargo_sector_local_departure_time;
		var outwardcargo_sector_local_arrival_time = req.body.outwardcargo_sector_local_arrival_time;
		var outwardcargo_sector_operational_days = req.body.outwardcargo_sector_operational_days;
		console.log(" operational days :-"+req.body.outwardcargo_sector_operational_days)
		var outwardcargo_sector_id = req.body.outwardcargo_sector_id
		
		//console.log(1)
		//sails.config.globals.putinfolog(req, req.options.action, req.method, "Now check's for validation begins");
		//console.log(2);

		//console.log(outwardcargo_vendor_id + " " + outwardcargo_vendor_name + " " + outwardcargo_vendor_email + " " + outwardcargo_vendor_phone_no + " " + outwardcargo_vendor_address + " " + outwardcargo_vendor_contract_for + " " + outwardcargo_vendor_enrollment_date + " " + outwardcargo_vendor_contract_start_date + " " + outwardcargo_vendor_contract_end_date + " " + outwardcargo_vendor_budget_code + " " + outwardcargo_vendor_station + " " + outwardcargo_vendor_owner)
		//check for source 
		console.log(1);
		var isSource = !sails.config.globals.validator.isEmpty(outwardcargo_sector_source);
		console.log(1);
		var isDestination = !sails.config.globals.validator.isEmpty(outwardcargo_sector_destination) && !(outwardcargo_sector_source == outwardcargo_sector_destination);
		console.log(2);
		var isFlight_no = !sails.config.globals.validator.isEmpty(outwardcargo_sector_flight_no);
		console.log(3);
		var isDeparture_time = !sails.config.globals.validator.isEmpty(outwardcargo_sector_local_departure_time);
		console.log(outwardcargo_sector_local_arrival_time);
		var isArrival_time = !sails.config.globals.validator.isEmpty(outwardcargo_sector_local_arrival_time) && !(outwardcargo_sector_local_departure_time > outwardcargo_sector_local_arrival_time);
		console.log(5);
		//passing through each check if one of the check failed pass error in response otherwise control goes to next check
		async.waterfall([
				function (callback) {
					if (isSource) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Source  Is valid");
						console.log(6);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Source is invalid");
						console.log(7);
						sails.config.log.addlog(1, req, "createsector","SOURCE")
						callback({
							error: 'Source is invalid',
							error_code: 'SOURCE'
						}, null);
					}
				},
				function (callback) {
					if (isDestination) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Destination is valid");
						console.log(8);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Destination is invalid');
						console.log(9);
						sails.config.log.addlog(1, req, "createsector","DESTINATION")
						callback({
							error: 'Destination is invalid',
							error_code: 'DESTINATION'
						}, null);
					}
				},
				function (callback) {
					if (isFlight_no) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Flight Number validation successfully");
						console.log(10);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Flight number is invalid');
						console.log(11);
						sails.config.log.addlog(1, req, "createsector","FLIGHT_NO")
						callback({
							error: 'Flight number is invalid',
							error_code: 'FLIGHT_NO'
						}, null);
					}
				},
				function (callback) {
					if (isDeparture_time) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Departure time validation successfully');
						console.log(12);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Departure time  is invalid');
						console.log(13);
						sails.config.log.addlog(1, req, "createsector","DEPARTURE_TIME")
						callback({
							error: 'Departure time invalid',
							error_code: 'DEPARTURE_TIME'
						}, null);
					}
				},
				function (callback) {
					if (isArrival_time) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Arival Time validation successfully');
						console.log(14);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Arival Time is invalid');
						console.log(15);
						sails.config.log.addlog(1, req, "createsector","ARIVAL_TIME")
						callback({
							error: 'Arival Time is invalid',
							error_code: 'ARIVAL_TIME'
						}, null);
					}
				},
				function (callback) {
					sails.config.globals.putinfolog(req, req.options.action, req.method, 'All Validations successfull, now check if record is already exist if not then create the record for vendor');
					//check if record is already exist if not then create the record
					Sector.findOrCreate({
							_id: outwardcargo_sector_id
						}, {
							source: outwardcargo_sector_source,
							destination: outwardcargo_sector_destination,
							flight_no: outwardcargo_sector_flight_no,
							local_departure_time: outwardcargo_sector_local_departure_time,
							local_arival_time: outwardcargo_sector_local_arrival_time,
							operational_days: outwardcargo_sector_operational_days
						})
						.exec(async (err, sector, wasCreated) => {
							if (err) {
								//check for uniqueness error
								if (err.code == 'E_UNIQUE') {
									sails.config.globals.putinfolog(req, req.options.action, req.method, 'Sector record already exists there for uniqueness error ');
									console.log(20);
									sails.config.log.addlog(1, req, "createsector","SECTOR_E_UNIQUE")
									callback({
										error: sails.config.globals.uniqueError,
										error_code: 'SECTOR_E_UNIQUE'
									}, null);
								} else {
									sails.config.globals.putinfolog(req, req.options.action, req.method, err);
									console.log(err);
									console.log(21);
									sails.config.log.addlog(1, req, "createsector","SECTOR_DB_CREATE")
									callback({
										error: 'Something Happend During Creating Record',
										error_code: 'SECTOR_DB_CREATE'
									}, null);
								}
							} else {
								sails.config.globals.putinfolog(req, req.options.action, req.method, 'Updating intiated for sector');
								//update vendor record
								Sector.update({
										_id: sector.id
									}, {
										source: outwardcargo_sector_source,
										destination: outwardcargo_sector_destination,
										flight_no: outwardcargo_sector_flight_no,
										local_departure_time: outwardcargo_sector_local_departure_time,
										local_arival_time: outwardcargo_sector_local_arrival_time,
										operational_days: outwardcargo_sector_operational_days,
									}).fetch()
									.exec(function (err, updatedSector) {
										if (err) {
											console.log(22);
											sails.config.globals.putinfolog(req, req.options.action, req.method, err);
											sails.config.log.addlog(1, req, "createsector","SECTOR_DB_CREATE");
											callback({
												error: 'Something Happens During Updating Or Inserting',
												error_code: 'SECTOR_DB_UPDATE'
											}, null);
										} else {
											console.log(23);
											sails.config.globals.putinfolog(req, req.options.action, req.method, 'Sector updation successfull');
											callback(null, updatedSector[0]);
										}
									});
							}
						});
				}
			],
			function (err, updatedSector) {
				if (err) {
					sails.config.globals.putinfolog(req, req.options.action, req.method, err);
					sails.config.log.addlog(1, req, "createsector",err);
					return res.send(err);
				} else {
					sails.config.globals.putinfolog(req, req.options.action, req.method, 'updated sector details send successfully');
					return res.send({
						value: updatedSector
					});
				}
			});
			sails.config.log.addOUTlog(req, "createsector");
	},

	//function to show vendor list
	getsectorlist: async function (req, res) {
		sails.config.log.addINlog(req, "getsectorlist");
		let sectors = await Sector.find();
		let ports = await Ports.find();
		sails.config.log.addOUTlog(req, "getsectorlist");
		return res.view('pages/sector', {sectorlistdetails: sectors, portlist: ports});
	},

	deletesector: async function (req, res) {
		sails.config.log.addINlog(req, "deletesector");
		var deletesectorId = req.body.outwardcargo_sector_delete_sector;
		Sector.destroy({
			'_id': deletesectorId
		}).exec(function (err, updatedsector) {
			if (err) {
				sails.config.globals.putinfolog(req, req.options.action, req.method, err);
				return res.view('pages/imlost', {
					error: 'Error while finding the port while deleting'
				});
			} else {
				sails.config.globals.putinfolog(req, req.options.action, req.method, "sector detail found and delete successfully");
				sails.config.log.addOUTlog(req, "deletesector");
				return res.send({
					result: true
				});
			}
		});
	}
};