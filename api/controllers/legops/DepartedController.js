/**
 * DepartureController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


module.exports = {

	getExistingCCARequest: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		
		let result = {};
		sails.config.log.addlog(4, req.user.username, req.options.action, 'getExistingCCARequest ' + JSON.stringify(req.query));

		//let results = await BookList.find().catch(err => console.log( err.message));
		let existing_cca_requests = await CCARequest.find().where({ 'awb_no': req.query.awbNo }).populate('cca_leg_op').populate('cca_approval').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

		if (existing_cca_requests.length > 0) {
			for (let i = 0; i < existing_cca_requests.length; i++) {
				if (existing_cca_requests[i].cca_leg_op.awb_leg == req.query.awb_leg_id) {
					let awb_leg = await AWBLeg.findOne({ where: { 'id': existing_cca_requests[i].cca_leg_op.awb_leg } }).populate('awb_info').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
					existing_cca_requests[i].awb_leg_details = awb_leg;
					sails.config.log.addlog(3, req.user.username, req.options.action, 'called from get existing awbleg ' + JSON.stringify(existing_cca_requests[i].awb_leg_details));
				}
			}
		}
		res.json(existing_cca_requests);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'called from get existing cca requests ' + JSON.stringify(existing_cca_requests));
		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	getExistingCCAApprovalRequest: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'getExistingCCAApprovalRequest ' + JSON.stringify(req.query));
		//let results = await BookList.find().catch(err => console.log( err.message));

		let existing_cca_approval = await CCAApproval.findOne({ where: { 'awb_no': req.query.awbNo, 'status': sails.config.custom.cca_approval_status.pending } }).populate('cca_request').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))

		// let existing_cca_requests = await CCARequest.find().where({ 'awb_no': req.body.awbNo, 'cca_approval': existing_cca_approval.id }).populate('cca_leg_op').populate('cca_approval').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		// if (existing_cca_requests.length > 0) {
		// 	for (let i = 0; i < existing_cca_requests.length; i++) {
		// 		let awb_leg = await AWBLeg.findOne({ where: { 'id': existing_cca_requests[i].cca_leg_op.awb_leg } }).populate('awb_info').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
		// 		existing_cca_requests[i].awb_leg_details = awb_leg;
		// 		console.log('called from get existing awbleg ' + JSON.stringify(existing_cca_requests[i].awb_leg_details));
		// 	}
		// }
		res.json(existing_cca_approval);

		sails.config.log.addlog(3, req.user.username, req.options.action, 'called from get existing cca requests ' + JSON.stringify(existing_cca_approval));
		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	preAlertPending: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'preAlertPending input' + JSON.stringify(req.body));

		let check_legop_action = await AWBLegOp.findOne({ where: { id: req.body.awb_legop_id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if (check_legop_action.closing_status) {
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by);
			sails.config.log.addOUTlog(req.user.username, req.options.action);
			return res.send({
				error: 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else {
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: req.body.awb_legop_id,
				awb_leg: req.body.awb_leg_id,
				station: req.body.station,
				awb_no: req.body.awb_no,
				ba80_notes: req.body.ba80_notes,
				release_notes: req.body.reason,
				closing_status: req.body.closing_status,
				acted_at_time: Date.now(),
				acted_by: req.user.username,
			});
			
			sails.config.log.addlog(3, req.user.username, req.options.action, 'updated leg op details' + JSON.stringify(update_leg_op));

			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_operation, { oldLegOp: update_leg_op });
			
			let updateAwbPreAlertDone = await sails.helpers.planner.updateAwb.with({ awb_no: req.body.awb_no, station: req.body.station, pre_alert: true });
		}
		
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.ok();
	},

	euicsPending: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, `euicsPending input ${JSON.stringify(req.body)}`);

		let check_legop_action = await AWBLegOp.findOne({ where: { id: req.body.awb_legop_id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))

		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if (check_legop_action.closing_status) {
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by);
			sails.config.log.addOUTlog(req.user.username, req.options.action);

			return res.send({
				error: 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else {
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: req.body.awb_legop_id,
				awb_leg: req.body.awb_leg_id,
				station: req.body.station,
				awb_no: req.body.awb_no,
				ba80_notes: req.body.ba80_notes,
				release_notes: req.body.reason,
				closing_status: req.body.closing_status,
				acted_at_time: Date.now(),
				acted_by: req.user.username,
			});
			
			let euics_discrepency_q_time=await OpsDuration.findOne({key: "euics_discr_pending_q_time"});

			if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.euics_discrepancy) {
				let create_leg_op_euics_discrepancy_pending = await sails.helpers.planner.updateAwbLegOp.with({
					station: req.body.station,
					awb_no: req.body.awb_no,
					awb_leg: req.body.awb_leg_id,
					op_name: sails.config.custom.op_name.euics,
					department: sails.config.custom.department_name.airport_ops,
					opening_status: sails.config.custom.awb_leg_ops_status.euics_discrepancy_pending,
					trigger_time: Date.now(),
					// duration: sails.config.custom.cut_off_timer.euics_discrepancy_pending_duration,
					cut_off_time: Date.now() + (60000*Number(euics_discrepency_q_time.duration)),
					prev_leg_op: update_leg_op.id
				});
			
				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_airport_operation, { newLegOp: create_leg_op_euics_discrepancy_pending });

			} else if (Array.isArray(req.body.CCA) && req.body.CCA.length > 0) {
				let create_cca = await CCARequest.create({
					awb_no: req.body.awb_no,
					priority: 0, //need to ask but required field	
					station: req.body.station,
					raised_by: req.user.username,
					raised_by_dept: update_leg_op.department,
					reason: req.body.CCA,
					reason_text: 'XXXXXXXXTODOXXXXXXXX', //need to ask but required field
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

				create_leg_op_cca_request.CCARequest = await CCARequest.findOne({ where: { cca_leg_op: create_leg_op_cca_request.id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

				sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  ' + JSON.stringify(create_leg_op_cca_request));

				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: create_leg_op_cca_request })
			} else {
				let updateAwbEUICSDone = await sails.helpers.planner.updateAwb.with({ awb_no: req.body.awb_no, station: req.body.station, euics: true });
			}

			sails.config.log.addlog(3, req.user.username, req.options.action, 'updated leg op details' + JSON.stringify(update_leg_op));

			// sails.sockets.broadcast(sails.config.custom.socket.room_name.planner, 'changeInBooklist', { awbleg: voidAwbLeg });
			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_operation, { oldLegOp: update_leg_op });
		}

		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.ok();
	},

	capAPending: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, '+++++++++++++++++++++++cap a Pending input' + JSON.stringify(req.body));
		let check_legop_action = await AWBLegOp.findOne({ where: { id: req.body.awb_legop_id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if (check_legop_action.closing_status) {
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by);
			return res.send({
				error: 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else {
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

			let cap_a_discr_q_time=await OpsDuration.findOne({key: "euics_discr_pending_q_time"});
			if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.cap_a_discrepancy) {
				let create_leg_op_cap_a_discrepancy_pending = await sails.helpers.planner.updateAwbLegOp.with({
					station: req.body.station,
					awb_no: req.body.awb_no,
					awb_leg: req.body.awb_leg_id,
					op_name: sails.config.custom.op_name.cap_awb,
					department: sails.config.custom.department_name.central_fin,
					opening_status: sails.config.custom.awb_leg_ops_status.cap_a_discrepancy_pending,
					trigger_time: Date.now(),
					// duration: sails.config.custom.cut_off_timer.cap_a_discrepancy_pending_duration,
					cut_off_time: Date.now() + (60000*Number(cap_a_discr_q_time.duration)),
					prev_leg_op: update_leg_op.id
				});
				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: create_leg_op_cap_a_discrepancy_pending });

			} else if (Array.isArray(req.body.CCA) && req.body.CCA.length > 0) {
				let create_cca = await CCARequest.create({
					awb_no: req.body.awb_no,
					priority: 0, //need to ask but required field	
					station: req.body.station,
					raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
					raised_by_dept: update_leg_op.department,
					reason: req.body.CCA,
					reason_text: 'XXXXXXXXTODOXXXXXXXX', //need to ask but required field
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

				create_leg_op_cca_request.CCARequest = await CCARequest.findOne({ where: { cca_leg_op: create_leg_op_cca_request.id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

				sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  ' + JSON.stringify(create_leg_op_cca_request));

				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: create_leg_op_cca_request })
			} else {
				let updateAwbCAPADone = await sails.helpers.planner.updateAwb.with({ awb_no: req.body.awb_no, station: req.body.station, cap_a: true });
			}

			sails.config.log.addlog(3, req.user.username, req.options.action, 'updated leg op details' + JSON.stringify(update_leg_op));
			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_operation, { oldLegOp: update_leg_op });
		}
		sails.config.log.addOUTlog(req.user.username, "capAPending");
		return res.ok();
	},

	eAwbCheckPending: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'eAwbCheckPending input' + JSON.stringify(req.body));
		let check_legop_action = await AWBLegOp.findOne({ where: { id: req.body.awb_legop_id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if (check_legop_action.closing_status) {
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by);
			return res.send({
				error: 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else {
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: req.body.awb_legop_id,
				awb_leg: req.body.awb_leg_id,
				station: req.body.station,
				awb_no: req.body.awb_no,
				ba80_notes: req.body.ba80_notes,
				release_notes: req.body.reason,
				closing_status: req.body.closing_status,
				acted_at_time: Date.now(),
				acted_by: req.user.username,
			});
			//Updating AWBInfo record with awbType() and amendedawb(true or false)
			if(update_leg_op){
				let awbInfo = await AWBInfo.update({awb_no: update_leg_op.awb_no}).set({awb_type: req.body.awb_type, amended_awb: req.body.amended_awb}).fetch();
			}
			sails.config.log.addlog(3, req.user.username, req.options.action, 'updated leg op details' + JSON.stringify(update_leg_op));
			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_operation, { oldLegOp: update_leg_op });

			let updateAwbEAwbCheckDone = await sails.helpers.planner.updateAwb.with({ awb_no: req.body.awb_no, station: req.body.station, eawb_check: true });

			if (Array.isArray(req.body.CCA) && req.body.CCA.length > 0) {
				let create_cca = await CCARequest.create({
					awb_no: req.body.awb_no,
					priority: 0, //need to ask but required field	
					station: req.body.station,
					raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
					raised_by_dept: update_leg_op.department,
					reason: req.body.CCA,
					reason_text: 'XXXXXXXXTODOXXXXXXXX', //need to ask but required field
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

				create_leg_op_cca_request.CCARequest = await CCARequest.findOne({ where: { cca_leg_op: create_leg_op_cca_request.id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

				sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  ' + JSON.stringify(create_leg_op_cca_request));

				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: create_leg_op_cca_request })

			}
		}
		sails.config.log.addOUTlog(req.user.username, "eAwbCheckPending");
		return res.ok();
	},


	euicsDiscrepancyPending: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'euicsDiscrepancyPending input' + JSON.stringify(req.body));
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
		sails.config.log.addlog(3, req.user.username, req.options.action, 'updated leg op details' + JSON.stringify(update_leg_op));
		sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_airport_operation, { oldLegOp: update_leg_op });

		if (Array.isArray(req.body.CCA) && req.body.CCA.length > 0) {
			let create_cca = await CCARequest.create({
				awb_no: req.body.awb_no,
				priority: 0, //need to ask but required field	
				station: req.body.station,
				raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
				raised_by_dept: update_leg_op.department,
				reason: req.body.CCA,
				reason_text: 'XXXXXXXXTODOXXXXXXXX', //need to ask but required field
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

			create_leg_op_cca_request.CCARequest = await CCARequest.findOne({ where: { cca_leg_op: create_leg_op_cca_request.id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

			sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  ' + JSON.stringify(create_leg_op_cca_request));

			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: create_leg_op_cca_request })
		}
		let updateAwbEuicsDone = await sails.helpers.planner.updateAwb.with({ awb_no: req.body.awb_no, station: req.body.station, euics: true });
		sails.config.log.addOUTlog(req.user.username, "euicsDiscrepancyPending");
		return res.ok();
	},

	capADiscrepancyPending: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'capADiscrepancyPending input' + JSON.stringify(req.body));
		let check_legop_action = await AWBLegOp.findOne({ where: { id: req.body.awb_legop_id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if (check_legop_action.closing_status) {
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by);
			return res.send({
				error: 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else {
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
			sails.config.log.addlog(3, req.user.username, req.options.action, 'updated leg op details' + JSON.stringify(update_leg_op));
			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_finance, { oldLegOp: update_leg_op });

			if (Array.isArray(req.body.CCA) && req.body.CCA.length > 0) {
				let create_cca = await CCARequest.create({
					awb_no: req.body.awb_no,
					priority: 0, //need to ask but required field	
					station: req.body.station,
					raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
					raised_by_dept: update_leg_op.department,
					reason: req.body.CCA,
					reason_text: 'XXXXXXXXTODOXXXXXXXX', //need to ask but required field
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
				create_leg_op_cca_request.CCARequest = await CCARequest.findOne({ where: { cca_leg_op: create_leg_op_cca_request.id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

				sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  ' + JSON.stringify(create_leg_op_cca_request));

				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: create_leg_op_cca_request })
			}
			let updateAwbCAPADone = await sails.helpers.planner.updateAwb.with({ awb_no: req.body.awb_no, station: req.body.station, cap_a: true });
		}
		sails.config.log.addOUTlog(req.user.username, "capADiscrepancyPending");
		return res.ok();
	},

	readyToRecovery: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'readyToRecovery input' + JSON.stringify(req.body));
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
		sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_recovery, { oldLegOp: update_leg_op });
		if (update_leg_op) {
			if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.assign_flight_to_recovery) {
				let flyflightDetails = (req.body.flightSelector).split(",");
				let flightNo = flyflightDetails[0];
				let flightTime = flyflightDetails[1];
				let flightArrivalTime = flyflightDetails[2];
				
				sails.config.log.addlog(3, req.user.username, req.options.action, 'assign_flight_to_recovery');
				let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
					id: req.body.awb_leg_id,
					station: req.body.station,
					awb_no: req.body.awb_no,
					from: req.body.from,
					created_by: req.body.created_by,
					void_on: Date.now(),// current timestamp
					void_reason: req.body.void_reason,
				});
				if (voidAwbLeg) {
					sails.config.log.addlog(3, req.user.username, req.options.action, 'voidawbLeg details = ' + JSON.stringify(voidAwbLeg))
					let awb_leg = await sails.helpers.planner.updateAwbLeg.with({
						awb_info: voidAwbLeg.awb_info.id,
						station: voidAwbLeg.station,								//	COMPULSORY
						awb_no: voidAwbLeg.awb_no,							//	Compulsory to create
						from: voidAwbLeg.from,			//	COMPULSORY
						to: req.body.to,	//this will change
						pieces: voidAwbLeg.pieces,
						weight: voidAwbLeg.weight,
						flight_no: flightNo,
						planned_departure: flightTime,
						planned_arrival: flightArrivalTime,
						created_by: req.body.created_by,							//	Compulsory to create
						transhipment: false,
						status: sails.config.custom.database_model_enums.awb_leg_status.pending,// 
					});
					let ready_to_recovery_starts=await OpsDuration.findOne({key: "ready_to_recovery_trigger_trigger"});
					let trigger_time = awb_leg.planned_departure + (60000*Number(ready_to_recovery_starts.duration));
					if(ready_to_recovery_starts.duration==0 || trigger_time<Date.now()){
						trigger_time= Date.now();
					}
					// getting ready to recovery q time
					let ready_to_recovery_q_time=await OpsDuration.findOne({key: "ready_to_recovery_q_time"});
					
					let create_recovery_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
						station: awb_leg.station,
						awb_no: awb_leg.awb_no,
						awb_leg: awb_leg.id,
						op_name: sails.config.custom.op_name.recovery,
						department: sails.config.custom.department_name.central_rec,
						opening_status: sails.config.custom.awb_leg_ops_status.ready_to_recovery,
						trigger_time: trigger_time,
						cut_off_time: trigger_time + (60000*Number(ready_to_recovery_q_time.duration))
						// duration: sails.config.custom.cut_off_timer.ready_to_recovery_duration
					});
				}
			}
			else if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.p2_escalation) {
				sails.config.log.addlog(3, req.user.username, req.options.action, 'P2 escalation');
				let p2_escalation_q_time=await OpsDuration.findOne({key: "p2_escalation_q_time"});
				let p2_escalation_trigger_time;
				if(update_leg_op.awb_info.priority_class=="M_CLASS"){
					p2_escalation_trigger_time=await OpsDuration.findOne({key: "p2_escalation_M_trigger_trigger"});
				}
				else if(update_leg_op.awb_info.priority_class=="F_CLASS"){
					p2_escalation_trigger_time=await OpsDuration.findOne({key: "p2_escalation_F_trigger_trigger"});
				}
				let triggerTime=Date.now()+ (60000*Number(p2_escalation_trigger_time.duration))
																	
				let create_leg_op_p2_escalation = await sails.helpers.planner.updateAwbLegOp.with({
					station: req.body.station,
					awb_no: req.body.awb_no,
					awb_leg: req.body.awb_leg_id,
					op_name: sails.config.custom.op_name.recovery,
					department: sails.config.custom.department_name.central_rec,
					opening_status: sails.config.custom.awb_leg_ops_status.p2_escalation,
					trigger_time: triggerTime,
					cut_off_time: triggerTime + (60000*Number(p2_escalation_q_time.duration)),
					// duration: sails.config.custom.cut_off_timer.p2_escalation_duration,
					prev_leg_op: update_leg_op.id
				});
				// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_recovery, { newLegOp: create_leg_op_p2_escalation });
			}
			else if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.p1_escalation) {
				sails.config.log.addlog(3, req.user.username, req.options.action, 'p1 escalation');
				let p1_escalation_q_time=await OpsDuration.findOne({key: "p1_escalation_q_time"});
				let p1_escalation_trigger_time;
				if(update_leg_op.awb_info.priority_class=="M_CLASS"){
					p1_escalation_trigger_time=await OpsDuration.findOne({key: "p1_escalation_M_trigger_trigger"});
				}
				else if(update_leg_op.awb_info.priority_class=="F_CLASS"){
					p1_escalation_trigger_time=await OpsDuration.findOne({key: "p1_escalation_F_trigger_trigger"});
				}
				let triggerTime=Date.now()+ (60000*Number(p1_escalation_trigger_time.duration))
				
				let create_leg_op_p1_escalation = await sails.helpers.planner.updateAwbLegOp.with({
					station: req.body.station,
					awb_no: req.body.awb_no,
					awb_leg: req.body.awb_leg_id,
					op_name: sails.config.custom.op_name.recovery,
					department: sails.config.custom.department_name.central_rec,
					opening_status: sails.config.custom.awb_leg_ops_status.p1_escalation,
					trigger_time: triggerTime,
					cut_off_time: triggerTime + (60000*Number(p1_escalation_q_time.duration)),
					// duration: sails.config.custom.cut_off_timer.p1_escalation_duration,
					prev_leg_op: update_leg_op.id
				});
				// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_recovery, { newLegOp: create_leg_op_p1_escalation });
			}
			else if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.escalation) {
				sails.config.log.addlog(3, req.user.username, req.options.action, 'escalation');
				let escalation_q_time=await OpsDuration.findOne({key: "escalation_q_time"});
				
				let escalation_trigger_time;
				if(update_leg_op.awb_info.priority_class=="M_CLASS"){
					escalation_trigger_time=await OpsDuration.findOne({key: "escalation_M_trigger_trigger"});
				}
				else if(update_leg_op.awb_info.priority_class=="F_CLASS"){
					escalation_trigger_time=await OpsDuration.findOne({key: "escalation_F_trigger_trigger"});
				}
				let triggerTime=Date.now()+ (60000*Number(escalation_trigger_time.duration))
				
				
				let create_leg_op_escalation = await sails.helpers.planner.updateAwbLegOp.with({
					station: req.body.station,
					awb_no: req.body.awb_no,
					awb_leg: req.body.awb_leg_id,
					op_name: sails.config.custom.op_name.recovery,
					department: sails.config.custom.department_name.central_rec,
					opening_status: sails.config.custom.awb_leg_ops_status.escalation,
					trigger_time: triggerTime,
					cut_off_time: triggerTime + (60000*Number(escalation_q_time.duration)),
					// duration: sails.config.custom.cut_off_timer.escalation_duration,
					prev_leg_op: update_leg_op.id
				});
				// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_recovery, { newLegOp: create_leg_op_escalation });
			}
			else if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.recovered) {
				sails.config.log.addlog(3, req.user.username, req.options.action, 'recovered'); //need to add actual pieces flown
				//need to update actual pieces and weight to proper awbleg of that booklist record who is valid
				let find_awb_leg = await AWBLeg.findOne({ id: req.body.awb_leg_id }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

				sails.config.log.addlog(3, req.user.username, req.options.action, 'find_awb_leg = = ' + JSON.stringify(find_awb_leg));
				if (find_awb_leg) {
					let update_awb_leg = await sails.helpers.planner.updateAwbLeg.with({
						id: find_awb_leg.id,
						station: req.body.station,
						awb_no: find_awb_leg.awb_no,
						from: find_awb_leg.from,
						created_by: find_awb_leg.created_by,
						actual_pieces_flown: Number(req.body.pieces),
						actual_weight_flown: Number(req.body.weight),
						status: sails.config.custom.database_model_enums.awb_leg_status.completed
					});
					let from_station_sanitizer = await sails.helpers.awbSanitizer.with({
						station: find_awb_leg.from,
						awb_no: find_awb_leg.awb_no,
						savedBy: req.body.created_by,
					});
					let to_station_sanitizer = await sails.helpers.awbSanitizer.with({
						station: find_awb_leg.to,
						awb_no: find_awb_leg.awb_no,
						savedBy: req.body.created_by,
					});
				}
			}
			else if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.flight_delay) {
				sails.config.log.addlog(3, req.user.username, req.options.action, 'flight delay');

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
		
				
				let updatedAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
					id: update_leg_op.awb_leg.id,
					flight_no: req.body.flight_no,
					planned_departure: new Date(parseInt(req.body.flight_delay)),
					station: req.body.station,
					awb_no: req.body.awb_no,
					from: req.body.from,
					created_by: "System"
				});
			
			}
			if (req.body.closing_status != sails.config.custom.awb_leg_ops_status.recovered) {
				if(req.body.customer_update){
					await sails.helpers.planner.updateAwb.with({
						awb_no: req.body.awb_no,
						customer_update: req.body.customer_update,
						station: req.body.station,
					});
				}
			
			}
			if (Array.isArray(req.body.CCA) && req.body.CCA.length > 0) {
				let create_cca = await CCARequest.create({
					awb_no: req.body.awb_no,
					priority: 0, //need to ask but required field	
					station: req.body.station,
					raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
					raised_by_dept: update_leg_op.department,
					reason: req.body.CCA,
					reason_text: 'XXXXXXXXTODOXXXXXXXX', //need to ask but required field
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

				create_leg_op_cca_request.CCARequest = await CCARequest.findOne({ where: { cca_leg_op: create_leg_op_cca_request.id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

				sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  ' + JSON.stringify(create_leg_op_cca_request));

				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: create_leg_op_cca_request })
			}
		}
		sails.config.log.addOUTlog(req.user.username, "readyToRecovery");
		return res.ok();
	},

	p2Escalation: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'p2 escalation input' + JSON.stringify(req.body));
		let check_legop_action = await AWBLegOp.findOne({ where: { id: req.body.awb_legop_id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if (check_legop_action.closing_status) {
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by);
			return res.send({
				error: 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else {
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
			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_recovery, { oldLegOp: update_leg_op });
			if (update_leg_op) {
				if(req.body.customer_update){
					await sails.helpers.planner.updateAwb.with({
						awb_no: req.body.awb_no,
						customer_update: req.body.customer_update,
						station: req.body.station,
					});
				}
				
				if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.assign_flight_to_recovery) {
					let flyflightDetails = (req.body.flightSelector).split(",");
					let flightNo = flyflightDetails[0];
					let flightTime = flyflightDetails[1];
					let flightArrivalTime = flyflightDetails[2];

					sails.config.log.addlog(3, req.user.username, req.options.action, 'assign_flight_to_recovery');
					let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
						id: req.body.awb_leg_id,
						station: req.body.station,
						awb_no: req.body.awb_no,
						from: req.body.from,
						created_by: req.body.created_by,
						void_on: Date.now(),// current timestamp
						void_reason: req.body.void_reason,
					});
					if (voidAwbLeg) {
						sails.config.log.addlog(3, req.user.username, req.options.action, 'voidawbLeg details = ' + JSON.stringify(voidAwbLeg))
						let awb_leg = await sails.helpers.planner.updateAwbLeg.with({
							awb_info: voidAwbLeg.awb_info.id,
							station: voidAwbLeg.station,								//	COMPULSORY
							awb_no: voidAwbLeg.awb_no,							//	Compulsory to create
							from: voidAwbLeg.from,			//	COMPULSORY
							to: req.body.to,	//this will change
							pieces: voidAwbLeg.pieces,
							weight: voidAwbLeg.weight,
							flight_no: flightNo,
							planned_departure: flightTime,
							planned_arrival: flightArrivalTime,
							created_by: req.body.created_by,							//	Compulsory to create
							transhipment: false,
							status: sails.config.custom.database_model_enums.awb_leg_status.pending,// 
						});

						let ready_to_recovery_starts=await OpsDuration.findOne({key: "ready_to_recovery_trigger_trigger"});
						let trigger_time = awb_leg.planned_departure + (60000*Number(ready_to_recovery_starts.duration));
						if(ready_to_recovery_starts.duration==0 || trigger_time<Date.now()){
							trigger_time= Date.now();
						}
						// getting ready to recovery q time
						let ready_to_recovery_q_time=await OpsDuration.findOne({key: "ready_to_recovery_q_time"});
					
						let create_recovery_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
							station: awb_leg.station,
							awb_no: awb_leg.awb_no,
							awb_leg: awb_leg.id,
							op_name: sails.config.custom.op_name.recovery,
							department: sails.config.custom.department_name.central_rec,
							opening_status: sails.config.custom.awb_leg_ops_status.ready_to_recovery,
							trigger_time: trigger_time,
							cut_off_time: trigger_time + (60000*Number(ready_to_recovery_q_time.duration))
						
							// duration: sails.config.custom.cut_off_timer.ready_to_recovery_duration
						});
					}
				}
				else if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.p1_escalation) {
					sails.config.log.addlog(3, req.user.username, req.options.action, 'p1 escalation');
					let p1_escalation_q_time=await OpsDuration.findOne({key: "p1_escalation_q_time"});
					let p1_escalation_trigger_time;
					if(update_leg_op.awb_info.priority_class=="M_CLASS"){
						p1_escalation_trigger_time=await OpsDuration.findOne({key: "p1_escalation_M_trigger_trigger"});
					}
					else if(update_leg_op.awb_info.priority_class=="F_CLASS"){
						p1_escalation_trigger_time=await OpsDuration.findOne({key: "p1_escalation_F_trigger_trigger"});
					}
					let triggerTime=Date.now()+ (60000*Number(p1_escalation_trigger_time.duration))
					
					let create_leg_op_p1_escalation = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.recovery,
						department: sails.config.custom.department_name.central_rec,
						opening_status: sails.config.custom.awb_leg_ops_status.p1_escalation,
						trigger_time: triggerTime,
						cut_off_time: triggerTime + (60000*Number(p1_escalation_q_time.duration)),
						// duration: sails.config.custom.cut_off_timer.p1_escalation_duration,
						prev_leg_op: update_leg_op.id
					});
					// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_recovery, { newLegOp: create_leg_op_p1_escalation });
				}
				else if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.escalation) {
					sails.config.log.addlog(3, req.user.username, req.options.action, 'escalation');
					let escalation_q_time=await OpsDuration.findOne({key: "escalation_q_time"});
					
					let escalation_trigger_time;
					if(update_leg_op.awb_info.priority_class=="M_CLASS"){
						escalation_trigger_time=await OpsDuration.findOne({key: "escalation_M_trigger_trigger"});
					}
					else if(update_leg_op.awb_info.priority_class=="F_CLASS"){
						escalation_trigger_time=await OpsDuration.findOne({key: "escalation_F_trigger_trigger"});
					}
					let triggerTime=Date.now()+ (60000*Number(escalation_trigger_time.duration))
				
					
					let create_leg_op_escalation = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.recovery,
						department: sails.config.custom.department_name.central_rec,
						opening_status: sails.config.custom.awb_leg_ops_status.escalation,
						trigger_time: triggerTime,
						cut_off_time: triggerTime + (60000*Number(escalation_q_time.duration)),
						// duration: sails.config.custom.cut_off_timer.escalation_duration,
						prev_leg_op: update_leg_op.id
					});
					// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_recovery, { newLegOp: create_leg_op_escalation });
				}
				if (Array.isArray(req.body.CCA) && req.body.CCA.length > 0) {
					let create_cca = await CCARequest.create({
						awb_no: req.body.awb_no,
						priority: 0, //need to ask but required field	
						station: req.body.station,
						raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
						raised_by_dept: update_leg_op.department,
						reason: req.body.CCA,
						reason_text: 'XXXXXXXXTODOXXXXXXXX', //need to ask but required field
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

					create_leg_op_cca_request.CCARequest = await CCARequest.findOne({ where: { cca_leg_op: create_leg_op_cca_request.id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

					sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  ' + JSON.stringify(create_leg_op_cca_request));

					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: create_leg_op_cca_request })
				}
				// else if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.recovered){
				// 	console.log('recovered');//need to add actual pieces flown

				// 	let find_awb_leg = await AWBLeg.findOne({id:req.body.awb_leg_id}).catch(err => console.log( err.message));

				// 	console.log('find_awb_leg = = '+ JSON.stringify(find_awb_leg));
				// 	if(find_awb_leg){
				// 		let update_awb_leg = await sails.helpers.planner.updateAwbLeg.with({
				// 			id: find_awb_leg.id,
				// 			station: req.body.station,
				// 			awb_no: find_awb_leg.awb_no,
				// 			from: find_awb_leg.from,
				// 			created_by: find_awb_leg.created_by,
				// 			actual_pieces_flown: Number(req.body.pieces),
				// 			actual_weight_flown: Number(req.body.weight),
				// 			status: sails.config.custom.database_model_enums.awb_leg_status.completed
				// 		});
				// 		let from_station_sanitizer = await sails.helpers.awbSanitizer.with({
				// 			station: find_awb_leg.from,
				// 			awb_no: find_awb_leg.awb_no,
				// 			savedBy: req.body.created_by,
				// 		});
				// 		let to_station_sanitizer = await sails.helpers.awbSanitizer.with({
				// 			station: find_awb_leg.to,
				// 			awb_no: find_awb_leg.awb_no,
				// 			savedBy: req.body.created_by,
				// 		});
				// 	}
				// }
			}
		}
		sails.config.log.addOUTlog(req.user.username, "p2Escalation");
		return res.ok();
	},

	p1Escalation: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'escalation input' + JSON.stringify(req.body));
		let check_legop_action = await AWBLegOp.findOne({ where: { id: req.body.awb_legop_id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if (check_legop_action.closing_status) {
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by);
			return res.send({
				error: 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else {
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
			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_recovery, { oldLegOp: update_leg_op });
			if (update_leg_op) {
				if(req.body.customer_update){
					await sails.helpers.planner.updateAwb.with({
						awb_no: req.body.awb_no,
						customer_update: req.body.customer_update,
						station: req.body.station,
					});
				}
				if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.assign_flight_to_recovery) {
					let flyflightDetails = (req.body.flightSelector).split(",");
					let flightNo = flyflightDetails[0];
					let flightTime = flyflightDetails[1];
					let flightArrivalTime = flyflightDetails[2];

					sails.config.log.addlog(3, req.user.username, req.options.action, 'assign_flight_to_recovery');
					let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
						id: req.body.awb_leg_id,
						station: req.body.station,
						awb_no: req.body.awb_no,
						from: req.body.from,
						created_by: req.body.created_by,
						void_on: Date.now(),// current timestamp
						void_reason: req.body.void_reason,
					});
					if (voidAwbLeg) {
						sails.config.log.addlog(3, req.user.username, req.options.action, 'voidawbLeg details = ' + JSON.stringify(voidAwbLeg))
						let awb_leg = await sails.helpers.planner.updateAwbLeg.with({
							awb_info: voidAwbLeg.awb_info.id,
							station: voidAwbLeg.station,								//	COMPULSORY
							awb_no: voidAwbLeg.awb_no,							//	Compulsory to create
							from: voidAwbLeg.from,			//	COMPULSORY
							to: req.body.to,	//this will change
							pieces: voidAwbLeg.pieces,
							weight: voidAwbLeg.weight,
							flight_no: flightNo,
							planned_departure: flightTime,
							planned_arrival: flightArrivalTime,
							created_by: req.body.created_by,							//	Compulsory to create
							transhipment: false,
							status: sails.config.custom.database_model_enums.awb_leg_status.pending,// 
						});

						let ready_to_recovery_starts=await OpsDuration.findOne({key: "ready_to_recovery_trigger_trigger"});
						let trigger_time = awb_leg.planned_departure + (60000*Number(ready_to_recovery_starts.duration));
						if(ready_to_recovery_starts.duration==0 || trigger_time<Date.now()){
							trigger_time= Date.now();
						}
						// getting ready to recovery q time
						let ready_to_recovery_q_time=await OpsDuration.findOne({key: "ready_to_recovery_q_time"});
						
						let create_recovery_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
							station: awb_leg.station,
							awb_no: awb_leg.awb_no,
							awb_leg: awb_leg.id,
							op_name: sails.config.custom.op_name.recovery,
							department: sails.config.custom.department_name.central_rec,
							opening_status: sails.config.custom.awb_leg_ops_status.ready_to_recovery,
							trigger_time: trigger_time,
							cut_off_time: trigger_time + (60000*Number(ready_to_recovery_q_time.duration))
						
							// duration: sails.config.custom.cut_off_timer.ready_to_recovery_duration
						});
					}
				}
				else if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.escalation) {
					sails.config.log.addlog(3, req.user.username, req.options.action, 'escalation');
					let escalation_q_time=await OpsDuration.findOne({key: "escalation_q_time"});
					let escalation_trigger_time;
					if(update_leg_op.awb_info.priority_class=="M_CLASS"){
						escalation_trigger_time=await OpsDuration.findOne({key: "escalation_M_trigger_trigger"});
					}
					else if(update_leg_op.awb_info.priority_class=="F_CLASS"){
						escalation_trigger_time=await OpsDuration.findOne({key: "escalation_F_trigger_trigger"});
					}
					let triggerTime=Date.now()+ (60000*Number(escalation_trigger_time.duration))
					let create_leg_op_escalation = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.recovery,
						department: sails.config.custom.department_name.central_rec,
						opening_status: sails.config.custom.awb_leg_ops_status.escalation,
						trigger_time: triggerTime,
						cut_off_time: triggerTime + (60000*Number(escalation_q_time.duration)),
						// duration: sails.config.custom.cut_off_timer.escalation_duration,
						prev_leg_op: update_leg_op.id
					});
					// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_recovery, { newLegOp: create_leg_op_escalation });
				}

				if (Array.isArray(req.body.CCA) && req.body.CCA.length > 0) {
					let create_cca = await CCARequest.create({
						awb_no: req.body.awb_no,
						priority: 0, //need to ask but required field	
						station: req.body.station,
						raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
						raised_by_dept: update_leg_op.department,
						reason: req.body.CCA,
						reason_text: 'XXXXXXXXTODOXXXXXXXX', //need to ask but required field
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

					create_leg_op_cca_request.CCARequest = await CCARequest.findOne({ where: { cca_leg_op: create_leg_op_cca_request.id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

					sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  ' + JSON.stringify(create_leg_op_cca_request));

					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: create_leg_op_cca_request })
				}
				// else if(req.body.closing_status == sails.config.custom.awb_leg_ops_status.recovered){
				// 	console.log('recovered');//need to add actual pieces flown

				// 	let find_awb_leg = await AWBLeg.findOne({id:req.body.awb_leg_id}).catch(err => console.log( err.message));

				// 	console.log('find_awb_leg = = '+ JSON.stringify(find_awb_leg));
				// 	if(find_awb_leg){
				// 		let update_awb_leg = await sails.helpers.planner.updateAwbLeg.with({
				// 			id: find_awb_leg.id,
				// 			station: req.body.station,
				// 			awb_no: find_awb_leg.awb_no,
				// 			from: find_awb_leg.from,
				// 			created_by: find_awb_leg.created_by,
				// 			actual_pieces_flown: Number(req.body.pieces),
				// 			actual_weight_flown: Number(req.body.weight),
				// 			status: sails.config.custom.database_model_enums.awb_leg_status.completed
				// 		});
				// 		let from_station_sanitizer = await sails.helpers.awbSanitizer.with({
				// 			station: find_awb_leg.from,
				// 			awb_no: find_awb_leg.awb_no,
				// 			savedBy: req.body.created_by,
				// 		});
				// 		let to_station_sanitizer = await sails.helpers.awbSanitizer.with({
				// 			station: find_awb_leg.to,
				// 			awb_no: find_awb_leg.awb_no,
				// 			savedBy: req.body.created_by,
				// 		});
				// 	}
				// }
			}
		}
		sails.config.log.addOUTlog(req.user.username, "p1Escalation");
		return res.ok();
	},

	escalation: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'escalation input' + JSON.stringify(req.body));
		let check_legop_action = await AWBLegOp.findOne({ where: { id: req.body.awb_legop_id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if (check_legop_action.closing_status) {
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by);
			return res.send({
				error: 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else {
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
			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_recovery, { oldLegOp: update_leg_op });
			if (update_leg_op) {
				if(req.body.customer_update){
					await sails.helpers.planner.updateAwb.with({
						awb_no: req.body.awb_no,
						customer_update: req.body.customer_update,
						station: req.body.station,
					});
				}
				if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.assign_flight_to_recovery) {
					let flyflightDetails = (req.body.flightSelector).split(",");
					let flightNo = flyflightDetails[0];
					let flightTime = flyflightDetails[1];
					let flightArrivalTime = flyflightDetails[2];

					sails.config.log.addlog(3, req.user.username, req.options.action, 'assign_flight_to_recovery');
					let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
						id: req.body.awb_leg_id,
						station: req.body.station,
						awb_no: req.body.awb_no,
						from: req.body.from,
						created_by: req.body.created_by,
						void_on: Date.now(),// current timestamp
						void_reason: req.body.void_reason,
					});
					if (voidAwbLeg) {
						sails.config.log.addlog(3, req.user.username, req.options.action, 'voidawbLeg details = ' + JSON.stringify(voidAwbLeg))
						let awb_leg = await sails.helpers.planner.updateAwbLeg.with({
							awb_info: voidAwbLeg.awb_info.id,
							station: voidAwbLeg.station,								//	COMPULSORY
							awb_no: voidAwbLeg.awb_no,							//	Compulsory to create
							from: voidAwbLeg.from,			//	COMPULSORY
							to: req.body.to,	//this will change
							pieces: voidAwbLeg.pieces,
							weight: voidAwbLeg.weight,
							flight_no: flightNo,
							planned_departure: flightTime,
							planned_arrival: flightArrivalTime,
							created_by: req.body.created_by,							//	Compulsory to create
							transhipment: false,
							status: sails.config.custom.database_model_enums.awb_leg_status.pending,// 
						});
						let ready_to_recovery_starts=await OpsDuration.findOne({key: "ready_to_recovery_trigger_trigger"});
						let trigger_time = awb_leg.planned_departure + (60000*Number(ready_to_recovery_starts.duration));
						if(ready_to_recovery_starts.duration==0 || trigger_time<Date.now()){
							trigger_time= Date.now();
						}
						// getting ready to recovery q time
						let ready_to_recovery_q_time=await OpsDuration.findOne({key: "ready_to_recovery_q_time"});
						
						let create_recovery_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
							station: awb_leg.station,
							awb_no: awb_leg.awb_no,
							awb_leg: awb_leg.id,
							op_name: sails.config.custom.op_name.recovery,
							department: sails.config.custom.department_name.central_rec,
							opening_status: sails.config.custom.awb_leg_ops_status.ready_to_recovery,
							trigger_time: trigger_time,
							cut_off_time: trigger_time + (60000*Number(ready_to_recovery_q_time.duration))
						
							// duration: sails.config.custom.cut_off_timer.ready_to_recovery_duration
						});
					}
				}
				else if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.escalation) {
					sails.config.log.addlog(3, req.user.username, req.options.action, 'escalation');
					let escalation_q_time=await OpsDuration.findOne({key: "escalation_q_time"});
					let escalation_trigger_time;
					if(update_leg_op.awb_info.priority_class=="M_CLASS"){
						escalation_trigger_time=await OpsDuration.findOne({key: "escalation_M_trigger_trigger"});
					}
					else if(update_leg_op.awb_info.priority_class=="F_CLASS"){
						escalation_trigger_time=await OpsDuration.findOne({key: "escalation_F_trigger_trigger"});
					}
					let triggerTime=Date.now()+ (60000*Number(escalation_trigger_time.duration))
					
					let create_leg_op_escalation = await sails.helpers.planner.updateAwbLegOp.with({
						station: req.body.station,
						awb_no: req.body.awb_no,
						awb_leg: req.body.awb_leg_id,
						op_name: sails.config.custom.op_name.recovery,
						department: sails.config.custom.department_name.central_rec,
						opening_status: sails.config.custom.awb_leg_ops_status.escalation,
						trigger_time: triggerTime,
						cut_off_time: triggerTime + (60000*Number(escalation_q_time.duration)),
						prev_leg_op: update_leg_op.id
					});
					// sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_recovery, { newLegOp: create_leg_op_escalation });
				}
				else if (req.body.closing_status == sails.config.custom.awb_leg_ops_status.recovered) {
					sails.config.log.addlog(3, req.user.username, req.options.action, 'recovered');//need to add actual pieces flown

					let find_awb_leg = await AWBLeg.findOne({ id: req.body.awb_leg_id }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

					sails.config.log.addlog(3, req.user.username, req.options.action, 'find_awb_leg = = ' + JSON.stringify(find_awb_leg));
					if (find_awb_leg) {
						let update_awb_leg = await sails.helpers.planner.updateAwbLeg.with({
							id: find_awb_leg.id,
							station: req.body.station,
							awb_no: find_awb_leg.awb_no,
							from: find_awb_leg.from,
							created_by: find_awb_leg.created_by,
							actual_pieces_flown: Number(req.body.pieces),
							actual_weight_flown: Number(req.body.weight),
							status: sails.config.custom.database_model_enums.awb_leg_status.completed
						});
						let from_station_sanitizer = await sails.helpers.awbSanitizer.with({
							station: find_awb_leg.from,
							awb_no: find_awb_leg.awb_no,
							savedBy: req.body.created_by,
						});
						let to_station_sanitizer = await sails.helpers.awbSanitizer.with({
							station: find_awb_leg.to,
							awb_no: find_awb_leg.awb_no,
							savedBy: req.body.created_by,
						});
					}
				}
				if (Array.isArray(req.body.CCA) && req.body.CCA.length > 0) {
					let create_cca = await CCARequest.create({
						awb_no: req.body.awb_no,
						priority: 0, //need to ask but required field	
						station: req.body.station,
						raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
						raised_by_dept: update_leg_op.department,
						reason: req.body.CCA,
						reason_text: 'XXXXXXXXTODOXXXXXXXX', //need to ask but required field
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

					create_leg_op_cca_request.CCARequest = await CCARequest.findOne({ where: { cca_leg_op: create_leg_op_cca_request.id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

					sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  ' + JSON.stringify(create_leg_op_cca_request));

					sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: create_leg_op_cca_request })
				}
			}
		}
		sails.config.log.addOUTlog(req.user.username, "escalation");
		return res.ok();
	},

	ccaRequest: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'ccaRequest input' + JSON.stringify(req.body));

		sails.config.log.addlog(3, req.user.username, req.options.action, 'requestedCCA length =====' + req.body.cca_request_table.length);
		let awbInfo=await AWBInfo.findOne({'awb_no':req.body.awb_no}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

		// //call helper for updating/creating cca 
		let entry_in_cca = await sails.helpers.updateCcaApproval.with({
			awb_no: req.body.awb_no,
			awb_leg_id: req.body.awb_leg_id,
			station: req.body.station,
			cca_records_id: req.body.cca_request_table,
			cca_records_data: req.body.ccaFormData,
			issuer_name: awbInfo.issuer_name,
		});



		if (req.body.cca_request_table.length > 0) {
			for (let i = 0; i < req.body.cca_request_table.length; i++) {
				let requestedCCA = await CCARequest.findOne({ where: { id: req.body.cca_request_table[i] } }).populate('cca_leg_op').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
				sails.config.log.addlog(3, req.user.username, req.options.action, 'requestedCCA =====' + JSON.stringify(requestedCCA));

				let refToCCAApproval = await CCAApproval.addToCollection(entry_in_cca.id, 'cca_request').members(requestedCCA.id);

				let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
					id: requestedCCA.cca_leg_op.id,
					awb_leg: requestedCCA.cca_leg_op.awb_leg,
					station: requestedCCA.cca_leg_op.station,
					awb_no: requestedCCA.cca_leg_op.awb_no,
					closing_status: sails.config.custom.awb_leg_ops_status.cca_approval_pending,
					acted_at_time: Date.now(),
					acted_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
				});

				sails.config.log.addlog(3, req.user.username, req.options.action, 'updated leg op details' + JSON.stringify(update_leg_op));
				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_finance, { oldLegOp: update_leg_op });
			}


			// find existing legOp in approval bucket for same awbLeg (pending status)

			let activeCCAApprovalLegop = await AWBLegOp.findOne({ where: { awb_leg: req.body.awb_leg_id, opening_status: sails.config.custom.awb_leg_ops_status.cca_approval_pending, closing_status: '' } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));
			sails.config.log.addlog(3, req.user.username, req.options.action, '+++++++++++activeCCAApprovalLegop ===== ' + JSON.stringify(activeCCAApprovalLegop));

			if (!activeCCAApprovalLegop) {
				let ccaApprovalLegOp = await sails.helpers.planner.updateAwbLegOp.with({
					station: req.body.station,
					awb_no: req.body.awb_no,
					awb_leg: req.body.awb_leg_id,
					op_name: sails.config.custom.op_name.cca,
					department: sails.config.custom.department_name.central_fin,
					opening_status: sails.config.custom.awb_leg_ops_status.cca_approval_pending,
					trigger_time: Date.now(),
					duration: sails.config.custom.cut_off_timer.cca_approval_pending_duration,
					// prev_leg_op: update_leg_op.id
				});

				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, { newLegOp: ccaApprovalLegOp });
			}

			let ccaAprrovalMail = await sails.helpers.sendEmail.with({
				to: req.body.email,
				subject: 'CCA - ' + entry_in_cca.cca_no,
				html: '<p><h2><a href="' + sails.config.custom.base_url + '/approveccaform/' + entry_in_cca.id + '"> View CCA </a></h2></p>',
			}, function (err) {
				if (err) {
					sails.config.log.addlog(0, req.user.username, req.options.action, JSON.stringify(err));
				}
				sails.config.log.addlog(3, req.user.username, req.options.action, 'returned from send email helper');
			});
			sails.config.log.addlog(3, req.user.username, req.options.action, "after sending mail");
		}
		sails.config.log.addOUTlog(req.user.username, "ccaRequest");
		return res.ok();
	},

	ccaPending: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'ccaPending input' + JSON.stringify(req.body));
		// let check_legop_action = await AWBLegOp.findOne({where:{id: req.body.awb_legop_id}}).catch(err => console.log( err.message))
		// // console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		// if(check_legop_action.closing_status){
		// 	return res.send({
		// 		error: 'This '+ check_legop_action.awb_no +' '+ check_legop_action.opening_status +' is already done with ' + check_legop_action.closing_status+' by : ' + check_legop_action.acted_by,
		// 		error_code: 'ERR_Legop_already_actioned'
		// 	});
		// } else{
		// 	let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
		// 		id: req.body.awb_legop_id,
		// 		awb_leg: req.body.awb_leg_id,
		// 		station: req.body.station,
		// 		awb_no: req.body.awb_no,
		// 		ba80_notes: req.body.ba80_notes,
		// 		release_notes: req.body.reason,
		// 		closing_status: req.body.closing_status,
		// 		acted_at_time: Date.now(),
		// 		acted_by: 'xxxxxTODOxxxxx',
		// 	});
		// 	console.log('updated leg op details' + JSON.stringify(update_leg_op));
		// 	sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,  sails.config.custom.socket_listener.removeLegOps_central_finance, { oldLegOp: update_leg_op });
		// }
		sails.config.log.addOUTlog(req.user.username, "ccaPending");
	},

	viewCCAForm: async function (req, res) {
		sails.config.log.addINlog("", req.options.action);
		// sails.config.log.addINlog('system user', req.options.action);
		let existing_cca_approval = await CCAApproval.findOne({ where: { id: req.params.id, status: {"in": [sails.config.custom.cca_approval_status.pending, sails.config.custom.cca_approval_status.approved]} } }).populate('cca_request').catch(err => sails.config.log.addlog(0, "", req.options.action, err.message));

		if (!existing_cca_approval) {
			res.ok('Data is not available.');
		} else {
			res.view('DemoPages/ccaviewform', { formData: existing_cca_approval, readOnly: true });
		}
		// sails.config.log.addOUTlog('system user', req.options.action);
		sails.config.log.addOUTlog("", req.options.action);
	},

	approveCCAForm: async function (req, res) {
		sails.config.log.addINlog("", req.options.action);
		// sails.config.log.addINlog('system user', req.options.action);
		let existing_cca_approval = await CCAApproval.findOne({ where: { id: req.params.id, } }).populate('cca_request').catch(err => sails.config.log.addlog(0, "", req.options.action, err.message));
		
		if(existing_cca_approval) {
			switch(existing_cca_approval.status) {
				case sails.config.custom.cca_approval_status.pending:
					res.view('DemoPages/ccaviewform', { formData: existing_cca_approval, readOnly: false });
					break;
				case sails.config.custom.cca_approval_status.approved:
				case sails.config.custom.cca_approval_status.rejected:
					res.send(`CCA ${existing_cca_approval.cca_no} for AWB ${existing_cca_approval.awb_no} stands ${existing_cca_approval.status}`);
					break;
			}
		}

		// sails.config.log.addOUTlog('system user', req.options.action);
		sails.config.log.addOUTlog("", req.options.action);
	},

	ccaApproved: async function (req, res) {
		sails.config.log.addINlog("", req.options.action);
		sails.config.log.addlog(3, "", req.options.action, 'req.params ccaApproved====> ' + JSON.stringify(req.params));

		let ccaApprovalRecord = await CCAApproval.findOne({ where: { id: req.params.id, 'status': sails.config.custom.cca_approval_status.pending } }).catch(err => sails.config.log.addlog(0, "", req.options.action, err.message));
		sails.config.log.addlog(3, "", req.options.action, 'ccaApprovalRecord ccaApproved====> ' + JSON.stringify(ccaApprovalRecord));

		if (ccaApprovalRecord && ccaApprovalRecord.status == sails.config.custom.cca_approval_status.pending) {
			let ccaApprovalRecordUpdate = await CCAApproval.updateOne({ id: ccaApprovalRecord.id }).set({ 'status': sails.config.custom.cca_approval_status.approved });

			let ccaApprovalLegOp = await AWBLegOp.findOne({ where: { 'awb_leg': ccaApprovalRecordUpdate.awb_leg_id, 'opening_status': sails.config.custom.awb_leg_ops_status.cca_approval_pending, 'closing_status': '' } }).catch(err => sails.config.log.addlog(0, "", req.options.action, err.message));

			if (ccaApprovalLegOp) {
				let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
					id: ccaApprovalLegOp.id,
					awb_leg: ccaApprovalLegOp.awb_leg,
					station: ccaApprovalLegOp.station,
					awb_no: ccaApprovalLegOp.awb_no,
					release_notes: req.body.reason,
					closing_status: sails.config.custom.awb_leg_ops_status.cca_approval_approved,
					acted_at_time: Date.now(),
					acted_by: "EMAIL",
				});

				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_finance, { oldLegOp: update_leg_op });
			}

			 await sails.helpers.sendEmail.with({
				to: 'india.cargo.finance@ba.com',
				subject: `CCA ${ccaApprovalRecord.cca_no} - Approved - ${ccaApprovalLegOp.awb_no} - ${ccaApprovalLegOp.station}`,
				html: `<p>Approved with notes - </p><p>${req.body.reason}</p>`,
			}, function (err) {
				if (err) {
					sails.config.log.addlog(0, "", req.options.action, `${err}`);
				}
			});

			res.ok('cca is approved for => ' + ccaApprovalRecord.cca_no)
		} else {
			res.ok('cca is allready actioned')
		}

		sails.config.log.addOUTlog("", req.options.action);
	},

	ccaRejected: async function (req, res) {
		sails.config.log.addINlog("", req.options.action);
		sails.config.log.addlog(3, "", req.options.action, 'req.params ccaRejected====> ' + JSON.stringify(req.params));

		let ccaApprovalRecord = await CCAApproval.findOne({ where: { id: req.params.id, 'status': sails.config.custom.cca_approval_status.pending } }).catch(err => sails.config.log.addlog(0, "", req.options.action, err.message));

		sails.config.log.addlog(3, "", req.options.action, 'ccaApprovalRecord ccaRejected====> ' + JSON.stringify(ccaApprovalRecord));

		if (ccaApprovalRecord && ccaApprovalRecord.status == sails.config.custom.cca_approval_status.pending) {
			let ccaApprovalRecordUpdate = await CCAApproval.update({ id: ccaApprovalRecord.id }).set({ 'status': sails.config.custom.cca_approval_status.rejected }).fetch();

			let ccaApprovalLegOp = await AWBLegOp.findOne({ where: { 'awb_leg': ccaApprovalRecordUpdate.awb_leg_id, 'opening_status': sails.config.custom.awb_leg_ops_status.cca_approval_pending } }).catch(err => sails.config.log.addlog(0, "", req.options.action, err.message));

			if (ccaApprovalLegOp) {
				let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
					id: ccaApprovalLegOp.id,
					awb_leg: ccaApprovalLegOp.awb_leg,
					station: ccaApprovalLegOp.station,
					awb_no: ccaApprovalLegOp.awb_no,
					release_notes: req.body.reason,
					closing_status: sails.config.custom.awb_leg_ops_status.cca_approval_rejected,
					acted_at_time: Date.now(),
					acted_by: "EMAIL",
				});

				sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_finance, { oldLegOp: update_leg_op });
			}

			await sails.helpers.sendEmail.with({
				to: 'india.cargo.finance@ba.com',
				subject: `CCA ${ccaApprovalRecord.cca_no} - Rejected - ${ccaApprovalLegOp.awb_no} - ${ccaApprovalLegOp.station}`,
				html: `<p>Rejected with notes - </p><p>${req.body.reason}</p>`,
			}, function (err) {
				if (err) {
					sails.config.log.addlog(0, "", req.options.action, `${err}`);
				}
			});

			res.ok('cca is rejected for => ' + ccaApprovalRecord.cca_no)
		} else {
			res.ok('cca is allready actioned')
		}

		sails.config.log.addOUTlog("", req.options.action);
	},

	getCCAForAWB: async function(req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		let awb_no = req.params.awb_no;
		sails.config.log.addlog(3, req.user.username, req.options.action, `awb_no`, awb_no);

		let awbs = await CCAApproval.find({awb_no: awb_no }).populate('cca_request');
		sails.config.log.addlog(3, req.user.username, req.options.action, `awbs`, awbs);
		
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		res.json(sails.config.custom.jsonResponse(null, awbs));
	},

	getPrealertDocs: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);

		let bookList = await BookList.findOne({id: req.query.booklistId}).populate('file_prealert');
		let awbInfo = await AWBInfo.findOne({id: req.query.awbInfoId})
		
		res.json(sails.config.custom.jsonResponse(null, {bookList, awbInfo}));
		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	rcfPending: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(3, req.user.username, req.options.action, 'rcfPending input' + JSON.stringify(req.body));

		let check_legop_action = await AWBLegOp.findOne({ where: { id: req.body.awb_legop_id } }).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message))
		
		// console.log('check_legop_action'+ JSON.stringify(check_legop_action));
		if (check_legop_action.closing_status) {
			sails.config.log.addlog(0, req.user.username, req.options.action, 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by);
			sails.config.log.addOUTlog(req.user.username, req.options.action);

			return res.send({
				error: 'This ' + check_legop_action.awb_no + ' ' + check_legop_action.opening_status + ' is already done with ' + check_legop_action.closing_status + ' by : ' + check_legop_action.acted_by,
				error_code: 'ERR_Legop_already_actioned'
			});
		} else {
			let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
				id: req.body.awb_legop_id,
				awb_leg: req.body.awb_leg_id,
				station: req.body.station,
				awb_no: req.body.awb_no,
				closing_status: req.body.closing_status,
				acted_at_time: Date.now(),
				acted_by: req.user.username,
			});
			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_recovery, { oldLegOp: update_leg_op });

			if (update_leg_op) {
				let awbInfo=await AWBInfo.findOne({awb_no: req.body.awb_no});
				let key;
				
				if(awbInfo.priority_class=="F_CLASS"){
					key = 'f_class_delivery_time';
				} else{
					key = 'm_class_delivery_time';
				}

				let opsDuration = await OpsDuration.findOne({key: key});
				let delivery_status="DAP";

				if(Date.now()-awbInfo.createdAt > (60*60000*Number(opsDuration.duration))){
					delivery_status="FAILED";
				} else{
					let awbLegs =  await AWBLeg.find({where:{ 'awb_no' : req.body.awb_no, void_on:{'>':0}}}).catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

					for(let i=0;i<awbLegs.length;i++){
						if(awbLegs[i].from!=awbLegs[i].station){
							delivery_status="RAP";
							break
						}
					}
				}

				let updateAwbRCFDone = await sails.helpers.planner.updateAwb.with({ awb_no: req.body.awb_no, station: req.body.station, rcf: true, delivery_status: delivery_status });
				if (updateAwbRCFDone) {
					sails.config.log.addlog(3, req.user.username, req.options.action, '******--------CARGO JOURNEY IS COMPLETED--------******', req.body.awb_no);
				}
			}
		}
		
		sails.config.log.addOUTlog(req.user.username, req.options.action);
		return res.ok();
	},
};
