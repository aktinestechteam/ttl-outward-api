/**
 * BudgetAnalyzerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	//function to create budget record
	createbudget: async function (req, res) {
		sails.config.log.addINlog(req, "createbudget");
		var outwardcargo_budget_id = req.body.outwardcargo_budget_id;
		var outwardcargo_budget_department_name = req.body.outwardcargo_budget_department_name;
		var outwardcargo_budget_budget_amount = req.body.outwardcargo_budget_budget_amount;
		var outwardcargo_budget_month = req.body.outwardcargo_budget_month;
		var outwardcargo_budget_year = req.body.outwardcargo_budget_year;
		var outwardcargo_budget_city = req.body.outwardcargo_budget_city;
		var outwardcargo_budget_created_by = req;

		sails.config.globals.putinfolog(req, req.options.action, req.method, "Now check's for validation begins");
		//check for depart name
		var isDepartmentName = !sails.config.globals.validator.isEmpty(
			outwardcargo_budget_department_name
		);

		//check for budget, it should be greater than zero
		var isBudget = !sails.config.globals.validator.isEmpty(
			outwardcargo_budget_budget_amount
		) && (Number(outwardcargo_budget_budget_amount) > 0 ? true : false);

		//check for month,it should be greater than equal to current month and less than 12
		var isMonth = !sails.config.globals.validator.isEmpty(
			outwardcargo_budget_month
		) && (Number(outwardcargo_budget_year) <= new Date().getFullYear() && Number(outwardcargo_budget_month) < new Date().getMonth() ? false : true) && (Number(outwardcargo_budget_month) < 12 ? true : false);

		//check for year, it should be greater than current year
		var isYear = !sails.config.globals.validator.isEmpty(
			outwardcargo_budget_year
		) && (Number(outwardcargo_budget_year) >= new Date().getFullYear() ? true : false);

		//check for created by 
		var isCreatedBy = !sails.config.globals.validator.isEmpty(
			outwardcargo_budget_created_by
		);
		
		var isCity = !sails.config.globals.validator.isEmpty(
			outwardcargo_budget_city
		);

		//passing through each check if one of the check failed pass error in response otherwise control goes to next check
		async.waterfall([
				function (callback) {
					if (isDepartmentName) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Departname Name Is valid");
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Department Name is invalid");
						sails.config.log.addlog(1, req, "createbudget", "BUDGET_DEPT_NAME");
						callback({
							error: 'Department Name is invalid',
							error_code: 'BUDGET_DEPT_NAME'
						}, null);
					}
				},
				function (callback) {
					if (isBudget) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Budget Amount Is valid");
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Budget Amount is invalid");
						sails.config.log.addlog(1, req, "createbudget", "BUDGET_BUDGET_AMT");
						callback({
							error: 'Budget Amount is invalid ',
							error_code: 'BUDGET_BUDGET_AMT'
						}, null);
					}
				},
				function (callback) {
					if (isMonth) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Month is valid");
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Month is invalid");
						sails.config.log.addlog(1, req, "createbudget", "BUDGET_MONTH");
						callback({
							error: 'Month is invalid',
							error_code: 'BUDGET_MONTH'
						}, null);
					}
				},
				function (callback) {
					if (isYear) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Year is valid");
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Year is invalid");
						sails.config.log.addlog(1, req, "createbudget", "BUDGET_YEAR");
						callback({
							error: 'Year is invalid',
							error_code: 'BUDGET_YEAR'
						}, null);
					}
				},
				function (callback) {
					if (isCreatedBy) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Created By is valid");
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Created By is invalid");
						sails.config.log.addlog(1, req, "createbudget", "BUDGET_CREATED_BY");
						callback({
							error: 'Created By is invalid',
							error_code: 'BUDGET_CREATED_BY'
						}, null);
					}
				},
				function (callback) {
					if (isCity) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "City is valid");
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "City is invalid");
						sails.config.log.addlog(1, req, "createbudget", "CITY");
						callback({
							error: 'Please select city',
							error_code: 'CITY'
						}, null);
					}
				},
				function (callback) {
					sails.config.globals.putinfolog(req, req.options.action, req.method, 'All Validations successfull, now check if record is already exist if not then create the record for Budget Analyzer');
					//check if record is already exist if not then create the record
					BudgetAnalyzer.findOrCreate({
							_id: outwardcargo_budget_id
						}, {
							departmentName: outwardcargo_budget_department_name,
							budget: outwardcargo_budget_budget_amount,
							month: outwardcargo_budget_month,
							year: outwardcargo_budget_year,
							city: outwardcargo_budget_city,
							createdBy: outwardcargo_budget_created_by
						})
						.exec(async (err, budget, wasCreated) => {
							if (err) {
								if (err.code == 'E_UNIQUE') {
									sails.config.log.addlog(1, req, "createbudget", err.code);
									sails.config.globals.putinfolog(req, req.options.action, req.method, sails.config.globals.uniqueError);
									callback({
										error: sails.config.globals.uniqueError,
										error_code: 'BUDGET_E_UNIQUE'
									}, null);
								} else {
									sails.config.globals.putinfolog(req, req.options.action, req.method, err);
									sails.config.log.addlog(1, req, "createbudget",'BUDGET_DB_CREATE');
									callback({
										error: 'Something Happend During Creating Record',
										error_code: 'BUDGET_DB_CREATE'
									}, null);
								}
							} else {
								sails.config.globals.putinfolog(req, req.options.action, req.method, 'Updating intiated for BudgetAnalyzer');
								//update budget record
								BudgetAnalyzer.update({
										_id: budget.id
									}, {
										departmentName: outwardcargo_budget_department_name,
										budget: outwardcargo_budget_budget_amount,
										month: outwardcargo_budget_month,
										year: outwardcargo_budget_year,
										city: outwardcargo_budget_city,
										createdBy: outwardcargo_budget_created_by
									}).fetch()
									.exec(function (err, updatedBudget) {
										if (err) {
											sails.config.globals.putinfolog(req, req.options.action, req.method, err);
											sails.config.log.addlog(1, req, "createbudget",'BUDGET_DB_UPDATE');
											callback({
												error: 'Something Happens During Updating Or Inserting',
												error_code: 'BUDGET_DB_UPDATE'
											}, null);
										} else {
											sails.config.globals.putinfolog(req, req.options.action, req.method, 'budget analyzer updation successfull');
											callback(null, updatedBudget[0]);
										}
									});
							}
						});
				}
			],
			function (err, updatedBudget) {
				if (err) {
					sails.config.globals.putinfolog(req, req.options.action, req.method, err);
					return res.send(err);
				} else {
					sails.config.globals.putinfolog(req, req.options.action, req.method, 'updated budget analyzer details send successfully');
					return res.send({
						value: updatedBudget
					});
				}
			});
		sails.config.log.addOUTlog(req, "createbudget");
	},
	//get list of all budgets
	getbudgetlist: async function (req, res) {
		sails.config.log.addINlog(req, "getbudgetlist");
		var city = req.query.outwardcargo_budget_city;
		Ports.find({
					where: {},
				}, function (err, ports) {
			if (err) {
				sails.config.globals.putinfolog(req, req.options.action, req.method, err);
				sails.config.log.addlog(1, req, "getbudgetlist",'Error in finding ports list');
				return res.view('pages/imlost', {
					error: 'Error in finding ports list'
				});
			} else {
				if (city === undefined) {
					sails.log.info(req + ' - ' + new Date() + 'INFO - (getconsigneeslist - get) if city is undefined then take first city');
					city = ports[0].iata_code;
				}
				BudgetAnalyzer.find({
							where: {
								city: city
							},
							sort: 'year'
						}, function (err, budgets) {
					if (err) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, err);
						return res.view('pages/imlost', {
							error: 'Error in finding budget list'
						});
					} else {
					
						sails.config.globals.putinfolog(req, req.options.action, req.method, "vendor's detail found and send successfully");
						return res.view('pages/budgetlist', {
							budgetlistdetails: budgets,
							portlist: ports,
							iata_city: city
						})
					}

				})

			};
			sails.config.log.addOUTlog(req, "getbudgetlist");
		})
	},

	deletebudgetlist: async function (req, res) {
		sails.config.log.addINlog(req, "deletebudgetlist");
		var deletebudgetId = req.body.outwardcargo_budget_delete_budget;
		BudgetAnalyzer.destroy({
			'_id': deletebudgetId
		}).exec(function (err, updatedbudget) {
			if (err) {
				sails.config.globals.putinfolog(req, req.options.action, req.method, err);
				return res.view('pages/imlost', {
					error: 'Error while finding the port while deleting'
				});
			} else {
				sails.config.globals.putinfolog(req, req.options.action, req.method, "budget successfully");
				return res.send({
					result: true
				});
			}
			
		});
		sails.config.log.addOUTlog(req, "deletebudgetlist");
	}

};