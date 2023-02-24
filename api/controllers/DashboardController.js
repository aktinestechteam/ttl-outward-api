/**
 * DashboardController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    getAwbsforRecoveryDashboard: async function(req, res) {
		sails.config.log.addINlog(req.user.username, "getAwbsforRecoveryDashboard");
        let awbInfos = await AWBInfo.find().where({'on_hand': true}).catch(err => console.log( err.message));
        res.json(awbInfos);
        sails.config.log.addOUTlog(req.user.username, "getAwbsforRecoveryDashboard");
        return res;
    
    }

};

