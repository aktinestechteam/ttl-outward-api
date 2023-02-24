/**
 * BooklistController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

let fs = require('fs');
let { promisify } = require('util');
let xlstojson = require("xls-to-json");
let _ = require('lodash');
let moment = require('moment-timezone');

module.exports = {

	getFlightDetails: async function(req, res) {
		sails.config.log.addINlog(req.user.username, "getFlightDetails");
		sails.config.log.addlog(4, req.user.username, req.options.action, JSON.stringify(req.query));
		
		let source = "";
		let destination = "";

		if (req.query) {
			source = req.query.source;
			destination = req.query.destination;
		} else {
			source = req.query.source;
			destination = req.query.destination;
		}
		
		if (!source || !destination) {
			sails.config.log.addlog(0, req.user.username, req.options.action, 'source and destination undefined');
			res.json(sails.config.custom.jsonResponse('source and destination undefined', null));
		} else {
			/*let srcDetails = await Station.findOne({ where: { iata: source }, select: ["tz"] }).catch(err => console.log(err.message));
			let destDetails = await Station.findOne({ where: { iata: destination }, select: ["tz"] }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));*/

			let flightDetails = await sails.helpers.selectedFlightDetail.with({ 
				//srcTz: srcDetails.tz,
				//destTz: destDetails.tz, 
				source: source, 
				destination: destination 
			});

			// console.log(JSON.stringify(flightDetails));
			res.json(sails.config.custom.jsonResponse(null, flightDetails));
		}

		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	uploadBooklistFile: async function(req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);

		sails.config.log.addlog(4, req.user.username, req.options.action, JSON.stringify(req.body));

		let notAvailableDestination = [];
		let notAvailableFlight = [];
		let notAddedAWB = [];
		let uploadedAWBCount = 0;

		if(req.body){
			if(!req.body.flightsSelector){
				sails.config.log.addlog(0, req.user.username, req.options.action, "flight is missing to perform uploadBooklistFile");
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				return res.json(sails.config.custom.jsonResponse('flight is missing to perform uploadBooklistFile', null));
			} else{
				sails.config.globals.getdumppath('booklist', async function(err, path) {
					req.file('booklistUpload').upload({
						dirname: ('.' + path),
						// You can apply a file upload limit (in bytes)
					}, async function whenDone(err, uploaded_files) {
						if (err) {
							sails.config.log.addlog(0, req.user.username, req.options.action, err);
							res.json(sails.config.custom.jsonResponse( err , null));
						}
		
						sails.config.globals.async.each(
							uploaded_files,
							function(uploaded_file, callback) {
								//console.log('start cb'+cb);
								//let json_file_name = uploaded_file.filename ;
								let moveFile = async() => {
									let mv = promisify(fs.rename);
									await mv(uploaded_file.fd, '.' + path + uploaded_file.filename);
									//creating db files
									let singleFile = await Files.create({ station: req.body.stationSourceInput, original_filename: uploaded_file.filename, new_filepath: path + uploaded_file.filename, received_from: req.user.username, type: 'booklist'}).fetch().catch(err => console.log(err.message));
									if(singleFile) {
										// console.log('Booklist data inserted successfuly in Files model');
										sails.config.log.addlog(4, req.user.username, req.options.action, `Booklist data inserted successfuly in Files model`);
									}
									//to convert csv file in json format
									let json_file_name = uploaded_file.filename.split('.')
									xlstojson({
										input: ('.' + path + uploaded_file.filename), // input csv 
										output: ('.' + path + json_file_name[0] + '.json'), // output json 
										lowerCaseHeaders: true
									}, async function(err, booklist_records) {
										if (err) {
											sails.config.log.addlog(0, req.user.username, req.options.action, err, "xlstojson");
											callback(err);
										} else {
											if(booklist_records.length === 0) {
												sails.config.log.addlog(0, req.user.username, req.options.action, "The uploaded file contains no Booklist records", "length is 0", "xlstojson");
												return;
											}

											sails.config.log.addlog(4, req.user.username, req.options.action, `flight details = > ${req.body.flightsSelector}`);
											let flyflightDetails = (req.body.flightsSelector).split(","); // get this from ui dependent on flightTime
											let flightNo = flyflightDetails[0];
											let flightTime = flyflightDetails[1]; // get this from ui and ask to add departure_time also
											let flightArrivalTime = flyflightDetails[2];
											let savedBy = req.user.username; //  get name of operating person  from ui
											let booklistStation = req.body.stationSourceInput;  //booklist_records[0].Uplift;
											let booklistId = String(flightTime + flightNo + booklistStation);
		
											//	Obtain a Booklist
											let booklist = await sails.helpers.planner.getBooklist.with({
												station: booklistStation,
												flight_no: flightNo,
												flight_time: flightTime
											});

											sails.config.log.addlog(4, req.user.username, req.options.action, `booklist************* = ${JSON.stringify(booklist)}`);
											
											//	Voiding all the exisitng legs
											let awbLegsTobeDiscarded = await AWBLeg.find({ where: { booklist: booklist.id, void_on:0 }, select: ["awb_no", "station"] }).catch(err => res.json({ errormsg: err.message }));
											// console.log('awbLegsTobeDiscarded************* = ' + JSON.stringify(awbLegsTobeDiscarded));
		
											if (awbLegsTobeDiscarded) {
												for (let i = 0; i < awbLegsTobeDiscarded.length; i++) {
													let discarded_leg = await AWBLeg.update({ id: awbLegsTobeDiscarded[i]['id'] }, {
														void_on: Date.now(), // current timestamp
														void_reason: sails.config.custom.void_reason.new_booklist,
														status: sails.config.custom.database_model_enums.awb_leg_status.discarded
													}).fetch().catch(err => {
														sails.config.log.addlog(0, req.user.username, req.options.action, err.message, awbLegsTobeDiscarded[i]['id'], "discarding AWB legs");
														res.json({errormsg: err.message})
													});
													
													discarded_leg = discarded_leg[0];

													let blank_awb_leg = await sails.helpers.awbSanitizer.with({
														station: awbLegsTobeDiscarded[i]['station'],
														awb_no: awbLegsTobeDiscarded[i]['awb_no'],
														savedBy: req.user.username,
													});
													
													if (blank_awb_leg) {
														//	Broadcasting the information that the AWB is added
														sails.sockets.broadcast(sails.config.custom.socket.room_name.planner, 'addAWBToBePlanned', { blankAwbLeg: blank_awb_leg });
													}

													if(discarded_leg){
														let legOps = await AWBLegOp.find({where: {awb_leg: discarded_leg.id, closing_status: ""}}).catch(err => console.log( err.message));

														if(legOps.length > 0){
															for(let i = 0; i < legOps.length; i++){
																let voidLegOp = await AWBLegOp.update({id: legOps[i].id}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();
															}
														}
													}
												}
		
											}
											await sails.config.globals.async.eachSeries(booklist_records, async function(booklist_record) {
												let awb_no = booklist_record['AWB Prefix'] + booklist_record['AWB No'];// + booklist_record['Suffix'];

												let destination = booklist_record['BKG Dst'];

												let cargo_uplift_location = booklistStation//booklist_record["Flight Uplift"];
												if(cargo_uplift_location !== booklistStation) {
													if(awb_no) {
														notAddedAWB.push(awb_no + "[uplift - " + cargo_uplift_location + "]");
													}
													return;
												}

												sails.config.log.addlog(4, req.user.username, req.options.action, `booklist record details is here -----> ${JSON.stringify(booklist_record)}`);
		
												let destinationcount = await Station.count({iata : destination})
												// if booklist file destination is not present in station iata code 
												if(destinationcount === 1){
													
													let priorityClass = 'M_CLASS';
													if(booklist_record['Product'] == 'F'){
														priorityClass = 'F_CLASS';
													}
													//	Update the AWB info received from booking list
													let awb_info = await sails.helpers.planner.updateAwb.with({
														awb_no: awb_no, //	Compulsory
														outward: true,
														station: booklistStation, //	Compulsory to create new AWB
														src: booklist_record['BKG Org'], //	Compulsory to create new AWB
														dest: destination,
														issuer_name: booklist_record['Issuer'],
														issuer_code: booklist_record['Customer'],
														unitized: (booklist_record['ULD'] ?? "").trim().length > 0,
														saved_by: savedBy, //	Compulsory to create new AWB
														shc: booklist_record['SHC'] ? booklist_record['SHC'].split('|') : [],
														priority_class: priorityClass,
														commodity: booklist_record['Commodity']
													});

													sails.config.log.addlog(4, req.user.username, req.options.action, `awb_info = ${JSON.stringify(awb_info)}`);
			
													//	Update the leg info received via booking list
													let awb_leg = await sails.helpers.planner.updateAwbLeg.with({
														awb_info: awb_info.id,
														booklist: booklist.id,
														station: booklistStation, //	COMPULSORY
														awb_no: awb_no, //	Compulsory to create
														from: booklistStation,//booklist_record['Flight Uplift'], //	COMPULSORY
														to: booklist_record['Flight Discharge'],
														pieces: booklist_record['Pcs'],
														weight: booklist_record['Wt'],
														//from_tz:					'Asia/',						//	Compulsory to create
														//to_tz:						'string',
														flight_no: flightNo,
														planned_departure: flightTime,
														planned_arrival: flightArrivalTime,
														//actual_departure:			'number',
														//actual_arrival:				'number',
														created_by: savedBy, //	Compulsory to create
														transhipment: false,
														status: sails.config.custom.database_model_enums.awb_leg_status.pending, // isIn: ['Pending', 'Completed', 'Discarded']},
														value_added_product: booklist_record['VAP'],
														volume: booklist_record['Vol'],
														dimensions: booklist_record['Dimensions'],
														//actual_pieces_flown:		'number',
														//actual_weight_flown:		'number',
														//void_on:					'number', defaultsTo: 0 },
														//void_reason:				'string'
													});
													
													sails.config.log.addlog(4, req.user.username, req.options.action, `awb_leg = ${JSON.stringify(awb_leg)}`);

													//this is to create legop when record is onhand and having active leg in booklist
													let check_active_legs = await AWBLeg.find({ where: { status: sails.config.custom.database_model_enums.awb_leg_status.pending, pieces: { '>': 0 }, from: /*booklist_record['Flight Uplift']*/booklistStation, awb_no: awb_no, void_on: 0, station: /*booklist_record['Flight Uplift']*/booklistStation} }).populate('awb_info').populate('awb_leg_ops').catch(err => console.log(err.message));
													
													if (check_active_legs && check_active_legs.length>0) {
														for(let i=0;i<check_active_legs.length;i++) {
															sails.config.log.addlog(4, req.user.username, req.options.action, `check_active_legs ${JSON.stringify(check_active_legs[i])}`);
															
															//check_active_legs = check_active_legs[0];
															if ((check_active_legs[i].awb_info.on_hand == true) && (check_active_legs[i].awb_info.pieces > 0) && (check_active_legs[i].awb_leg_ops.length == 0)) {
																let awbLegOpCutoff = await sails.helpers.getAwbLegOpCutoff.with({
																	opName: 'ready_to_rate_check',
																	planned_departure: check_active_legs[i].planned_departure
																});
																let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
																	station: check_active_legs[i].from,
																	awb_no: check_active_legs[i].awb_no,
																	awb_leg: check_active_legs[i].id,
																	op_name: sails.config.custom.op_name.rate_check,
																	department: sails.config.custom.department_name.planner_ops,
																	opening_status: sails.config.custom.awb_leg_ops_status.ready_to_rate_check,
																	trigger_time: Date.now(),
																	//duration:  sails.config.custom.cut_off_timer.ready_to_rate_check_duration
																	cut_off_time: awbLegOpCutoff.cut_off_time
																});
																sails.config.log.addlog(4, req.user.username, req.options.action, `created leg op details ${JSON.stringify(create_leg_op)}`);
																
																//need to apply dispacher function for here
																// if (create_leg_op) {
																// 	sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, 'addLegOps', { newLegOp: create_leg_op });
																// }
															}
														}
													}
													
													let flightcount = await Flight.count({flight_no : booklist_record['Next Flight'].replace(/ /g,'')});

													if(flightcount > 0){
														if(booklist_record['Next Flight'].replace(/ /g,'') && booklist_record['Next Flight Dept Date'] && booklist_record['Next Flight Discharge'] ){

															let subsequent_leg_flight_no = booklist_record['Next Flight'].replace(/ /g,'');
															let transhipment_status = subsequent_leg_flight_no.startsWith(!"BA")
															
															let subsequent_leg_flight_date_moment = moment.tz(booklist_record['Next Flight Dept Date'], 'ddd MMM DD HH:mm:ss YYYY', 'Europe/London');

															sails.config.log.addlog(4, req.user.username, req.options.action, `subsequent_leg_flight_date_moment for ${subsequent_leg_flight_no} of ${awb_no} = ${subsequent_leg_flight_date_moment}`);
															
															/*let subsequent_leg_flight_date = subsequent_leg_flight_date_moment.valueOf();
															
															let splits = subsequent_leg_flight_date.split("-");
															if(splits.length !== 3) {
																splits = subsequent_leg_flight_date.split('/');
															}

															subsequent_leg_flight_date = splits[1] + "/" + splits[0] + "/" + splits[2];*/

															let subsequentFlightDetails = await sails.helpers.getArrivalDepartureTime.with({from: 'LHR', flight_no: subsequent_leg_flight_no, flight_date: subsequent_leg_flight_date_moment.valueOf()});

															if(subsequentFlightDetails.errormsg) {
																sails.config.log.addlog(1, "req.user.email", req.options.action, subsequentFlightDetails.errormsg);
																notAvailableFlight.push(awb_no + "[Flight - " + booklist_record['Next Flight'].replace(/ /g,'') + "]");
																//	Even if subsequent flight is not avalable, 
																//sanitize it since diagram is not being shown properly
																await sails.helpers.awbSanitizer.with({
																	station: sails.config.constants.LHR,
																	awb_no: awb_no,
																	savedBy: req.user.username
																});
															} else {
																let subsequent_leg_flight_departure_time = subsequentFlightDetails.data.departure;
																let subsequent_leg_flight_arrival_time = subsequentFlightDetails.data.arrival;

																let create_subsequent_leg = await sails.helpers.planner.updateAwbLeg.with({awb_info: awb_info.id,
																	// booklist: booklist.id,
																	station: booklistStation, //	COMPULSORY
																	awb_no: awb_no, //	Compulsory to create
																	from: booklist_record['Flight Discharge'], //	COMPULSORY
																	to: booklist_record['Next Flight Discharge'],
																	pieces: booklist_record['Pcs'],
																	weight: booklist_record['Wt'],
																	//from_tz:					'Asia/',						//	Compulsory to create
																	//to_tz:						'string',
																	flight_no: subsequent_leg_flight_no,
																	planned_departure: subsequent_leg_flight_departure_time,
																	planned_arrival: subsequent_leg_flight_arrival_time,
																	//actual_departure:			'number',
																	//actual_arrival:				'number',
																	created_by: savedBy, 
																	transhipment: transhipment_status,
																	status: sails.config.custom.database_model_enums.awb_leg_status.pending,
																});

																if (create_subsequent_leg){
																	console.log('subsequent leg is created');
																	//creating recovery legop for subsequent leg
																	//caculating trigger time
																	let ready_to_recovery_starts=await OpsDuration.findOne({key: "ready_to_recovery_trigger_trigger"});
																	
																	let trigger_time = create_subsequent_leg.planned_departure + (60000*Number(ready_to_recovery_starts.duration));
																	
																	if(ready_to_recovery_starts.duration==0 || trigger_time<Date.now()){
																		trigger_time= Date.now();
																	}
																	
																	// getting ready to recovery q time
																	let ready_to_recovery_q_time=await OpsDuration.findOne({key: "ready_to_recovery_q_time"});
																	
																	let create_recovery_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
																		station: create_subsequent_leg.from,
																		awb_no: create_subsequent_leg.awb_no,
																		awb_leg: create_subsequent_leg.id,
																		op_name: sails.config.custom.op_name.recovery,
																		department: sails.config.custom.department_name.central_rec,
																		opening_status: sails.config.custom.awb_leg_ops_status.ready_to_recovery,
																		trigger_time: trigger_time,
																		cut_off_time: trigger_time + (60000*Number(ready_to_recovery_q_time.duration))
																		// duration:  sails.config.custom.cut_off_timer.ready_to_recovery_duration
																	});
																	
																	sails.config.log.addlog(4, req.user.username, req.options.action, `created recovery leg op details = ${JSON.stringify(create_recovery_leg_op)}`);
																	
																	//	Sanitize at the end of leg
																	await sails.helpers.awbSanitizer.with({
																		station: booklist_record['Next Flight Discharge'],
																		awb_no: awb_no,
																		savedBy: req.user.username
																	});
																}
															}
														}
													}
													else 
													{
														if (booklist_record['Next Flight'].replace(/ /g,'')) {
															
															notAvailableFlight.push(awb_no + "[Flight - " + booklist_record['Next Flight'].replace(/ /g,'') + "]");
														}
														//	Even if subsequent flight is not avalable, 
														//sanitize it since diagram is not being shown properly
														await sails.helpers.awbSanitizer.with({
															station: sails.config.constants.LHR,
															awb_no: awb_no,
															savedBy: req.user.username
														});
													}
			
													//each_cb();
													let blank_awb_leg = await sails.helpers.awbSanitizer.with({
														station: booklistStation/*booklist_record['Flight Uplift']*/,
														awb_no: awb_no,
														savedBy: req.user.username
													});

													//planning of subsequent leg for next phase
			
			
													if (blank_awb_leg) {
														//	Broadcasting the information that the AWB is added
														sails.sockets.broadcast(sails.config.custom.socket.room_name.planner, 'addAWBToBePlanned', { blankAwbLeg: blank_awb_leg });
													} else {
														sails.sockets.broadcast(sails.config.custom.socket.room_name.planner, 'removeAWBToBePlanned', { awb_no: awb_no });
													}

													uploadedAWBCount++;
												}
												else
												{
													if(destination) {
														notAvailableDestination.push(awb_no + "[destination - " + destination + "]");
													}
												}	
											}, function(error) {
												sails.config.log.addlog(0, req.user.username, req.options.action, error, "1");
												callback();
											});
										}
									});
								}
								moveFile();
							}, async function(err) {
								if (err) {
									sails.config.log.addlog(0, req.user.username, req.options.action, error);
								} else {
									//res.redirect('/demo')
									let result = {notAvailableDestination, notAvailableFlight, notAddedAWB, uploadedAWBCount};
									sails.config.log.addlog(4, req.user.username, req.options.action, `result = ${JSON.stringify(result)}`);
									res.json(sails.config.custom.jsonResponse(null, result));

									sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, 'changeInBooklist', { msg: 'change in booklist need to refresh operations' });
									sails.sockets.broadcast(sails.config.custom.socket.room_name.planner, 'changeInBooklist', { msg: 'change in booklist need to refresh planner' });
								}
							}
						);
					});
				});
			}
		} else {
				res.json(sails.config.custom.jsonResponse('inputs are invalid to perform uploadBooklistFile', null));
		}
		sails.config.log.addOUTlog(req.user.username, "uploadBooklistFile");
	},
};
