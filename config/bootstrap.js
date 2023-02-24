/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also do this by creating a hook.
 *
 * For more information on bootstrapping your app, check out:
 * https://sailsjs.com/config/bootstrap
 */

//	Cron link https://cronexpressiondescriptor.azurewebsites.net/?expression=0+0+22+30%2C31+*+*&locale=en

var cron = require('node-cron');
var moment = require('moment-timezone');
var del = require('del');
var mkpath = require('mkpath');

module.exports.bootstrap = async function (done) {
	// sails.helpers.ccaRefNumber.with({
	// 	date: 1532131844436,//Date.now(),
	// 	generate_number_for: 'INV'
	// }).exec(function(err, no) {
	// 	if(err)
	// 		console.log(err);
	// 	console.log('cca number = = '+no);
	// });
	creatSoftLinks();
	//await kickStartEmailProcessing();
	//await kickStartIataProcessing();
	//await kickStartShcProcessing();
	//await kickStartReasonProcessing();
	// By convention, this is a good place to set up fake data during development.
	//
	// For example:
	// ```
	// // Set up fake development data (or if we already have some, avast)
	// if (await User.count() > 0) {
	//   return done();
	// }
	//
	// await User.createEach([
	//   { emailAddress: 'ry@example.com', fullName: 'Ryan Dahl', },
	//   { emailAddress: 'rachael@example.com', fullName: 'Rachael Shaw', },
	//   // etc.
	// ]);
	// ```

	//sails.config.custom.createSettingKeys();

	cron.schedule('0 * * * * *', async function () {
		//legOpsDispacherCron();
		if(sails.config.environment == 'production') {
			await sails.helpers.readEmail.with({});
		}
	});

	cron.schedule('0 0 15 * * *', async function() {
		let today = new moment();
		sails.config.log.addlog(3, "", 'SCRUBBING starts', today);
		today.subtract(90, 'days')

		let pathsToWork = ['email_attachments/BOM', 'email_attachments/BLR', 'email_attachments/DEL', 'email_attachments/HYD', 'email_attachments/MAA', 'booklist']
		//	Attempting for yester-days 90 to 100 from today
		for(let i = 90; i <= 100; i++) {
			let datePath = today.subtract(1, 'days').format('YYYY/M/D');
			for(let j = 0; j < pathsToWork.length; j++) {
				try {
					sails.config.log.addlog(3, "", "SCRUBBING FOR", `./static_data/${pathsToWork[j]}/${datePath}`);
					await del(`./static_data/${pathsToWork[j]}/${datePath}`);
				} catch(e) {sails.config.log.addlog(0, "", "SCRUBBING ERROR", `${e}`);}
			}
		}
	});

	// creating pdf appPath
	//makepdfpath();
	//makeloggerpath();
	
	//initializeCRONJobs();

	// Don't forget to trigger `done()` when this bootstrap function's logic is finished.
	// (otherwise your server will never lift, since it's waiting on the bootstrap)
	return done();

};

function creatSoftLinks() {
	setTimeout(function()
	{
		let softlinknames = ['static_data'];
		let shell = require('shelljs');
		
		for(let i = 0; i < softlinknames.length; i++) {
			shell.mkdir("-p", './' + softlinknames[i]);

			let lnk = require('lnk');
			lnk([softlinknames[i]], '.tmp/public').then(() => console.log(softlinknames[i] + ' created')).catch((err)=>console.log(err));
		}
	},10000);
}

function kickStartEmailProcessing() {
	console.log("before emailProcessing");
	sails.helpers.emailProcessing.with({}, function(err) {
		if (err){
			console.log(err);
		}
		console.log('returned from helper');
	});
	console.log("after emailProcessing");
	
}

function kickStartIataProcessing() {
	console.log("before iataProcessing");
	sails.helpers.iataProcessing.with({}, function(err) {
		if (err){
			console.log(err);
		}
		console.log('returned from helper');
	});
	console.log("after iataProcessing");
	
}

function kickStartShcProcessing() {
	console.log("before iataProcessing");
	sails.helpers.shcProcessing.with({}, function(err) {
		if (err){
			console.log(err);
		}
		console.log('returned from shc helper');
	});
	console.log("after shc Processing");
	
}
function kickStartReasonProcessing() {
	console.log("before iataProcessing");
	sails.helpers.reasonProcessing.with({}, function(err) {
		if (err){
			console.log(err);
		}
		console.log('returned from helper');
	});
	console.log("after raeson Processing");
	
}

async function legOpsDispacherCron(){
	let legopsToBeDispatch = await sails.helpers.awbLegopDispatcher.with({});
	// console.log('legopsToBeDispatch '+ JSON.stringify(legopsToBeDispatch));
	if(legopsToBeDispatch.legops.length){
		for(let i=0; i<legopsToBeDispatch.legops.length; i++){
			//console.log("legops to dispatch  = "+JSON.stringify(legopsToBeDispatch.legops[i]));
			let socketListener ='';
			switch(legopsToBeDispatch.legops[i].opening_status) {
				case sails.config.custom.awb_leg_ops_status.ready_to_rate_check:
					socketListener = sails.config.custom.socket_listener.addLegOps_planner_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.ready_to_fdc:
					socketListener = sails.config.custom.socket_listener.addLegOps_planner_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.rate_check_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.rate_check_referred:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.rate_check_hold:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.rms_review:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.rms_hub_review:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.fdc_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_airport_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.pre_alert_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.euics_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.cap_a_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.e_awb_check_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.euics_discrepancy_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_airport_operation;
				break;

				case sails.config.custom.awb_leg_ops_status.cap_a_discrepancy_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_finance;
				break;

				case sails.config.custom.awb_leg_ops_status.ready_to_recovery:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_recovery;
				break;

				case sails.config.custom.awb_leg_ops_status.p2_escalation:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_recovery;
				break;

				case sails.config.custom.awb_leg_ops_status.p1_escalation:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_recovery;
				break;

				case sails.config.custom.awb_leg_ops_status.escalation:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_recovery;
				break;

				case sails.config.custom.awb_leg_ops_status.cca_request_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_finance;
				break;

				case sails.config.custom.awb_leg_ops_status.cca_approval_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_finance;
				break;

				case sails.config.custom.awb_leg_ops_status.rcf_pending:
					socketListener = sails.config.custom.socket_listener.addLegOps_central_recovery;
				break;
			}
			sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,socketListener, {newLegOp: legopsToBeDispatch.legops[i]});
		}
	}
}

function initializeCRONJobs() {
	// //	Every minute
	/*cron.schedule('* * * * *', function() {
		console.log('CRON running every minute ' + new Date());
		//generateInvoiceForCreditPeriod('15 Days');
		makeloggerpath();
	});*/

	//	Every 12 AM
	cron.schedule('0 0 * * *', function () {
		sails.log.info('' + new Date() + 'CRON running every 12 AM ' + new Date());
		//makepdfpath();
		//makeloggerpath();
	});
}

function makepdfpath() {
	var pdfpath = 'pdf/'
	mkpath(pdfpath, function (err) {
		if (err)
			sails.log.error('' + new Date() + 'Error in creating pdf path');
		else
			sails.log.info('' + new Date() + 'pdf path created');
	});
}

function makeloggerpath() {
	var logpath = 'log/'
	mkpath(logpath, function (err) {
		if (err)
			sails.log.error('' + new Date() + 'Error in creating logger path');
		else
			sails.log.info('' + new Date() + 'logger path created');
	});
}

function generateInvoiceForCreditPeriod(credit_period) {

	//	Find all the congignees that belong to this credit_period
	//	For each such consignee, search for all the AWBs that are void_on = 0, invoice_document = ''

	sails.config.globals.async.waterfall([
		function (callback) {
			Address.find({
				credit_period: credit_period
			}, function (err, consignees) {
				if (err) {
					sails.log.error('' + new Date() + err);
					callback('Error in searching for the consignees for the period ' + credit_period);
				} else {
					if (consignees) {
						sails.log.info('' + new Date() + 'Found ' + consignees.length + ' consignees');
						callback(null, consignees);
					} else {
						callback('There are no consignees for the period ' + credit_period, null);
						sails.log.info('' + new Date() + 'There are no consignees for the period ' + credit_period);
					}
				}
			});
		},
		function (consignees, callback) {
			sails.config.globals.async.eachSeries(consignees, function (consignee, each_callback) {
				sails.log.info('' + new Date() + 'working for the consignee = ' + consignee.id);
				sails.config.globals.async.series({
					awb_user_datas: function (series_callback) {
						AwbUserData.find({
							consignee: consignee.id,
							void_on: 0,
							invoice_document: '',
							do_document: {
								'!=': ''
							}
						}, function (err, awb_user_datas) {
							if (err) {
								sails.log.error('' + new Date() + err);
								series_callback('error in finding the AWB user Datas', null);
							} else
							if (awb_user_datas.length > 0)
								series_callback(null, awb_user_datas);
							else
								series_callback('could not find any AWBUserData for invoicing', null);
						});
					},
					dcms: function (series_callback) {
						DCM.find({
							consignee: consignee.id,
							invoiced_under_invoice_id: ''
						}, function (err, dcms) {
							if (err) {
								sails.log.error(err);
								series_callback('error in finding the DCMs for this customer', null);
							} else {
								sails.log.error('' + new Date() + 'found ' + dcms.length + ' dcms');
								series_callback(null, dcms);
							}
						});
					}
				}, function (err, results) { //	async.series
					if (err) {
						sails.log.error('' + new Date() + err);
						sails.log.error('' + new Date() + 'cannot generate the invoice for consignee = ' + consignee.id);
						each_callback();
					} else {
						if (results && results.awb_user_datas.length > 0) {
							//	get today's date
							//	subtract 1 day from today's date and that will give you period_to
							//	subtract provided days - 1 from today's date and that will give you period_from
							var credit_period_to = new Date();
							credit_period_to.setDate(credit_period_to.getDate() - 1);
							credit_period_to.setHours(23);
							credit_period_to.setMinutes(59);
							credit_period_to.setSeconds(59);

							var credit_period_from = new Date();

							if (credit_period === '7 Days')
								credit_period_from.setDate(credit_period_from.getDate() - 7);
							else if (credit_period === '15 Days')
								credit_period_from.setDate(credit_period_from.getDate() - 15);
							else if (credit_period === '30 Days')
								credit_period_from.setDate(credit_period_from.getDate() - 30);

							credit_period_from.setHours(23);
							credit_period_from.setMinutes(59);
							credit_period_from.setSeconds(59);

							sails.helpers.issueInvoice.with({
								awb_user_datas: results.awb_user_datas,
								dcms: results.dcms,
								credit_period_from: credit_period_from.getTime(),
								credit_period_to: credit_period_to.getTime()
							}).exec(function (err, invoice) {
								if (invoice.error) {
									//res.send(invoice);	//	We are sending the error that is sent in the object called invoice.
									sails.log.error('' + new Date() + 'Error occrured while generating invoice at cron job');
									each_callback();
								} else {
									sails.log.info('' + new Date() + 'Invoice generated successfully for consignee = ' + consignee.id);
									each_callback();
								}
							});
						} else {
							sails.log.info('' + new Date() + 'There are no awb for the consignee = ' + consignee.id);
							each_callback();
						}
					}
				});
			}, function (err) { //	async.each
				if (err) {
					sails.log.error('' + new Date() + err);
					sails.log.error('' + new Date() + 'An error occured in each loop');
					callback(null, true);
				} else {
					sails.log.info('' + new Date() + 'For each completes')
					callback(null, true);
				}
			});
		}
	], function (err, result) {
		if (err) {
			sails.log.error('' + new Date() + err);
		} else {
			sails.log.info('' + new Date() + 'CRON for period ' + credit_period + ' , completed !');
		}
	});
}

function sendEmailOfPendingPayment() {
	//	Identify those Invoices, which are issued more than 3 days ago and whose payments are not yet received.
	//	Send the email about the data over the email.
	var cut_off_date = new Date();
	cut_off_date.setDate(cut_off_date.getDate() - 3);
	var cut_off_date_ts = cut_off_date.getTime();

	CityConstants.find({
		and: [{
				expires_on: {
					'>': cut_off_date_ts
				}
			},
			{
				effective_from: {
					'<': cut_off_date_ts
				}
			}
		]
	}, function (err, constants) {
		if (err) {
			sails.log.error(err);
			sails.log.error('Error occured while finding city constants while sending email  of pending payments');
		} else {
			sails.config.globals.async.each(constants, function (constant, callback) {
				if (!constant.line_manager_email) {
					sails.log.info('CRON - There is no line manager defined for the city ' + constant.iata_code);
					callback();
				} else {
					Invoice.find({
						where: {
							and: [{
									igm_city: constant.iata_code
								},
								{
									void_on: 0
								},
								{
									payment_received_date: 0
								},
								{
									invoice_issue_date: {
										'<=': cut_off_date_ts
									}
								},
							]
						}
					}, function (err, invoices) {
						if (err) {
							sails.log.error(err);
							sails.log.error('CRON - Error while finding the invoices by CRON for finding pending payments')
							callback();
						} else {
							var tr_tags = '';
							for (var i = 0; i < invoices.length; i++) {
								var issue_date = new Date(invoices[i].invoice_issue_date);
								var tr_tag = '<tr><td>' + issue_date.getDate() + '-' + (issue_date.getMonth() + 1) + '-' + issue_date.getFullYear() + '</td><td>' + invoices[i].invoice_number + '</td><td>' + invoices[i].amount_billed + '</td></tr>';
								tr_tags += tr_tag;
							}

							if (invoices && invoices.length > 0) {
								sails.helpers.sendEmail.with({
									to: constant.line_manager_email,
									subject: 'Invoices - Pending Payment',
									html: '<table border="1"><thead><th>Invoice Date</th><th>Invoice Number</th><th>Amount</th></thead><tbody>' + tr_tags + '</tbody></table>'
								}, function (err, status) {
									if (err) {
										sails.log.error('CRON - Error while sending - Pending Payment list is sent to ' + constant.iata_code + ' line manager');
										sails.log.error(err);
									} else {
										sails.log.info('CRON - Pending Payment list is sent to ' + constant.iata_code + ' line manager');
									}
									callback();
								});
							} else {
								sails.log.info('CRON - Pending Payment list - No invoices found for ' + constant.iata_code);
								callback();
							}
						}
					});
				}
			})
		}
	});
}