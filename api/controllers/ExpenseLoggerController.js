/**
 * BudgetAnalyzerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	//function to create budget record
	createexpenselog: async function (req, res) {
		sails.config.log.addINlog(req, "createexpenselog");
		//#todo take data from req for validation
		console.log(req.body);
		//console.log(budgetcodeArray[0]+'         '+budgetcodeArray[1]);
		var outwardcargo_expense_logger_department_name = req.body.outwardcargo_expense_logger_department_name;
		var outwardcargo_expense_logger_created_by = req;
		var outwardcargo_expense_logger_date_of_expense = req.body.outwardcargo_expense_logger_date_of_expense;
		
		console.log(outwardcargo_expense_logger_date_of_expense);
		console.log(Number(outwardcargo_expense_logger_date_of_expense));
		var outwardcargo_expense_logger_nature_of_expense = req.body.outwardcargo_expense_logger_nature_of_expense;
		var outwardcargo_expense_logger_amount_expended = req.body.outwardcargo_expense_logger_amount_expended;
		var outwardcargo_expense_logger_additional_note = req.body.outwardcargo_expense_logger_additional_note;
		var outwardcargo_expense_id = req.body.id;
		sails.config.globals.putinfolog(req, req.options.action, req.method, "Now check's for validation begins");
		//check for depart name
		var isDepartmentName = !sails.config.globals.validator.isEmpty(outwardcargo_expense_logger_department_name);
		console.log(2);
		var isCreated_by = !sails.config.globals.validator.isEmpty(outwardcargo_expense_logger_created_by);
		var isDateofExpense = !sails.config.globals.validator.isEmpty(''+outwardcargo_expense_logger_date_of_expense);
		var isNatureofExpense = !sails.config.globals.validator.isEmpty(outwardcargo_expense_logger_nature_of_expense);
		//var isBudgetCode = !sails.config.globals.validator.isEmpty(outwardcargo_expense_logger_budget_code);
		console.log(3);
		var isAmountExpended = !sails.config.globals.validator.isEmpty(''+outwardcargo_expense_logger_amount_expended) && !(outwardcargo_expense_logger_amount_expended < 0);
		
		
		//passing through each check if one of the check failed pass error in response otherwise control goes to next check
		async.waterfall([
				function (callback) {
					if (isDepartmentName) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Departname Name Is valid");
						console.log(4);
						callback();
						
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Department Name is invalid");
						sails.config.log.addlog(1, req, "createexpenselog","EXPENSE_DEPT_NAME");
						
						callback({
							
							error: 'Department Name is invalid',
							error_code: 'EXPENSE_DEPT_NAME'
						}, null);
					}
				},
				function (callback) {
					if (isCreated_by) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Expense Created by is valid");
						console.log(6);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Expense Created by is Invalid");
						sails.config.log.addlog(1, req, "createexpenselog","EXPENSE_CREATED_BY");
						
						callback({
							
							error: 'Expense Created by is Invalid ',
							error_code: 'EXPENSE_CREATED_BY'
						}, null);
					}
				},
				function (callback) {
					if (isDateofExpense) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "date of expense is valid");
						console.log(7);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Date of expense is invalid");
						sails.config.log.addlog(1, req, "createexpenselog","EXPENSE_DATE");
						
						callback({
							
							error: 'Date of exchange is invalid',
							error_code: 'EXPENSE_DATE'
						}, null);
					}
				},
				function (callback) {
					if (isNatureofExpense) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Nature of expense is valid");
						console.log(8);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Nature of expense  is invalid");
						sails.config.log.addlog(1, req, "createexpenselog","EXPENSE_NATURE");
						
						callback({
							error: 'Nature of expense is invalid',
							error_code: 'EXPENSE_NATURE'
						}, null);
					}
				},
				function (callback) {
					if (isAmountExpended) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Amount expended is valid");
						console.log(10);
						callback();
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "Amount expended is invalid");
						sails.config.log.addlog(1, req, "createexpenselog","EXPENSE_AMOUNT");
						callback({
							error: 'Amount expended is invalid',
							error_code: 'EXPENSE_AMOUNT'
						}, null);
					}
				},
				function (callback) {
					console.log(Number(outwardcargo_expense_logger_date_of_expense));
					sails.config.globals.putinfolog(req, req.options.action, req.method, 'All Validations successfull, now check if record is already exist if not then create the record for Budget Analyzer');
					//check if record is already exist if not then create the record
					ExpenseLogger.findOrCreate({
						_id: outwardcargo_expense_id
							}, {
							departmentName: outwardcargo_expense_logger_department_name,
							createdBy: outwardcargo_expense_logger_created_by,
							dateOfExpense: Number(outwardcargo_expense_logger_date_of_expense),
							natureOfExpense: outwardcargo_expense_logger_nature_of_expense,
							amountExpend: outwardcargo_expense_logger_amount_expended,
							additionalNote: outwardcargo_expense_logger_additional_note
						})
						.exec(async (err, expense, wasCreated) => {
							if (err) {
								console.log(11);
								console.log(err);
								if (err.code == 'E_UNIQUE') {
									sails.config.globals.putinfolog(req, req.options.action, req.method, sails.config.globals.uniqueError);
									sails.config.log.addlog(1, req, "createexpenselog","EXPENSE_E_UNIQUE");
									callback({
										error: sails.config.globals.uniqueError,
										error_code: 'EXPENSE_E_UNIQUE'
									}, null);
								} else {
									sails.config.globals.putinfolog(req, req.options.action, req.method, err);
									sails.config.log.addlog(1, req, "createexpenselog","EXPENSE_DB_CREATE");
									callback({
										error: 'Something Happend During Creating Record',
										error_code: 'EXPENSE_DB_CREATE'
									}, null);
								}
							} else {
								sails.config.globals.putinfolog(req, req.options.action, req.method, 'Updating intiated for Expense Logger');
								//update budget record
								
								ExpenseLogger.update({
										_id: expense.id
									}, {
										departmentName:outwardcargo_expense_logger_department_name,
										createdBy :outwardcargo_expense_logger_created_by,
										dateOfExpense :Number(outwardcargo_expense_logger_date_of_expense),
										natureOfExpense :outwardcargo_expense_logger_nature_of_expense,
										amountExpend :outwardcargo_expense_logger_amount_expended,
										additionalNote :outwardcargo_expense_logger_additional_note
									}).fetch()
									.exec(function (err, updatedExpense) {
										if (err) {
											sails.config.globals.putinfolog(req, req.options.action, req.method, err);
											console.log(13);
											sails.config.log.addlog(1, req, "createexpenselog","EXPENSE_DB_UPDATE");
											callback({
												error: 'Something Happens During Updating Or Inserting',
												error_code: 'EXPENSE_DB_UPDATE'
											}, null);
										} else {
											console.log(14);
											sails.config.globals.putinfolog(req, req.options.action, req.method, 'budget analyzer updation successfull');
											callback(null, updatedExpense[0]);
										}
									});
							}
						});
				}
			],
			function (err, updatedExpense) {
				if (err) {
					console.log(err);
					console.log(16);
					sails.config.globals.putinfolog(req, req.options.action, req.method, err);
					sails.config.log.addlog(1, req, "createexpenselog",err);
					return res.send(err);
				} else {
					console.log(15);
					sails.config.globals.putinfolog(req, req.options.action, req.method, 'updated Expense logger details send successfully');
					return res.send({
						value: updatedExpense
					});
				}
			});
			sails.config.log.addOUTlog(req, "createexpenselog");
	},
	//get list of all budgets 
	getexpenselist: async function (req, res) {
		sails.config.log.addINlog(req, "getexpenselist");
		/*async.series({
			expenselistdetails: function(callback){
				ExpenseLogger.find({
					where: {},
					sort: 'dateOfExpense'
				}, function (err, expenses) {
					if (err) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, err);
						
					} else {
						sails.config.globals.putinfolog(req, req.options.action, req.method, "expense log detail found and send successfully");
						callback(null, expenses);
					}
					
				});
				
			},
			budgetlistdetails: function(callback){
				BudgetAnalyzer.find({
					where: {},
				}, function(err, budgets) {
					if(err){
						sails.config.globals.putinfolog(req, req.options.action, req.method, err);
					} else{
						sails.config.globals.putinfolog(req, req.options.action, req.method, "budget  detail found and send successfully");
						callback(null, budgets);
					}
				})
			},
			created_by:function(callback){
				callback(null, req)
			}
		}), function(err, results) {
				if(err){
					return res.view('pages/imlost', {
						error: 'Error in finding expense log'
					});
				} else {
					return res.view('pages/expenselogger', {
						results:results
					});
				}
			}*/
		
			
		var city = req.query.outwardcargo_expense_iata_city;
		Ports.find({
			where: {},
		}, function (err, ports) {
			if (err) {
				sails.config.globals.putinfolog(req, req.options.action, req.method, err);
				return res.view('pages/imlost', {
					error: 'Error in finding ports list'
				});
			} else {
				if (city === undefined) {
					sails.log.info(req + ' - ' + new Date() + 'INFO - (getconsigneeslist - get) if city is undefined then take first city');
					city = ports[0].iata_code;
				}
				ExpenseLogger.find({
					where: {
						city: city
					},
					sort: 'dateOfExpense'
				}, function (err, expenses) {
					if (err) {
						sails.config.globals.putinfolog(req, req.options.action, req.method, err);
						return res.view('pages/imlost', {
							error: 'Error in finding budget list'
						});
					} else {

						sails.config.globals.putinfolog(req, req.options.action, req.method, "vendor's detail found and send successfully");
						return res.view('pages/expenselogger', {
							expenselistdetails: expenses,
							portlist: ports,
							iata_city: city
						})
					}

				})

			};
		})
		sails.config.log.addOUTlog(req, "getexpenselist");	
	},
	
	deleteexpense : async function (req, res){
		sails.config.log.addINlog(req, "deleteexpense");
		var deleteexpenseId = req.body.outwardcargo_expense_logger_delete_expense;
		ExpenseLogger.destroy({
			'_id': deleteexpenseId
		}).exec(function (err, updatedexpenses) {
			if (err) {
				sails.config.globals.putinfolog(req, req.options.action, req.method, err);
				sails.config.log.addOUTlog(req, "deleteexpense");
				return res.view('pages/imlost', {
					error: 'Error while finding the port while deleting'
				});
			} else {
				sails.config.globals.putinfolog(req, req.options.action, req.method, "expense log detail found and send successfully");
				sails.config.log.addOUTlog(req, "deleteexpense");
				return res.send({
					result: true
				});
			}
			
		});
	}
};