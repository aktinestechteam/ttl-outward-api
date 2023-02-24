/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {

	/***************************************************************************
	 *                                                                          *
	 * Any other custom config this Sails app should use during development.    *
	 *                                                                          *
	 ***************************************************************************/
	// mailgunDomain: 'transactional-mail.example.com',
	// mailgunSecret: 'key-testkeyb183848139913858e8abd9a3',
	// stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',

	xlsx_date_from_windows: true,
	
	jwt_secret: "kl8N@m30k>%<,$^aGN*adF@2i82yi7s)GH!2",
	jwt_expiry: '20m',
	jwt_secret_refresh: "kl8N@m30k>%<,$^aGN*adF@2i82yi7s)GH!3",
	jwt_expiry_refresh: '4h',

	white_listed_emails: ["naval@mobigic.com"],

	database_model_enums: {
		
		awb_leg_status: {
			pending: 'PENDING', 
			completed: 'COMPLETED', 
			discarded: 'DISCARDED',
		},
	},

	socket: {
		room_name:{
			planner: 'main',
			operation: 'main',
			queryAndClaims: 'queryAndClaims'
		},
	},

	socket_listener: {
		addLegOps_airport_operation: 'addLegOps_airport_operation',
		addLegOps_central_operation: 'addLegOps_central_operation',
		addLegOps_planner_operation: 'addLegOps_planner_operation',
		addLegOps_central_finance: 'addLegOps_central_finance',
		addLegOps_central_recovery: 'addLegOps_central_recovery',

		removeLegOps_airport_operation: 'removeLegOps_airport_operation',
		removeLegOps_central_operation: 'removeLegOps_central_operation',
		removeLegOps_planner_operation: 'removeLegOps_planner_operation',
		removeLegOps_central_finance: 'removeLegOps_central_finance',
		removeLegOps_central_recovery: 'removeLegOps_central_recovery',

		lockedOps: 'lockedOps',
		unlockedOps: 'unlockedOps',
	},

	department_name: {
		airport_ops: 'AIRPORT OPS', // FDC_PENDING, EUICS_DISCREPANCY_PENDING
		central_ops: 'CENTRAL OPS', // RATE_CHECK_PENDING, RATE_CHECK_HOLD, RATE_CHECK_REFERRED, RMS_REVIEW, RMS_HUB_REVIEW, PRE_ALERT_PENDING, EUICS_PENDING, CAP_A_PENDING, E_AWB_CHECK_PENDING, 
		planner_ops: 'PLANNER OPS', // READY_TO_RATE_CHECK, READY_TO_FDC
		central_fin: 'CENTRAL FIN', // CCA_REQUEST_PENDING, CCA_APPROVAL_PENDING, CAP_A_DISCREPANCY_PENDING
		central_rec: 'CENTRAL REC' // RCF_PENDING, ASSIGN_FLIGHT_TO_RECOVERY, ESCALATION, P1ESCALATION, P2ESCALATION, AWB_QUERY_PENDING,
	},

	op_name: {
		rate_check: 'RATE CHECK',
		fdc: 'FDC',
		euics: 'EUICS',
		pre_alert: 'PRE_ALERT',
		cap_awb: 'CAP_AWB',
		e_awb: 'E_AWB',
		cca: 'CCA',
		recovery: 'RECOVERY',
		rcf: 'RCF'
	},

	awb_leg_ops_status: {
		discarded: 'DISCARDED',

		ready_to_rate_check: 'READY_TO_RATE_CHECK',
		rate_check_done: 'RATE_CHECK_DONE',
		rate_check_pending: 'RATE_CHECK_PENDING',
		rate_check_hold: 'RATE_CHECK_HOLD',
		rate_check_referred: 'RATE_CHECK_REFERRED',
		rate_check_rejected: 'RATE_CHECK_REJECTED',
		rms_review: 'RMS_REVIEW',
		rms_hub_review: 'RMS_HUB_REVIEW',

		ready_to_fdc: 'READY_TO_FDC',
		fdc_pending: 'FDC_PENDING',
		fdc_hold: 'FDC_HOLD',
		fdc_rejected: 'FDC_REJECTED',
		fdc_done: 'FDC_DONE',

		ready_to_recovery: 'READY_TO_RECOVERY',
		departed: 'DEPARTED',
		pre_alert_pending: 'PRE_ALERT_PENDING',
		euics_pending: 'EUICS_PENDING',
		cap_a_pending: 'CAP_A_PENDING',
		e_awb_check_pending: 'E_AWB_CHECK_PENDING',
		pre_alert_done: 'PRE_ALERT_DONE',
		euics_done: 'EUICS_DONE',
		cap_a_done: 'CAP_A_DONE',
		e_awb_check_done: 'E_AWB_CHECK_DONE',

		euics_discrepancy: 'EUICS_DISCREPANCY',
		cap_a_discrepancy: 'CAP_A_DISCREPANCY',

		euics_discrepancy_pending: 'EUICS_DISCREPANCY_PENDING',
		cap_a_discrepancy_pending: 'CAP_A_DISCREPANCY_PENDING',

		euics_discrepancy_done: 'EUICS_DISCREPANCY_DONE',
		cap_a_discrepancy_done: 'CAP_A_DISCREPANCY_DONE',

		assign_flight_to_recovery: 'ASSIGN_FLIGHT_TO_RECOVERY',
		recovered: 'RECOVERED',
		escalation: 'ESCALATION',
		// e_escalatio: 'EESCALATION',
		p1_escalation: 'P1_ESCALATION',
		p2_escalation: 'P2_ESCALATION',
		flight_delay: 'FLIGHT_DELAY',

		awb_query_pending: 'AWB_QUERY_PENDING',
		awb_query_visited: 'AWB_QUERY_VISITED',

		cca_request_pending: 'CCA_REQUEST_PENDING',
		cca_request_rejected: 'CCA_REQUEST_REJECTED',
		cca_approval_pending: 'CCA_APPROVAL_PENDING',
		cca_approval_approved: 'CCA_APPROVAL_APPROVED',
		cca_approval_rejected: 'CCA_APPROVAL_REJECTED',
		cca_done: 'CCA_DONE',

		rcf_pending: 'RCF_PENDING',
		rcf_done: 'RCF_DONE',
	},
	
	cca_approval_status:{
		pending: 'PENDING',
		approved: 'APPROVED',
		rejected: 'REJECTED'
	},

	awb_claim_status: {
		provisional: 'PROVISIONAL',
		allocated: 'ALLOCATED',
		hold: 'HOLD',
		offer: 'OFFER',
		barred: 'BARRED',
		closed: 'CLOSED',
	},

	//get this queue timer value from settings
	cut_off_timer:{
		ready_to_rate_check_duration: 30,
		ready_to_fdc_duration: 30,
		rate_check_pending_duration: 30,
		rate_check_hold_duration: 30,
		rate_check_referred_duration: 30,
		rms_review_duration: 30,
		rms_hub_review_duration: 30,
		fdc_pending_duration: 30,
		pre_alert_pending_duration: 30,
		euics_pending_duration: 30,
		cap_a_pending_duration: 30,
		e_awb_check_pending_duration: 30,
		euics_discrepancy_pending_duration: 30,
		cap_a_discrepancy_pending_duration: 30,
		ready_to_recovery_duration: 30,
		escalation_duration: 30,
		p1_escalation_duration: 30,
		p2_escalation_duration: 30,
		rcf_pending_duration: 30,
		awb_query_pending_duration: 30,
		cca_request_pending_duration: 30,
		cca_approval_pending_duration: 30
	},

	queue_timer:{
		ready_to_rate_check_queue_duration: 5,
		ready_to_fdc_queue_duration: 5,
		rate_check_pending_queue_duration: 10,
		rate_check_hold_queue_duration: 15,
		rate_check_referred_queue_duration: 15,
		rms_review_queue_duration: 100,
		rms_hub_review_queue_duration: 100,
		fdc_pending_queue_duration: 20,
		pre_alert_pending_queue_duration: 25,
		euics_pending_queue_duration: 25,
		cap_a_pending_queue_duration: 25,
		e_awb_check_pending_queue_duration: 25,
		euics_discrepancy_pending_queue_duration: 30,
		cap_a_discrepancy_pending_queue_duration: 35,
		ready_to_recovery_queue_duration: 40,
		escalation_queue_duration: 45,
		p1_escalation_queue_duration: 45,
		p2_escalation_queue_duration: 45,
		rcf_pending_queue_duration: 45,
		awb_query_pending_queue_duration: 45,
		cca_request_pending_queue_duration: 50,
		cca_approval_pending_queue_duration: 55
	},

	void_reason:{
		merged: 'MORE PCS ADDED TO EXISTING PLAN',
		new_booklist: 'LEG-DISCARDED-DUETO-NEW-BOOKLIST-IN-SAME-FLIGHT',
		revised_awb: 'REVISED_AWB',
		egm_offloaded: 'EGM_OFFLOADED',
		discarded_due_to_completly_flown: 'DISCARDED_DUE_TO_COMPLETLY_FLOWN'
	},

	reason_category: {
		short_ship: 'Short Ship',
		offload_controllable: 'Offload Controllable',
		offload_uncontrollable: 'Offload Uncontrollable'

	},

	setting_keys:{
		// read_email_oauth_access_token: {name: "read_email_oauth_access_token", defaultValue: ""},
		// read_email_oauth_refresh_token: {name: "read_email_oauth_refresh_token", defaultValue: ""},
		// read_email_oauth_access_token_expiry: {name: "read_email_oauth_access_token_expiry", defaultValue: 0},
		// write_email_oauth_access_token: {name: "write_email_oauth_access_token", defaultValue: ""},
		// write_email_oauth_refresh_token: {name: "write_email_oauth_refresh_token", defaultValue: ""},
		// write_email_oauth_access_token_expiry: {name: "write_email_oauth_access_token_expiry", defaultValue: 0},
	},

	email_credentials_for: {
		read_email: {
			name: "read_email",	//	Have this value same as the parent's key name.
			email_id: "central@ttgroupglobal.com",	//	Cops@2022
			application_id: "85833ad8-19ea-4f67-9f24-7f22bd4f0288",
			client_id: "85833ad8-19ea-4f67-9f24-7f22bd4f0288",
			object_id: "e232f911-b0a7-40dd-b3eb-cacab469adf6",
			tenant_id: "328ff087-8f0d-41d4-b71b-8b368174cd14",
			client_secret: "~NK8Q~avUvfhDsrxFOePLVJHGpnVDK2Gbi6RVcY1",
			access_token_name: "read_mail_access_token",
			access_token_expiry_name: "read_mail_access_token_expiry_name",
			refresh_token_name: "read_mail_refresh_token",
			redirect_url: "/azure/auth-redirect-read-email"
		},
		write_email: {
			name: "write_email",	//	Have this value same as the parent's key name.
			email_id: "CCA-Approval@ttgroupglobal.com",	//	Qut54628
			application_id: "85833ad8-19ea-4f67-9f24-7f22bd4f0288",
			client_id: "85833ad8-19ea-4f67-9f24-7f22bd4f0288",
			object_id: "e232f911-b0a7-40dd-b3eb-cacab469adf6",
			tenant_id: "328ff087-8f0d-41d4-b71b-8b368174cd14",
			client_secret: "~NK8Q~avUvfhDsrxFOePLVJHGpnVDK2Gbi6RVcY1",
			access_token_name: "write_mail_access_token",
			access_token_expiry_name: "write_mail_access_token_expiry_name",
			refresh_token_name: "write_mail_refresh_token",
			redirect_url: "/azure/auth-redirect-write-email"
		}
	},

	hardcoded_values:{
		min_weight: 0.001,
		savedBy: 'XXXXXXXSavedByUserNameXXXXXXX',
		createdBy: 'XXXXXXXCreatedByUserNameXXXXXXX',
		todo: 'needToWork'
	},

	month: ["01", "02","03","04","05","06","07","08","09","10","11","12"],
	nature_of_expense: ["1st reason", "2nd reason", "3rd reason", "4th reason"],
	Expense_departments: ["department 1", "department 2", "department 3", "department 4"],
	nature_expense: ["nature 1", "nature 2", "nature 3", "other"],

	////// the belowe code is refferd from outward apps custom.js file

	reset_password_timeout: 1 * 60 * 60 * 1000,
	
	base_url: 'http://localhost:1337',	//	Do not keep / in the end
	//base_url: 'https://capsbackend.ttgroupglobal.com',	//	Do not keep / in the end
	base_station_name: {
		mumbai : 'BOM',
		hyderabad : 'HYD',
		delhi : 'DEL',
		london: 'LHR'
	},
	airline_cargo_code: '125',
	airline_iata_code: 'BA',

	local_tz: 'Asia/Kolkata',

	jsonResponse: function (errormsg, data, token, refreshToken) {

		let response = new Object();
	
		if (errormsg) {
		  response.errormsg = errormsg;
		  sails.config.log.addlog(undefined, "ERROR", errormsg);
		}
	
		if (data != null && data != undefined)
		  response.data = data;
	
		if (token)
		  response.token = token;

		if (refreshToken)
		  response.refreshToken = refreshToken;

		return response;
	},
	
	getdumppath: function (purpose, fn) {
		return new Promise((good, bad) => {
			try {
				var date = new Date();
				var year = date.getFullYear();
				var month = date.getMonth() + 1;
				var day = date.getDate();

				var path_for_url = "/static_data/" + purpose + "/" + year + "/" + month + "/" + day + "/";
				var path = '.' + path_for_url;
				var mkdirp = require('mkdirp');
				const made = mkdirp.sync(path);
				good(path)

				if(fn) {
					fn(null, path_for_url);
				}
			} catch (err) {
				if(fn) {
					fn(err, null);
				}
				bad(err);
			}
		})
	},

	normalizeDigitsToTwo: function(n) {
		return n < 10 ? '0' + n : n; 
	},
	
	normalizeDigitsTo3Digits: function(n) {
		if(n < 10)
			return '00' + n;
		if(n < 100)
			return '0' + n;
		
		return n;
	},
	
	getReadableDate: function(timestamp, showTime = false, date_separator = '-', time_separator = ':') {
		
		let readable_date = 'NA';
		
		if(_.isNumber(timestamp)) {
			let date = new Date(timestamp);
			readable_date = sails.config.custom.normalizeDigitsToTwo(date.getDate()) + date_separator + sails.config.custom.normalizeDigitsToTwo(date.getMonth()+1) + date_separator + date.getFullYear();
			
			if(showTime) {
				readable_date += ', ' + sails.config.custom.normalizeDigitsToTwo(date.getHours()) + time_separator + sails.config.custom.normalizeDigitsToTwo(date.getMinutes());
			}
		}
		
		return readable_date;
	},
	
	getTimestamp: function(date) {	//	To be used only if date is of format 01-Apr-18 or 20190330
		let timestamp = 0;
		if(date) {
			let date_splits = date.split('-');
			if(date_splits.length === 3) {
				let currentYear = (new Date()).getFullYear();
				let shortYear = Number(date_splits[2]);
				if(shortYear > currentYear - 2000) {	//	which means short year belongs to 20th century
					date_splits[2] = '' + (1900 + shortYear);
				} else {
					date_splits[2] = '' + (2000 + shortYear);
				}
				
				timestamp = (new Date(_.kebabCase(date_splits))).getTime();
			} else if(date.length === 8) {
				timestamp = (new Date(_.kebabCase([date.slice(0,4), date.slice(4,6), date.slice(6)]))).getTime();
			}
		}
		
		return timestamp;
	},

	leftPad: function (number, targetLength) {
		var output = number + '';
		while (output.length < targetLength) {
			output = '0' + output;
		}
		return output;
	},

	createSettingKeys: async function() {
		let setting_keys = Object.keys(sails.config.custom.setting_keys);
		for(let index = 0; index < setting_keys.length; index++) {
			//	Check if the setting exists or not. If it does not exist, then create.
			let setting = await Settings.findOne({key: sails.config.custom.setting_keys[setting_keys[index]].name});

			if(setting) {
				console.log(`key: ${setting_keys[index]} already exists`);
			} else {
				await Settings.create({key: sails.config.custom.setting_keys[setting_keys[index]].name, value: sails.config.custom.setting_keys[setting_keys[index]].defaultValue});
			}
		}
	},

	getDateAtMidnight: function(date) {
		let midnight_date = date ? new Date(date) : new Date();
		midnight_date.setHours(0);
		midnight_date.setMinutes(0);
		midnight_date.setSeconds(0);
		midnight_date.setMilliseconds(0);

		return midnight_date;
	}

};
