/**
 * ClaimController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

	saveClaim: async function(req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(4, req.user.username, req.options.action, JSON.stringify(req.body));
		
		let claim;

		if(await AWBClaim.count({awb_no: req.body.awb_no}) == 0) {	//	Create New Claim
			claim = await AWBClaim.create(req.body).fetch();
		} else {	//	Update the existing claim
			claim = await AWBClaim.update({awb_no: req.body.awb_no}).set(req.body).fetch();
		}

		if(claim) {
			res.json(sails.config.custom.jsonResponse(null, claim));
			sails.sockets.broadcast(sails.config.custom.socket.room_name.queryAndClaims, 'addAWBClaim', { awb_claim: claim })
		} else {
			sails.config.log.addlog(0, req.user.username, req.options.action, `Failed to create the claim.`);
			res.json(sails.config.custom.jsonResponse('Failed to create the claim.', null));
		}
		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	getClaim: async function(req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		
		let claim = await AWBClaim.findOne({awb_no: req.params.awb_no});
		
		if(claim) {
			res.json(sails.config.custom.jsonResponse(null, claim));
		} else {
			sails.config.log.addlog(0, req.user.username, req.options.action, `Could not find the claim.`);
			res.json(sails.config.custom.jsonResponse('Could not find the claim.', null));
		}

		sails.config.log.addOUTlog(req.user.username, req.options.action);
	},

	getClaimForPrint: async function(req, res) {

	},
};
