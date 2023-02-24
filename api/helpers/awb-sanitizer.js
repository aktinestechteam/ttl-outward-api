const STATION_TYPE = {
	SOURCE: 1,
	TRANSIT: 2,
	DESTINATION: 3
 };

var Queue = require('better-queue');

module.exports = {

	friendlyName: 'awbSanitizer',

	description: 'Sanitizes the AWB for preparing required legs at a given station(s)',

	inputs: {
		awb_no:				{type: 'string', required: true},
		// station:			{type: 'string', required: true},
		station:			{type: 'string'},
		savedBy:			{type: 'string', required: true},
		//pieces:				{type: 'number'},
		//weight:				{type: 'number'}
	},

	exits: {
		success: {
			outputDescription: "No output... return back is to be considered as success",
		}
	},

	fn: function (inputs, exits) {	
		sails.config.log.addINlog("helper", "awb-sanitizer");
		sails.config.log.addlog(3, "helper", "awb-santizer", `inputs = ${JSON.stringify(inputs)}`, inputs.awb_no);

		if (inputs.station){
			sanitizer_queue.push(inputs, function(err, blank_awb_leg) {
				if(err) {
					sails.config.log.addlog(0, "helper", "awb-sanitizer", JSON.stringify(err), inputs.awb_no);
				}
				//console.log('exiting sanitizer for awb = ' + inputs.awb_no);
				//console.log('exiting sanitizer for awb = ' + blank_awb_leg);
				sails.config.log.addOUTlog("helper", "awb-sanitizer");
				exits.success(blank_awb_leg);
			});
		} else{
			sails.config.log.addOUTlog("helper", "awb-sanitizer");
			exits.success();
		}
		
	}
};

const sanitizer_queue = new Queue(async function(inputs, cb){
	/*
		To perform Sanitization, we have to identify the number of pieces that are confirmed to be coming to a station.
		For the Origin , it will always be the number of pieces which is present in the AWBInfo
		For the transit (in between) stations, it will always be the number of pieces actually flown to the station.
		For Destination, it will always be the number of pieces which is finally received.

		Identify the AWBInfo using the awb_no
		Identify if the station provided is Origin / Transit / Destination.
		If the station is Origin, pieces_to_check = AWBInfo.pieces
		If the station is Transit/Destination, pieces_to_check = sum (actual pieces flown into the station for each leg)

		For any of the cases above, if the pieces_to_check > sum (actual pieces flown out of the station for each complete leg + , planned number of pieces for pending leg), then create empty leg by calling the update-awb-leg helper.

		After actual flown pieces if total actual flown pices are equals to the total pieces in awb info then discard/ inactive the blank leg for that awb
	*/

	let pieces_to_check = 0;
	let pieces_outgoing = 0;
	let weight_to_check = 0;
	let weight_outgoing = 0;
	
	let awb_info = await AWBInfo.findOne({awb_no: inputs.awb_no, void_on: 0});
	
	let station_type = STATION_TYPE.TRANSIT;

	if(inputs.station === awb_info.station) {	//	We are using station as the 1st point instead of src. This is because cargo comes from SRC = AMD to BOM via truck, and sanitizer starts working on AMD in this case.
		station_type = STATION_TYPE.SOURCE ;
	} if(inputs.station === awb_info.dest) {
		station_type = STATION_TYPE.DESTINATION ;
	}

	sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", `inputs.station = ${inputs.station}| awb_info.station = ${awb_info.station}| station_type = ${station_type}|`, inputs.awb_no);

	//console.log('sanitizer awb_info'+JSON.stringify(awb_info));
	switch (station_type){
		case STATION_TYPE.SOURCE :
			weight_to_check = awb_info.weight;
			pieces_to_check = awb_info.pieces;
		break;
		case STATION_TYPE.DESTINATION :
			pieces_outgoing = awb_info.pieces;
			weight_outgoing = awb_info.weight;
		// break;	//we want to calculate incomming_awb_leg's for station type destination
		case STATION_TYPE.TRANSIT :
			let incoming_awb_legs = await AWBLeg.find({
				where: {
					to: inputs.station, 
					awb_no: inputs.awb_no,
					status: [sails.config.custom.database_model_enums.awb_leg_status.completed, sails.config.custom.database_model_enums.awb_leg_status.pending], 
					pieces: {'>': 0}, 
					void_on: 0
				}, 
				select: ['pieces', 'actual_pieces_flown', 'status','weight','actual_weight_flown']
			});
	
			sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", JSON.stringify(incoming_awb_legs), inputs.awb_no);
			
			for(let i = 0; i < incoming_awb_legs.length; i++) {
				switch(incoming_awb_legs[i].status) {
					case sails.config.custom.database_model_enums.awb_leg_status.pending:
						if(station_type == STATION_TYPE.TRANSIT) {	//	If its destination, we cannot rely on pending legs
							pieces_to_check += incoming_awb_legs[i].pieces;
							weight_to_check += incoming_awb_legs[i].weight;
						}
						break;
					case sails.config.custom.database_model_enums.awb_leg_status.completed:
						pieces_to_check += incoming_awb_legs[i].actual_pieces_flown;
						weight_to_check += incoming_awb_legs[i].actual_weight_flown;
						break;
				}
			}
		break;
	}

	switch (station_type){
		case STATION_TYPE.DESTINATION :
				//do nothing
		break;
		case STATION_TYPE.SOURCE :
		case STATION_TYPE.TRANSIT :
			//let total_actual_pieces_flown = 0;
			let outgoing_awb_legs = await AWBLeg.find({
				where: {
					from: inputs.station, 
					awb_no: inputs.awb_no, 
					status: [sails.config.custom.database_model_enums.awb_leg_status.completed, sails.config.custom.database_model_enums.awb_leg_status.pending], 
					pieces: {'>': 0}, 
					void_on: 0
				}, 
				select: ['pieces', 'actual_pieces_flown', 'status','weight','actual_weight_flown']
			});

			for(let i = 0; i < outgoing_awb_legs.length; i++) {
				switch(outgoing_awb_legs[i].status) {
					case sails.config.custom.database_model_enums.awb_leg_status.pending:
						pieces_outgoing += outgoing_awb_legs[i].pieces;
						weight_outgoing += outgoing_awb_legs[i].weight;
						break;
					case sails.config.custom.database_model_enums.awb_leg_status.completed:
						pieces_outgoing += outgoing_awb_legs[i].actual_pieces_flown;
						weight_outgoing += outgoing_awb_legs[i].actual_weight_flown;
						break;
				}
				//total_actual_pieces_flown += Number(outgoing_awb_legs[i].actual_pieces_flown);
				sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", 'total_Pieces = ' +pieces_to_check +'   actual - pieces = ' + pieces_outgoing, inputs.awb_no );
			}
		break;
	}

	let blank_awb_leg = undefined;

	sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", 'pieces_to_check = ' + pieces_to_check + ', pieces_outgoing = ' + pieces_outgoing, inputs.awb_no);
	//	Perform the checks only if there exists some pieces_to_check, else 0 == 0 holds true most of the times which is not we want to evaluate for.
	if(pieces_to_check > 0 && (station_type == STATION_TYPE.SOURCE || station_type == STATION_TYPE.TRANSIT || station_type == STATION_TYPE.DESTINATION)) {
		sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", 'station type = '+ station_type, inputs.awb_no);

		switch (station_type){
			case STATION_TYPE.SOURCE:
			case STATION_TYPE.TRANSIT:
				if(pieces_to_check > pieces_outgoing) {
					blank_awb_leg = await sails.helpers.planner.updateAwbLeg.with({
						awb_info:		awb_info.id,
						station:		awb_info.station,			//	COMPULSORY
						awb_no:			inputs.awb_no,				//	Compulsory to create
						from:			inputs.station,				//	COMPULSORY
						pieces:			(pieces_outgoing - pieces_to_check),	//	We want -ve number to seek user i/p
						weight:			(weight_outgoing - weight_to_check),
						created_by:		inputs.savedBy,					//	Compulsory to create
						status:			sails.config.custom.database_model_enums.awb_leg_status.pending,
					});
				}
				
				if(pieces_outgoing == pieces_to_check){
					sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", "*********************stop******************", inputs.awb_no);

					let discard_blank_awb_leg = await sails.helpers.planner.updateAwbLeg.with({
						awb_info:		awb_info.id,
						station:		awb_info.station,			//	COMPULSORY
						awb_no:			inputs.awb_no,				//	Compulsory to create
						from:			inputs.station,				//	COMPULSORY
						created_by:		inputs.savedBy,					//	Compulsory to create
						status:			sails.config.custom.database_model_enums.awb_leg_status.discarded,
						void_on:		Date.now(),
						void_reason:	sails.config.custom.void_reason.discarded_due_to_completly_flown
					});

					if(discard_blank_awb_leg){
						sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", "*********************discarded******************", inputs.awb_no);
						blank_awb_leg = undefined;
					}
				}
				else{
					sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", "*********************continue******************", inputs.awb_no);
				}
			break;
			case STATION_TYPE.DESTINATION:
				
				sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", "pieces_outgoing = "+ pieces_outgoing+"  pieces_to_check = "+pieces_to_check, inputs.awb_no);
				if(pieces_outgoing == pieces_to_check){
					sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", 'checkeing inputs data = '+ JSON.stringify(inputs), inputs.awb_no);
					sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", 'checkeing awb_info data = '+ JSON.stringify(awb_info), inputs.awb_no);
					let awb_leg_details = await AWBLeg.find({
						where: {
							to: awb_info.dest,
							awb_no: inputs.awb_no, 
							status: sails.config.custom.database_model_enums.awb_leg_status.completed, 
							pieces: {'>': 0}, 
							void_on: 0
						}
					}).sort('createdAt DESC').catch(err => sails.config.log.addlog(0, "helper", "Q-awb-sanitizer", err.message, inputs.awb_no));

					sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", 'awb_leg_details' + JSON.stringify(awb_leg_details), inputs.awb_no);

					if(awb_leg_details.length > 0){
						let rcf_starts=await OpsDuration.findOne({key: "ready_to_recovery_trigger_trigger"});
						let trigger_time = awb_leg_details[0].planned_arrival + (60000*Number(rcf_starts.duration));
						if(rcf_starts.duration==0 || trigger_time<Date.now()){
							trigger_time= Date.now();
						}
						// getting ready to recovery q time
						let rcf_q_time=await OpsDuration.findOne({key: "ready_to_recovery_q_time"});
										
						// create legop to perform rcf
						let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
							station: inputs.station,
							awb_no: inputs.awb_no,
							awb_leg: awb_leg_details[0].id,	// this index 0 is for the letest leg arrives to that destination
							op_name: sails.config.custom.op_name.rcf,
							department: sails.config.custom.department_name.central_rec,
							opening_status: sails.config.custom.awb_leg_ops_status.rcf_pending,
							trigger_time: trigger_time,
							cut_off_time: trigger_time + (60000*Number(rcf_q_time.duration))
							// duration: sails.config.custom.cut_off_timer.rcf_pending_duration
						});
						
						sails.config.log.addlog(3, "helper", "Q-awb-sanitizer", 'create_leg_op' + JSON.stringify(create_leg_op), inputs.awb_no);
						
						sails.sockets.broadcast(sails.config.custom.socket.room_name.operation, sails.config.custom.socket_listener.addLegOps_central_recovery, { newLegOp: create_leg_op });
					}
				}	
			break;
		}		
	}
	
	sails.config.log.addOUTlog("helper", "Q-awb-sanitizer");
	cb(null, blank_awb_leg);
});

