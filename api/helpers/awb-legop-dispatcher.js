module.exports = {


	friendlyName: 'AWB Leg Operations Dispatcher',


	description: 'This helper will be responsible to manage the dispatching of the AWB Leg ops to the operations team for their inputs.',

	inputs: {
	},


	exits: {
	},


	fn: async function (inputs, exits) {
		sails.config.log.addINlog("helper", "awb-legop-dispatcher");

		let allValidLegops = [];
		// console.log('inside dispatcher function by cron');
		let current_date = new Date();
		let date_at_start_of_this_minute = new Date(current_date);
		date_at_start_of_this_minute.setSeconds(0);
		date_at_start_of_this_minute.setMilliseconds(0);
		let date_at_start_of_last_minute = new Date(date_at_start_of_this_minute);
		date_at_start_of_this_minute.setMinutes(date_at_start_of_this_minute.getMinutes() - 1);
		// console.log(date_at_start_of_last_minute.getTime() + "---" + date_at_start_of_this_minute.getTime());
		let legops = await AWBLegOp.find({
			where: {
				acted_at_time: 0, 
				trigger_time: {'<=': date_at_start_of_last_minute.getTime(), '>=': date_at_start_of_this_minute.getTime()},
				opening_status: [
					sails.config.custom.awb_leg_ops_status.ready_to_rate_check, sails.config.custom.awb_leg_ops_status.ready_to_recovery,
					sails.config.custom.awb_leg_ops_status.p2_escalation,
					sails.config.custom.awb_leg_ops_status.p1_escalation,
					sails.config.custom.awb_leg_ops_status.escalation,
					// sails.config.custom.awb_leg_ops_status.ready_to_departure(Not includeing this case bcz there is no any validation that the fdc is done for theat specific leg op wich is flown i.e we consider thag the fdc is done of the specific legop and it is redy to fly but what if it is undone and there is no any legop for ready to departure for that leg)
				]	//	WE NEED TO ADD THOSE STATUS WHICH NEEDS TO BE TRACKED BY DISPATCHER
			}
		}).populate('awb_leg').catch(err => console.log( err.message));

		for(let i = 0; i < legops.length; i++){
			if((legops[i].awb_leg.status != sails.config.custom.database_model_enums.awb_leg_status.discarded ) && legops[i].awb_leg.void_on == 0){
				legops[i].awb_info = await AWBInfo.findOne({awb_no: legops[i].awb_no, void_on: 0});
				allValidLegops.push(legops[i]);
			}
		}
		// console.log('inside dispatcher function by cron output'+JSON.stringify(legops));
		sails.config.log.addlog(3, "helper", "awb-legop-dispatcher", `number of awbs to dispatch = ${legops.length}`);
		sails.config.log.addOUTlog("helper", "awb-legop-dispatcher");
		exits.success({legops: allValidLegops});
	}
};