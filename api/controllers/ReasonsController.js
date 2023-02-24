/**
 * ReasonsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	// function to add reasons ,update reasons

	fetchReasons: async function(req, res) {
		sails.config.log.addINlog(req.user.username, "fetchReasons");
		console.log('fetchReason data body'+ JSON.stringify(req.body));
		console.log('fetchReason data query'+ JSON.stringify(req.query));
		let query = {};

		if (req.query.limit) {
			query.limit = req.query.limit;
		}

		if (req.query.page) {
			let skip_records_count = (Number(req.query.limit)*(req.query.page-1));
			console.log('skip_records_count = = '+ skip_records_count);
			query.skip = skip_records_count;
		}

		if(req.query.orderBy){
			if(req.query.ascending == '1'){
				let sortData= req.query.orderBy+' '+ 'ASC';
				query.sort= sortData;
			} else{
				let sortData= req.query.orderBy+' '+ 'DESC';
				query.sort= sortData;
			}
		}
		
		if (req.query.query) {
			query.where = {};
			query.where.or = [];
			let columns = [{"data":"code"},{"data":"explanation"}];

			columns.map(function(col) {
				let obj = {};
				let splits = req.query.query.split(' ');
				for (let i = 0; i < splits.length; i++) {
					if (splits[i]) {
						switch(col.data) {
							case 'code':
								obj['code'] = {contains: splits[i].toUpperCase()};
								break;
							default:
								obj[col.data] = {contains: splits[i].toUpperCase()};
								break;
						}
					}
				}
				query.where.or.push(obj);
				return col.data;
			});
		}
		sails.config.log.addlog(4, req.user.username, req.options.action, `query = ${JSON.stringify(query)}`);
		//	Validate
		let reasons = await Reason.find(query);
		let response = sails.config.custom.jsonResponse(null, reasons);
		let totalFilteredRecords = await Reason.count(query.where ? query.where : {})
		// let totalRecords = await Reason.count();
		// response.recordsFiltered = totalFilteredRecords;
		response.total = totalFilteredRecords;
		// console.log("response  =  ="+JSON.stringify(response));
		sails.config.log.addOUTlog(req.user.username, "fetchReasons");
		res.send(response);
	},

	addReason : async function (req, res) {
		sails.config.log.addINlog(req.user.username, "addReason");
		console.log('addReason ==> ' +JSON.stringify(req.body));
		var id = req.body.id;
		var code = req.body.code;
		var category = req.body.category;
		var explanation = req.body.explanation;
		var makeItVisible = req.body.make_it_visible;

		if (category == undefined || category == null || category == '') {
			sails.log.error(  ' - ' + new Date() + ' ERR - (reasons - post)' + 'Reason Type Cannot be blank');
			sails.config.log.addlog(1, req, "addReason","ERR_R_category_BLANK")
			return res.send({
				error: 'Reason Type Cannot be blank',
				error_code: 'ERR_R_category_BLANK'
			});
		} else if (code == undefined || code == null || code == '') {
			sails.log.error(  ' - ' + new Date() + ' ERR - (reasons - post)' + 'code Cannot be blank');
			sails.config.log.addlog(1, req, "addReason",'ERR_R_CODE_BLANK')
			return res.send({
				error: 'code Cannot be blank',
				error_code: 'ERR_R_CODE_BLANK'
			});
		} else if (explanation == undefined || explanation == null || explanation == '') {
			sails.log.error(  ' - ' + new Date() + ' ERR - (reasons - post)' + 'Reason Cannot be blank');
			sails.config.log.addlog(1, req, "addReason",'ERR_R_EXPLANATION_BLANK')
			return res.send({
				error: 'Explanation Cannot be blank',
				error_code: 'ERR_R_EXPLANATION_BLANK'
			});
		} else {
			sails.log.info(  ' - ' + new Date() + ' INFO - (reasons - post) Reasons all validation passed');
			let result = await Reason.findOrCreate({
					id: id
				}, {
					category: category,
					code:code,
					explanation: explanation
				})
			if(result){
				let updatedReasons = await Reason.update({
					id: result.id
				}, {
					make_it_visible: makeItVisible,
					category: category,
					code: code,
					explanation: explanation
				}).fetch()
				if (updatedReasons) {
					await sails.helpers.jsonFileWrite.with({called :"reason"});
					sails.log.info(  ' - ' + new Date() + 'INFO - (reasons - post) reasons updated successfully');
					sails.config.log.addOUTlog(req.user.username, "addReason");
					return res.send({
						value: '/reasons' + ((category == undefined) ? '' : '?outwardcargo_reason_list_category_input=' + category)
					});
				} else {
					sails.log.error(  ' - ' + new Date() + ' ERR - (reasons - post)' + err);
					sails.config.log.addlog(1, req, "addReason",'Something Happens During Updating Or Inserting')
					return res.send({
						error: 'Something Happens During Updating Or Inserting'
					});
				}
			}else{
				sails.log.error(  ' - ' + new Date() + ' ERR - (reasons - post)' + err);
				sails.config.log.addlog(1, req, "addReason",'Something Happend During Creating Record')
				return res.send({
					error: 'Something Happend During Creating Record'
				});
			}	
		}
	},

	getReasonsList: function (req, res) {
		sails.config.log.addINlog(req, "getReasonsList");
		var category = req.query.outwardcargo_reason_list_category_input;
		if (category == undefined) {
			category = sails.config.globals.category[0];
		}
		Reason.find({
			category: category
		}, function (err, reasons) {
			if (err) {
				sails.log.error(  ' - ' + new Date() + ' ERR - (getReasonsList - get)' + err);
				sails.config.log.addlog(1, req, "getReasonsList","Error finding reasons")
				return res.view('pages/imlost', {
					error: 'Error finding reasons'
				});
			} else {
				if (reasons != undefined || reasons != null) {
					sails.log.info(  ' - ' + new Date() + 'INFO - (getReasonsList - get) find reasons who matches criteria and render reasons page');
					// console.log('==== '+ category);
					// console.log('==== '+ sails.config.globals.category);
					sails.config.log.addOUTlog(req, "getReasonsList");
					return res.view('pages/reasons', {
						reasonlistdetails: reasons,
						category: category,
						categorys: sails.config.globals.category
					});
				} else {
					sails.log.error(  ' - ' + new Date() + ' ERR - (getReasonsList - get)' + 'There are no reasons to show');
					sails.config.log.addOUTlog(req, "getReasonsList");
					sails.config.log.addlog(1, req, "getReasonsList","There are no reasons to show")
					return res.view('pages/imlost', {
						error: 'There are no reasons to show'
					});
				}
				
			}
		});
	},

	deleteReason: function (req, res) {
		sails.config.log.addINlog(req.user.username, "deleteReason");
		console.log('deleteReason ==> ' +JSON.stringify(req.body));
		var deleteReasonId = req.body.reason_id;
		Reason.destroy({
			'id': deleteReasonId
		}).exec(function (err, reasons) {
			if (err) {
				sails.log.error(  ' - ' + new Date() + ' ERR - (deleteReason - post)' + err);
				sails.config.log.addlog(1, req, "deleteReason","Error while deleting the reason")
				return res.view('pages/imlost', {
					error: 'Error while deleting the reason'
				});
			} else {
				sails.log.info(  ' - ' + new Date() + 'INFO - (deleteReason - post) delete reason who matches criteria and render reasons page');
				return res.send({
					result: true
				});
			}
		});
		sails.config.log.addOUTlog(req.user.username, "deleteReason");
	}
};