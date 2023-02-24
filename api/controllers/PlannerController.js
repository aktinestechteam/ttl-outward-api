/**
 * PlannerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Settings = require('../models/Settings');

module.exports = {

	getAWBToBeActioned: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);

		let toBeActionedAWB = await AWBInfo.find().where({ 'pieces' : 0, 'on_hand': true}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		res.json(toBeActionedAWB);
		
	//	sails.sockets.broadcast('planner','addAWBToBeActioned', {greeting: toBeActionedAWB});
		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	getAWBToBePlanned: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(4, req.user.username, req.options.action, `query = ${JSON.stringify(req.query)}`);

		if(req.query.station) {
			let toBePlannedAWB = await AWBLeg.find().where({
				from: req.query.station,
				pieces: {'<': 0}, 
				status: sails.config.custom.database_model_enums.awb_leg_status.pending
			}).populate('awb_info').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
			
			res.json(sails.config.custom.jsonResponse(null, toBePlannedAWB));
			sails.config.log.addOUTlog(req.user.username, req.options.action);
		} else {
			sails.config.log.addlog(0, req.user.username, req.options.action, `Kindly select a station before querying`);
			res.json(sails.config.custom.jsonResponse('Kindly select a station before querying', null));
		}
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		// sails.sockets.broadcast('planner','addAWBToBePlanned', {greeting: toBePlannedAWB});
	},

	getPlannerRecords: async function(req, res){
		sails.config.log.addINlog(req.user.username, req.options.action);

		let plannerRecords = {};
		
		if(req.query.station) {
			let toBePlannedAWB = await AWBLeg.find().where({
				from: req.query.station,
				pieces: {'<': 0}, 
				status: sails.config.custom.database_model_enums.awb_leg_status.pending
			}).populate('awb_info').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
			
			//console.log('called from planner for leg');
			plannerRecords.awbLegRecords = toBePlannedAWB;

			let toBeActionedAWB = await AWBInfo.find().where({station: req.query.station, 'pieces' : 0, 'on_hand': true}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

			plannerRecords.awbInfoRecords = toBeActionedAWB;
			// sails.config.log.addOUTlog(req, "getPlannerRecords");
			res.json(sails.config.custom.jsonResponse(null, plannerRecords));
			sails.config.log.addOUTlog(req.user.username, req.options.action);
		} else {
			// sails.config.log.addOUTlog(req, "getPlannerRecords");
			sails.config.log.addlog(0, req.user.username, req.options.action, `Kindly select a station before querying`);
			res.json(sails.config.custom.jsonResponse('Kindly select a station before querying', null));
		}

		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	getPlanner: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);

		sails.config.globals.async.series({
			stations: function(callback) {
				Station.find({select: ['iata', 'name', 'country']}).sort('iata ASC').exec(function(err, stations) {
					callback(null, stations);
				});
			},
			shc_codes: function(callback) {
				SHC.find({make_it_visible: true}).sort('code ASC').exec(function(err, shc_codes){
					callback(null, shc_codes);
				});
			},
			offload_codes: function(callback){
				Reason.find({make_it_visible: true, category: sails.config.custom.reason_category.offload}).sort('code ASC').exec(function(err, offload_codes){
					callback(null, offload_codes);
				});
			}
		}, function(err, results) {
			if(err) {
				sails.config.log.addlog(0, req.user.username, req.options.action, err);
			}
			sails.config.log.addOUTlog(req.user.username, req.options.action);

			return res.view('pages/planner', results);
		});
	},
	
	getBooklistRecords: async function(req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(4, req.user.username, req.options.action, `getBooklistRecords details ===> ${JSON.stringify(req.body)}`);
		
		let user = req.user;
		let flightNo = req.query.flightNo;
		let flightTime = req.query.flightTime;
		let station = req.query.station;
		//console.log('FLIGHT DETAILS: ----   ='+flightNo+'  '+flightTime);

		let booklistRecords = await AWBLeg.find().where({ 'void_on':0, 'flight_no': flightNo, 'planned_departure': flightTime, 'station' : station }).populate('awb_info').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));;
		
		//sails.config.log.addlog(4, req.user.username, req.options.action, 'booklistRecords  ===> '+ JSON.stringify(booklistRecords));

		sails.config.log.addOUTlog(req.user.username, req.options.action);
		res.json(booklistRecords);
	},

	updateAwbinfo: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(4, req.user.username, req.options.action, `awb info body = ${JSON.stringify(req.body)}`);

		let minimum_pieces_to_check = 0 ;
		if(req.body){
			if(!req.body.awb_no/* || req.body.awb_no.length != 11*/ ) {
				sails.config.log.addlog(0, req.user.username, req.options.action, `Awb_No is invalid to perform updateAwbinfo`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				
				return res.send({
					error: 'Awb_No is invalid to perform updateAwbinfo',
					error_code: 'ERR_updateAwbinfo_AWB_No_INVALID'
				});
			} 
			else{
				let	existing_records = await AWBLeg.find({where: {
					from: req.body.station,
					awb_no: req.body.awb_no, status:{'!=' : sails.config.custom.database_model_enums.awb_leg_status.discarded}, pieces: {'>': 0}}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
				if(existing_records.length > 0) {
					for (let i = 0; i< existing_records.length; i++){
						minimum_pieces_to_check += existing_records[i].pieces;
					}
				}
			}
		
			let  savedBy = req.user.username;
			if(!req.body.station ) {
				sails.config.log.addlog(0, req.user.username, req.options.action, `Station is missing to perform updateAwbinfo`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);

				return res.send({
					error: 'Station is missing to perform updateAwbinfo',
					error_code: 'ERR_updateAwbinfo_STATION_MISSING'
				});
			} else if(!req.body.dest) {
				sails.config.log.addlog(0, req.user.username, req.options.action, `Destination is missing to perform updateAwbinfo`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);

				return res.send({
					error: 'Destination is missing to perform updateAwbinfo',
					error_code: 'ERR_updateAwbinfo_Destination_MISSING'
				});
			} else if(!savedBy ){	//get user name from ui login
				sails.config.log.addlog(0, req.user.username, req.options.action, `user is missing to perform updateAwbinfo`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);

				return res.send({
					error: 'user is missing to perform updateAwbinfo',
					error_code: 'ERR_updateAwbinfo_user_MISSING'
				});
			} else if(!req.body.issuer_name ){
				sails.config.log.addlog(0, req.user.username, req.options.action, `issuer_name is missing to perform updateAwbinfo`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				
				return res.send({
					error: 'issuer_name is missing to perform updateAwbinfo',
					error_code: 'ERR_updateAwbinfo_issuer_name_MISSING'
				});
			} else if(!req.body.pieces || req.body.pieces < minimum_pieces_to_check){
				sails.config.log.addlog(0, req.user.username, req.options.action, `pieces are invalid to perform updateAwbinfo`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);

				return res.send({
					error: 'pieces are invalid to perform updateAwbinfo',
					error_code: 'ERR_updateAwbinfo_PIECES_INVALID'
				});
			} else if(!req.body.weight || req.body.weight < 0.001){
				sails.config.log.addlog(0, req.user.username, req.options.action, `weight is invalid to perform updateAwbinfo`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				return res.send({
					error: 'weight is invalid to perform updateAwbinfo',
					error_code: 'ERR_updateAwbinfo_WEIGHT_INVALID'
				});
			} else{
				let updatedAwbinfo = await sails.helpers.planner.updateAwb.with({
					awb_no: req.body.awb_no, 
					station: req.body.station,
					dest: req.body.dest, 
					saved_by: savedBy, 
					issuer_name: req.body.issuer_name, 
					issuer_code: req.body.issuer_code,
					shc: req.body.shc, 
					pieces: req.body.pieces, 
					weight: req.body.weight
					});
				//console.log('awb info body is updated for the id '+ JSON.stringify(updatedAwbinfo));
		
				let blank_awb_leg = await sails.helpers.awbSanitizer.with({
					station: req.body.station,
					awb_no: req.body.awb_no,
					savedBy: savedBy,
					//pieces: remaining_pieces 
				});

				//console.log('from to be actioned  ==== '+JSON.stringify(blank_awb_leg));
				if(blank_awb_leg) {
					//	Broadcasting the information that the AWB is added
					sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
				}
				
				//	remove the AWB fom RCS since its value is captured now.
				sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'removeAWBToBeActioned', {awb_info: updatedAwbinfo});

				//this is to create legop when record is onhand and having active leg in booklist
				let check_active_legs = await AWBLeg.find({where: {status: {'!=' : sails.config.custom.database_model_enums.awb_leg_status.discarded}, pieces: {'>': 0}, awb_no: req.body.awb_no, booklist: { '!=' : null}, void_on: 0}}).populate('awb_info').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
				
				let pre_flight_checks_start=await OpsDuration.findOne({key: "ready_to_rate_check_trigger_trigger"});
				let ready_to_rate_check_cutoff_time=await OpsDuration.findOne({key: "ready_to_rate_check_cutoff_time"});
				
				sails.config.log.addlog(4, req.user.username, req.options.action, `check_active_legs ${JSON.stringify(check_active_legs)}`);

				if (check_active_legs){
					for(let i = 0; i < check_active_legs.length; i++){
						if ((check_active_legs[i].awb_info.on_hand == true) && (check_active_legs[i].awb_info.pieces > 0)){
							//console.log('check_active_legc-c-c-c-c-c'+JSON.stringify(check_active_legs));
							sails.config.log.addlog(4, req.user.username, req.options.action, 'from planner controller update awb info ');
							
							try{
								
								/*let trigger_time = check_active_legs[i].planned_departure - (60000*Number(pre_flight_checks_start.duration));
								
								if(pre_flight_checks_start.duration==0 || trigger_time<Date.now()){
									trigger_time= Date.now();
								}
								
								let cut_off_time = check_active_legs[i].planned_departure - (60000*Number(ready_to_rate_check_cutoff_time.duration));
								
								if(ready_to_rate_check_cutoff_time.duration==0 || cut_off_time<Date.now()){
									cut_off_time=Date.now()
								}*/

								let awbLegOpCutoff = await sails.helpers.getAwbLegOpCutoff.with({
									opName: 'ready_to_rate_check',
									planned_departure: check_active_legs[i].planned_departure
								})
								
								let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
									station: check_active_legs[i].from,
									awb_no: check_active_legs[i].awb_no,
									awb_leg: check_active_legs[i].id,
									op_name: sails.config.custom.op_name.rate_check,
									department: sails.config.custom.department_name.planner_ops,
									opening_status: sails.config.custom.awb_leg_ops_status.ready_to_rate_check,
									//TODO: change this to settings value in db to D-180
									// 180(will be the value that is set for trigger time in the db)
									trigger_time: awbLegOpCutoff.trigger_time,
									// trigger_time: Date.now()-awb_info,
									// duration: sails.config.custom.cut_off_timer.ready_to_rate_check_duration
									cut_off_time: awbLegOpCutoff.cut_off_time
								});
								
								sails.config.log.addlog(3, req.user.username, req.options.action, `created leg op details = ${JSON.stringify(create_leg_op)}`);
							}
							catch(e){
								sails.config.log.addlog(0, req.user.username, req.options.action, `${JSON.stringify(e)}`);
							}
							
							//need to apply dispacher function for here
							// if(create_leg_op){
							// 	sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'addLegOps', {newLegOp: create_leg_op});
							// }
							sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'onHandforToBePlanned', {awb_info: check_active_legs[i].awb_info});
							sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'onHandforBooklistRecord', {awb_info_id: check_active_legs[i].id});
						}
					}
				}
				
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				res.json({});
			}
		} else{
			sails.config.log.addlog(0, req.user.username, req.options.action, `inputs are invalid to perform updateAwbinfo`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			
			return res.send({
				error: 'inputs are invalid to perform updateAwbinfo',
				error_code: 'ERR_updateAwbinfo_inputs_INVALID'
			});
		}
		
	},
	
	addAwbLeg: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(4, req.user.username, req.options.action, `body = ${JSON.stringify(req.body)}`);

		let maximum_pieces_to_check = 0 ;
		if(req.body){
			if(!req.body.awb_leg_id ){
				sails.config.log.addlog(0, req.user.username, req.options.action, `Awb_No is invalid to perform addAwbLeg`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);

				return res.send({
					error: 'Awb_No is invalid to perform addAwbLeg',
					error_code: 'ERR_addAwbLeg_AWB_No_INVALID'
				});
			} 
			else{
				let	awbLegDetails = await AWBLeg.findOne({where: {
					id: req.body.awb_leg_id}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
				maximum_pieces_to_check = (-awbLegDetails.pieces);
			}
		}

		if(!req.body.awb_no /*|| req.body.awb_no.length != 11*/ ) {
			sails.config.log.addlog(0, req.user.username, req.options.action, `awb_leg_id is missing to perform addAwbLeg`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);

			return res.send({
				error: 'awb_leg_id is missing to perform addAwbLeg',
				error_code: 'ERR_addAwbLeg_awb_leg_id_MISSING'
			});
		} else if(!req.body.from) {
			sails.config.log.addlog(0, req.user.username, req.options.action, `from is missing to perform addAwbLeg`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			
			return res.send({
				error: 'from is missing to perform addAwbLeg',
				error_code: 'ERR_addAwbLeg_from_MISSING'
			});
		} else if(!req.body.to) {
			sails.config.log.addlog(0, req.user.username, req.options.action, `to is missing to perform addAwbLeg`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			
			return res.send({
				error: 'to is missing to perform addAwbLeg',
				error_code: 'ERR_addAwbLeg_to_MISSING'
			});
		} else if(!req.body.station) {
			sails.config.log.addlog(0, req.user.username, req.options.action, `station is missing to perform addAwbLeg`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			
			return res.send({
				error: 'station is missing to perform addAwbLeg',
				error_code: 'ERR_addAwbLeg_station_MISSING'
			});
		}  else if(!req.body.created_by) {
			sails.config.log.addlog(0, req.user.username, req.options.action, `created_by is missing to perform addAwbLeg`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			
			return res.send({
				error: 'created_by is missing to perform addAwbLeg',
				error_code: 'ERR_addAwbLeg_created_by_MISSING'
			});
		} else if(!req.body.flightsSelectorModal) {
			sails.config.log.addlog(0, req.user.username, req.options.action, `flight is missing to perform addAwbLeg`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			
			return res.send({
				error: 'flight is missing to perform addAwbLeg',
				error_code: 'ERR_addAwbLeg_flight_MISSING'
			});
		} else if(!req.body.pieces || req.body.pieces < 1 || req.body.pieces > maximum_pieces_to_check) {
			sails.config.log.addlog(0, req.user.username, req.options.action, `pieces are invalid to perform updateAwbinfo`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			
			return res.send({
				error: 'pieces are invalid to perform updateAwbinfo',
				error_code: 'ERR_updateAwbinfo_PIECES_INVALID'
			});
		} else if(!req.body.weight || req.body.weight < 0.001) {
			sails.config.log.addlog(0, req.user.username, req.options.action, `weight is invalid to perform updateAwbinfo`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			
			return res.send({
				error: 'weight is invalid to perform updateAwbinfo',
				error_code: 'ERR_updateAwbinfo_WEIGHT_INVALID'
			});
		} else {
			let flyflightDetails = (req.body.flightsSelectorModal).split(",");
			//find if the entry for the same awb leg is exists in operating awb
			//console.log('---'+req.body.awb_no+'---'+flyflightDetails[0]+'---'+Number(flyflightDetails[1]));
			let existing_leg_in_same_flight = await AWBLeg.findOne({
				awb_no: req.body.awb_no,flight_no: flyflightDetails[0], planned_departure: Number(flyflightDetails[1]), status:sails.config.custom.database_model_enums.awb_leg_status.pending});
			let updatedAwbLeg;

			if(!existing_leg_in_same_flight){
				sails.config.log.addlog(3, req.user.username, req.options.action, `existing leg not in same flight`);
				updatedAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
					id: req.body.awb_leg_id,
					station: req.body.station,
					from: req.body.from,
					to: req.body.to,
					pieces: Number(req.body.pieces),
					weight: Number(req.body.weight),
					flight_no: flyflightDetails[0],
					planned_departure: Number(flyflightDetails[1]),
					planned_arrival: Number(flyflightDetails[2]),
					created_by: req.user.username,
					awb_no: req.body.awb_no,
					status:	sails.config.custom.database_model_enums.awb_leg_status.pending
				});

				//this is to create legop when record is onhand and having active leg in booklist
				let check_active_leg = await AWBLeg.findOne({where: {status: sails.config.custom.database_model_enums.awb_leg_status.pending, pieces: {'>': 0}, id: updatedAwbLeg.id, void_on: 0}}).populate('awb_info').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
				//console.log('check_active_leg'+JSON.stringify(check_active_leg));

				if (check_active_leg) {
					//check_active_leg = check_active_leg[0];
					if ((check_active_leg.awb_info.on_hand == true) && (check_active_leg.awb_info.pieces > 0)) {
						//console.log('check_active_legc-c-c-c-c-c'+JSON.stringify(check_active_leg));
						if(check_active_leg.awb_info.station == check_active_leg.from) {
							let awbLegOpCutoff = await sails.helpers.getAwbLegOpCutoff.with({
								opName: 'ready_to_rate_check',
								planned_departure: check_active_leg.planned_departure
							});

							let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
								station: check_active_leg.from,
								awb_no: check_active_leg.awb_no,
								awb_leg: check_active_leg.id,
								op_name: sails.config.custom.op_name.rate_check,
								department: sails.config.custom.department_name.planner_ops,
								opening_status: sails.config.custom.awb_leg_ops_status.ready_to_rate_check,
								trigger_time: Date.now(),
								//duration: sails.config.custom.cut_off_timer.ready_to_rate_check_duration
								cut_off_time: awbLegOpCutoff.cut_off_time
							});

							if(create_leg_op){
								sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_planner_operation, {newLegOp: 	create_leg_op});
							}
						}
						// else if(check_active_leg.awb_info.dest != check_active_leg.from){// this is condition to check the final destination to create recovery legop
						else{

							let ready_to_recovery_starts=await OpsDuration.findOne({key: "ready_to_recovery_trigger_trigger"});
							let trigger_time = check_active_leg.planned_departure + (60000*Number(ready_to_recovery_starts.duration));
							
							if(ready_to_recovery_starts.duration==0 || trigger_time<Date.now()) {
								trigger_time= Date.now();
							}
							// getting ready to recovery q time
							let ready_to_recovery_q_time=await OpsDuration.findOne({key: "ready_to_recovery_q_time"});
																	
							let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
								station: check_active_leg.station,
								awb_no: check_active_leg.awb_no,
								awb_leg: check_active_leg.id,
								op_name: sails.config.custom.op_name.recovery,
								department: sails.config.custom.department_name.central_rec,
								opening_status: sails.config.custom.awb_leg_ops_status.ready_to_recovery,
								trigger_time: trigger_time,
								cut_off_time: trigger_time + (60000*Number(ready_to_recovery_q_time.duration))
								// duration: sails.config.custom.cut_off_timer.ready_to_recovery_duration
							});
						}
						//console.log('created leg op details'+JSON.stringify(create_leg_op));
						//need to apply dispacher function for here
						// if(create_leg_op){
						// 	sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'addLegOps', {newLegOp: create_leg_op});
						// }
					}
				}
			}
			else{
				sails.config.log.addlog(3, req.user.username, req.options.action, `existing leg found in same flight`);
				//+JSON.stringify(existing_leg_in_same_flight));

				let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
					id: existing_leg_in_same_flight.id,
					station: existing_leg_in_same_flight.station,
					awb_no: existing_leg_in_same_flight.awb_no,
					from: existing_leg_in_same_flight.from,
					created_by: existing_leg_in_same_flight.created_by,
					void_on: Date.now(),// current timestamp
					void_reason: sails.config.custom.void_reason.merged,
				});

				if(voidAwbLeg) {
					await AWBLegOp.update({where: {awb_leg: voidAwbLeg.id, closing_status: ""}}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();

					/*let legOps = await AWBLegOp.find({where: {awb_leg: voidAwbLeg.id, closing_status: ""}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
					if(legOps.length > 0) {
						for(let i = 0; i < legOps.length; i++){
							let voidLegOp = await AWBLegOp.update({id: legOps[i].id}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();
						}
					}*/
				}

				sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'discardBooklistAwbLeg', {awbleg: voidAwbLeg});
				updatedAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
					id: req.body.awb_leg_id,
					station: req.body.station,
					from: req.body.from,
					to: req.body.to,
					pieces: Number(req.body.pieces) + existing_leg_in_same_flight.pieces,
					weight: Number(req.body.weight)+ existing_leg_in_same_flight.weight,
					flight_no: flyflightDetails[0],
					planned_departure: Number(flyflightDetails[1]),
					planned_arrival: Number(flyflightDetails[2]),
					created_by: req.body.created_by,
					awb_no: req.body.awb_no,
					status:	sails.config.custom.database_model_enums.awb_leg_status.pending
				});

				//this is to create legop when record is onhand and having active leg in booklist
				let check_active_leg = await AWBLeg.findOne({where: {status: sails.config.custom.database_model_enums.awb_leg_status.pending, pieces: {'>': 0}, id: updatedAwbLeg.id, void_on: 0}}).populate('awb_info').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

				//console.log('check_active_leg'+JSON.stringify(check_active_leg));
				if (check_active_leg){
					//check_active_leg = check_active_leg[0];
					if ((check_active_leg.awb_info.on_hand == true) && (check_active_leg.awb_info.pieces > 0)){
						//console.log('check_active_legc-c-c-c-c-c'+JSON.stringify(check_active_leg));
						sails.config.log.addlog(3, req.user.username, req.options.action,'from planner controller add awb 2');

						if(check_active_leg.awb_info.station == check_active_leg.from){
							let awbLegOpCutoff = await sails.helpers.getAwbLegOpCutoff.with({
								opName: 'ready_to_rate_check',
								planned_departure: check_active_leg.planned_departure
							});

							let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
								station: check_active_leg.from,
								awb_no: check_active_leg.awb_no,
								awb_leg: check_active_leg.id,
								op_name: sails.config.custom.op_name.rate_check,
								department: sails.config.custom.department_name.planner_ops,
								opening_status: sails.config.custom.awb_leg_ops_status.ready_to_rate_check,
								trigger_time: Date.now(),
								//duration: sails.config.custom.cut_off_timer.ready_to_rate_check_duration
								cut_off_time: awbLegOpCutoff.cut_off_time
							});

							if(create_leg_op){
								sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_planner_operation, {newLegOp: 	create_leg_op});
							}
						}
						// else if(check_active_leg.awb_info.dest != check_active_leg.from){// this is condition to check the final destination to create recovery legop
						else{
							let ready_to_recovery_starts = await OpsDuration.findOne({key: "ready_to_recovery_trigger_trigger"});
							let trigger_time = check_active_leg.planned_departure + (60000*Number(ready_to_recovery_starts.duration));
							if(ready_to_recovery_starts.duration==0 || trigger_time<Date.now()){
								trigger_time= Date.now();
							}
							// getting ready to recovery q time
							let ready_to_recovery_q_time=await OpsDuration.findOne({key: "ready_to_recovery_q_time"});
										
							let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
								station: check_active_leg.from,
								awb_no: check_active_leg.awb_no,
								awb_leg: check_active_leg.id,
								op_name: sails.config.custom.op_name.recovery,
								department: sails.config.custom.department_name.central_rec,
								opening_status: sails.config.custom.awb_leg_ops_status.ready_to_recovery,
								trigger_time: trigger_time,
								cut_off_time: trigger_time + (60000*Number(ready_to_recovery_q_time.duration))
								// duration: sails.config.custom.cut_off_timer.ready_to_recovery_duration
							});
						}
						//console.log('created leg op details'+JSON.stringify(create_leg_op));
						//need to apply dispacher function for here
						// if(create_leg_op){
						// 	sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'addLegOps', {newLegOp: create_leg_op});
						// }
						sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'onHandforToBePlanned', {awb_info: check_active_leg.awb_info});
						sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'onHandforBooklistRecord', {awb_info_id: check_active_leg.id});
					}
				}
			}

			//let remaining_pieces = (pieces_to_be_planned + Number(req.body.pieces));
			//console.log('remaining_pieces    = '+remaining_pieces);
			let blank_awb_leg = await sails.helpers.awbSanitizer.with({
				station: req.body.from,
				awb_no: req.body.awb_no,
				savedBy: sails.config.custom.hardcoded_values.savedBy,
			//	pieces: remaining_pieces
			});

			let destination_blank_awb_leg = await sails.helpers.awbSanitizer.with({
				station: req.body.to,
				awb_no: req.body.awb_no,
				savedBy: sails.config.custom.hardcoded_values.savedBy,
			//	pieces: remaining_pieces
			});

			sails.config.log.addlog(3, req.user.username, req.options.action, `destination_blank_awb_leg = ${JSON.stringify(destination_blank_awb_leg)}`);

			//console.log('++++$$$$+++++ '+JSON.stringify(blank_awb_leg));
			if(blank_awb_leg) {
				//	Broadcasting the information that the AWB is added
				sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
			} else {
				sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'removeAWBToBePlanned', {awb_no: req.body.awb_no,});
			}

			//console.log('addAwbToBooklistRecord4444@@@@@@@@@'+ JSON.stringify(updatedAwbLeg));
			// if(req.body.from == sails.config.custom.base_station_name.mumbai){
				sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAwbToBooklistRecord', {awbleg: updatedAwbLeg});
			// }

			let booklist = await sails.helpers.planner.getBooklist.with({
				station: req.body.from,
				flight_no: flyflightDetails[0],
				flight_time: flyflightDetails[1]
			});
			//console.log('booklist received = ' + JSON.stringify(booklist.id));
			//console.log('++++++++++updatedAwbLeg details'+JSON.stringify(updatedAwbLeg));
			//console.log('++++++++++booklist details'+JSON.stringify(booklistDetails));
			// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'changeInBooklist', {msg: 'change in booklist need to refresh operations'});
			let refToBooklist = await BookList.addToCollection(booklist.id, 'awb_legs').members(updatedAwbLeg.id);

			//console.log('awb Leg is updated for the id '+ JSON.stringify(updatedAwbLeg));
			// sails.config.log.addINlog(req.user.username, "addAwbLeg");
			res.json({});
		}
		
		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	discardBooklistRecord: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);

	//	Voiding the exisitng leg
		sails.config.log.addlog(4, req.user.username, req.options.action, JSON.stringify(req.body));

		if(req.body){
			if(!req.body.awb_no /*|| req.body.awb_no.length != 11*/ ){
				sails.config.log.addlog(0, req.user.username, req.options.action, `awb_leg_id is missing to perform discardBooklistRecord`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);

				return res.send({
					error: 'awb_leg_id is missing to perform discardBooklistRecord',
					error_code: 'ERR_discardBooklistRecord_awb_leg_id_MISSING'
				});
			} else if(!req.body.from){
				sails.config.log.addlog(0, req.user.username, req.options.action, `from is missing to perform discardBooklistRecord`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				
				return res.send({
					error: 'from is missing to perform discardBooklistRecord',
					error_code: 'ERR_discardBooklistRecord_from_MISSING'
				});
			} else if(!req.body.created_by){
				sails.config.log.addlog(0, req.user.username, req.options.action, `to is missing to perform discardBooklistRecord`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				
				return res.send({
					error: 'to is missing to perform discardBooklistRecord',
					error_code: 'ERR_discardBooklistRecord_to_MISSING'
				});
			} else if(!req.body.station){
				sails.config.log.addlog(0, req.user.username, req.options.action, `station is missing to perform discardBooklistRecord`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				
				return res.send({
					error: 'station is missing to perform discardBooklistRecord',
					error_code: 'ERR_discardBooklistRecord_station_MISSING'
				});
			} else if(!req.body.awb_leg_id){
				sails.config.log.addlog(0, req.user.username, req.options.action, `awb_leg_id is missing to perform discardBooklistRecord`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				
				return res.send({
					error: 'awb_leg_id is missing to perform discardBooklistRecord',
					error_code: 'ERR_discardBooklistRecord_awb_leg_id_MISSING'
				});
			} else if(!req.body.reason){
				sails.config.log.addlog(0, req.user.username, req.options.action, `reason is missing to perform discardBooklistRecord`);
				sails.config.log.addOUTlog(req.user.username, req.options.action);
				
				return res.send({
					error: 'reason is missing to perform discardBooklistRecord',
					error_code: 'ERR_discardBooklistRecord_awb_leg_id_MISSING'
				});
			} else{
				let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
					id: req.body.awb_leg_id,
					station: req.body.station,
					awb_no: req.body.awb_no,
					from: req.body.from,
					created_by: req.body.created_by,
					void_on: Date.now(),// current timestamp
					void_reason: req.body.reason,
				});

				sails.config.log.addlog(4, req.user.username, req.options.action, 'void awb leg is '+ JSON.stringify(voidAwbLeg));

				if(voidAwbLeg){
					let legOps = await AWBLegOp.find({where: {awb_leg: voidAwbLeg.id, closing_status: ""}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

					sails.config.log.addlog(4, req.user.username, req.options.action, 'find awb leg ops are ============== '+ JSON.stringify(legOps));

					if(legOps.length > 0){
						for(let i = 0; i < legOps.length; i++){
							let voidLegOp = await AWBLegOp.update({id: legOps[i].id}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();
							sails.config.log.addlog(4, req.user.username, req.options.action, 'voided leg ops is ============== '+ JSON.stringify(voidLegOp));
						}
					}
				}
				
				sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'discardBooklistAwbLeg', {awbleg: voidAwbLeg});
			}

			if(req.body.assignFlight == true ){
				if(!req.body.flightSelector){
					sails.config.log.addlog(0, req.user.username, req.options.action, `flight is missing to perform addAwbLeg`);
					sails.config.log.addOUTlog(req.user.username, req.options.action);

					return res.send({
						error: 'flight is missing to perform addAwbLeg',
						error_code: 'ERR_addAwbLeg_flight_MISSING'
					});
				} else if(!req.body.to){
					sails.config.log.addlog(0, req.user.username, req.options.action, `to is missing to perform discardBooklistRecord`);
					sails.config.log.addOUTlog(req.user.username, req.options.action);
					
					return res.send({
						error: 'to is missing to perform discardBooklistRecord',
						error_code: 'ERR_discardBooklistRecord_to_MISSING'
					});
				} else if(!req.body.pieces || req.body.pieces < 1 ){
					sails.config.log.addlog(0, req.user.username, req.options.action, `pieces are invalid to perform discardBooklistRecord`);
					sails.config.log.addOUTlog(req.user.username, req.options.action);
					
					return res.send({
						error: 'pieces are invalid to perform discardBooklistRecord',
						error_code: 'ERR_discardBooklistRecord_PIECES_INVALID'
					});
				} else if(!req.body.weight || req.body.weight < 0.001){
					sails.config.log.addlog(0, req.user.username, req.options.action, `weight is invalid to perform discardBooklistRecord`);
					sails.config.log.addOUTlog(req.user.username, req.options.action);
					
					return res.send({
						error: 'weight is invalid to perform discardBooklistRecord',
						error_code: 'ERR_discardBooklistRecord_WEIGHT_INVALID'
					});
				}

				let flyflightDetails = (req.body.flightSelector).split(",");
				let flightNo = flyflightDetails[0];
				let flightTime = flyflightDetails[1];
				let flightArrivalTime = flyflightDetails[2];

				let booklist = await sails.helpers.planner.getBooklist.with({
					station: req.body.station,
					flight_no: flightNo,
					flight_time: flightTime
				});
				if (booklist){
					let awb_leg = await sails.helpers.planner.updateAwbLeg.with({
						awb_info:					req.body.awb_info_id,
						booklist:					booklist.id,
						station:					req.body.station,								//	COMPULSORY
						awb_no:						req.body.awb_no,							//	Compulsory to create
						from:						req.body.from,			//	COMPULSORY
						to:							req.body.to,
						pieces:						req.body.pieces,
						weight:						req.body.weight,
						flight_no:					flightNo,
						planned_departure:			flightTime,
						planned_arrival:			flightArrivalTime,
						created_by:					req.body.created_by,							//	Compulsory to create
						transhipment:				false,
						status:						sails.config.custom.database_model_enums.awb_leg_status.pending ,// 
					});
				}
			}
			let blank_awb_leg = await sails.helpers.awbSanitizer.with({
				station: req.body.from,
				awb_no: req.body.awb_no,
				savedBy: sails.config.custom.hardcoded_values.savedBy,
			//	pieces: remaining_pieces
			});
	
			let destination_blank_awb_leg = await sails.helpers.awbSanitizer.with({
				station: req.body.to,
				awb_no: req.body.awb_no,
				savedBy: sails.config.custom.hardcoded_values.savedBy,
			//	pieces: remaining_pieces
			});
	
			sails.config.log.addlog(3, req.user.username, req.options.action, `destination_blank_awb_leg = ${JSON.stringify(destination_blank_awb_leg)}`);
	
			//console.log('++++$$$$+restorrrrreeeeeeee++++ '+JSON.stringify(blank_awb_leg));
			if(blank_awb_leg) {
				//	Broadcasting the information that the AWB is added
				sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
			}
			
			sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'changeInBooklist', {msg: 'change in booklist need to refresh toBePlanned'});
	
			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'changeInBooklist', {msg: 'change in booklist need to refresh operations'});
			
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			return res.json(sails.config.custom.jsonResponse({ok:"ok"}));
		} else{
			sails.config.log.addlog(0, req.user.username, req.options.action, `inputs are invalid to perform discardBooklistRecord`);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			return res.send({
				error: 'inputs are invalid to perform discardBooklistRecord',
				error_code: 'ERR_discardBooklistRecord_inputs_INVALID'
			});
		}
	},

	getExistingRecords: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);

		sails.config.log.addlog(4, req.user.username, req.options.action, 'awblegs details '+ JSON.stringify(req.query));
		sails.config.log.addlog(4, req.user.username, req.options.action, req.body);
		sails.config.log.addlog(4, req.user.username, req.options.action, req.params);

		let existing_records = await AWBLeg.find({where: {
			awb_no: req.query.awbNo, from: req.query.from, status:{'!=' : sails.config.custom.database_model_enums.awb_leg_status.discarded}, pieces: {'>': 0}}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

		sails.config.log.addlog(4, req.user.username, req.options.action, '-----results-   '+JSON.stringify(existing_records));
		
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		res.json(existing_records);
	},

	manuallyDepart: async function(req, res){
		sails.config.log.addINlog(req.user.username, req.options.action);

		let booklist_id = JSON.stringify(req.body.booklist_id);
		booklist_id = booklist_id.replace(/[" ]/g, "");
		
		sails.config.log.addlog(4, req.user.username, req.options.action, 'booklist_id   = '+booklist_id);

		let egmFileRecords = req.body.egmFileRecords;
		let check_egm_exists = await BookList.findOne({where:{id: booklist_id}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action,  err.message));
		
		if(check_egm_exists.egm_awbs){
			sails.config.log.addlog(0, req.user.username, req.options.action, 'EGM is already Uploaded on this booklist');

			return res.send({
				error: 'EGM is already Uploaded on this booklist',
				error_code: 'ERR_uploadEGMFile_egm_already_uploaded'
			});
		} else{
			let legs_tobe_discarded=[];
			if(req.body.discarded_booklist_records.length>0){
				legs_tobe_discarded = JSON.stringify(req.body.discarded_booklist_records);
				legs_tobe_discarded = legs_tobe_discarded.replace(/[" ]/g, "");
				legs_tobe_discarded = legs_tobe_discarded.split(',');
				
				sails.config.log.addlog(0, req.user.username, req.options.action, 'legs_to_be_discarded = '+legs_tobe_discarded[0]);
			}
			if(egmFileRecords.length > 0){
				let egm_awbs = [];
				for (let k = 0; k < egmFileRecords.length; k++){
					egm_awbs.push(egmFileRecords[k].awb_no);

					//need to update actual pieces and weight to proper awbleg of that booklist record who is valid
					let find_awb_leg = await AWBLeg.findOne({awb_no: egmFileRecords[k].awb_no, void_on: 0, booklist: booklist_id}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
					
					sails.config.log.addlog(4, req.user.username, req.options.action, 'find_awb_leg = = '+ JSON.stringify(find_awb_leg));

					if(find_awb_leg){
						try{
						let update_awb_leg = await sails.helpers.planner.updateAwbLeg.with({
							id: find_awb_leg.id,
							station: req.body.station,
							awb_no: find_awb_leg.awb_no,
							from: find_awb_leg.from,
							created_by: find_awb_leg.created_by,
							actual_pieces_flown: Number(egmFileRecords[k].pieces),
							actual_weight_flown: Number(egmFileRecords[k].weight),
							status: sails.config.custom.database_model_enums.awb_leg_status.completed
						});}
						catch(e){
							sails.config.log.addlog(0, req.user.username, req.options.action, JSON.stringify(e));
						}

						let update_blank_leg = await sails.helpers.awbSanitizer.with({
							station: req.body.station,
							awb_no: find_awb_leg.awb_no,
							savedBy: req.body.user,
						});

						sails.config.log.addlog(3, req.user.username, req.options.action, 'find_awb_leg '+ JSON.stringify(find_awb_leg));

						let to_station_sanitizer = await sails.helpers.awbSanitizer.with({
							station: find_awb_leg.to,
							awb_no: find_awb_leg.awb_no,
							savedBy: req.body.user,
						});

						let euics_pending_q_time=await OpsDuration.findOne({key: "euics_pending_q_time"});
						let department = sails.config.custom.department_name.central_ops;

						if(find_awb_leg.transhipment){
							department=sails.config.custom.department_name.airport_ops;
						}

						let create_leg_op_euics_pending = await sails.helpers.planner.updateAwbLegOp.with({
							station: req.body.station,
							awb_no: find_awb_leg.awb_no,
							awb_leg: find_awb_leg.id,
							op_name: sails.config.custom.op_name.euics,
							department: department,
							opening_status: sails.config.custom.awb_leg_ops_status.euics_pending,
							trigger_time: Date.now(),
							// duration:  sails.config.custom.cut_off_timer.euics_pending_duration
							cut_off_time: Date.now() + (60000*Number(euics_pending_q_time.duration))
						});
						
						if(create_leg_op_euics_pending.awb_info.transhipment){
							sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_airport_operation, {newLegOp: create_leg_op_euics_pending})
						}
						else{
							sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_euics_pending})
						}
						
						let pre_alert_pending_q_time=await OpsDuration.findOne({key: "pre_alert_pending_q_time"});
						let create_leg_op_pre_alert_pending = await sails.helpers.planner.updateAwbLegOp.with({
							station: req.body.station,
							awb_no: find_awb_leg.awb_no,
							awb_leg: find_awb_leg.id,
							op_name: sails.config.custom.op_name.pre_alert,
							department: department,
							opening_status: sails.config.custom.awb_leg_ops_status.pre_alert_pending,
							trigger_time: Date.now(),
							// duration:  sails.config.custom.cut_off_timer.pre_alert_pending_duration
							cut_off_time: Date.now() + (60000*Number(pre_alert_pending_q_time.duration))
						});
							
						if(create_leg_op_pre_alert_pending.awb_info.transhipment){
							sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_airport_operation, {newLegOp: create_leg_op_pre_alert_pending})
						}
						else{
							sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_pre_alert_pending})
						}
						
						let cap_a_pending_q_time=await OpsDuration.findOne({key: "cap_a_pending_q_time"});
						let create_leg_op_cap_a_pending = await sails.helpers.planner.updateAwbLegOp.with({
							station: req.body.station,
							awb_no: find_awb_leg.awb_no,
							awb_leg: find_awb_leg.id,
							op_name: sails.config.custom.op_name.cap_awb,
							department: department,
							opening_status: sails.config.custom.awb_leg_ops_status.cap_a_pending,
							trigger_time: Date.now(),
							// duration:  sails.config.custom.cut_off_timer.cap_a_pending_duration
							cut_off_time: Date.now() + (60000*Number(cap_a_pending_q_time.duration))
						});
						
						if(create_leg_op_cap_a_pending.awb_info.transhipment){
							sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_airport_operation, {newLegOp: create_leg_op_cap_a_pending})
						}
						else{
							sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_cap_a_pending})
						}
						
						let e_awb_check_pending_q_time=await OpsDuration.findOne({key: "e_awb_check_pending_q_time"});

						let create_leg_op_e_awb_check_pending = await sails.helpers.planner.updateAwbLegOp.with({
							station: req.body.station,
							awb_no: find_awb_leg.awb_no,
							awb_leg: find_awb_leg.id,
							op_name: sails.config.custom.op_name.e_awb,
							department: sails.config.custom.department_name.central_ops,
							opening_status: sails.config.custom.awb_leg_ops_status.e_awb_check_pending,
							trigger_time: Date.now(),
							// duration:  sails.config.custom.cut_off_timer.e_awb_check_pending_duration
							cut_off_time: Date.now() + (60000*Number(e_awb_check_pending_q_time.duration))
						});
							
						sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_e_awb_check_pending})
					
					}
				}

				//creating attachment record for egm
				// let create_attachment = await Attachment.create({ station: req.body.station, original_filename: uploaded_file.filename, new_filepath: ('.' + path + file_name), received_from: req.body.user, }).fetch().catch(err => console.log(err.message));

				let findBooklist = await BookList.find({id: booklist_id}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

				sails.config.log.addlog(4, req.user.username, req.options.action, 'findBooklist  '+JSON.stringify(findBooklist));

				let update_booklist = await BookList.update({id: booklist_id}).set({egm_awbs : egm_awbs}).fetch().catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

				// update_booklist = update_booklist[0];
				//reference of booklist to attachment
				// let refOfBooklist = await BookList.addToCollection(update_booklist.id, 'file_manifest').members(create_attachment.id);
			}
			

			////discarding awb legs
			if(legs_tobe_discarded.length > 0){
				for(let i =0; i< legs_tobe_discarded.length; i++){
					let discarded_leg = await AWBLeg.update({id: legs_tobe_discarded[i]},{
						void_on: Date.now(),// current timestamp
						void_reason: sails.config.custom.void_reason.egm_offloaded,
						status: sails.config.custom.database_model_enums.awb_leg_status.discarded
					}).fetch().catch(err => res.json(sails.config.custom.jsonResponse(err.message, null)));

					discarded_leg = discarded_leg[0];
					let blank_awb_leg = await sails.helpers.awbSanitizer.with({
						station: discarded_leg['station'],
						awb_no: discarded_leg['awb_no'],
						savedBy: req.body.user,
					});
					
					//console.log('++++$$$$+restorrrrreeeeeeee++++ '+JSON.stringify(blank_awb_leg));
					if(discarded_leg){
						let legOps = await AWBLegOp.find({where: {awb_leg: discarded_leg.id, closing_status: ""}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

						if(legOps.length > 0) {
							for(let i = 0; i < legOps.length; i++) {
								let voidLegOp = await AWBLegOp.update({id: legOps[i].id}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();
							}
						}
					}
					//	Broadcasting the information that the AWB is added
					sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
				}
			}
		}

		sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'changeInBooklist', {msg: 'change in booklist need to refresh operations'});
		sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'changeInBooklist', {msg: 'change in booklist need to refresh legs'});

		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	uploadEGMFile: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);

		sails.config.log.addlog(4, req.user.username, req.options.action, 'uploadEGMFile input --> '+JSON.stringify(req.body));
		
		let current_path = (__dirname).split('api');
		sails.config.log.addlog(4, req.user.username, req.options.action, `current_path = ${current_path}`);

		let root_path = current_path[0];
		sails.config.log.addlog(4, req.user.username, req.options.action, `root_path = ${root_path}`);

		let booklist_id = JSON.stringify(req.body.booklist_id);
		booklist_id = booklist_id.replace(/[" ]/g, "");
		sails.config.log.addlog(4, req.user.username, req.options.action, `booklist_id = ${booklist_id}`);

		let check_egm_exists = await BookList.findOne({where:{id: booklist_id}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		if(check_egm_exists.egm_awbs){
			sails.config.log.addlog(0, req.user.username, req.options.action, 'EGM is already Uploaded on this booklist');
			sails.config.log.addOUTlog(req.user.username, req.options.action);

			return res.send({
				error: 'EGM is already Uploaded on this booklist',
				error_code: 'ERR_uploadEGMFile_egm_already_uploaded'
			});
		} else{
			let legs_tobe_discarded = '';
			if(req.body.discarded_booklist_records){
				legs_tobe_discarded = JSON.stringify(req.body.discarded_booklist_records);
				legs_tobe_discarded = legs_tobe_discarded.replace(/[" ]/g, "");
				legs_tobe_discarded = legs_tobe_discarded.split(',');
				sails.config.log.addlog(4, req.user.username, req.options.action, 'legs_tobe_discarded   = '+legs_tobe_discarded[0]);
			}
			let egm_file_records = [];
			let flyflightDetails = (req.body.flightsSelector).split(","); // get this from ui dependent on flightTime
			let flightNo = flyflightDetails[0];

			sails.config.globals.getdumppath('egm', async function(err, path) {
				req.file('egmFileUpload').upload({
					dirname:('.' + path),
					// You can apply a file upload limit (in bytes)
				}, async function whenDone(err, uploaded_files) {
					if (err) {
						sails.config.log.addlog(0, req.user.username, req.options.action, err);
						res.json(sails.config.custom.jsonResponse(err, null));
					}
					
					sails.config.globals.async.each(
						uploaded_files, 
						async function(uploaded_file, callback){
							//console.log('start cb'+cb);
							//let json_file_name = uploaded_file.filename ;
							
							let timestamp = new Date().getTime();
							let file_name = timestamp + '-'+ flightNo+'.txt';
							var {promisify} = require('util');
							var fs1 = require('fs');
							var {join} = require('path');
							
							let moveFile = async () => {
								var readline = require('readline');
								var fs = require('fs');
								let mv = promisify(fs.rename);
								await mv(uploaded_file.fd, '.' + path + file_name);
								sails.config.log.addlog(3, req.user.username, req.options.action, 'EGM file is uploaded + ' + root_path + path.slice(1) + file_name);
								//console.log(records);
								let singleFile = await Files.create({ station: req.body.station, original_filename: file_name, new_filepath: path + file_name, received_from: req.user.username, type: 'EGM'}).fetch().catch(err => console.log(err.message));
								if(singleFile) {
									// console.log('EGM data inserted successfuly in Files model');
									sails.config.log.addlog(4, req.user.username, req.options.action, `EGM data inserted successfuly in Files model`);
								}
								var input = fs.createReadStream(root_path + path.slice(1) + file_name);
								var myInterface = readline.createInterface({
									input: input,
								});
								
								myInterface.on('line', function (line) {
									line.includes()
									let testDigits = /\d{11}/;
									//let testSpaces = /^[    ]/;
									if(testDigits.test(line)){
										//console.log(line);
										line=line.trim();
										let egm_record = {};
										let egm_record_detail = line.split(' ')
										egm_record_detail = egm_record_detail.filter(i => i.length!=0);
										//console.log(_.compact(line.slice(27).split(' ')));
										let manifest_data =(_.compact(line.slice(27).split(' ')));
										//console.log('pieces = '+ manifest_data[0]+' weight = '+ manifest_data[1]+ ' volume = '+ manifest_data[2]);
										egm_record.awb_no = egm_record_detail[1];
										egm_record.pieces = egm_record_detail[4];
										egm_record.weight = parseInt(egm_record_detail[5]);
										//egm_record.volume = parseFloat(manifest_data[2]);
										egm_record.class = egm_record_detail[6].charAt(egm_record_detail[6].length-1);
										//console.log(egm_record);

										egm_file_records.push(egm_record);
									}

								});
								
								input.on('end', async function (line) {
									//console.log('closing interface');
									sails.config.log.addlog(3, req.user.username, req.options.action, 'egm_file_records end = = =++++ = = ='+ JSON.stringify(egm_file_records));

									if(egm_file_records.length > 0){
										let egm_awbs = [];
										for (let k = 0; k < egm_file_records.length; k++){
											egm_awbs.push(egm_file_records[k].awb_no.substr(0, 11));

											//need to update actual pieces and weight to proper awbleg of that booklist record who is valid
											let find_awb_leg = await AWBLeg.findOne({awb_no: egm_file_records[k].awb_no.substr(0, 11), void_on: 0, booklist: booklist_id}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
											
											sails.config.log.addlog(3, req.user.username, req.options.action, 'find_awb_leg = = '+ JSON.stringify(find_awb_leg));

											if(find_awb_leg){
												let update_awb_leg = await sails.helpers.planner.updateAwbLeg.with({
													id: find_awb_leg.id,
													station: req.body.station,
													awb_no: find_awb_leg.awb_no,
													from: find_awb_leg.from,
													created_by: find_awb_leg.created_by,
													actual_pieces_flown: Number(egm_file_records[k].pieces),
													actual_weight_flown: Number(egm_file_records[k].weight),
													status: sails.config.custom.database_model_enums.awb_leg_status.completed
												});
											
												let update_blank_leg = await sails.helpers.awbSanitizer.with({
													station: req.body.station,
													awb_no: find_awb_leg.awb_no,
													savedBy: req.body.user,
												});

												sails.config.log.addlog(3, req.user.username, req.options.action, 'find_awb_leg    '+ JSON.stringify(find_awb_leg));

												let to_station_sanitizer = await sails.helpers.awbSanitizer.with({
													station: find_awb_leg.to,
													awb_no: find_awb_leg.awb_no,
													savedBy: req.body.user,
												});

												let euics_pending_q_time=await OpsDuration.findOne({key: "euics_pending_q_time"});
												let create_leg_op_euics_pending = await sails.helpers.planner.updateAwbLegOp.with({
													station: req.body.station,
													awb_no: find_awb_leg.awb_no,
													awb_leg: find_awb_leg.id,
													op_name: sails.config.custom.op_name.euics,
													department: sails.config.custom.department_name.central_ops,
													opening_status: sails.config.custom.awb_leg_ops_status.euics_pending,
													trigger_time: Date.now(),
													// duration:  sails.config.custom.cut_off_timer.euics_pending_duration
													cut_off_time: Date.now() + (60000*Number(euics_pending_q_time.duration))
												});
													
												// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_euics_pending})
												if(create_leg_op_euics_pending.awb_info.transhipment) {
													sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_airport_operation, {newLegOp: create_leg_op_euics_pending})
												} else {
													sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_euics_pending})
												}

												let pre_alert_pending_q_time=await OpsDuration.findOne({key: "pre_alert_pending_q_time"});
												let create_leg_op_pre_alert_pending = await sails.helpers.planner.updateAwbLegOp.with({
													station: req.body.station,
													awb_no: find_awb_leg.awb_no,
													awb_leg: find_awb_leg.id,
													op_name: sails.config.custom.op_name.pre_alert,
													department: sails.config.custom.department_name.central_ops,
													opening_status: sails.config.custom.awb_leg_ops_status.pre_alert_pending,
													trigger_time: Date.now(),
													// duration:  sails.config.custom.cut_off_timer.pre_alert_pending_duration
													cut_off_time: Date.now() + (60000*Number(pre_alert_pending_q_time.duration))
												});
													
												// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_pre_alert_pending})
												if(create_leg_op_pre_alert_pending.awb_info.transhipment){
													sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_airport_operation, {newLegOp: create_leg_op_pre_alert_pending})
												} else{
													sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_pre_alert_pending})
												}

												let cap_a_pending_q_time=await OpsDuration.findOne({key: "cap_a_pending_q_time"});
												let create_leg_op_cap_a_pending = await sails.helpers.planner.updateAwbLegOp.with({
													station: req.body.station,
													awb_no: find_awb_leg.awb_no,
													awb_leg: find_awb_leg.id,
													op_name: sails.config.custom.op_name.cap_awb,
													department: sails.config.custom.department_name.central_ops,
													opening_status: sails.config.custom.awb_leg_ops_status.cap_a_pending,
													trigger_time: Date.now(),
													// duration:  sails.config.custom.cut_off_timer.cap_a_pending_duration
													cut_off_time: Date.now() + (60000*Number(cap_a_pending_q_time.duration))
												});
													
												// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_cap_a_pending})
												if(create_leg_op_cap_a_pending.awb_info.transhipment){
													sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_airport_operation, {newLegOp: create_leg_op_cap_a_pending})
												} else{
													sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_cap_a_pending})
												}

												let e_awb_check_pending_q_time=await OpsDuration.findOne({key: "e_awb_check_pending_q_time"});
												let create_leg_op_e_awb_check_pending = await sails.helpers.planner.updateAwbLegOp.with({
													station: req.body.station,
													awb_no: find_awb_leg.awb_no,
													awb_leg: find_awb_leg.id,
													op_name: sails.config.custom.op_name.e_awb,
													department: sails.config.custom.department_name.central_ops,
													opening_status: sails.config.custom.awb_leg_ops_status.e_awb_check_pending,
													trigger_time: Date.now(),
													// duration:  sails.config.custom.cut_off_timer.e_awb_check_pending_duration
													cut_off_time: Date.now() + (60000*Number(e_awb_check_pending_q_time.duration))
												});
													
												sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op_e_awb_check_pending})
											}
										}

										//creating attachment record for egm
										let create_attachment = await Attachment.create({ station: req.body.station, original_filename: uploaded_file.filename, new_filepath: ('.' + path + file_name), received_from: req.body.user, }).fetch().catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

										let findBooklist = await BookList.find({id: booklist_id}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

										sails.config.log.addlog(3, req.user.username, req.options.action, 'findBooklist  '+JSON.stringify(findBooklist));

										let update_booklist = await BookList.update({id: booklist_id}).set({egm_awbs : egm_awbs}).fetch().catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

										update_booklist = update_booklist[0];
										//reference of booklist to attachment
										let refOfBooklist = await BookList.addToCollection(update_booklist.id, 'file_manifest').members(create_attachment.id);
									}

									myInterface.close();
									sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'changeInBooklist', {msg: 'change in booklist need to refresh operations'});
									sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'changeInBooklist', {msg: 'change in booklist need to refresh legs'});
								});
								
								////discarding awb legs
								if(legs_tobe_discarded.length > 0){
									for(let i =0; i< legs_tobe_discarded.length; i++){
										let discarded_leg = await AWBLeg.update({id: legs_tobe_discarded[i]},{
											void_on: Date.now(),// current timestamp
											void_reason: sails.config.custom.void_reason.egm_offloaded,
											status: sails.config.custom.database_model_enums.awb_leg_status.discarded
										}).fetch().catch(err => res.json(sails.config.custom.jsonResponse(err.message, null)));

										discarded_leg = discarded_leg[0];
										let blank_awb_leg = await sails.helpers.awbSanitizer.with({
											station: discarded_leg['station'],
											awb_no: discarded_leg['awb_no'],
											savedBy: req.body.user,
										});
										
										//console.log('++++$$$$+restorrrrreeeeeeee++++ '+JSON.stringify(blank_awb_leg));
										if(discarded_leg){
											let legOps = await AWBLegOp.find({where: {awb_leg: discarded_leg.id, closing_status: ""}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

											if(legOps.length > 0){
												for(let i = 0; i < legOps.length; i++){
													let voidLegOp = await AWBLegOp.update({id: legOps[i].id}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();
												}
											}
										}
										//	Broadcasting the information that the AWB is added
										sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
									}
								}
							}
							//////file reading close at here				
							await moveFile();
							callback();
						}, async function(err) {
							if(err){
								sails.config.log.addlog(0, req.user.username, req.options.action, JSON.stringify(err));
							} else{
								//res.redirect('/planner')
								res.ok();
							}
						}
					);
				});
			});
		}

		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},	
};
