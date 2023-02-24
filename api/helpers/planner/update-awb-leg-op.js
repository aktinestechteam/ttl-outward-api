module.exports = {

	friendlyName: 'updateAWBLegOp',

	description: 'Updates / Create AWBLegOp',

	inputs: {
		id:					{ type: 'string'},							//	Compulsory for update
		station:			{ type: 'string', required: true },			// Compulsory for create
		awb_no:				{ type: 'string', required: true },			// Compulsory for create
		awb_leg:			{ type: 'string'},	//ref	// Compulsory for create
		duration:			{ type: 'number' } ,
		op_name:			{ type: 'string' },
		department:			{ type: 'string' },			// Compulsory for create
		opening_status:		{ type: 'string' },			// Compulsory for create
		closing_status:		{ type: 'string' },								//	Compulsory for update
		prev_leg_op:		{ type: 'string' },	//ref						//	Compulsory for update
		trigger_time:			{ type: 'number' },			// Compulsory for create
		cut_off_time:		{ type: 'number' },			// Compulsory for create
		acted_at_time:		{ type: 'number' },								//	Compulsory for update
		acted_by:			{ type: 'string' },//user						//	Compulsory for update
		released_by:		{ type: 'string' },//user
		release_notes:		{ type: 'string' },
		ba80_notes:			{ type: 'string' },
		cca:				{ type: 'string' }	//ref
	},

	exits: {
		success: {
			outputDescription: "returns the AwbLegOp",
		}
	},

	fn: async function(inputs, exits) {
		sails.config.log.addINlog("helper", "update-awb-leg-op");
		sails.config.log.addlog(4, "helper", "update-awb-leg-op", 'inputs for legOps = ' + JSON.stringify(inputs));

		//	Check if AWBLegOp with received AWBLegOp id exists
		let awb_leg_op = inputs.id ? await AWBLegOp.findOne({where: {id: inputs.id}}) : undefined;
		//for CCA leg op we will get a random leg;
		if(!inputs.awb_leg){
			let awb_leg = await AWBLeg.find({awb_no: inputs.awb_no, status: {'!=': sails.config.custom.database_model_enums.awb_leg_status.discarded}}).limit(1);
			if(awb_leg && awb_leg.length == 1) {
				inputs.awb_leg=awb_leg[0].id;
			}
		}

		//	If awb_leg_op exists, then update the AWBLegOp with received qty
		if(awb_leg_op) {
			let values_to_update = {};
			
			//	Possible reasons to update the AWBLegOp are:
			//	2. update the legop for releas with released_by, released_notes
			//	1. update the legop with valid values for closing status,next_leg_op,acted_at_time,acted_by.
			
			if(inputs.released_by) {
				if(inputs.released_by)				values_to_update.released_by = inputs.released_by;
				if(inputs.release_notes)			values_to_update.release_notes = inputs.release_notes;
			} else if(inputs.closing_status) {
				if(inputs.closing_status)				values_to_update.closing_status = inputs.closing_status;
				if(inputs.acted_at_time)			values_to_update.acted_at_time = inputs.acted_at_time;
				if(inputs.acted_by)					values_to_update.acted_by = inputs.acted_by;
				if(inputs.release_notes)			values_to_update.release_notes = inputs.release_notes;
				if(inputs.ba80_notes)			values_to_update.ba80_notes = inputs.ba80_notes;
			}
			
			sails.config.log.addlog(4, "helper", "update-awb-leg-op", 'values_to_update LegOp------ ' + JSON.stringify(values_to_update), inputs.awb_no);

			awb_leg_op = await AWBLegOp.update({id: inputs.id}).set(values_to_update).fetch();
			awb_leg_op = awb_leg_op[0];
		}
		//	create a new AwbLegOp in DB with the received inputs
		else {
			let values_to_create = {};
			//600000 milliseconds = 10 minutes so plann cutofftime accordingly
			let cut_off_time_span = 60000 * Number(inputs.duration); //time in minutes for duration to take action
				values_to_create.station = 		inputs.station;
				values_to_create.awb_no = 		inputs.awb_no;
				values_to_create.awb_leg = 		inputs.awb_leg;
				values_to_create.op_name = 		inputs.op_name;
				values_to_create.department = 	inputs.department;
				values_to_create.opening_status = 	inputs.opening_status;
				if(inputs.prev_leg_op)				values_to_create.prev_leg_op = inputs.prev_leg_op;
	
				// if(inputs.opening_status == 'READY_FOR_RC'){
				// 	cut_off_time_span = 600000*3;
				// }else if(inputs.opening_status == 'RC_PENDING'){
				// 	cut_off_time_span = 600000*6;
				// }else if(inputs.opening_status == 'READY_FOR_FDC'){
				// 	cut_off_time_span = 600000*2;
				// }else {
				// 	cut_off_time_span = 600000*4.5;			//for FDC_PENDING status
				// }
				let cca_request_pending_q_time=await OpsDuration.findOne({key: "cca_request_pending_q_time"});
				let cca_approval_pending_q_time=await OpsDuration.findOne({key: "cca_approval_pending_q_time"});
				if(inputs.opening_status==sails.config.custom.awb_leg_ops_status.cca_request_pending){
					values_to_create.trigger_time = 		Date.now();
					values_to_create.cut_off_time = 		Date.now() + (60000*Number(cca_request_pending_q_time.duration));
				}
				else if(inputs.opening_status==sails.config.custom.awb_leg_ops_status.cca_approval_pending){
					values_to_create.trigger_time = 		Date.now();
					values_to_create.cut_off_time = 		Date.now() + (60000*Number(cca_approval_pending_q_time.duration));
				}
				else{
					values_to_create.trigger_time = 		inputs.trigger_time;
					values_to_create.cut_off_time = 		inputs.cut_off_time;
				}
				
				// values_to_create.cut_off_time = 		inputs.trigger_time + cut_off_time_span;

				//console.log('-----0values_to_create LegOp0------ ' + JSON.stringify(values_to_create));
				awb_leg_op = await AWBLegOp.create(values_to_create).fetch();
				//console.log('!!!!! ' + JSON.stringify(awb_leg_op));
				if(inputs.awb_leg){
					let ref_to_awb_leg = await AWBLeg.addToCollection(inputs.awb_leg, 'awb_leg_ops').members(awb_leg_op.id);
				}
		}
		// if (awb_leg_op.closing_status = 'FDC_DONE'){
		// 	console.log('Cargo is ready to fly  '+ JSON.stringify(awb_leg));
		if(inputs.awb_leg){
			let awb_leg = await AWBLeg.findOne({id: inputs.awb_leg});
			awb_leg_op.awb_leg = awb_leg;
		}
		let awb_info = await AWBInfo.findOne({awb_no: inputs.awb_no});
		
		awb_leg_op.awb_info = awb_info;
		//	return the created AwbLeg

		sails.config.log.addOUTlog("helper", "update-awb-leg-op");
		exits.success(awb_leg_op);
	}
};