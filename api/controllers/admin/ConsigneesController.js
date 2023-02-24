/**
 * ConsigneesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	//function to add consignee gstin on awb page
	saveconsigneegstin: function (req, res) {
		sails.config.log.addINlog(req, "saveconsigneegstin");
		var id = req.body.inwardcargo_awb_consignee_info_consignee_id;
		var consigneeGSTIN = req.body.inwardcargo_awb_consignee_info_gstin_input;

		Address.update({
			_id: id
		}, {
			gstin: consigneeGSTIN
		}).fetch().exec(function (err, updatedConsignee) {
			if (err) {
				sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + err);
				sails.config.log.addlog(1, req, "getairportlist","Something Happens During Updating Or Inserting");
				return res.send({
					error: 'Something Happens During Updating Or Inserting'
				});
			} else {
				sails.log.info(req + ' - ' + new Date() + ' INFO - (saveconsigneegstin - post) Consignee GSTIN updated successfully');
				sails.config.log.addOUTlog(req, "saveconsigneegstin");
				return res.send({
					value: updatedConsignee
				});
			}
		});
	},
	//function to add consignee gstin on saved awb page as well as add consignee_gstn in awb
	saveconsigneegstinsavedawb: function (req, res) {
		sails.config.log.addINlog(req, "saveconsigneegstinsavedawb");
		var id = req.body.inwardcargo_awb_consignee_info_consignee_id_saved_awb;
		var awbid = req.body.inwardcargo_awb_consignee_info_awb_id_saved_awb;
		var consigneeGSTIN = req.body.inwardcargo_awb_consignee_info_gstin_saved_awb_input;
		sails.config.globals.async.waterfall([
			function (callback) {
				AwbUserData.update({
					_id: awbid
				}, {
					consignee_gstn: consigneeGSTIN
				}).fetch().exec(function (err, updatedAwb) {
					if (err) {
						sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + err);
						sails.config.log.addlog(1, req, "saveconsigneegstinsavedawb",err);
						callback('Something Happens During Updating Or Inserting', null);
					} else {
						callback(null, updatedAwb);
					}
				});
			},
			function (updatedAwb, callback) {
				Address.update({
					_id: id
				}, {
					gstin: consigneeGSTIN
				}).fetch().exec(function (err, updatedConsignee) {
					if (err) {
						sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + err);
						sails.config.log.addlog(1, req, "saveconsigneegstinsavedawb",err);
						callback('Something Happens During Updating Or Inserting', null);
					} else {
						sails.log.info(req + ' - ' + new Date() + ' INFO - (saveconsigneegstin - post) Awb GSTIN updated successfully');
						callback(null, updatedConsignee);
					}
				});
			},
		], function (err, result) {
			if (err) {
				sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + err);
				sails.config.log.addlog(1, req, "saveconsigneegstinsavedawb",err);
				return res.send({
					error: 'Something Happens During Updating Or Inserting'
				});
			} else {
				sails.log.info(req + ' - ' + new Date() + ' INFO - (saveconsigneegstin - post) Consignee GSTIN updated successfully');
				return res.send({
					value: result
				});
			}
		});
		sails.config.log.addOUTlog(req, "saveconsigneegstinsavedawb");
	},
	// function to add consignee ,update consignee
	consignees: function (req, res) {
		sails.config.log.addINlog(req, "consignees");
		var id = req.body.inwardcargo_consignees_list_id;
		var consigneeFullName = req.body.inwardcargo_consignees_list_fullname_input;
		var consigneeAddress = req.body.inwardcargo_consignees_list_address_input;
		var consigneeState = req.body.inwardcargo_consignees_list_state_input;
		var consigneeEmail = req.body.inwardcargo_consignees_list_email_input;
		var consigneePhone = req.body.inwardcargo_consignees_list_phone_input;
		var consigneePincode = req.body.inwardcargo_consignees_list_pincode_input;
		var consigneeCityIATA = req.body.inwardcargo_consignees_list_city_input;
		var consigneeCreditPeriod = req.body.inwardcargo_consignees_list_credit_period_input;
		var consigneeGSTIN = req.body.inwardcargo_consignees_list_gstin_input;
		var consigneeCustomerType = req.body.inwardcargo_consignees_list_customer_input;
		var isSez = req.body.inwardcargo_consignees_list_is_sez;
		var isEnableConsignee = req.body.inwardcargo_consignees_list_enable_consignee;
		var gstExemption = req.body.inwardcargo_consignees_list_gst_exemption;
		var isFullNameNum = /^\d+$/.test(consigneeFullName);
		var isPhoneNumber = /^\d{10}/.test(consigneePhone);
		var isGst = consigneeGSTIN ? /^([0-2][0-9]|[3][0-7])[A-Z]{3}[ABCFGHLJPTK][A-Z]\d{4}[A-Z][A-Z0-9][Z][A-Z0-9]$/.test(consigneeGSTIN) : true;
		//var isEmail = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(consigneeEmail);
		var isPincode = /^\d{6}/.test(consigneePincode);
		if (consigneeFullName == undefined || consigneeFullName == null || consigneeFullName == '') {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + 'Name Cannot be blank');
			sails.config.log.addlog(1, req, "consignees","ERR_C_NAME_BLANK");
			return res.send({
				error: 'Name Cannot be blank',
				error_code: 'ERR_C_NAME_BLANK'
			});
		} else if (consigneeAddress == undefined || consigneeAddress == null || consigneeAddress == '') {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + 'Address Cannot be blank');
			sails.config.log.addlog(1, req, "consignees","ERR_C_ADDRESS_BLANK");
			return res.send({
				error: 'Address Cannot be blank',
				error_code: 'ERR_C_ADDRESS_BLANK'
			});
			/*}else if (consigneeEmail == undefined || consigneeEmail == null || consigneeEmail == '') {
				sails.log.error(req + ' - ' + new Date() +' ERR - (saveconsigneegstin - post)' + 'Email Cannot be blank');
				return res.send({error: 'Email Cannot be blank', error_code:'ERR_C_EMAIL_BLANK'});
			} else if(consigneeEmail && !isEmail){
				sails.log.error(req + ' - ' + new Date() +' ERR - (saveconsigneegstin - post)' + 'Email id is invalid');
				return res.send({error: 'Email id is invalid', error_code:'ERR_C_EMAIL_INVALID'});
			*/
		} else if (consigneeCityIATA == undefined || consigneeCityIATA == null || consigneeCityIATA == '') {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + 'City Cannot be blank');
			sails.config.log.addlog(1, req, "consignees","ERR_C_CITY_BLANK");
			return res.send({
				error: 'City Cannot be blank',
				error_code: 'ERR_C_CITY_BLANK'
			});
			/*}else if (consigneePhone == undefined || consigneePhone == null || consigneePhone == '') {
				sails.log.error(req + ' - ' + new Date() +' ERR - ' + 'Phone Cannot be blank');
				return res.send({error: 'Phone Cannot be blank', error_code:'ERR_C_PHONE_BLANK'});
			*/
		} else if (consigneeState == undefined || consigneeState == null || consigneeState == '') {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + 'State Cannot be blank');
			sails.config.log.addlog(1, req, "consignees","ERR_C_STATE_BLANK");
			return res.send({
				error: 'State Cannot be blank',
				error_code: 'ERR_C_STATE_BLANK'
			});
		} else if (isFullNameNum) {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + 'Full Name cannot be number');
			sails.config.log.addlog(1, req, "consignees","ERR_C_NAME_NOTNUMBER");
			return res.send({
				error: 'Full Name cannot be number',
				error_code: 'ERR_C_NAME_NOTNUMBER'
			});
		} else if (consigneePhone && !isPhoneNumber) {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + 'invalid Phone number');
			sails.config.log.addlog(1, req, "consignees","ERR_C_PHONE_INVALID");
			return res.send({
				error: 'invalid Phone number',
				error_code: 'ERR_C_PHONE_INVALID'
			});
		} else if (!isPincode) {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + 'invalid Pin code');
			sails.config.log.addlog(1, req, "consignees","ERR_C_PINCODE_INVALID");
			return res.send({
				error: 'invalid Pin code',
				error_code: 'ERR_C_PINCODE_INVALID'
			});
		} else {
			if (!isGst) {
				sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post)' + 'invalid GSTIN number');
				sails.config.log.addlog(1, req, "consignees","ERR_C_GSTIN_INVALID");
				return res.send({
					error: 'invalid GSTIN number',
					error_code: 'ERR_C_GSTIN_INVALID'
				});
			} else {
				sails.log.info(req + ' - ' + new Date() + ' INFO - (saveconsigneegstin - post) Consignee all validation passed');
				Address.findOrCreate({
						_id: id
					}, {
						name: consigneeFullName,
						name_alias: consigneeFullName,
						address_text: consigneeAddress,
						email: consigneeEmail,
						pincode: consigneePincode,
						phone: consigneePhone,
						state: consigneeState,
						gstin: consigneeGSTIN,
						is_sez: isSez,
						credit_period: consigneeCreditPeriod,
						type_of_customer: consigneeCustomerType,
						city_iata_code: consigneeCityIATA,
						is_enable_consignee: isEnableConsignee,
						gst_exemption: gstExemption,
						created_by: req
					})
					.exec(async (err, address, wasCreated) => {
						if (err) {
							sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post) ' + err);
							sails.config.log.addlog(1, req, "consignees",err);
							return res.send({
								error: err
							});
						} else {
							sails.log.info(req + ' - ' + new Date() + ' INFO - (saveconsigneegstin - post) Check for existing consignee if it is found fetch for updation otherwise create consignee');
							Address.update({
									_id: address.id
								}, {
									name: consigneeFullName,
									name_alias: consigneeFullName,
									address_text: consigneeAddress,
									email: consigneeEmail,
									pincode: consigneePincode,
									phone: consigneePhone,
									state: consigneeState,
									gstin: consigneeGSTIN,
									is_sez: isSez,
									credit_period: consigneeCreditPeriod,
									type_of_customer: consigneeCustomerType,
									city_iata_code: consigneeCityIATA,
									is_enable_consignee: isEnableConsignee,
									gst_exemption: gstExemption
								}).fetch()
								.exec(function (err, updatedConsignee) {
									if (err) {
										sails.log.error(req + ' - ' + new Date() + ' ERR - (saveconsigneegstin - post) ' + err);
										sails.config.log.addlog(1, req, "consignees",err);
										return res.send({
											error: 'Something Happens During Updating Or Inserting'
										});
									} else {
										sails.log.info(req + ' - ' + new Date() + ' INFO - (saveconsigneegstin - post) Consignee updated successfully');
										sails.config.log.addOUTlog(req, "consignees");
										return res.send({
											value: updatedConsignee[0]
										});
									}
								});
						}
					});
			}
		}
	},
	//function used to render consignee page
	getconsigneeslist: function (req, res) {
		sails.config.log.addINlog(req, "getconsigneeslist");
		var city = req.query.inwardcargo_consignees_list_new_city;
		var consignee_name = req.query.inwardcargo_consignees_list_consignee_name_search_input ? req.query.inwardcargo_consignees_list_consignee_name_search_input : '';
		var query = {};
		query.where = {};
		query.where.and = [];
		if (req.user.role == 'user') {
			query.where.and.push({
				"is_inward_port": true
			});
			query.where.and.push({
				"iata_code": req.user.iata_code
			});
			query.sort = 'iata_code';
		} else if (req.user.role == 'admin') {
			query.where.and.push({
				"is_inward_port": true
			});
			query.sort = 'iata_code';
		}
		sails.config.globals.async.waterfall([
			function (callback) {
				Ports.find(query, function (err, ports) {
					if (err) {
						sails.log.error(req + ' - ' + new Date() + ' ERR - (getconsigneeslist - get) ' + err);
						sails.config.log.addlog(1, req, "getconsigneeslist",err);
						callback('something went wrong while finding airports', null, null, null, null);
					} else {
						if (ports.length > 0) {
							sails.log.info(req + ' - ' + new Date() + ' INFO - (getconsigneeslist - get) Find all ports who matches criteria and sort by iata code');
							callback(null, ports);
						} else {
							callback('There are no ports to work with', null, null, null, null);
						}
					}
				});
			},
			function (ports, callback) {
				Gst.find({
					where: {},
					sort: 'state_name'
				}, function (err, gst) {
					if (err) {
						sails.config.log.addlog(1, req, "getconsigneeslist",err);
						sails.log.error(req + ' - ' + new Date() + ' ERR - (getconsigneeslist - get)' + err);
						callback('something went wrong while finding airports', null, null, null, null);
					} else {
						sails.log.info(req + ' - ' + new Date() + ' INFO - (getconsigneeslist - get) Find all gst and sort by state name');
						callback(null, ports, gst);
					}
				});
			},
			function (ports, gst, callback) {
				if (city === undefined && ports) {
					sails.log.info(req + ' - ' + new Date() + 'INFO - (getconsigneeslist - get) if city is undefined then take first city');
					city = ports[0].iata_code;
				}
				Address.find({
					where: {
						and: [{
								city_iata_code: city
							},
							{
								name_alias: {
									contains: consignee_name.toLowerCase()
								}
							}
						]
					},
					sort: 'name'
				}, function (err, consignees) {
					if (err) {
						sails.log.error(req + ' - ' + new Date() + ' ERR - ' + err);
						sails.config.log.addlog(1, req, "getconsigneeslist",err);
						callback('something went wrong while finding consignees', null, null, null, null);
					} else {
						sails.log.info(req + ' - ' + new Date() + ' INFO - (getconsigneeslist - get) Find all consignees who matches criteria');
						callback(null, consignees, ports, gst);
					}
				});
			}
		], function (err, consignees, ports, gst) {
			if (err) {
				sails.log.error(req + ' - ' + new Date() + ' ERR - ' + err);
				sails.config.log.addlog(1, req, "getconsigneeslist",err);
				return res.view('pages/imlost', {
					error: err
				});
			} else {
				sails.log.info(req + ' - ' + new Date() + ' INFO - (getconsigneeslist - get) render consignee page');
				return res.view('pages/consignees', {
					consigneeslistdetails: consignees,
					airportlistdetails: ports,
					gstlistdetails: gst,
					cityCode: city
				});
			}
		});
		sails.config.log.addOUTlog(req, "getconsigneeslist");
	},
};