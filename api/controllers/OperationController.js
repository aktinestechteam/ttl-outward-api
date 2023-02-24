/**
 * OperationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

	getOperation: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);

		result ={};
		reason_codes = await Reason.find({make_it_visible: true, category : sails.config.custom.reason_category.short_ship,}).sort('code ASC').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		//console.log('result'+JSON.stringify(reason_codes));
		result.reason_codes= reason_codes; // this is temporarry solution for rising cca due to unavailability of cca reasons

		offload_codes = await Reason.find({make_it_visible: true, category : sails.config.custom.reason_category.offload}).sort('code ASC').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		//console.log('result'+JSON.stringify(reason_codes));
		result.offload_codes= offload_codes;

		stations = await Station.find({select: ['iata', 'name', 'country']}).sort('iata ASC').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		result.stations= stations;

		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.view('pages/operation', result);
	},
	
	// getOperation: async function (req, res) {
	// 	console.log("inside")
	// 	sails.config.globals.async.series({
	// 		stations: function(callback) {
	// 			Station.find({select: ['iata', 'name', 'country']}).sort('iata ASC').exec(function(err, stations) {
	// 				callback(null, stations);
	// 			});
	// 		},
	// 		reason_codes: function(callback) {
	// 			Reason.find({make_it_visible: true, category : sails.config.custom.reason_category.short_ship,}).sort('code ASC').exec(function(err, shc_codes){
	// 				callback(null, reason_codes);
	// 			});
	// 		}
	// 	}, function(err, results) {
	// 		console.log('result'+JSON.stringify(results));
	// 		return res.view('pages/operation', results);
	// 	});
	// },

	getLegOps: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);

		let station = req.query.station;
		let department = req.query.department;
		let allValidLegops = [];
		let legops = await AWBLegOp.find({
			where: {
				acted_at_time: 0, 
				trigger_time: {'<=': Date.now()},
				station : station,
				department : department,
			}
		}).populate('awb_leg').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		
		for (let i = 0; i < legops.length; i++ ){
			let awbInfo = await AWBInfo.findOne({where:{ 'awb_no' : legops[i].awb_no}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
			legops[i].awb_info = awbInfo;
		}

		for(let i = 0; i < legops.length; i++){
			if(legops[i].awb_leg != null && (legops[i].awb_leg.status != sails.config.custom.database_model_enums.awb_leg_status.discarded ) && legops[i].awb_leg.void_on == 0){
				allValidLegops.push(legops[i]);
			}
		}
		
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		res.json(sails.config.custom.jsonResponse(null, allValidLegops));
	},
	
	
	delayFlight: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);

		let updatedAwbLeg;
		let check_active_leg = await AWBLeg.findOne({ where: { status: sails.config.custom.database_model_enums.awb_leg_status.pending, awb_no: req.body.awb_no, void_on: 0, id: req.body.awb_leg_id } }).populate('awb_info').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		
		if(check_active_leg){
			updatedAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
				id: req.body.awb_leg_id ,
				flight_no: req.body.flight_no,
				planned_departure: new Date(parseInt(req.body.flight_delay)),
				station: req.body.station,
				awb_no: req.body.awb_no,
				from: req.body.from,
				created_by: req.user.username
			});
		}

		let check_legop = await AWBLegOp.findOne({ where: { awb_leg: req.body.awb_leg_id, closing_status: "", opening_status: sails.config.custom.awb_leg_ops_status.ready_to_recovery } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		
		if(check_legop){
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: check_legop.id,
				awb_leg: check_legop.awb_leg,
				station: req.body.station,
				awb_no: req.body.awb_no,
				// ba80_notes: req.body.ba80_notes,
				release_notes: `Delay reported by ${req.user.username}`,
				closing_status: sails.config.custom.awb_leg_ops_status.flight_delay,
				acted_at_time: Date.now(),
				acted_by: req.user.username,
			});

			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_recovery, { oldLegOp: update_leg_op });
			
			let ready_to_recovery_starts=await OpsDuration.findOne({key: "ready_to_recovery_trigger_trigger"});
			let trigger_time = req.body.flight_delay + (60000*Number(ready_to_recovery_starts.duration));
			
			if(ready_to_recovery_starts.duration==0 || trigger_time<Date.now()){
				trigger_time= Date.now();
			}
			
			// getting ready to recovery q time
			let ready_to_recovery_q_time=await OpsDuration.findOne({key: "ready_to_recovery_q_time"});												
			let create_leg_op_ready_to_recovery = await sails.helpers.planner.updateAwbLegOp.with({
				station: req.body.station,
				awb_no: req.body.awb_no,
				awb_leg: req.body.awb_leg_id,
				op_name: sails.config.custom.op_name.recovery,
				department: sails.config.custom.department_name.central_rec,
				opening_status: sails.config.custom.awb_leg_ops_status.ready_to_recovery,
				trigger_time: trigger_time,
				cut_off_time: trigger_time + (60000*Number(ready_to_recovery_q_time.duration)),
				// duration: sails.config.custom.cut_off_timer.p2_escalation_duration,
				prev_leg_op: update_leg_op.id,
			});
		}
		
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.json(updatedAwbLeg);
	},

	getLegOp: async function(req,res){
		sails.config.log.addINlog(req.user.username, req.options.action);

		let id = req.query.operationId;
		let legop = await AWBLegOp.findOne({
			where: {
				id: id
			}
		}).populate('awb_leg').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

		sails.config.log.addOUTlog(req.user.username, req.options.action);
		res.json(sails.config.custom.jsonResponse(null, legop));
	},
};
