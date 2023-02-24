var moment = require('moment-timezone');

module.exports = {

	friendlyName: 'getAwbDetail',

	description: 'To fetch the all details of inputed AWB ',

	inputs: {
		awbNo: {type: 'string'},
	},

	exits: {
		success: {
			outputDescription: "awb is processed.",
		}
	},

	fn: async function (inputs, exits) {
		sails.config.log.addINlog("helper", "get-awb-detail");
		sails.config.log.addlog(3, "helper", "get-awb-detail", `${JSON.stringify(inputs)}`, inputs.awbNo);

		let results = [];
		let awb = await AWB.findOne({awb_no: inputs.awbNo}).catch(err => console.log(err));
		
		let awbInfo = await AWBInfo.findOne({awb_no: inputs.awbNo}).catch(err => console.log(err));
		
		let awbLeg = await AWBLeg.find({where:{'awb_no': inputs.awbNo}}).catch(err => console.log(err));
		if (awb || awbInfo || awbLeg){
			results.push(awb);
			results.push(awbInfo);
			results.push(awbLeg);
		}
		else{
			results = null;
		}

		sails.config.log.addOUTlog("helper", "get-awb-detail");
		exits.success(results);
	}
};