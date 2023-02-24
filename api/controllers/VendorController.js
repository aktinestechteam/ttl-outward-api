/**
 * VendorController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	//create vendor record
	createvendor: async function (req, res) {
		var outwardcargo_vendor_id = req.body.outwardcargo_vendor_id;
		var outwardcargo_vendor_name = req.body.outwardcargo_vendor_name;
		var outwardcargo_vendor_email = req.body.outwardcargo_vendor_email;
		var outwardcargo_vendor_phone_no = req.body.outwardcargo_vendor_phone_no;
		var outwardcargo_vendor_address = req.body.outwardcargo_vendor_address;
		var outwardcargo_vendor_contract_for = req.body.outwardcargo_vendor_contract_for;
		var outwardcargo_vendor_enrollment_date = Number(req.body.outwardcargo_vendor_enrollment_date);
		var outwardcargo_vendor_contract_start_date = Number(req.body.outwardcargo_vendor_contract_start_date);
		var outwardcargo_vendor_contract_end_date = Number(req.body.outwardcargo_vendor_contract_end_date);
		var outwardcargo_vendor_budget_code = req.body.outwardcargo_vendor_budget_code;
		var outwardcargo_vendor_station = req.body.outwardcargo_vendor_station;
		var outwardcargo_vendor_owner = req.body.outwardcargo_vendor_owner;
		console.log(1)
		sails.config.globals.putinfolog(req, req.options.action, req.method, "Now check's for validation begins");
		console.log(2);
		
		console.log(outwardcargo_vendor_id+" "+outwardcargo_vendor_name+" "+outwardcargo_vendor_email+" "+outwardcargo_vendor_phone_no+" "+outwardcargo_vendor_address+" "+outwardcargo_vendor_contract_for+" "+outwardcargo_vendor_enrollment_date+" "+outwardcargo_vendor_contract_start_date+" "+outwardcargo_vendor_contract_end_date+" "+outwardcargo_vendor_budget_code+" "+outwardcargo_vendor_station+" "+outwardcargo_vendor_owner)
		//check for name 
		var isValidName = !sails.config.globals.validator.isEmpty(
			outwardcargo_vendor_name
		);
		console.log(3);

		//check for email id's
		var isEmail = await sails.helpers.validations.email.with({
			emailids: outwardcargo_vendor_email
		});
		console.log(4);
		console.log();
		//check for mobile number validation
		var isMobilePhone =
			sails.config.globals.validator.isLength(
				outwardcargo_vendor_phone_no, {
					min: 10,
					max: undefined
				}
			) &&
			(!sails.config.globals.validator.isEmpty(
					outwardcargo_vendor_phone_no
				) &&
				sails.config.globals.validator.isNumeric(
					outwardcargo_vendor_phone_no
				));
		console.log(5);

		//console.log(isMobilePhone);
		//check for address validation
		var isAddress = !sails.config.globals.validator.isEmpty(
			outwardcargo_vendor_address
		);
		console.log(6);
		//console.log(isAddress);
		//check for contract for
		var isContractFor = !sails.config.globals.validator.isEmpty(
			outwardcargo_vendor_contract_for
		);
		console.log(isContractFor);
		//check for enrollment date
		var isEnrollmentDate = !sails.config.globals.validator.isEmpty(
			''+outwardcargo_vendor_enrollment_date
		);
		console.log(isEnrollmentDate);
		console.log('isEnrollmentDate'+isEnrollmentDate);
		//check for contract date's
		var isValidContractDates = !sails.config.globals.validator.isEmpty(
				''+outwardcargo_vendor_contract_start_date
			) &&
			!sails.config.globals.validator.isEmpty(
				''+outwardcargo_vendor_contract_end_date
			) && (outwardcargo_vendor_contract_start_date >= new Date().getTime() ?
				true :
				false) &&
			(outwardcargo_vendor_contract_start_date <=
				outwardcargo_vendor_contract_end_date ?
				true :
				false);
		console.log(9);
		//passing through each check if one of the check failed pass error in response otherwise control goes to next check
		async.waterfall([
				function (callback) {
					if (isValidName) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Vendor Name Is valid");
						console.log(6);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Name is invalid");console.log(6);
						callback({
							error: 'Name is invalid',
							error_code: 'VENDOR_NAME'
						}, null);
					}
				},
				function (callback) {
					if (isEmail) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Email validation successfully");
						console.log(7);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, outwardcargo_vendor_email[isEmail.key] + ' is invalid');console.log(6);
						callback({
							error: outwardcargo_vendor_email[isEmail.key] + ' is invalid',
							error_code: 'VENDOR_EMAIL'
						}, null);
					}
				},
				function (callback) {
					if (isMobilePhone) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Mobile validation successfully");
						console.log(8);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Mobile Number is invalid');console.log(6);
						callback({
							error: 'Mobile Number is invalid',
							error_code: 'VENDOR_MOBILE'
						}, null);
					}
				},
				function (callback) {
					if (isAddress) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Address validation successfully');
						console.log(9);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Address is invalid');console.log(6);
						callback({
							error: 'Address is invalid',
							error_code: 'VENDOR_ADDRESS'
						}, null);
					}
				},
				function (callback) {
					if (isContractFor) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Contract For validation successfully');
						console.log(10);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Contract For is invalid');console.log(6);
						callback({
							error: 'Contract For is invalid',
							error_code: 'VENDOR_CONTRACTFOR'
						}, null);
					}
				},
				function (callback) {
					if (isEnrollmentDate) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Enrollment Date validation successfully');
						console.log(11);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Enrollment Date is invalid');console.log(6);
						callback({
							error: 'Enrollment Date is invalid',
							error_code: 'VENDOR_ENROLLDATE'
						}, null);
					}
				},
				function (callback) {
					if (isValidContractDates) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Contract Dates validation successfully');
						console.log(12);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, 'Contract Dates is invalid');
						console.log(13)
						console.log(isValidContractDates+" "+isEnrollmentDate);
						callback({
							error: 'Contract Dates is invalid',
							error_code: 'VENDOR_CONTRACTDATES'
						}, null);
					}
				},
				function (callback) {
					sails.config.globals.putinfolog(req, req.options.action, req.method, 'All Validations successfull, now check if record is already exist if not then create the record for vendor');
					//check if record is already exist if not then create the record
					Vendor.findOrCreate({
							_id: outwardcargo_vendor_id
						}, {
							name: outwardcargo_vendor_name,
							email: outwardcargo_vendor_email,
							phone: outwardcargo_vendor_phone_no,
							address: outwardcargo_vendor_address,
							contractFor: outwardcargo_vendor_contract_for,
							enrollmentDate: outwardcargo_vendor_enrollment_date,
							contractStartDate: outwardcargo_vendor_contract_start_date,
							contractEndDate: outwardcargo_vendor_contract_end_date,
							budgetCode: outwardcargo_vendor_budget_code,
							station: outwardcargo_vendor_station,
							owner: outwardcargo_vendor_owner
						})
						.exec(async (err, vendor, wasCreated) => {
							if (err) {
								//check for uniqueness error
								if (err.code == 'E_UNIQUE') {
									sails.config.globals.putinfolog(req, req.options.action, req.method, 'Vendor record already exists there for uniqueness error ');
									console.log(13);
									callback({
										error: sails.config.globals.uniqueError,
										error_code: 'VENDOR_E_UNIQUE'
									}, null);
								} else {
									sails.config.globals.putinfolog(req, req.options.action, req.method, err);
									console.log(err);console.log(14);
									callback({
										error: 'Something Happend During Creating Record',
										error_code: 'VENDOR_DB_CREATE'
									}, null);
								}
							} else {
								sails.config.globals.putinfolog(req, req.options.action, req.method, 'Updating intiated for vendor');
								//update vendor record
								Vendor.update({
										_id: vendor.id
									}, {
										name: outwardcargo_vendor_name,
										email: outwardcargo_vendor_email,
										phone: outwardcargo_vendor_phone_no,
										address: outwardcargo_vendor_address,
										contractFor: outwardcargo_vendor_contract_for,
										enrollmentDate: outwardcargo_vendor_enrollment_date,
										contractStartDate: outwardcargo_vendor_contract_start_date,
										contractEndDate: outwardcargo_vendor_contract_end_date,
										budgetCode: outwardcargo_vendor_budget_code,
										station: outwardcargo_vendor_station,
										owner: outwardcargo_vendor_owner
									}).fetch()
									.exec(function (err, updatedVendor) {
										if (err) {
											console.log(15);
											sails.config.globals.putinfolog(req, req.options.action, req.method, err);
											callback({
												error: 'Something Happens During Updating Or Inserting',
												error_code: 'VENDOR_DB_UPDATE'
											}, null);
										} else {
											console.log(16);
											sails.config.globals.putinfolog(req, req.options.action, req.method, 'Vendor updation successfull');
											callback(null, updatedVendor[0]);
										}
									});
							}
						});
				}
			],
			function (err, updatedVendor) {
				if (err) {
					sails.config.globals.putinfolog(req, req.options.action, req.method, err);
					return res.send(err);
				} else {
					sails.config.globals.putinfolog(req, req.options.action, req.method, 'updated vendor details send successfully');
					return res.send({
						value: updatedVendor
					});
				}
			});
	},

	//function to show vendor list
	getvendorlist: async function (req, res) {
		var city = req.query.outwardcargo_vendor_city;
		Vendor.find({
			where: {
				station: city
			},
			sort: 'name'
		}, function (err, vendors) {
			if (err) {
				sails.config.globals.putinfolog(req, req.options.action, req.method, err);
				return res.view('pages/imlost', {
					error: 'Error in finding vendor list'
				});
			} else {
				sails.config.globals.putinfolog(req, req.options.action, req.method, "vendor's detail found and send successfully");
				return res.view('pages/vendor-list', {
					vendorlistdetails: vendors,
					station : city
				});
			}
		});
	},
	
	deletevendor : async function (req, res){
		var deletevendorId = req.body.outwardcargo_vendor_id;
		Vendor.destroy({
			'_id': deletevendorId
		}).exec(function (err, updatedvendor) {
			if (err) {
				sails.config.globals.putinfolog(req, req.options.action, req.method, err);
				return res.view('pages/imlost', {
					error: 'Error while finding the port while deleting'
				});
			} else {
				sails.config.globals.putinfolog(req, req.options.action, req.method, "vendor detail found and delete successfully");
				return res.send({
					result: true
				});
			}
		});
	}
};