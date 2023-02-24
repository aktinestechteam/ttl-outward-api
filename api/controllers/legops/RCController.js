/**
 * RCController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

	//action on rate chck pending legop to closeit with closing status will create new legop with closing staus is opening status
	readyToRateCheck: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);
		
		sails.config.log.addlog(3, req.user.username, req.options.action, 'readyToRateCheck input'+ JSON.stringify(req.body));
		
		let check_legop_action = await AWBLegOp.findOne({where:{id: req.body.awb_legop_id}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		let rate_check_pending_cutoff_time=await OpsDuration.findOne({key: "rate_check_pending_cutoff_time"});

		let check_active_leg = await AWBLeg.findOne({
			status: {'!=' : sails.config.custom.database_model_enums.awb_leg_status.discarded}, 
			pieces: {'>': 0},
			id: req.body.awb_leg_id, 
			booklist: { '!=' : null}, 
			void_on: 0
		}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		let cut_off_time=Date.now();

		if(check_active_leg){
			cut_off_time = check_active_leg.planned_departure - (60000*Number(rate_check_pending_cutoff_time.duration));
		}
		
		if(rate_check_pending_cutoff_time.duration==0 || cut_off_time<Date.now()){
			cut_off_time=Date.now()
		}
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if(check_legop_action.closing_status){
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			return res.send({
				error: 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else{
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: req.body.awb_legop_id,
				awb_leg: req.body.awb_leg_id,
				station: req.body.station,
				awb_no: req.body.awb_no,
				ba80_notes: req.body.ba80_notes,
				release_notes: req.body.reason,
				closing_status: req.body.closing_status,
				acted_at_time: Date.now(),
				acted_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
			});
			//console.log('updated leg op details'+JSON.stringify(update_leg_op));
			if (update_leg_op){
				let department = sails.config.custom.department_name.central_ops
				if(check_active_leg && check_active_leg.transhipment){
					department = sails.config.custom.department_name.airport_ops;
				}
				let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
					station: req.body.station,
					awb_no: req.body.awb_no,
					awb_leg: req.body.awb_leg_id,
					op_name: sails.config.custom.op_name.rate_check,
					department: department,
					opening_status: req.body.closing_status,
					trigger_time: Date.now(),
					duration: sails.config.custom.cut_off_timer.rate_check_pending_duration,
					cut_off_time: cut_off_time,
					prev_leg_op: update_leg_op.id
				});
				sails.config.log.addlog(3, req.user.username, req.options.action, 'created leg op details'+JSON.stringify(create_leg_op));
				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.removeLegOps_planner_operation, {oldLegOp: update_leg_op});
				if(check_active_leg.transhipment){
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.addLegOps_airport_operation, {newLegOp: create_leg_op})
				}
				else{
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op})
				}
			}
		}
		
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.ok();
	},

	rateCheckPending: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'ratecheckpending done input'+ JSON.stringify(req.body));

		let check_legop_action = await AWBLegOp.findOne({where:{id: req.body.awb_legop_id}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if(check_legop_action.closing_status){
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			return res.send({
				error: 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else{
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: req.body.awb_legop_id,
				awb_leg: req.body.awb_leg_id,
				station: req.body.station,
				awb_no: req.body.awb_no,
				ba80_notes: req.body.ba80_notes,
				release_notes: req.body.reason,
				closing_status: req.body.closing_status,				//RATE_CHECK_REFERRED,RATE_CHECK_HOLD,RATE_CHECK_REJECTED,RATE_CHECK_DONE.
				acted_at_time: Date.now(),
				acted_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
			});
			//console.log('updated leg op details'+JSON.stringify(update_leg_op));
			if (update_leg_op){
				if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.rate_check_done){
					let ready_to_fdc_cutoff_time=await OpsDuration.findOne({key: "ready_to_fdc_q_time"});
				
					let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.fdc,
						department: sails.config.custom.department_name.planner_ops,
						opening_status: sails.config.custom.awb_leg_ops_status.ready_to_fdc,
						trigger_time: Date.now(),
						// duration: sails.config.custom.cut_off_timer.ready_to_fdc_duration,
						cut_off_time: Date.now() + (60000*Number(ready_to_fdc_cutoff_time.duration)),
						prev_leg_op: update_leg_op.id	
					});
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.addLegOps_planner_operation, {newLegOp: create_leg_op})
					let updateAwbRCDone = await sails.helpers.planner.updateAwb.with({awb_no: req.body.awb_no, station: req.body.station, rate_check: true});
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
				} else if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.rate_check_hold){
					let rate_check_hold_q_time=await OpsDuration.findOne({key: "rate_check_hold_q_time"});
				
					let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.rate_check,
						department: sails.config.custom.department_name.central_ops,
						opening_status: sails.config.custom.awb_leg_ops_status.rate_check_hold,
						trigger_time: Date.now(),
						// duration: sails.config.custom.cut_off_timer.rate_check_hold_duration,
						cut_off_time: Date.now() + (60000*Number(rate_check_hold_q_time.duration)),
						prev_leg_op: update_leg_op.id
					});
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op})
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
				} else if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.rate_check_referred){
					let rate_check_referred_q_time=await OpsDuration.findOne({key: "rate_check_referred_q_time"});
					let cut_off_time = Date.now() + (60000*Number(rate_check_referred_q_time.duration))
				
					let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.rate_check,
						department: sails.config.custom.department_name.central_ops,
						opening_status: sails.config.custom.awb_leg_ops_status.rate_check_referred,
						trigger_time: Date.now(),
						// duration: sails.config.custom.cut_off_timer.rate_check_referred_duration,
						cut_off_time: cut_off_time,
						prev_leg_op: update_leg_op.id
					});
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op});
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
				} else if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.rms_review){
					let rms_review_q_time=await OpsDuration.findOne({key: "rms_review_q_time"});
					let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.rate_check,
						department: sails.config.custom.department_name.central_ops,
						opening_status: sails.config.custom.awb_leg_ops_status.rms_review,
						trigger_time: Date.now(),
						// duration: sails.config.custom.cut_off_timer.rms_review_duration,
						cut_off_time: Date.now() + (60000*Number(rms_review_q_time.duration)),
						prev_leg_op: update_leg_op.id
					});
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op});
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
				} else{
					//this is to discard the awbleg becouse this case is for RATE_CHECK_REJECTED 
					let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
						id: req.body.awb_leg_id,
						station: req.body.station,
						awb_no: req.body.awb_no,
						from: req.body.from,
						created_by: req.body.created_by,
						void_on: Date.now(),// current timestamp
						void_reason: sails.config.custom.awb_leg_ops_status.rate_check_rejected,
					});

					if(voidAwbLeg){
						let legOps = await AWBLegOp.find({where: {awb_leg: voidAwbLeg.id, closing_status: ""}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
						if(legOps.length > 0){
							for(let i = 0; i < legOps.length; i++){
								let voidLegOp = await AWBLegOp.update({id: legOps[i].id}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();
							}
						}
					}
					sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'discardBooklistAwbLeg', {awbleg: voidAwbLeg});
					//let remaining_pieces =  -(Number(req.body.pieces));
					let blank_awb_leg = await sails.helpers.awbSanitizer.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						savedBy: "TODO",
					//	pieces: remaining_pieces
					});
					//console.log('++++$$$$+restorrrrreeeeeeee++++ '+JSON.stringify(blank_awb_leg));
					if(blank_awb_leg) {
						//	Broadcasting the information that the AWB is added
						sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
					}
				}
				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_operation, {oldLegOp: update_leg_op});

				if(Array.isArray(req.body.CCA) && req.body.CCA.length > 0){
					let create_cca = await CCARequest.create({
						awb_no: req.body.awb_no,
						priority: 0,		//need to ask but required field	
						station: req.body.station,
						raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
						raised_by_dept: update_leg_op.department,
						reason: req.body.CCA,
						reason_text: 'XXXXXXXXTODOXXXXXXXX',	//need to ask but required field
					}).fetch().catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		
					let create_leg_op_cca_request = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.cca,
						department: sails.config.custom.department_name.central_fin,
						opening_status: sails.config.custom.awb_leg_ops_status.cca_request_pending,
						trigger_time: Date.now(),
						duration: sails.config.custom.cut_off_timer.cca_request_pending_duration,
						prev_leg_op: update_leg_op.id
					});
					
					let refToAWBLegOp = await AWBLegOp.addToCollection(req.body.awb_legop_id, 'cca_request').members(create_cca.id);

					let refToCCALegOp = await AWBLegOp.addToCollection(create_leg_op_cca_request.id, 'cca_request_leg_op').members(create_cca.id);

					create_leg_op_cca_request.CCARequest = await CCARequest.findOne({where:{ cca_leg_op:create_leg_op_cca_request.id}}).populate('cca_leg_op').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

					sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  '+JSON.stringify(create_leg_op_cca_request));
					
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, {newLegOp: create_leg_op_cca_request})
				}
			}
		}
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.ok();
	},

	rateCheckHold: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);
		let check_legop_action = await AWBLegOp.findOne({where:{id: req.body.awb_legop_id}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if(check_legop_action.closing_status){
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			return res.send({
				error: 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else{
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: req.body.awb_legop_id,
				awb_leg: req.body.awb_leg_id,
				station: req.body.station,
				awb_no: req.body.awb_no,
				closing_status: req.body.closing_status,				//RATE_CHECK_REFERRED,RATE_CHECK_HOLD,RATE_CHECK_REJECTED,RATE_CHECK_DONE.
				acted_at_time: Date.now(),
				acted_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
			});
			//console.log('updated leg op details'+JSON.stringify(update_leg_op));
			if (update_leg_op){
				if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.rate_check_done){
					let ready_to_fdc_cutoff_time=await OpsDuration.findOne({key: "ready_to_fdc_q_time"});
					let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.fdc,
						department: sails.config.custom.department_name.planner_ops,
						opening_status: sails.config.custom.awb_leg_ops_status.ready_to_fdc,
						trigger_time: Date.now(),
						// duration: sails.config.custom.cut_off_timer.ready_to_fdc_duration,
						cut_off_time: Date.now() + (60000*Number(ready_to_fdc_cutoff_time.duration)),
						prev_leg_op: update_leg_op.id
					});
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.addLegOps_planner_operation, {newLegOp: create_leg_op})
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
					let updateAwbRCDone = await sails.helpers.planner.updateAwb.with({awb_no: req.body.awb_no, station: req.body.station, rate_check: true});
				}else{
					//this is to discard the awbleg becouse this case is for RATE_CHECK_REJECTED 
					let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
						id: req.body.awb_leg_id,
						station: req.body.station,
						awb_no: req.body.awb_no,
						from: req.body.from,
						created_by: req.body.created_by,
						void_on: Date.now(),// current timestamp
						void_reason: sails.config.custom.awb_leg_ops_status.rate_check_rejected,
					});

					if(voidAwbLeg){
						let legOps = await AWBLegOp.find({where: {awb_leg: voidAwbLeg.id, closing_status: ""}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
						if(legOps.length > 0){
							for(let i = 0; i < legOps.length; i++){
								let voidLegOp = await AWBLegOp.update({id: legOps[i].id}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();
							}
						}
					}
					sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'discardBooklistAwbLeg', {awbleg: voidAwbLeg});
					//let remaining_pieces =  -(Number(req.body.pieces));
					let blank_awb_leg = await sails.helpers.awbSanitizer.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						savedBy: "TODO",
					//	pieces: remaining_pieces
					});
					//console.log('++++$$$$+restorrrrreeeeeeee++++ '+JSON.stringify(blank_awb_leg));
					if(blank_awb_leg) {
						//	Broadcasting the information that the AWB is added
						sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
					}
				}
				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_operation, {oldLegOp: update_leg_op});

				if(Array.isArray(req.body.CCA) && req.body.CCA.length > 0){
					let create_cca = await CCARequest.create({
						awb_no: req.body.awb_no,
						priority: 0,		//need to ask but required field	
						station: req.body.station,
						raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
						raised_by_dept: update_leg_op.department,
						reason: req.body.CCA,
						reason_text: 'XXXXXXXXTODOXXXXXXXX',	//need to ask but required field
					}).fetch().catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		
					let create_leg_op_cca_request = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.cca,
						department: sails.config.custom.department_name.central_fin,
						opening_status: sails.config.custom.awb_leg_ops_status.cca_request_pending,
						trigger_time: Date.now(),
						duration: sails.config.custom.cut_off_timer.cca_request_pending_duration,
						prev_leg_op: update_leg_op.id
					});
					//console.log('create_leg_op_cca_request'+JSON.stringify(create_leg_op_cca_request));
					let refToAWBLegOp = await AWBLegOp.addToCollection(req.body.awb_legop_id, 'cca_request').members(create_cca.id);

					let refToCCALegOp = await AWBLegOp.addToCollection(create_leg_op_cca_request.id, 'cca_request_leg_op').members(create_cca.id);

					create_leg_op_cca_request.CCARequest = await CCARequest.findOne({where:{ cca_leg_op:create_leg_op_cca_request.id}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

					sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  '+JSON.stringify(create_leg_op_cca_request));

					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, {newLegOp: create_leg_op_cca_request})
				}
			}
		}
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.ok();
	},

	rateCheckReferred: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);
		let check_legop_action = await AWBLegOp.findOne({where:{id: req.body.awb_legop_id}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if(check_legop_action.closing_status){
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			return res.send({
				error: 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else{
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: req.body.awb_legop_id,
				awb_leg: req.body.awb_leg_id,
				station: req.body.station,
				awb_no: req.body.awb_no,
				ba80_notes: req.body.ba80_notes,
				release_notes: req.body.reason,
				closing_status: req.body.closing_status,				//RATE_CHECK_REFERRED,RATE_CHECK_HOLD,RATE_CHECK_REJECTED,RATE_CHECK_DONE.
				acted_at_time: Date.now(),
				acted_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
			});
			//console.log('updated leg op details'+JSON.stringify(update_leg_op));
			if (update_leg_op){
				if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.rate_check_done){
					let ready_to_fdc_cutoff_time=await OpsDuration.findOne({key: "ready_to_fdc_q_time"});
					let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.fdc,
						department: sails.config.custom.department_name.planner_ops,
						opening_status: sails.config.custom.awb_leg_ops_status.ready_to_fdc,
						trigger_time: Date.now(),
						// duration: sails.config.custom.cut_off_timer.ready_to_fdc_duration,
						cut_off_time: Date.now() + (60000*Number(ready_to_fdc_cutoff_time.duration)),
						prev_leg_op: update_leg_op.id
					});
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_planner_operation, {newLegOp: create_leg_op})
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
					let updateAwbRCDone = await sails.helpers.planner.updateAwb.with({awb_no: req.body.awb_no, station: req.body.station, rate_check: true});
				} else{
					//this is to discard the awbleg becouse this case is for RATE_CHECK_REJECTED 
					let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
						id: req.body.awb_leg_id,
						station: req.body.station,
						awb_no: req.body.awb_no,
						from: req.body.from,
						created_by: req.body.created_by,
						void_on: Date.now(),// current timestamp
						void_reason: sails.config.custom.awb_leg_ops_status.rate_check_rejected,
					});

					if(voidAwbLeg){
						let legOps = await AWBLegOp.find({where: {awb_leg: voidAwbLeg.id, closing_status: ""}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
						if(legOps.length > 0){
							for(let i = 0; i < legOps.length; i++){
								let voidLegOp = await AWBLegOp.update({id: legOps[i].id}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();
							}
						}
					}
					sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'discardBooklistAwbLeg', {awbleg: voidAwbLeg});
					//let remaining_pieces =  -(Number(req.body.pieces));
					let blank_awb_leg = await sails.helpers.awbSanitizer.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						savedBy: "TODO",
					//	pieces: remaining_pieces
					});
					//console.log('++++$$$$+restorrrrreeeeeeee++++ '+JSON.stringify(blank_awb_leg));
					if(blank_awb_leg) {
						//	Broadcasting the information that the AWB is added
						sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
					}
				}
				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_operation, {oldLegOp: update_leg_op});   

				if(Array.isArray(req.body.CCA) && req.body.CCA.length > 0){
					let create_cca = await CCARequest.create({
						awb_no: req.body.awb_no,
						priority: 0,		//need to ask but required field	
						station: req.body.station,
						raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
						raised_by_dept: update_leg_op.department,
						reason: req.body.CCA,
						reason_text: 'XXXXXXXXTODOXXXXXXXX',	//need to ask but required field
					}).fetch().catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		
					let create_leg_op_cca_request = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.cca,
						department: sails.config.custom.department_name.central_fin,
						opening_status: sails.config.custom.awb_leg_ops_status.cca_request_pending,
						trigger_time: Date.now(),
						duration: sails.config.custom.cut_off_timer.cca_request_pending_duration,
						prev_leg_op: update_leg_op.id
					});
					//console.log('create_leg_op_cca_request'+JSON.stringify(create_leg_op_cca_request));
					let refToAWBLegOp = await AWBLegOp.addToCollection(req.body.awb_legop_id, 'cca_request').members(create_cca.id);

					let refToCCALegOp = await AWBLegOp.addToCollection(create_leg_op_cca_request.id, 'cca_request_leg_op').members(create_cca.id);
					create_leg_op_cca_request.CCARequest = await CCARequest.findOne({where:{ cca_leg_op:create_leg_op_cca_request.id}}).populate('cca_leg_op').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

					sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  '+JSON.stringify(create_leg_op_cca_request));

					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, {newLegOp: create_leg_op_cca_request})
				}
			}
		}
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.ok();
	},

	rmsReview: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'rmsReview input body   === '+ JSON.stringify(req.body));
		let check_legop_action = await AWBLegOp.findOne({where:{id: req.body.awb_legop_id}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if(check_legop_action.closing_status){
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			return res.send({
				error: 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else{
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: req.body.awb_legop_id,
				awb_leg: req.body.awb_leg_id,
				station: req.body.station,
				awb_no: req.body.awb_no,
				ba80_notes: req.body.ba80_notes,
				release_notes: req.body.reason,
				closing_status: req.body.closing_status,				//RATE_CHECK_REJECTED,RATE_CHECK_DONE,RMS_HUB_REVIEW.
				acted_at_time: Date.now(),
				acted_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
			});
			//console.log('updated leg op details'+JSON.stringify(update_leg_op));
			if (update_leg_op){
				if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.rate_check_done){
					let ready_to_fdc_cutoff_time=await OpsDuration.findOne({key: "ready_to_fdc_q_time"});
					let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.fdc,
						department: sails.config.custom.department_name.planner_ops,
						opening_status: sails.config.custom.awb_leg_ops_status.ready_to_fdc,
						trigger_time: Date.now(),
						// duration: sails.config.custom.cut_off_timer.ready_to_fdc_duration,
						cut_off_time: Date.now() + (60000*Number(ready_to_fdc_cutoff_time.duration)),
						prev_leg_op: update_leg_op.id
					});
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_planner_operation, {newLegOp: create_leg_op})
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
					let updateAwbRCDone = await sails.helpers.planner.updateAwb.with({awb_no: req.body.awb_no, station: req.body.station, rate_check: true});
				} else if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.rms_hub_review){
					let rms_hub_review_time=await OpsDuration.findOne({key: "rms_hub_review_q_time"});
					let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.rate_check,
						department: sails.config.custom.department_name.central_ops,
						opening_status: sails.config.custom.awb_leg_ops_status.rms_hub_review,
						trigger_time: Date.now(),
						// duration: sails.config.custom.cut_off_timer.rms_hub_review_duration,
						cut_off_time: Date.now() + (60000*Number(rms_hub_review_time.duration)),
						prev_leg_op: update_leg_op.id
					});
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op});
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
				} else{
					//this is to discard the awbleg becouse this case is for RATE_CHECK_REJECTED 
					let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
						id: req.body.awb_leg_id,
						station: req.body.station,
						awb_no: req.body.awb_no,
						from: req.body.from,
						created_by: req.body.created_by,
						void_on: Date.now(),// current timestamp
						void_reason: sails.config.custom.awb_leg_ops_status.rate_check_rejected,
					});

					if(voidAwbLeg){
						let legOps = await AWBLegOp.find({where: {awb_leg: voidAwbLeg.id, closing_status: ""}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
						if(legOps.length > 0){
							for(let i = 0; i < legOps.length; i++){
								let voidLegOp = await AWBLegOp.update({id: legOps[i].id}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();
							}
						}
					}

					sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'discardBooklistAwbLeg', {awbleg: voidAwbLeg});
					//let remaining_pieces =  -(Number(req.body.pieces));
					let blank_awb_leg = await sails.helpers.awbSanitizer.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						savedBy: "TODO",
					//	pieces: remaining_pieces
					});
					//console.log('++++$$$$+restorrrrreeeeeeee++++ '+JSON.stringify(blank_awb_leg));
					if(blank_awb_leg) {
						//	Broadcasting the information that the AWB is added
						sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
					}
				}
				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_operation, {oldLegOp: update_leg_op});
			}
		}
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.ok();
	},


	rmsHubReview: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'rmsHubReview input body   === '+ JSON.stringify(req.body));
		let check_legop_action = await AWBLegOp.findOne({where:{id: req.body.awb_legop_id}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if(check_legop_action.closing_status){
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			return res.send({
				error: 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status +' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else{
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: req.body.awb_legop_id,
				awb_leg: req.body.awb_leg_id,
				station: req.body.station,
				awb_no: req.body.awb_no,
				ba80_notes: req.body.ba80_notes,
				release_notes: req.body.reason,
				closing_status: req.body.closing_status,				//RATE_CHECK_REJECTED,RATE_CHECK_DONE,RATE_CHECK_REFERRED.
				acted_at_time: Date.now(),
				acted_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
			});
			//console.log('updated leg op details'+JSON.stringify(update_leg_op));
			if (update_leg_op){
				if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.rate_check_done){
					let ready_to_fdc_cutoff_time=await OpsDuration.findOne({key: "ready_to_fdc_q_time"});
					let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.fdc,
						department: sails.config.custom.department_name.planner_ops,
						opening_status: sails.config.custom.awb_leg_ops_status.ready_to_fdc,
						trigger_time: Date.now(),
						// duration: sails.config.custom.cut_off_timer.ready_to_fdc_duration,
						cut_off_time: Date.now() + (60000*Number(ready_to_fdc_cutoff_time.duration)),
						prev_leg_op: update_leg_op.id
					});
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.addLegOps_planner_operation, {newLegOp: create_leg_op})
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
					let updateAwbRCDone = await sails.helpers.planner.updateAwb.with({awb_no: req.body.awb_no, station: req.body.station, rate_check: true});
				} else if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.rate_check_referred){
					
					let rate_check_referred_q_time=await OpsDuration.findOne({key: "rate_check_referred_q_time"});
					let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.rate_check,
						department: sails.config.custom.department_name.central_ops,
						opening_status: sails.config.custom.awb_leg_ops_status.rate_check_referred,
						trigger_time: Date.now(),
						// duration: sails.config.custom.cut_off_timer.rate_check_referred_duration,
						cut_off_time: Date.now() + (60000*Number(rate_check_referred_q_time.duration)),
						prev_leg_op: update_leg_op.id
					});
					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.addLegOps_central_operation, {newLegOp: create_leg_op});
					//console.log('created leg op details'+JSON.stringify(create_leg_op));
				} else{
					//this is to discard the awbleg becouse this case is for RATE_CHECK_REJECTED 
					let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
						id: req.body.awb_leg_id,
						station: req.body.station,
						awb_no: req.body.awb_no,
						from: req.body.from,
						created_by: req.body.created_by,
						void_on: Date.now(),// current timestamp
						void_reason: sails.config.custom.awb_leg_ops_status.rate_check_rejected,
					});

					if(voidAwbLeg){
						let legOps = await AWBLegOp.find({where: {awb_leg: voidAwbLeg.id, closing_status: ""}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
						if(legOps.length > 0){
							for(let i = 0; i < legOps.length; i++){
								let voidLegOp = await AWBLegOp.update({id: legOps[i].id}).set({closing_status: sails.config.custom.awb_leg_ops_status.discarded, acted_at_time: Date.now(), acted_by: req.user.username}).fetch();
							}
						}
					}

					sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'discardBooklistAwbLeg', {awbleg: voidAwbLeg});
					//let remaining_pieces =  -(Number(req.body.pieces));
					let blank_awb_leg = await sails.helpers.awbSanitizer.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						savedBy: "TODO",
					//	pieces: remaining_pieces
					});
					//console.log('++++$$$$+restorrrrreeeeeeee++++ '+JSON.stringify(blank_awb_leg));
					if(blank_awb_leg) {
						//	Broadcasting the information that the AWB is added
						sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
					}
				}
				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_operation, {oldLegOp: update_leg_op});
			}
		}
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.ok();
	},
};