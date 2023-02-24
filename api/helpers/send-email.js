module.exports = {


	friendlyName: 'Send email',


	description: '',


	inputs: {
		to: {
			type: 'string'
		},
		cc: {
			type: 'string'
		},
		bcc: {
			type: 'string'
		},

		subject: {
			type: 'string'
		},

		body: {
			type: 'string'
		},
		html: {
			type: 'string'
		},
		attachment: {
			type: 'string'
		}
	},


	exits: {

	},


	fn: async function (inputs, exits) {

		return exits.success(true);

		//	Disabling the EMAIL since we do not have the email account via which the sending of email should happen
		/*console.log('Email is disabled as there is no email account linked')
		exits.success(true);
		return;*/

		const nodemailer = require('nodemailer');

		// create reusable transporter object using the default SMTP transport

		let response = await sails.helpers.azure.getAuthTokens.with({for: sails.config.custom.email_credentials_for.write_email.name});

		if(response.errormsg) {
			sails.config.log.addlog(0, 'SEND_EMAIL', 'HELPER', response.errormsg, "", "SEND_EMAIL", "");
			return exits.success(false);
		}

		let access_token = await Settings.findOne({key: sails.config.custom.email_credentials_for.write_email.access_token_name});
		if(!access_token || !access_token.value) {
			sails.config.log.addlog(0, 'SEND_EMAIL', 'HELPER', "The token does not exists for sending email", "", "SEND_EMAIL", "");
			return exits.success(false);
		}

		let transporter = nodemailer.createTransport({
			host: 'smtp.office365.com',
			port: 587,
			secure: false, // true for 465, false for other ports
			auth: {
				//user: "CCA-Approval@ttgroupglobal.com",//"TESTApproval@ttgroupglobal.com", // generated ethereal user
				//pass: "Qut54628" // generated ethereal passwod
				type: 'OAuth2',
				user: sails.config.custom.email_credentials_for.write_email.email_id,//'support@vnops.in',
				accessToken: `${access_token.value}`,
			},
			requireTLS: true,
			debug: true,
			logger: true, 
		});

		// transporter.set("oauth2_provision_cb", (user, renew, callback) => {
		// 	console.log("oauth2_provision_cb called");
		// 	let accessToken = "";

		// 	if (!accessToken) {
		// 		return callback(new Error("Unknown user"));
		// 	} else {
		// 		return callback(null, accessToken);
		// 	}
		// });

		// setup email data with unicode symbols
		let mailOptions = {};
		mailOptions.from = sails.config.custom.email_credentials_for.write_email.email_id;//"CCA-Approval@ttgroupglobal.com";//'TESTApproval@ttgroupglobal.com'; // sender address

		if (inputs.to)
			mailOptions.to = inputs.to; // list of receivers
		if (inputs.subject)
			mailOptions.subject = inputs.subject; // Subject line
		if (inputs.body)
			mailOptions.text = inputs.body; // plain text body
		if (inputs.html)
			mailOptions.html = inputs.html; // html body
		if (inputs.attachment) {
			mailOptions.attachments = [{
				filename: inputs.attachment.substr(inputs.attachment.indexOf('/') + 1),
				path: inputs.attachment,
				contentType: 'application/pdf'
			}];
		}

		console.log("email body", inputs.body);
		console.log("email html", inputs.html);

		// send mail with defined transport object
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(' - ' + new Date() + ' ERR - (send-email - helper)' + error);
				exits.success(false);
			} else {
				exits.success(true);
			}
		});
	}
};
