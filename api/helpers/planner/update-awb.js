module.exports = {

	friendlyName: 'updateAWB',

	description: 'Updates / Create the AWB and AWB info as available',

	inputs: {
		awb_no: 				{type: 'string'},							//	Compulsory
		outward: 				{type: 'boolean', defaultsTo: true},
		
		station:				{type: 'string', required: true },			//	Compulsory to create new AWB
		pieces:					{type: 'number', defaultsTo: 0 },
		weight:					{type: 'number', defaultsTo: 0 },
		src:					{type: 'string' },							//	Compulsory to create new AWB
		dest:					{type: 'string' },
		//consignee:				{type: 'string' },	//ref
		issuer_name:			{type: 'string' },
		issuer_code:			{type: 'string' },
		unitized:				{type: 'boolean'},
		//awb_legs:				{collection: 'AWBLeg', via: 'awb_info' }, 	//	ref
		saved_by:				{type: 'string'},							//	Compulsory to create new AWB
		transhipment:			{type: 'boolean', defaultsTo: false }, 
		
		shc:					{type: 'json' },
		
		on_hand:				{type: 'boolean', defaultsTo: false }, 
		rate_check:				{type: 'boolean', defaultsTo: false }, 
		fdc:					{type: 'boolean', defaultsTo: false }, 
		pre_alert:				{type: 'boolean', defaultsTo: false }, 
		euics:					{type: 'boolean', defaultsTo: false }, 
		cap_a:					{type: 'boolean', defaultsTo: false }, 
		eawb_check:				{type: 'boolean', defaultsTo: false }, 
		rcf:					{type: 'boolean', defaultsTo: false }, 
		//cca:					{type: 'json' },	//ref 
		priority_class:			{type: 'string', isIn: ['M_CLASS', 'F_CLASS']},
		commodity: 				{type: 'string'},
		delivery_status:		{type: 'string'},
		customer_update:		{type: 'boolean'},
	},

	exits: {
		success: {
			outputDescription: "returns back the AWBInfo object that is being created/updated",
		}
	},

	fn: async function (inputs, exits) {
		sails.config.log.addINlog("helper", "update-awb");
		sails.config.log.addlog(3, "helper", "update-awb", `inputs = ${JSON.stringify(inputs)}`, inputs.awb_no);

		//	check if AWBInfo copy with void_on = 0 exists
		let awb_info = await AWBInfo.findOne({awb_no: inputs.awb_no, void_on: 0}).catch(err => console.log(err));;

		//	If AWBInfo copy exists, then update the AWBInfo copy
		if(awb_info) {
			let values_to_update = {};
			let value_is_added = false;
			
			if(inputs.pieces)			{values_to_update.pieces = inputs.pieces; value_is_added = true;}
			if(inputs.weight)			{values_to_update.weight = inputs.weight; value_is_added = true;}
			if(inputs.dest)				{values_to_update.dest = inputs.dest; value_is_added = true;}
			if(inputs.issuer_name)	{values_to_update.issuer_name = inputs.issuer_name; value_is_added = true;}
			if(inputs.issuer_code)	{values_to_update.issuer_code = inputs.issuer_code; value_is_added = true;}
			if(inputs.unitized)			{values_to_update.unitized = true; value_is_added = true;}
			if(inputs.transhipment)		{values_to_update.transhipment = inputs.transhipment; value_is_added = true;}
			if(inputs.shc)				{values_to_update.shc = inputs.shc; value_is_added = true;}
			if(inputs.on_hand)			{values_to_update.on_hand = inputs.on_hand; value_is_added = true;}
			if(inputs.rate_check)			{values_to_update.rate_check = inputs.rate_check; value_is_added = true;}
			if(inputs.fdc)			{values_to_update.fdc = inputs.fdc; value_is_added = true;}
			if(inputs.pre_alert)			{values_to_update.pre_alert = inputs.pre_alert; value_is_added = true;}
			if(inputs.euics)			{values_to_update.euics = inputs.euics; value_is_added = true;}
			if(inputs.cap_a)			{values_to_update.cap_a = inputs.cap_a; value_is_added = true;}
			if(inputs.eawb_check)			{values_to_update.eawb_check = inputs.eawb_check; value_is_added = true;}
			if(inputs.rcf)			{values_to_update.rcf = inputs.rcf; value_is_added = true;}
			if(inputs.delivery_status)		{values_to_update.delivery_status = inputs.delivery_status;value_is_added = true;}
			if(inputs.customer_update)	{values_to_update.customer_update = inputs.customer_update;value_is_added = true;}
			if(inputs.priority_class)	{values_to_update.priority_class = inputs.priority_class; value_is_added = true;}

			if(inputs.commodity)	{values_to_update.commodity = inputs.commodity; value_is_added = true;}
			if(value_is_added) {
				let awb_infos = await AWBInfo.update({id: awb_info.id}).set(values_to_update).fetch();
				awb_info = awb_infos[0];	//	HACK
			}
		}
		//	If AWBInfo copy does no exists, then create AWBInfo in DB
		else {
			let values_to_add = {};
			
			//	Values that is COMPULSORY to be added to the AWBInfo
			values_to_add.awb_no = inputs.awb_no;
			values_to_add.station = inputs.station;
			values_to_add.src = inputs.src;
			values_to_add.saved_by = inputs.saved_by;
			
			//	Optional values that is to be added to AwbInfo
			if(inputs.outward)			values_to_add.outward = inputs.outward;
			if(inputs.pieces)			values_to_add.pieces = inputs.pieces;
			if(inputs.weight)			values_to_add.weight = inputs.weight;
			if(inputs.dest)				values_to_add.dest = inputs.dest;
			if(inputs.issuer_name)	values_to_add.issuer_name = inputs.issuer_name;
			if(inputs.issuer_code)	values_to_add.issuer_code = inputs.issuer_code;
			if(inputs.unitized)		values_to_add.unitized = inputs.unitized;
			if(inputs.transhipment)		values_to_add.transhipment = inputs.transhipment;
			if(inputs.shc)				values_to_add.shc = inputs.shc;
			if(inputs.on_hand)			values_to_add.on_hand = inputs.on_hand;
			if(inputs.priority_class)	values_to_add.priority_class = inputs.priority_class;
			if(inputs.commodity)	values_to_add.commodity = inputs.commodity;
			if(inputs.customer_update)	{values_to_add.customer_update = inputs.customer_update;}

			
			awb_info = await AWBInfo.create(values_to_add).fetch().catch(err => console.log( err.message));
		}
		
		//	check if AWB copy exists
		let awb_exists = await AWB.count({awb_no: inputs.awb_no});
		
		//	If AWB copy does not exists, then create AWB in DB
		if(awb_exists == 0) {
			await AWB.create({awb_no: inputs.awb_no, outward: inputs.outward, awb_info: awb_info.id}).fetch().catch(err => console.log(err));
		}
		
		// if(inputs.on_hand == true){
		// 	sails.sockets.broadcast('planner','alterAWBBooklistRecord', {awb_no: awb_info.awb_no});	
		// }
		//awb_leg = await sails.helpers.planner.updateAwbLeg.with(awb_info);
		//	return AWBInfo copy


		//call (Y) sanitizer helper
		/*let checkAndCreateBlankLeg = await sails.helpers.awbSanitizer.with({
			station: inputs.station,
			awb_no: inputs.awb_no,
			savedBy: inputs.saved_by});
		console.log('created blank leg is'+ checkAndCreateBlankLeg);*/
		sails.config.log.addOUTlog("helper", "update-awb");
		exits.success(awb_info);
	}
};