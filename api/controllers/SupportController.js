/**
 * SupportController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    sanitize: async function(req, res){
        let sanitized = await sails.helpers.awbSanitizer.with({
            station: req.params.station,
            awb_no: req.params.awb_no,
            savedBy: "external call"
        });
        res.json(sails.config.custom.jsonResponse(null, "sanitized"));
        console.log("sanitized")
    },

    createRateCheck: async function(req, res) {
        sails.config.log.addINlog("support for createing rate check", req.options.action);
        let check_active_legs = await AWBLeg.find({ where: { status: sails.config.custom.database_model_enums.awb_leg_status.pending,
            pieces: { '>': 0 }, 
            // from: booklist_record['Flight Uplift'],
            awb_no: req.params.awb_no, void_on: 0, 
            // station: booklist_record['Flight Uplift']
        } }).populate('awb_info').populate('awb_leg_ops').catch(err => console.log(err.message));

        if (check_active_legs && check_active_legs.length>0) {
            let flag = false;

            for(let i = 0; i < check_active_legs.length; i++) {
                sails.config.log.addlog(4, "SUPPORT", req.options.action, `check_active_legs ${JSON.stringify(check_active_legs[i])}`);
                // console.log('check_active_legs'+JSON.stringify(check_active_legs[i]));
                if ((check_active_legs[i].awb_info.on_hand == true) && (check_active_legs[i].awb_info.pieces > 0) && check_active_legs[i].from === check_active_legs[i].awb_info.station) {
                    let awbLegOpCutoff = await sails.helpers.getAwbLegOpCutoff.with({
                        opName: 'ready_to_rate_check',
                        planned_departure: check_active_legs[i].planned_departure
                    })

                    //console.log('check_active_legs[i]'+JSON.stringify(check_active_legs[i]));
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
                    
                    sails.config.log.addlog(4, "SUPPORT", req.options.action, `created leg op details ${JSON.stringify(create_leg_op)}`);
                    // console.log('created leg op details'+JSON.stringify(create_leg_op));
                    sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_planner_operation, { newLegOp: create_leg_op });
                    flag = true
                }
            }
            if(!flag) {
                sails.config.log.addlog(0, "SUPPORT", req.options.action, `The legs found are either not on hand OR pieces < 0 ${req.params.awb_no}`);
                return res.json(sails.config.custom.jsonResponse("The legs found are either not on hand OR pieces < 0", null));
            }
            res.ok()
            sails.config.log.addOUTlog("exit support for creating rate check", req.options.action);
        }
        else{
            sails.config.log.addlog(0, "SUPPORT", req.options.action, `No active legs found for ${req.params.awb_no}`);
            return res.json(sails.config.custom.jsonResponse("No active legs found!!", null));
        }
    },

    commands: async function(req, res) {
        let value = req.params.awb_no
        let awb_no = value.length == 11 ? value : "";
        let id = value.length != 11 ? value : ""
        res.view('DemoPages/commands', {id, awb_no});
    },

    changeAWBStation: async function(req, res) {
        let awb_no = req.params.awb_no;
        let station = req.params.station;
        await AWBInfo.update({awb_no: awb_no}).set({station: station});
        res.ok();
    },

    changeAWBSrc: async function(req, res) {
        let awb_no = req.params.awb_no;
        let src = req.params.station;
        await AWBInfo.update({awb_no: awb_no}).set({src: src});
        res.ok();
    },

    forceAWBToRCS: async function(req, res) {
        await AWBInfo.update({awb_no: req.params.awb_no}).set({pieces: 0, weight: 0});
        res.ok();
    }, 

    changeAWBPriorityClass: async function(req, res) {
        switch(req.params.priority_class.toUpperCase()) {
            case 'M':
                await AWBInfo.update({awb_no: req.params.awb_no}).set({priority_class: "M_CLASS"});
                break;
            case 'F':
                await AWBInfo.update({awb_no: req.params.awb_no}).set({priority_class: "F_CLASS"});
                break;
            default:
                break;
        }

        res.ok();
    }
};

