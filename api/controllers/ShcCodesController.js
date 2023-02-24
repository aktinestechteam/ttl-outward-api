/**
 * ShcCodesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const { error } = require("shelljs");

module.exports = {
	// function for saving shccodes

	fetchShcCodes: async function(req, res) {
		sails.config.log.addINlog(req.user.username, "fetchShcCodes");
		//sails.config.log.addINlog(req.user.username.user.email, req.options.action);
		console.log('fetchshc data body'+ JSON.stringify(req.body));
		console.log('fetchshc data query'+ JSON.stringify(req.query));
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
								obj[col.data] = {contains: splits[i]};
								break;
						}
					}
				}
				query.where.or.push(obj);
				return col.data;
			});
		}
		console.log('query====>  '+JSON.stringify(query));
		//	Validate
		let shcCodes = await SHC.find(query);
		
		let response = sails.config.custom.jsonResponse(null, shcCodes);
		let totalFilteredRecords = await SHC.count(query.where ? query.where : {});
		// let totalRecords = await SHC.count();
		// response.recordsFiltered =  totalFilteredRecords;
		response.total = totalFilteredRecords;
		// console.log(JSON.stringify(response));
		sails.config.log.addOUTlog(req.user.username, "fetchShcCodes");
		res.send(response);
		//sails.config.log.addOUTlog(req.user.email, req.options.action);
	},

	addShcCode: async function (req, res) {
		sails.config.log.addINlog(req.user.username, "addShcCode");
		//getting data
		let id = req.body.shc_id;
		let shcCodes = req.body.shc_shc_code;
		let stateName = req.body.shc_explanation;
		let isshcNumber = /^\d+$/.test(shcCodes);
		let isStateNameNum = /^\d+$/.test(stateName);
		//validations check
		if (shcCodes == undefined || shcCodes == null || shcCodes == '') {
			sails.log.error( ' - ' + new Date() + ' ERR - (addShcCodes - post)' + 'shc Code Cannot be blank');
			sails.config.log.addlog(1, req, "addShcCode","ERR_GC_shcCODE_BLANK");
			return res.send({
				error: 'shc Code Cannot be blank',
				error_code: 'ERR_GC_shcCODE_BLANK'
			});
		} else if (stateName == undefined || stateName == null || stateName == '') {
			sails.log.error( ' - ' + new Date() + ' ERR - (addShcCodes - post)' + 'State Name Cannot be blank');
			sails.config.log.addlog(1, req, "addShcCode","ERR_GC_STATE_BLANK");
			return res.send({
				error: 'State Name Cannot be blank',
				error_code: 'ERR_GC_STATE_BLANK'
			});
		} else if (isshcNumber) {
			sails.log.error( ' - ' + new Date() + ' ERR - (addShcCodes - post)' + 'shc Code Cannot be a number');
			sails.config.log.addlog(1, req, "addShcCode","ERR_GC_shcCODE_NOTNUMBER");
			return res.send({
				error: 'shc Code Cannot be a number',
				error_code: 'ERR_GC_shcCODE_NOTNUMBER'
			});
		} else if (isStateNameNum) {
			sails.log.error( ' - ' + new Date() + ' ERR - (addShcCodes - post)' + 'State Name Cannot be number');
			sails.config.log.addlog(1, req, "addShcCode","ERR_GC_STATE_NOTNUMBER");
			return res.send({
				error: 'State Name Cannot be number',
				error_code: 'ERR_GC_STATE_NOTNUMBER'
			});
		} else {
			sails.log.info( ' - ' + new Date() + ' INFO - (addShcCodes - post)' + 'shcCODES validations successfully');
			//check for shc code if it is already there, if not then create it
			let result = await SHC.findOrCreate({
						id: id
					}, {
					code: shcCodes.toUpperCase(),
					explanation: stateName
					})
				if(result){
					//shccode found or created if not there
					sails.log.info( ' - ' + new Date() + ' INFO - (addShcCodes - post) shcCODE found or created new if not found');
					let updatedSHC = await SHC.update({
							id: result.id
						}, {
							code: shcCodes.toUpperCase(),
							explanation: stateName
						}).fetch()
					if(updatedSHC){
						await sails.helpers.jsonFileWrite.with({called :"shc"});
						return res.send({
							value: updatedSHC[0]
						});
					}
					else{
						sails.config.log.addOUTlog(req, "addShcCode");
						sails.config.log.addlog(1, req, "addShcCode","Something Happens During Updating Or Inserting");
						return res.send({
							error: 'Something Happens During Updating Or Inserting'
						});
					}
				}
				else
				{
					if (error.code == 'E_UNIQUE') {
						sails.log.error( ' - ' + new Date() + ' ERR - (addShcCodes - post)' + sails.config.globals.uniqueError);
						sails.config.log.addlog(1, req, "addShcCode","ERR_GC_E_UNIQUE");
						return res.send({
							error: sails.config.globals.uniqueError,
							error_code: 'ERR_GC_E_UNIQUE'
						});
					} else {
						sails.log.error( ' - ' + new Date() + ' ERR - (addShcCodes - post)' + err);
						sails.config.log.addlog(1, req, "addShcCode","Something Happend During Creating Record");
						return res.send({
							error: 'Something Happend During Creating Record'
						});
					}
				}	
						
		}	
	},
	
	//getting list of shccodes
	getShcCodes: function (req, res) {
		sails.config.log.addINlog(req, "getShcCodes");
		SHC.find({
			where: {},
			sort: 'code'
		}, function (err, shc) {
			if (err) {
				sails.log.error( ' - ' + new Date() + ' ERR - (getshccodes - get)' + err);
				return res.view('pages/imlost', {
					error: 'Error while finding the SHC Code'
				});
			} else {
				sails.log.info( ' - ' + new Date() + ' INFO - (getSHCcodes - get) SHCCODES found successfully');
				//console.log(shc);
				sails.config.log.addOUTlog(req, "getShcCodes");
				return res.view('pages/shccodes', {
					shccodesdetails: shc
				});
			}
		});
	},
	//delete shccode
	deleteShcCodes: function (req, res) {
		sails.config.log.addINlog(req.user.username, "deleteShcCodes");
		let deleteShcCodeId = req.body.shc_id;
		SHC.destroy({
			'id': deleteShcCodeId
		}).exec(function (err, shc) {
			if (err) {
				sails.log.error( ' - ' + new Date() + ' ERR - (deleteShcCodes - post)' + err);
				return res.view('pages/imlost', {
					error: 'Error while deleting the SHC'
				});
			} else {
				sails.log.info( ' - ' + new Date() + ' INFO - (deleteShcCodes - post) SHC CODE deleted successfully');
				sails.config.log.addINlog(req.user.username, "deleteShcCodes");
				return res.send({
					result: true
				});
			}
		});
	}
};
