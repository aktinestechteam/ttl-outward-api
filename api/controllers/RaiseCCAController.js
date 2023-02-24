/**
 * RaiseCCAController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    raiseCCA: async function (req, res) {
        sails.config.log.addINlog(req.user.username, req.options.action);
        sails.config.log.addlog(3, req.user.username, req.options.action, `${req.body.awb_no}`);

        let awb_info = await AWBInfo.findOne({awb_no: req.body.awb_no, void_on: 0}).select('station');
        
		if(Array.isArray(req.body.CCA) && req.body.CCA.length > 0){
            let create_cca = await CCARequest.create({
                awb_no: req.body.awb_no,
                priority: 0,		//need to ask but required field	
                station: awb_info.station,
                raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
                raised_by_dept: req.body.department,
                reason: req.body.CCA,
                reason_text: 'XXXXXXXXTODOXXXXXXXX',	//need to ask but required field
            }).fetch().catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

            let create_leg_op_cca_request = await sails.helpers.planner.updateAwbLegOp.with({
                station: awb_info.station,
                awb_no: req.body.awb_no,
                op_name: sails.config.custom.op_name.cca,
                department: sails.config.custom.department_name.central_fin,
                opening_status: sails.config.custom.awb_leg_ops_status.cca_request_pending,
                trigger_time: Date.now(),
                duration: sails.config.custom.cut_off_timer.cca_request_pending_duration,
            });
            
            let refToAWBLegOp = await AWBLegOp.addToCollection(create_leg_op_cca_request.id, 'cca_request').members(create_cca.id);

            let refToCCALegOp = await AWBLegOp.addToCollection(create_leg_op_cca_request.id, 'cca_request_leg_op').members(create_cca.id);

            create_leg_op_cca_request.CCARequest = await CCARequest.findOne({where:{ cca_leg_op:create_leg_op_cca_request.id}}).populate('cca_leg_op').catch(err => sails.config.log.addlog(0, req.user.username, req.options.action, err.message));

            sails.config.log.addlog(3, req.user.username, req.options.action, 'cca_leg_op ==== ===  '+JSON.stringify(create_leg_op_cca_request));
            
            sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_finance, {newLegOp: create_leg_op_cca_request})

            sails.config.log.addOUTlog(req.user.username, req.options.action);

            res.ok();
        }
	},

    discardCCA: async function (req, res) {
        sails.config.log.addINlog(req.user.username, req.options.action);
        sails.config.log.addlog(3, req.user.username, req.options.action, `${req.body.awb_no}`);

        let create_cca = await CCARequest.destroy({
            id: req.body.cca_request_id
        });

        let close_leg_op_cca_request = await sails.helpers.planner.updateAwbLegOp.with({
            id: req.body.awb_legop_id,
            station: req.body.station,    //  I think we do not intent to update the station value here.
            awb_no: req.body.awb_no,
            op_name: sails.config.custom.op_name.cca,
            department: sails.config.custom.department_name.central_fin,
            closing_status: sails.config.custom.awb_leg_ops_status.cca_request_rejected,
            acted_at_time: Date.now(),
            acted_by: req.user.username,
            release_notes: req.body.discardReason,
        });

        sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.removeLegOps_central_finance, {oldLegOp: close_leg_op_cca_request})

        sails.config.log.addOUTlog(req.user.username, req.options.action);
        res.ok();
	}
};

