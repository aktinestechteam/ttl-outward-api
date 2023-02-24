module.exports = {

	friendlyName: 'updateCCA',

	description: 'Updates / Create the CCA and for respective AWB',

	inputs: {
		awb_no:				{type: 'string', required: true },
		raised_by:			{type: 'string', required: true },//user
		raised_by_dept:		{type: 'string', required: true },
		reason:				{type: 'json', required: true },
		reason_text:		{type: 'string', required: true },
		station:			{type: 'string', required: true },
		created_by:			{type: 'string', required: true },
		cca_request_id:		{type: 'string',required: true }
	},

	exits: {
		success: {
			outputDescription: "returns back the CCA object that is being created/updated",
		}
	},

	fn: async function (inputs, exits) {	
		sails.config.log.addINlog("helper", "update-cca");
		sails.config.log.addlog(3, "helper", "update-cca", `inputs = ${JSON.stringify(inputs)}`);
		//	check if ccacopy with pending status
		let ccaRecord = await CCA.findOne({where:{ awb_no:inputs.awb_no, status:sails.config.custom.cca_status.pending}}).catch(err => sails.config.log.addlog(0, "helper", "update-cca", err.message));
		
		sails.config.log.addlog(3, "helper", "update-cca", 'ccaRecord = ' + JSON.stringify(ccaRecord));
		
		let including_cca_requests = [];
		let raised_by = [];
		let raised_by_dept = [];
		let reason = [];
		let reason_text = [];
		//	If CCA copy exists, then update the CCA copy
		if(ccaRecord) {
			let values_to_update = {};
			let value_is_added = false;
			including_cca_requests = (ccaRecord.including_cca_requests);
			raised_by = (ccaRecord.raised_by);
			raised_by_dept = (ccaRecord.raised_by_dept);
			//console.log('raisedbydept ===+'+  raised_by_dept);
			reason = (ccaRecord.reason);
			reason_text = (ccaRecord.reason_text);

			if(inputs.raised_by)		{
				raised_by.push(inputs.raised_by);
				values_to_update.raised_by = raised_by; value_is_added = true;
			}
			
			if(inputs.raised_by_dept)	{
				raised_by_dept.push(inputs.raised_by_dept);
				values_to_update.raised_by_dept = raised_by_dept; 
				value_is_added = true;
			}
			
			if(inputs.reason)			{
				reason.push(inputs.reason);
				values_to_update.reason = reason; 
				value_is_added = true;
			}
			
			if(inputs.reason_text)		{
				reason_text.push(inputs.reason_text);
				values_to_update.reason_text = reason_text;
				value_is_added = true;
			}
			
			if(inputs.cca_request_id)	{
				including_cca_requests.push(inputs.cca_request_id);
				values_to_update.including_cca_requests = including_cca_requests;
				value_is_added = true;
			}
			
			if(value_is_added) {
				//console.log('values_to_update')
				sails.config.log.addlog(3, "helper", "update-cca", 'values_to_update ' +JSON.stringify(values_to_update));
				let ccaRecords = await CCA.update({id: ccaRecord.id}).set(values_to_update).fetch();
				ccaRecord = ccaRecords[0];	//	HACK
			}
		}
		//	If CCA copy does no exists, then create CCA in DB
		else {
			let values_to_add = {};
			including_cca_requests.push(inputs.cca_request_id);
			raised_by.push(inputs.raised_by);
			raised_by_dept.push(inputs.raised_by_dept);
			sails.config.log.addlog(3, "helper", "update-cca", 'raisedbydept = '+  raised_by_dept);

			reason.push(inputs.reason);
			reason_text.push(inputs.reason_text);
			//	Values that is COMPULSORY to be added for creating new cca with random cca number ex.BOM/946/18

			
			values_to_add.cca_no = ('XXXBOM/946/18XXX'+ new Date().getTime());
			values_to_add.awb_no = inputs.awb_no;
			values_to_add.station = inputs.station;
			values_to_add.created_by = inputs.created_by;
			values_to_add.raised_by = raised_by;
			values_to_add.raised_by_dept = raised_by_dept;
			values_to_add.reason = reason;
			values_to_add.reason_text = reason_text;
			values_to_add.status = sails.config.custom.cca_status.pending;
			values_to_add.including_cca_requests = including_cca_requests;
			ccaRecord = await CCA.create(values_to_add).fetch().catch(err => console.log( err.message));
		}

		sails.config.log.addOUTlog("helper", "update-cca");
		exits.success(ccaRecord);
	}
};