/**
 * LockUnlockLegOpController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    lockAwbLegOp: async function(req, res) {
        sails.config.log.addINlog(req.user.username, req.options.action);
        sails.config.log.addlog(4, req.user.username, req.options.action, req.body.operationId);

        let awbLegOp = await AWBLegOp.findOne({id: req.body.operationId});
        if(!awbLegOp) {
            sails.config.log.addlog(0, req.user.username, req.options.action, `There is no operation for the provided id`);
            sails.config.log.addOUTlog(req.user.username, req.options.action);
            
            return res.json(sails.config.custom.jsonResponse("There is no operation for the provided id", null));
        }

        if(awbLegOp.void_on > 0 || awbLegOp.acted_by.length > 0) {
            sails.config.log.addlog(0, req.user.username, req.options.action, `Cannot lock this Operation`);
            sails.config.log.addOUTlog(req.user.username, req.options.action);
            
            return res.json(sails.config.custom.jsonResponse("Cannot lock this Operation", null));
        }

        let legOperation = await LockedOperation.findOne({operationId: awbLegOp.id});

        if(legOperation) {
            sails.config.log.addlog(0, req.user.username, req.options.action, `This AWB ${legOperation.awb_no} leg operation is already locked by ${legOperation.username}`);
            sails.config.log.addOUTlog(req.user.username, req.options.action);

            return res.json(sails.config.custom.jsonResponse(`This AWB ${legOperation.awb_no} leg operation is already locked by ${legOperation.username}`, null));
        }

        let lockedOfLegOpsForUser = await LockedOperation.find({username: req.user.username});
        if(lockedOfLegOpsForUser != 0) {
            sails.config.log.addlog(0, req.user.username, req.options.action, `${req.user.username} has already locked AWB ${lockedOfLegOpsForUser[0].awb_no}, Please release/complete ${lockedOfLegOpsForUser[0].awb_no}.`);
            sails.config.log.addOUTlog(req.user.username, req.options.action);

            return res.json(sails.config.custom.jsonResponse(`${req.user.username} has already locked AWB ${lockedOfLegOpsForUser[0].awb_no}, Please release/complete ${lockedOfLegOpsForUser[0].awb_no}.`, null));
        }

        let lockedOperation = await LockedOperation.create({operationId: awbLegOp.id, username: req.user.username, awb_no: awbLegOp.awb_no, department: awbLegOp.department, opening_status: awbLegOp.opening_status, station: awbLegOp.station}).fetch();

        if(lockedOperation) {
            res.ok();
            sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.lockedOps, {operationId: awbLegOp.id, username: lockedOperation.username});
        } else {
			sails.config.log.addlog(0, req.user.username, "lockAwbLegOp","Unable to lock the leg operation. Please contact the Admin.");
            res.json(sails.config.custom.jsonResponse("Unable to lock the leg operation. Please contact the Admin.", null));
        }
        
        sails.config.log.addOUTlog(req.user.username, req.options.action);
    },

    unlockAwbLegOp: async function(req, res) {
        sails.config.log.addINlog(req.user.username, req.options.action);
        sails.config.log.addlog(4, req.user.username, req.options.action, req.body.operationId);

        let lockedOperation = await LockedOperation.findOne({operationId: req.body.operationId});
        if(!lockedOperation) {
			sails.config.log.addlog(0, req.user.username, req.options.action, `There is no operation for the provided id`);
            sails.config.log.addOUTlog(req.user.username, req.options.action);

            return res.json(sails.config.custom.jsonResponse("There is no operation to unlock for the provided id", null))
        }

        if(lockedOperation.username === req.user.username) {
            try{
                await LockedOperation.destroy({operationId: req.body.operationId});
            }
            catch(e){
                sails.config.log.addlog(0, req.user.username, req.options.action, JSON.stringify(e));
            }

            sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,sails.config.custom.socket_listener.unlockedOps, {operationId: req.body.operationId, username: lockedOperation.username});
            sails.config.log.addOUTlog(req.user.username, req.options.action);
            return res.ok();
        } else {
            sails.config.log.addOUTlog(req.user.username, req.options.action);
            return res.json(sails.config.custom.jsonResponse(`This operation is locked by ${lockedOperation.username}, it cannot be release by ${req.user.username}`, null));
        }
    },

    forceUnlockAwbLegOp: async function(req, res) {
        
    },

    getLockedAwbOps: async function(req, res) {
        res.json(sails.config.custom.jsonResponse(null, await LockedOperation.find()));
    }
}
