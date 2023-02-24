module.exports = {

	friendlyName: 'validateAwbNumber',

	description: 'Validates the AWB number and replies as true/false. It also optionally send the email if the awb number is incorrect.',

	inputs: {
		awb_no: 				{type: 'string', required: true},							//	Compulsory
		send_email:		        {type: 'boolean'},
        station:                {type: 'string'}
	},

	exits: {
		success: {
			outputDescription: "returns back the true/false as per the modulus-7 check",
		}
	},

	fn: async function (inputs, exits) {
		sails.config.log.addINlog("helper", "validate-awb-number");
		sails.config.log.addlog(3, "helper", "validate-awb-number", `inputs = ${JSON.stringify(inputs)}`, inputs.awb_no);

        let awbNumber = inputs.awb_no;
        let validAWBNumber = awbNumber.substring(3);
        let divident = Number(validAWBNumber.slice(0,7));
        let reminder = (Number(validAWBNumber.slice(7)));

        let number_is_valid = (divident % 7) == reminder;

        sails.config.log.addlog(3, "helper", "validate-awb-number", `inputs = ${JSON.stringify(inputs)}`, `number is valid = ${number_is_valid}`);

        if(number_is_valid == false && inputs.send_email) {
            if(!inputs.station) {
                sails.config.log.addlog(0, "helper", "validate-awb-number", `require station value to send email`);
            }

            let email;
            switch(inputs.station) {
                case 'BOM': 
                    email = "cargoops.bom@ba.com";
                    break;
                case 'BLR': 
                    email = "cargoops.blr@ba.com";
                    break;
                case 'DEL': 
                    email = "cargoops.del@ba.com";
                    break;
                case 'HYD': 
                    email = "cargoops.hyd@ba.com";
                    break;
                case 'MAA': 
                    email = "cargoops.maa@ba.com";
                    break;
            }

            if(email) {
                /*sails.helpers.sendEmail.with({
                    to: email,
                    subject: `Incorrect AWB Number ${inputs.awb_no} Received from ${inputs.station}`,
                    html: `The received AWB Number ${inputs.awb_no} is unrecognized/wrong, please recheck and send email with the correct AWB number.`
                }, function (err) {
                    if (err) {
                        sails.config.log.addlog(0, "helper", "validate-awb-number", JSON.stringify(err));
                    }
                });*/
                console.log(`sending email to ${email}`)
            } else {
                sails.config.log.addlog(0, "helper", "validate-awb-number", `cannot send email for station ${inputs.station}`);
            }
        }

		sails.config.log.addOUTlog("helper", "validate-awb-number");
		exits.success(sails.config.custom.jsonResponse(null, number_is_valid));
	}
};