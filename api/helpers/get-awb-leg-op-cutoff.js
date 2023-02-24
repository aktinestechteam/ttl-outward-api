module.exports = {

	friendlyName: 'getAWBLegOpCutoff',

	description: 'Obtains AWB Leg Op Cut-off that is configured in the system',

	inputs: {
		opName:				{ type: 'string' },
        planned_departure:  { type: 'number', defaultsTo: 0 }
	},

	exits: {
		success: {
			outputDescription: "returns the AwbLegOp cut-off time",
		}
	},

	fn: async function(inputs, exits) {
		sails.config.log.addINlog("helper", "get-awb-leg-op-cutoff");
		sails.config.log.addlog(4, "helper", "get-awb-leg-op-cutoff", 'inputs for get-awb-leg-op-cutoff = ' + JSON.stringify(inputs));

        let trigger_time = Date.now();
        let cut_off_time = Date.now();

        switch(inputs.opName) {
            case 'ready_to_rate_check': {
                let pre_flight_checks_start = await OpsDuration.findOne({key: "ready_to_rate_check_trigger_trigger"});
                let ready_to_rate_check_cutoff_time = await OpsDuration.findOne({key: "ready_to_rate_check_cutoff_time"});
                        
                trigger_time = inputs.planned_departure - (60000*Number(pre_flight_checks_start.duration));
                                        
                if(pre_flight_checks_start.duration==0 || trigger_time<Date.now()){
                    trigger_time= Date.now();
                }
                
                cut_off_time = inputs.planned_departure - (60000*Number(ready_to_rate_check_cutoff_time.duration));
                
                if(ready_to_rate_check_cutoff_time.duration==0 || cut_off_time<Date.now()){
                    cut_off_time=Date.now()
                }

                exits.success({trigger_time, cut_off_time});
            }
            break;
        }
        
		sails.config.log.addOUTlog("helper", "get-awb-leg-op-cutoff");
	}
};