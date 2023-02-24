module.exports = {

	friendlyName: 'getBooklist',

	description: 'Obtaining a booklist for a given flight at a given date and time',

	inputs: {
		station:			{type: 'string', required: true},
		flight_no:			{type: 'string', required: true},
		flight_time:		{type: 'number', required: true},
	},

	exits: {
		success: {
			outputDescription: "a booklist for a given flight is provided.",
		}
	},

	fn: async function (inputs, exits) {	
		sails.config.log.addINlog("helper", "get-booklist");
		sails.config.log.addlog(3, "helper", "get-booklist", 'booklist helper = ' + JSON.stringify(inputs), JSON.stringify(inputs))

		let booklist_id = String(inputs.flight_time + inputs.flight_no + inputs.station);
		//console.log('booklist_id = ' + booklist_id)
		//	Using the available inputs, find if the booklist exists
		let booklist = await BookList.findOne({booklist_id: booklist_id});
		
		sails.config.log.addlog(3, "helper", "get-booklist", '1 = ' + JSON.stringify(booklist), JSON.stringify(inputs));
		
		//	if the booklist exists, return back the booklist
		//	if the booklist does not exist, create the booklist and return the booklist
		if(!booklist) {
			booklist = await BookList.create({
				booklist_id: booklist_id,
				station: inputs.station,
				flight_no: inputs.flight_no,
				flight_time: inputs.flight_time
			}).fetch();

			sails.config.log.addlog(3, "helper", "get-booklist", '2 = ' + JSON.stringify(booklist), JSON.stringify(inputs));
		}
		
		sails.config.log.addlog(3, "helper", "get-booklist", '3 = ' + JSON.stringify(booklist), JSON.stringify(inputs));


		sails.config.log.addOUTlog("helper", "get-booklist");
		exits.success(booklist);
	}
};