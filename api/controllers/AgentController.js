/**
 * AgentController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

let fs = require('fs');
let { promisify } = require('util');
let xlstojson = require("xls-to-json");
 
module.exports = {

    uploadAgentList: async function (req, res) {

        sails.config.log.addINlog("", req.options.action);

        let agentFilePath = await sails.config.custom.getdumppath('agent');

        req.file('agentUpload').upload({
            dirname: ('.' + agentFilePath),
            // You can apply a file upload limit (in bytes)
        }, async function whenDone(err, uploaded_files) {
            sails.config.log.addlog(3, "", req.options.action, JSON.stringify(uploaded_files));
            
            sails.config.globals.async.each(uploaded_files,
                async function (uploaded_file, cb) {
                    //let json_file_name = uploaded_file.filename ;
                    //console.log('======='+JSON.stringify(uploaded_file));
                    let moveFile = async () => {
                        let mv = promisify(fs.rename);
                        let finalFileName = Date.now() + uploaded_file.filename;
                        let finalCompleteFilePath = agentFilePath + finalFileName;
                        await mv(uploaded_file.fd, finalCompleteFilePath);
                        
                        let json_file_name = finalFileName.split('.');
                        xlstojson({
                            input: (finalCompleteFilePath), // input csv 
                            output: (agentFilePath + json_file_name[0] + '.json'), // output json 
                            sheet: "Report1"
                        }, async function (err, result) {
                            if (err) {
                                sails.config.log.addlog(0, req.user.username, req.options.action, err);
                            } else {
                                for(let i = 0; i < result.length; i++) {
                                    let element = await result[i];
                                    let existCount = await Agent.count({billing_code: element['Agent Billing Cd']});

                                    let start_date_splits = (element['Agent Start Date']).split('.')
                                    let end_date_splits = (element['Agent End Date']).split('.')
                                    let updated_date_splits = (element['Date updated']).split('.')

                                    let start_date = new Date(`${start_date_splits[1]}/${start_date_splits[0]}/${start_date_splits[2]}`);
                                    let end_date = new Date(`${end_date_splits[1]}/${end_date_splits[0]}/${end_date_splits[2]}`);
                                    let updated_date = new Date(`${updated_date_splits[1]}/${updated_date_splits[0]}/${updated_date_splits[2]}`);

                                    let valuesForDB = {
                                        country_code: element['Agent Country Cd'],
                                        billing_code: element['Agent Billing Cd'],
                                        account_no: element['Agent Account No'],
                                        uk_company_no: element['Agent UK Company No'],
                                        name: element['Agent Name'],
                                        location: element['Agent Location'],
                                        iata: element['IATA ?'] == 'Y',
                                        cass: element['CASS ?'] == 'Y',
                                        billing_method: element['Agent Billing Method'],
                                        billing_station: element['Agent Billing Station Cd'],
                                        station: element['Agent Contact Station'],
                                        currency: element['Agent Currency Cd'],
                                        start_date: start_date,
                                        end_date: end_date,
                                        updated_terminal: element['Agent Updated Terminal'],
                                        updated_date: updated_date,
                                    };

                                    if (existCount == 0) {
                                        await Agent.create(valuesForDB);
                                    } if (existCount == 1) {
                                        await Agent.update({billing_code: element['Agent Billing Cd']}).set(valuesForDB);
                                    } else {
                                        sails.config.log.addlog(0, "", req.options.action, `${existCount} agents pre-exists in database for billing_code = ${element['Agent Billing Cd']}`);
                                    }
                                }
                            }

                            await sails.helpers.jsonFileWrite.with({called :"agent"});
                            res.ok();
                        });   
                    }
                    await moveFile();
                });
        });
    },

    fetchAgents: async function (req, res) {
		sails.config.log.addINlog(req.user.username, req.options.action);
		sails.config.log.addlog(4, req.user.username, req.options.action, `fetchAgents data body = ${JSON.stringify(req.body)}`);
		sails.config.log.addlog(4, req.user.username, req.options.action, `fetchAgents data query = ${JSON.stringify(req.query)}`);

		let query = {};
		//query.where = {};
		
		if (req.query.limit) {
			query.limit = req.query.limit;
		}

		if (req.query.page) {
			let skip_records_count = (Number(req.query.limit) * (req.query.page - 1));
			sails.config.log.addlog(4, req.user.username, req.options.action, `skip_records_count = ${skip_records_count}`);
			query.skip = skip_records_count;
		}

		if (req.query.orderBy) {
			if (req.query.ascending == '1') {
				let sortData = req.query.orderBy + ' ' + 'ASC';
				query.sort = sortData;
			} else {
				let sortData = req.query.orderBy + ' ' + 'DESC';
				query.sort = sortData;
			}
		}

		if (req.query.query) {
			query.where = {};
			query.where.or = [];
			let columns = [
                {"data": 'billing_code'}, 
                {"data": 'name'}, 
                {"data": 'billing_station'}, 
                {"data": 'station'}
            ];

			columns.map(function (col) {
				let obj = {};
				let splits = req.query.query.split(' ');
				for (let i = 0; i < splits.length; i++) {
					if (splits[i]) {
						switch (col.data) {
							default:
								obj[col.data] = { contains: splits[i].toUpperCase() };
								break;
						}
					}
				}
				query.where.or.push(obj);
				return col.data;
			});
		}

		sails.config.log.addlog(4, req.user.username, req.options.action, JSON.stringify(query));
		
		//	Validate
		let agents = await Agent.find(query);

		let response = sails.config.custom.jsonResponse(null, agents);
		let totalFilteredRecords = await Agent.count(query.where ? query.where : {})
		// let totalRecords = await Agent.count();
		// response.recordsFiltered = totalFilteredRecords;
		response.total = totalFilteredRecords;
		// console.log("response  =  ="+JSON.stringify(response));
		sails.config.log.addOUTlog(req.user.username, "fetchAgents");
		res.send(response);
		//sails.config.log.addOUTlog(req.user.email, req.options.action);
	}

};