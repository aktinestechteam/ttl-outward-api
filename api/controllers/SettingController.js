const cons = require("consolidate");

module.exports = {

	getAllOpsDurations: async function(req, res) {
		sails.config.log.addINlog(req.user.username, "getAllOpsDurations");
		let opsDurations = await OpsDuration.find();
		sails.config.log.addOUTlog(req.user.username, "getAllOpsDurations");
		res.json(sails.config.custom.jsonResponse(null, opsDurations));
	},

	saveOpsDurations: async function(req, res) {
		sails.config.log.addINlog(req.user.username, "saveOpsDurations");
		console.log(req.body);
		let keys = Object.keys(req.body);

		for(let i = 0 ; i < keys.length; i++) {
			let opsDuration = await OpsDuration.findOne({key: keys[i]});
			if(opsDuration) {
				await OpsDuration.update({key: keys[i]}).set({duration: req.body[keys[i]]});
			} else {
				await OpsDuration.create({key: keys[i], duration: req.body[keys[i]]});
			}
		}
		sails.config.log.addOUTlog(req.user.username, "saveOpsDurations");
		res.ok();
	}
};
