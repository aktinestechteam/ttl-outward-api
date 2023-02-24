/**
 * AWBController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	getAWBKundali: async function(req, res){
		sails.config.log.addINlog(req.user.username, "getAWBKundali");
		console.log('getAWBKundali data => '+ JSON.stringify(req.query));
		let awb = await AWB.findOne({awb_no: req.query.awb_no}).populate('awb_info').populate('file_awb').populate('file_house');
		sails.config.log.addlog(3, req.user.username, req.options.action, awb.awb_no, "", "");
		//let awbKundali = await AWBInfo.findOne({where:{ 'awb_no' : req.query.awb_no}}).catch(err => console.log( err.message));
		
		if(awb) {
			let awbLegs =  await AWBLeg.find({where:{ 'awb_no' : req.query.awb_no},sort:'planned_arrival ASC'}).catch(err => console.log( err.message));
			if(awbLegs.length){

				for(let i=0; i<awbLegs.length; i++){
					let awbLegOps = await AWBLegOp.find({where:{ 'awb_leg' : awbLegs[i].id}}).catch(err => console.log( err.message));
					if (awbLegOps.length)
						{
							for(let j=0; j<awbLegOps.length; j++){
								let cca_raised = await CCARequest.findOne({where:{ 'awb_leg_op' : awbLegOps[j].id}}).catch(err => console.log( err.message));
								awbLegOps[j].cca_raised = cca_raised;

								let cca_leg_op = await CCARequest.findOne({where:{ 'cca_leg_op' : awbLegOps[j].id}}).catch(err => console.log( err.message));
								awbLegOps[j].cca_leg_op = cca_leg_op;
							}
						}
					awbLegs[i].awbLegOps = awbLegOps;
				}
			}

			awb.awb_info.awbLegs = awbLegs;
		}

		let awbLegsList=awb.awb_info.awbLegs;
		let bookLists=[];
		
		if(awbLegsList.length>0){
			let bookListIds=[];
			awbLegsList.map(awbLeg=>{
				if(awbLeg.void_on == 0){
					bookListIds.push(awbLeg.booklist);
				}
			});
		
			let bookListIdList=bookListIds.filter(booklistId=>booklistId!=null);
			bookLists=await BookList.find({id: bookListIdList}).populate('file_prealert');
		}
		
		sails.config.log.addOUTlog(req.user.username, "getAWBKundali");
		res.json(sails.config.custom.jsonResponse(null, {awb, bookLists}));
	},

	getStations: async function(req, res){
		// sails.config.log.addINlog(req.user.username, "getStations");
		let stations = await Station.find({select: ['iata'] ,sort:'iata ASC'}).catch(err => console.log( err.message));
		// sails.config.log.addOUTlog(req.user.username, "getStations");
		res.json(sails.config.custom.jsonResponse(null, stations));
	},


	// responseAWBQuery: async function (req, res){

	// },

	updateAwbWithOnHand: async function(req,res){
		//console.log('onhand status = = '+JSON.stringify(req.body));
		// sails.config.log.addINlog(req.user.username, "updateAwbWithOnHand");
		let createAwb = await sails.helpers.planner.updateAwb.with({awb_no: req.body.awbNoInput, 
			station: req.body.stationInput,
			src: req.body.stationInput,
			saved_by: 'Email',
			on_hand: true});

		sails.config.log.addlog(3, "", req.options.action, req.body.awbNoInput, "", "demo2");

		//this is to create legop when record is onhand and having active leg in booklist
		let check_active_legs = await AWBLeg.find({where: {status: sails.config.custom.database_model_enums.awb_leg_status.pending , pieces: {'>': 0}, awb_no: createAwb.awb_no, void_on: 0}}).populate('awb_info').catch(err => console.log( err.message));
		//console.log('check_active_leg'+JSON.stringify(check_active_leg));
		for(let i = 0; i < check_active_legs.length; i++) {
			let check_active_leg = check_active_legs[i];
			if (check_active_leg){
				//check_active_leg = check_active_leg[0];
				if ((check_active_leg.awb_info.on_hand == true) && (check_active_leg.awb_info.pieces > 0)){
					sails.config.log.addlog(3, "SYSTEM", req.options.action, `check_active_leg = ${JSON.stringify(check_active_leg)}`);
					//console.log('check_active_leg'+JSON.stringify(check_active_leg));

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
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
					
					//need to apply dispacher funtion for here
					// if(create_leg_op){
					// 	sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'addLegOps', {newLegOp: create_leg_op});
					// }
				}
			}
		}

		sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBeActioned', {awb_info: createAwb});
		sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'onHandforToBePlanned', {awb_info: createAwb});
		sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'onHandforBooklistRecord', {awb_info_id: createAwb.id});
		// sails.config.log.addOUTlog(req, "updateAwbWithOnHand");
		res.redirect('/demo2');
	},

	createAwbWithInfoManually: async function(req,res){
		sails.config.log.addINlog(req.user.username, "createAwbWithInfoManually");
		//console.log('newawb Body: '+JSON.stringify(req.body));
		let minimum_pieces_to_check = 0 ;
		let savedBy = sails.config.custom.hardcoded_values.savedBy; //  get name of operating person  from ui

		if(req.body){
			if(!req.body.awb_no || req.body.awb_no.length != 11 ){
				sails.config.log.addlog(0, req.user.username, req.options.action, `Awb_No is invalid to perform createAwbWithInfoManually`);
				return res.send({
					error: 'Awb_No is invalid to perform createAwbWithInfoManually',
					error_code: 'ERR_createAwbWithInfoManually_AWB_No_INVALID'
				});
			} else{
				let	existing_records = await AWBLeg.find({where: {
					awb_no: req.body.awb_no, status:{'!=' : sails.config.custom.database_model_enums.awb_leg_status.discarded}, pieces: {'>': 0}}}).catch(err => console.log( err.message));

				for (let i = 0; i< existing_records.length; i++){
					minimum_pieces_to_check += existing_records[i].pieces;
				}
			} 

			if(!req.body.station ){
				sails.config.log.addlog(0, req.user.username, req.options.action, "Station is missing to perform createAwbWithInfoManually");
				return res.send({
					error: 'Station is missing to perform createAwbWithInfoManually',
					error_code: 'ERR_createAwbWithInfoManually_STATION_MISSING'
				});
			} else if(!req.body.src){
				sails.config.log.addlog(0, req.user.username, req.options.action, `Source is missing to perform createAwbWithInfoManually`);
				return res.send({
					error: 'Source is missing to perform createAwbWithInfoManually',
					error_code: 'ERR_createAwbWithInfoManually_Source_MISSING'
				});
			} else if(!req.body.dest){
				sails.config.log.addlog(0, req.user.username, req.options.action, `ERR_createAwbWithInfoManually_Destination_MISSING`);
				return res.send({
					error: 'Destination is missing to perform createAwbWithInfoManually',
					error_code: 'ERR_createAwbWithInfoManually_Destination_MISSING'
				});
			} else if(!savedBy){	//get username from ui
				sails.config.log.addlog(0, req.user.username, req.options.action, `ERR_createAwbWithInfoManually_user_MISSING`);
				return res.send({
					error: 'user is missing to perform createAwbWithInfoManually',
					error_code: 'ERR_createAwbWithInfoManually_user_MISSING'
				});
			} else if(!req.body.issuer_name){	//get username from ui
				sails.config.log.addlog(0, req.user.username, req.options.action, "ERR_createAwbWithInfoManually_issuer_name_MISSING");
				return res.send({
					error: 'issuer_name is missing to perform createAwbWithInfoManually',
					error_code: 'ERR_createAwbWithInfoManually_issuer_name_MISSING'
				});
			} else if(!req.body.pieces || req.body.pieces < 1 || req.body.pieces < minimum_pieces_to_check){
				sails.config.log.addlog(0, req.user.username, req.options.action, "ERR_updateAwbinfo_PIECES_INVALID");
				return res.send({
					error: 'pieces are invalid to perform updateAwbinfo',
					error_code: 'ERR_updateAwbinfo_PIECES_INVALID'
				});
			} else if(!req.body.weight || req.body.weight < 0.001){
				sails.config.log.addlog(0, req.user.username, req.options.action, "ERR_updateAwbinfo_WEIGHT_INVALID");
				return res.send({
					error: 'weight is invalid to perform updateAwbinfo',
					error_code: 'ERR_updateAwbinfo_WEIGHT_INVALID'
				});
			} else{
				let awb_info = await sails.helpers.planner.updateAwb.with({
					station: req.body.station,
					awb_no: req.body.awb_no,
					src: req.body.src,
					dest: req.body.dest,
					saved_by: savedBy,
					issuer_name: req.body.issuer_name,
					issuer_code: req.body.issuer_code,
					unitized: req.body.unitized,
					shc: req.body.shc,
					pieces: Number(req.body.pieces),
					weight: Number(req.body.weight),
					transhipment: req.body.transhipment,
					priority_class: req.body.priority_class
				});

				sails.config.log.addlog(3, req.user.username, req.options.action, req.body.awb_no, "awb is updated");

				//	Sanitize the AWB since it is newly got created
				let blank_awb_leg = await sails.helpers.awbSanitizer.with({
					station: req.body.station,
					awb_no: req.body.awb_no,
					savedBy: savedBy,
					//pieces: -(Number(req.body.pieces))
				});

				//console.log('manuallly '+JSON.stringify(blank_awb_leg));
				if(blank_awb_leg) {
					//	Broadcasting the information that the AWB is added
					sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
					sails.config.log.addlog(3, req.user.username, req.options.action, req.body.awb_no, 'blank awb leg is created and broadcasted');
				} else {
					sails.config.log.addlog(3, req.user.username, req.options.action, req.body.awb_no, 'blank awb leg is not created');
				}

				sails.config.log.addOUTlog(req.user.username, "createAwbWithInfoManually");
				res.ok();
			}
		} else{
			sails.config.log.addlog(0, req.user.username, req.options.action, "ERR_createAwbWithInfoManually_inputs_INVALID");
			return res.send({
				error: 'inputs are invalid to perform createAwbWithInfoManually',
				error_code: 'ERR_createAwbWithInfoManually_inputs_INVALID'
			});
		}
		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	getAwbDetails: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);
		// console.log('get awb details '+ JSON.stringify(req.body));
		let awbNo = req.query.awbNo;
		let results = await sails.helpers.getAwbDetail.with({awbNo:awbNo,});

		//console.log('------   '+JSON.stringify(results));
		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},
};

////////////////////////////////////////////////////////////////////