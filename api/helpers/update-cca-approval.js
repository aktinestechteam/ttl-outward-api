module.exports = {

	friendlyName: 'updateCCAApproval',

	description: 'Updates / Create the CCAApproval Record',

	inputs: {
		awb_no: { type: 'string', required: true },
		awb_leg_id: { type: 'string', required: true },
		station: { type: 'string', required: true },
		cca_records_id: { type: 'json', required: true },
		cca_records_data: { type: 'json', required: true },
		issuer_name: {type: 'string' },
	},

	exits: {
		success: {
			outputDescription: "returns back the CCA object that is being created/updated",
		}
	},

	fn: async function (inputs, exits) {

		sails.config.log.addINlog("helper", "update-cca-approval");

		sails.config.log.addlog(3, "helper", "update-cca-approval", JSON.stringify(inputs)), inputs.awb_no;

		//	check if ccaApprovalcopy with pending status
		let ccaApprovalRecord = await CCAApproval.findOne({ where: { awb_leg_id: inputs.awb_leg_id, status: sails.config.custom.cca_approval_status.pending } }).catch(err => sails.config.log.addlog(0, "helper", "update-cca-approval", err.message, inputs.awb_no));

		sails.config.log.addlog(3, "helper", "update-cca-approval", 'ccaRecord = ' + JSON.stringify(ccaApprovalRecord), inputs.awb_no);
		let including_cca_requests = [];
		let ccaRecord = '';
		//	If CCA copy exists, then update the CCA copy
		if (ccaApprovalRecord) {
			let values_to_update = {};
			let value_is_added = false;
			including_cca_requests = (ccaApprovalRecord.cca_records_included);
			including_cca_requests = including_cca_requests.concat(inputs.cca_records_id);
			values_to_update.cca_records_included = including_cca_requests;
			values_to_update.cca_form_data = inputs.cca_records_data;
			value_is_added = true;

			if (value_is_added) {
				//console.log('values_to_update')
				sails.config.log.addlog(3, "helper", "update-cca-approval", 'values_to_update = ' + JSON.stringify(values_to_update), inputs.awb_no);
				let ccaRecords = await CCAApproval.update({ id: ccaApprovalRecord.id }).set(values_to_update).fetch();
				ccaRecord = ccaRecords[0];	//	HACK
			}
		}
		//	If CCA copy does no exists, then create CCA in DB
		else {
			let values_to_add = {};

			values_to_add.cca_no = await sails.helpers.ccaRefNumber.with({
				date: Date.now(),
				generate_number_for: inputs.station
			});

			values_to_add.cca_form_number = values_to_add.cca_no
			values_to_add.awb_no = inputs.awb_no;
			values_to_add.awb_leg_id = inputs.awb_leg_id;
			values_to_add.station = inputs.station;
			values_to_add.issuer_name = inputs.issuer_name
			values_to_add.status = sails.config.custom.cca_approval_status.pending;
			values_to_add.cca_records_included = inputs.cca_records_id;
			inputs.cca_records_data.ccaref = values_to_add.cca_no;
			inputs.cca_records_data.number = values_to_add.cca_no;
			inputs.cca_records_data.ref_cca_no = values_to_add.cca_no;
			values_to_add.cca_form_data = inputs.cca_records_data;
			sails.config.log.addlog(3, "helper", "update-cca-approval", 'values to addd======>   .. > ' + values_to_add.cca_records_included, inputs.awb_no);
			sails.config.log.addlog(3, "helper", "update-cca-approval", 'values to cca_records_id======>   .. > ' + inputs.cca_records_id, inputs.awb_no);
			ccaRecord = await CCAApproval.create(values_to_add).fetch().catch(err => console.log(err.message));
		}

		await CCARequest.update({id: {'in': inputs.cca_records_id}}).set({is_included: true});

		sails.config.log.addOUTlog("helper", "update-cca-approval");
		exits.success(ccaRecord);
	}
};