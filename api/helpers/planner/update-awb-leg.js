module.exports = {

	friendlyName: 'updateAWBLeg',

	description: 'Updates / Create AWBLeg',

	inputs: {
		id:							{type: 'string'},							//	Compulsory for update

		awb_info:					{type: 'string'},
		booklist:					{type: 'string'},
		station:					{type: 'string', required: true },			//	COMPULSORY
		awb_no:						{type: 'string', required: true },			//	Compulsory to create
		from:						{type: 'string', required: true },			//	COMPULSORY
		to:							{type: 'string'},
		pieces:						{type: 'number',defaultsTo: 0},
		weight:						{type: 'number', defaultsTo: 0 },
		//from_tz:					{type: 'string', required: true },			//	Compulsory to create
		//to_tz:						{type: 'string' },
		flight_no:					{type: 'string' },
		planned_departure:			{type: 'number', defaultsTo: 0 },
		planned_arrival:			{type: 'number', defaultsTo: 0 },
		actual_departure:			{type: 'number' },
		actual_arrival:				{type: 'number' },
		created_by:					{type: 'string', required: true },//user	//	Compulsory to create
		transhipment:				{type: 'boolean', defaultsTo: false },
		status:						{type: 'string', isIn: [
			sails.config.custom.database_model_enums.awb_leg_status.pending,
			sails.config.custom.database_model_enums.awb_leg_status.completed,
			sails.config.custom.database_model_enums.awb_leg_status.discarded
		]},
		//awb_leg_ops:				{type: 'json' },	//ref
		actual_pieces_flown:		{type: 'number' },
		actual_weight_flown:		{type: 'number' },
		void_on:					{type: 'number', defaultsTo: 0 },
		void_reason:				{type: 'string' },
		value_added_product:		{type: 'string' },
		volume:						{type: 'number', defaultsTo: 0 },
		dimensions:					{type: 'string' },
	},

	exits: {
		success: {
			outputDescription: "returns the AwbLeg",
		}
	},

	fn: async function(inputs, exits) {
		sails.config.log.addINlog("helper", "update-awb-leg");
		sails.config.log.addlog(3, "helper", "update-awb-leg", 'updateAWBLeg inputs = ' + JSON.stringify(inputs));
		//	Check if AWBLeg with received AWBLeg id exists
		let awb_leg = inputs.id ? await AWBLeg.findOne({where: {id: inputs.id}}) : undefined;
		let empty_leg = '';
		//	If awb_leg exists, then update the AWBLeg with received qty
		
		let awb_info = await AWBInfo.findOne({awb_no: inputs.awb_no});
			
		
		if(awb_leg) {
			let values_to_update = {};
			
			//	Possible reasons to update the AWBLeg are:
			//	3. void the leg (for whatever reason)
			//	2. update the leg with changes that are coming from the booklist (altered time or altered pieces/weight)
			//	1. update the leg with valid values for flying the cargo
			
			if((inputs.status == sails.config.custom.database_model_enums.awb_leg_status.discarded) || (inputs.void_on > 0)) {
				if(inputs.void_on)				values_to_update.void_on = inputs.void_on;
				if(inputs.void_reason)			values_to_update.void_reason = inputs.void_reason;
				values_to_update.status = sails.config.custom.database_model_enums.awb_leg_status.discarded;
				sails.config.log.addlog(3, "helper", "update-awb-leg", 'discarding due to completed ====================='+inputs.id, inputs.awb_no);
			} else if (	inputs.actual_departure		||
						inputs.actual_arrival		||
						inputs.actual_pieces_flown	||
						inputs.actual_weight_flown) {
				if(inputs.actual_departure)		values_to_update.actual_departure = inputs.actual_departure;
				if(inputs.actual_arrival)		values_to_update.actual_arrival = inputs.actual_arrival;
				if(inputs.actual_pieces_flown)	values_to_update.actual_pieces_flown = inputs.actual_pieces_flown;
				if(inputs.actual_weight_flown)	values_to_update.actual_weight_flown = inputs.actual_weight_flown;
				values_to_update.status = sails.config.custom.database_model_enums.awb_leg_status.completed;
			} else {
				
				if(inputs.to) {
					let timezoneDetails = await Station.findOne({where: {iata: inputs.to}, select: ["tz"]}).catch(err => console.log( err.message));
					values_to_update.to = inputs.to;
					values_to_update.to_tz =timezoneDetails.tz;
				}
				
				if(inputs.pieces)				values_to_update.pieces = inputs.pieces;
				if(inputs.weight)				values_to_update.weight = inputs.weight;
				if(inputs.booklist)				values_to_update.booklist = inputs.booklist;
				if(inputs.flight_no)			values_to_update.flight_no = inputs.flight_no;
				if(inputs.planned_departure)	values_to_update.planned_departure = inputs.planned_departure;
				if(inputs.planned_arrival)		values_to_update.planned_arrival = inputs.planned_arrival;
				values_to_update.transhipment = awb_info.transhipment;		
				if(inputs.value_added_product)	values_to_update.value_added_product = inputs.value_added_product;
				if(inputs.volume)				values_to_update.volume = inputs.volume;
				if(inputs.dimensions)			values_to_update.dimensions = inputs.dimensions;
				if(inputs.flight_no)			values_to_update.flight_no = inputs.flight_no;
				if(inputs.planned_departure)	values_to_update.planned_departure = inputs.planned_departure;
			}
			
			if(inputs.status) values_to_update.status = inputs.status;
			//console.log('-----00------'+JSON.stringify(values_to_update));
			awb_leg = await AWBLeg.update({id: inputs.id}).set(values_to_update).fetch();
			awb_leg = awb_leg[0];
		}
		//	If awb_leg does not exists, then before creating new AWBLeg, check if there exist any AWBLeg with blank qty and use it
		//	If awb_leg still does not exists, then create a new AwbLeg in DB with the received qty
		else {
			let values_to_create = {};
			
			empty_leg = await AWBLeg.findOne({
				awb_no: inputs.awb_no, 
				station: inputs.station, 
				from: inputs.from,
				pieces: {'<': 0}
			});
			
			if(empty_leg) {
				//console.log('empty leg found for = ' + inputs.awb_no);
				//	Update the existing empty leg
				inputs.id = empty_leg.id;
				awb_leg = await sails.helpers.planner.updateAwbLeg.with(inputs);
			} else if (inputs.pieces !== 0) {
				//console.log('empty leg NOT found for = ' + inputs.awb_no);
				let from_station = await Station.findOne({where: {iata: inputs.from}, select: ["tz"]}).catch(err => console.log( err.message));
				//console.log('from_station = ' + from_station);
				let to_station = inputs.to ? await Station.findOne({where: {iata: inputs.to}, select: ["tz"]}).catch(err => console.log( err.message)) : undefined;
				//console.log('to_station = ' + to_station);

				//	COMPULSORY values for adding for the leg
				values_to_create.awb_info = 	inputs.awb_info;
				values_to_create.booklist = 	inputs.booklist;
				
				values_to_create.station = 		inputs.station;
				values_to_create.awb_no = 		inputs.awb_no;
				values_to_create.from = 		inputs.from;
				values_to_create.from_tz = 		from_station['tz'];
				values_to_create.created_by = 	inputs.created_by;
				values_to_create.pieces = 		inputs.pieces;
				values_to_create.transhipment = awb_info.transhipment;
				//values_to_create.weight = 		inputs.weight;

				if(inputs.to)					{values_to_create.to = inputs.to; values_to_create.to_tz = to_station['tz'];}
				
				if(inputs.weight)				values_to_create.weight = inputs.weight;
				//if(inputs.to_tz)				values_to_update.to_tz = inputs.to_tz;
				if(inputs.flight_no)			values_to_create.flight_no = inputs.flight_no;
				if(inputs.planned_departure)	values_to_create.planned_departure = inputs.planned_departure;
				if(inputs.planned_arrival)		values_to_create.planned_arrival = inputs.planned_arrival;
				//if(inputs.actual_departure)		values_to_create.actual_departure = inputs.actual_departure;
				//if(inputs.actual_arrival)		values_to_create.actual_arrival = inputs.actual_arrival;
				// if(inputs.transhipment)			values_to_create.transhipment = awb_info.transhipment;
				if(inputs.status)				values_to_create.status = inputs.status;
				//if(inputs.actual_pieces_flown)	values_to_create.actual_pieces_flown = inputs.actual_pieces_flown;
				//if(inputs.actual_weight_flown)	values_to_create.actual_weight_flown = inputs.actual_weight_flown;
				if(inputs.value_added_product)	values_to_create.value_added_product = inputs.value_added_product;
				if(inputs.volume)				values_to_create.volume = inputs.volume;
				if(inputs.dimensions)			values_to_create.dimensions = inputs.dimensions;

				//console.log('value to create = ' + JSON.stringify(values_to_create));
				awb_leg = await AWBLeg.create(values_to_create).fetch();
				//console.log('!!!!! ' + JSON.stringify(awb_leg));
			}
		}
		
		/*if (awb_leg.pieces > 0){
			//console.log('legops to be created  '+ JSON.stringify(awb_leg));
		} else {
			//console.log('legops not to be created  '+ JSON.stringify(awb_leg));
		}*/

		if(awb_leg && awb_info) {
			// let awb_info = await AWBInfo.findOne({awb_no: inputs.awb_no});
			awb_leg.awb_info = awb_info;
		}

		sails.config.log.addOUTlog("helper", "update-awb-leg");
		//	return the created AwbLeg
		exits.success(awb_leg);
	}
};