/**
 * DemoController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
let fs = require('fs');
let {promisify} = require('util');
let xlstojson = require("xls-to-json");
let moment = require('moment-timezone');
let _ = require('lodash');
var voca = require('voca');
var mkpath = require('mkpath');
module.exports = {

	/*uploadCSVFile: async function(req,res){
		sails.config.log.addINlog(req, "uploadCSVFile");
		console.log('inside the controller for upload CSVfile');
		// console.log(req.user);
		sails.config.globals.getdumppath('xxxxxxxxxxx', async function(err, path) {
			console.log(err);
			console.log(path);
			req.file('fileupload').upload({
				dirname:('.' + path),
				// You can apply a file upload limit (in bytes)
			}, async function whenDone(err, uploaded_files) {
				if (err) {
					console.log(err);
					res.json({errmsg: err});
				}

				sails.config.globals.async.each(
					uploaded_files, 
					 function (uploaded_file, cb){
						//let json_file_name = uploaded_file.filename ;
						let moveFile = async () => {
							let mv = promisify(fs.rename);
							await mv(uploaded_file.fd, '.' + path + uploaded_file.filename);

							//to convert csv file in json format
							let json_file_name = uploaded_file.filename.split('.')
							xlstojson({
								input: ('.' + path + uploaded_file.filename),  // input csv 
								output: ('.' + path + json_file_name[0] + '.json'), // output json 
								lowerCaseHeaders:true
							}, async function(err, result) {
								if(err) {
									console.log('-------------'+err);
									cb(err);
								} else {
									let result_string = JSON.stringify(result);
									console.log('++++++++++++++\n'+result_string);
									let count = Object.keys(result).length;
									//console.log(count);
									let crtawbiCount = 0;
									
									let flightTime = '2019';// get this from ui
									let flightNo = 'BA 138'; // get this from ui dependent on flightTime
									let savedBy = 'XXXXXabcdXXXXX'; //  get name of operating person  from ui
									let station = result[0].Uplift;
									let booklistId = String(flightTime + flightNo + station);
									BookList.findOrCreate({
										booklist_id: booklistId},{
										booklist_id: booklistId,
										station: station,
										flight_no: flightNo,
										flight_time: flightTime
									}).exec(function(err, newOrExistingRecord){
										if (err){
											console.log('-------------'+err);
										}
									});
									for (i = 0; i < (count); i++){
										let awbNo = String(result[i]['Prefix']+result[i]['AWB Number']+result[i]['Suffix']);
										//console.log('AAWWBBNNOO     '+awbNo);
										let pieces = result[i]['Pieces'];
										let weight = result[i]['Weight'];
										let src = result[i]['Origin'];
										let dest = result[i]['Destination'];
										let issuer_name = result[i]['Issuer'];
										// let transhipment = 
										let shc = (result[i]['SHC'].split('|'));

										let awb = await AWB.findOne({awb_no: awbNo}).catch(err => console.log(err));

										if (!awb){	
											let awb_info = await AWBInfo.create({station: station,	awb_no: awbNo,	src: src,	dest: dest,	saved_by: savedBy,	issuer_name: consignee_name,	shc: shc}).fetch().catch(err => console.log( err.message));

											let awbEntry = await AWB.create({awb_no: awbNo, awb_info: awb_info.id}).fetch().catch(err => console.log(err));
										}
										let src_station  = await Station.findOne({where: {iata: dest}, select: ["tz"]}).catch(err => console.log( err.message));

										let dest_station  = await Station.findOne({where: {iata: dest}, select: ["tz"]}).catch(err => console.log( err.message));

										// let flightSrc = result[i]['Flight Uplift'];
										// let flightDest = result[i]['Flight Discharge'];
										// let awbLeg = await AWBLeg.create({
										// 	station: station,
										// 	awb_no: awbNo,
										// 	from: flightSrc,
										// 	to: flightDest,
										// 	pieces:pieces,
										// 	weight: weight,
										// 	from_tz: src_station.tz,
										// 	to_tz: dest_station.tz,
										// 	flight_no: flightNo,
										// 	planned_departure:
										// 	planned_arrival:
										// 	created_by: savedBy
										// }).fetch().catch(err => console.log( err.message));
										
									}
									// var awbWithInfo = await AWB.find({awb_no: '12542629613'}).populate('awb_info');
									// console.log('this is linking  :'+ JSON.stringify(awbWithInfo));
									console.log('done');
								}
								
							});

							cb();
						}
						moveFile();	
					}, function(err) {
						if (err)
							console.log(err);
						res.redirect('/demo');
					}
				);
				sails.config.log.addOUTlog(req, "uploadCSVFile");
			});
		});
	},*/

	/*uploadExcelFile: async function(req,res){
		sails.config.log.addINlog(req, "uploadExcelFile");
		console.log('inside the controller for uploadexcelFile');
		sails.config.globals.getdumppath('xxxexcelxxx', async function(err, path) {
			console.log(err);
			console.log(path);
			req.file('fileupload').upload({
				dirname:('.' + path),
				// You can apply a file upload limit (in bytes)
			}, async function whenDone(err, uploaded_files) {
				if (err) {
					console.log(err);
					res.json({errmsg: err});
				}

				sails.config.globals.async.each(
					uploaded_files, 
					function(uploaded_file, cb){
						//let json_file_name = uploaded_file.filename ;
						//console.log('======='+JSON.stringify(uploaded_file));
						let moveFile = async () => {
							let mv = promisify(fs.rename);
							await mv(uploaded_file.fd, '.' + path + uploaded_file.filename);
						//to convert csv file in json format
						let json_file_name = uploaded_file.filename.split('.')
						xlstojson({
							input: ('.' + path + uploaded_file.filename),  // input csv 
							output: ('.' + path + json_file_name[0] + '.json'), // output json 
							sheet: "SCHEDULE"
						}, async function(err, result) {
							if (err) {
								console.log('-------------'+err);
								cb(err);
							} else {
								//	let result_string = JSON.stringify(result);
								let count = Object.keys(result).length;
								console.log(count);
								let crtfltCount = 0;

								let missing_stations = [];
								let affected_flights = [];

								let season = 'Summer2019';
								await Flight.destroy({'season': season}).exec(function (err, flight) {
									if (err) {
										console.log(err);
										}
									else{
										console.log('destroyed ');
									}
								});
								//count-1 bcs excel file is having one extra line
								for (i = 0; i < (count); i++){
									let number = result[i].Flight;
									let targetLength = 4;
									let fourDigitNo = sails.config.custom.leftPad(number, targetLength);
									let flight_no = (result[i]['Org Unit'] + fourDigitNo + result[i].Suffix);
									let src = result[i]['Departure Station Code'];
									let dest = (result[i]['Route']).match(/.{1,3}/g);
									let leg = Number(result[i].Leg);
									let destination = dest[leg];
									let route = (_.kebabCase(dest).toUpperCase());
									let vehicle = result[i].Vehicle;
									
									let monday = (result[i].Doop).includes('1');
									let tuesday = (result[i].Doop).includes('2');
									let wednesday = (result[i].Doop).includes('3');
									let thursday = (result[i].Doop).includes('4');
									let friday = (result[i].Doop).includes('5');
									let saturday = (result[i].Doop).includes('6');
									let sunday = (result[i].Doop).includes('7');
									
									let departure_time = result[i]['Depart Time'];
									let arrival_time = result[i]['Arrive Time'];
									
									let src_station = await Station.findOne({where: {iata: src}, select: ["tz"]}).catch(err => console.log( err.message));
									if (!src_station) {
										//	If the missing station is already captured and is present in the array, we should not add it again.
										if (_.indexOf(missing_stations, src) == -1)
											missing_stations.push(src);

										if (_.indexOf(affected_flights, flight_no))
											affected_flights.push(flight_no);
									}
									
									let dest_station  = await Station.findOne({where: {iata: destination}, select: ["tz"]}).catch(err => console.log( err.message));
									if (!dest_station) {
										//	If the missing station is already captured and is present in the array, we should not add it again.
										if (_.indexOf(missing_stations, destination) == -1)
											missing_stations.push(destination);

										if (_.indexOf(affected_flights, flight_no))
											affected_flights.push(flight_no);
									}
									
									let tz_src = src_station ? src_station.tz : sails.config.custom.local_tz;// get the timezone from database of iata
									let tz_dest = dest_station ? dest_station.tz : sails.config.custom.local_tz;// get the timezone from database of iata
									let start_date = moment(new Date(result[i]['Local Start Date'])).tz(tz_src).valueOf();// use moment library with start_date and tz_src 
									let end_date = moment(new Date(result[i]['Local End Date'])).tz(tz_dest).valueOf();// use moment library with end_date and tz_dest

									let arrival_day = Number(result[i]['Days From Origin']);

									let data = await Flight.create({
										flight_no: flight_no,
										season: season,
										src: src,
										leg: leg,
										dest: destination,
										route: route,
										vehicle: vehicle,
										monday: monday,
										tuesday: tuesday,
										wednesday: wednesday,
										thursday: thursday,
										friday: friday,
										saturday: saturday,
										sunday: sunday,
										departure_time: departure_time,
										arrival_time: arrival_time,
										tz_src: tz_src,
										tz_dest: tz_dest,
										start_date: start_date,
										end_date: end_date,
										arrival_day: arrival_day
									}).fetch().catch(err => console.log( err.message));
										
									if(data) {
										crtfltCount= crtfltCount + 1;
									}

									//console.log((crtfltCount) + '\t' + flight_no + '\t' + src + '\t' + leg + '\t' + destination + '\t' + route + '\t' + vehicle + '\t' + monday + '\t' + tuesday + '\t' + wednesday + '\t' + thursday + '\t' + friday + '\t' + saturday + '\t' + sunday + '\t' + departure_time + '\t' + arrival_time + '\t' + tz_src + '\t' + tz_dest + '\t' + start_date + '\t' + end_date + '\t' + arrival_day ) ;
								}
								console.log('missing '+missing_stations);
								console.log('affected '+affected_flights);
								if (missing_stations || affected_flights){
									sails.helpers.sendEmail.with({
										to: 'medha.halbe@ba.com',
										subject: 'Report - Missing IATA stations',
										html: '<p>Following IATA stations have missing entries in the system:<br><strong>' + missing_stations + '</strong></p><p>Not having their entries is directly affecting the flight schedules:<br><strong>' + affected_flights + '</strong></p>'
									}, function(err) {
										if (err){
											console.log(err);
										}
										console.log('returned from send email helper');
									});
									console.log("after sending mail");
								}
								console.log('done'+ crtfltCount);
							}
						});
						cb();
					}
					moveFile();
					}, function(err) {
						if(err)
							console.log(err);
						res.redirect('/demo1');
					}
				);
				sails.config.log.addOUTlog(req, "uploadExcelFile");
			});
		});
	},*/



	// sendLegData: async function(req, res) {
	// 		let toBePlannedAWB = await AWBLeg.find().where({ 'pieces' : 0}).catch(err => console.log( err.message));
	// 		console.log(toBePlannedAWB);
	// //	sails.sockets.broadcast('planner', /* Send your leg json here */)
	// 	sails.sockets.broadcast('planner','addAWBToBePlanned', {greeting: toBePlannedAWB});
	// 	// async function(){

	// 	// 	return res.json ({greeting: toBePlannedAWB});
	// 	// }
	// }

	//////////////////////////////////////////////////////////////////

	/*uploadEGMFile: async function(req,res){
		sails.config.log.addINlog(req.user.username, "uploadEGMFile");
		console.log(JSON.stringify(req.body));
		
		let current_path = (__dirname).split('api');
		console.log(current_path);
		let root_path = current_path[0];
		console.log(root_path);

		let booklist_id = JSON.stringify(req.body.booklist_id);
		booklist_id = booklist_id.replace(/[" ]/g, "");
		console.log('booklist_id   = '+booklist_id);
		let legs_tobe_discarded = '';
		if(req.body.discarded_booklist_records){
			legs_tobe_discarded = JSON.stringify(req.body.discarded_booklist_records);
			legs_tobe_discarded = legs_tobe_discarded.replace(/[" ]/g, "");
			legs_tobe_discarded = legs_tobe_discarded.split(',');
			console.log('legs_tobe_discarded   = '+legs_tobe_discarded[0]);
		}
		
		
		
		let egm_file_records = [];
		let flyflightDetails = (req.body.flightsSelector).split(","); // get this from ui dependent on flightTime
		let flightNo = flyflightDetails[0];
		sails.config.globals.getdumppath('xxxxxEGMxxxxxx', async function(err, path) {
			req.file('egmFileUpload').upload({
				dirname:('.' + path),
				// You can apply a file upload limit (in bytes)
			}, async function whenDone(err, uploaded_files) {
				if (err) {
				sails.config.log.addlog(1, req, "uploadEGMFile",err);
				console.log(err);
					res.json({errmsg: err});
				}
				
				sails.config.globals.async.each(
					uploaded_files, 
					 function(uploaded_file, callback){
						//console.log('start cb'+cb);
						//let json_file_name = uploaded_file.filename ;
						
						let timestamp = new Date().getTime();
						let file_name = timestamp + '-'+ flightNo+'.txt';
						var {promisify} = require('util');
						var fs1 = require('fs');
						var {join} = require('path');
						
						let moveFile = async () => {
							var readline = require('readline');
							var fs = require('fs');
							let mv = promisify(fs.rename);
							await mv(uploaded_file.fd, '.' + path + file_name);
							console.log('EGM file is uploaded + ' + root_path + path.slice(1) + file_name);
							//console.log(records);

							var input = fs.createReadStream(root_path + path.slice(1) + file_name);
							var myInterface = readline.createInterface({
								input: input,
							});
							
							myInterface.on('line', function (line) {
								line.includes()
								let testDigits = /\d{11}/;
								//let testSpaces = /^[    ]/;
								if(testDigits.test(line)){
									//console.log(line);
									let egm_record = {};
									let egm_record_detail = line.split(' ')
									//console.log(_.compact(line.slice(27).split(' ')));
									let manifest_data =(_.compact(line.slice(27).split(' ')));
									//console.log('pieces = '+ manifest_data[0]+' weight = '+ manifest_data[1]+ ' volume = '+ manifest_data[2]);
									egm_record.awb_no = egm_record_detail[1];
									egm_record.pieces = manifest_data[0];
									egm_record.weight = parseInt(manifest_data[1]);
									//egm_record.volume = parseFloat(manifest_data[2]);
									egm_record.class = manifest_data[2].charAt(manifest_data[2].length-1);
									
									//console.log(egm_record);

									egm_file_records.push(egm_record);
								}

							});
							
							input.on('end', async function (line) {
								//console.log('closing interface');
								console.log('egm_file_records end = = =++++ = = ='+ JSON.stringify(egm_file_records));

								if(egm_file_records.length > 0){
									let egm_awbs = [];
									for (let k = 0; k < egm_file_records.length; k++){
										egm_awbs.push(egm_file_records[k].awb_no);

										//need to update actual pieces and weight to proper awbleg of that booklist record who is valid
										let find_awb_leg = await AWBLeg.findOne({awb_no: egm_file_records[k].awb_no, void_on: 0, booklist: booklist_id}).catch(err => console.log( err.message));
										
										console.log('find_awb_leg = = '+ JSON.stringify(find_awb_leg));
										if(find_awb_leg){
											let update_awb_leg = await sails.helpers.planner.updateAwbLeg.with({
												id: find_awb_leg.id,
												station: req.body.station,
												awb_no: find_awb_leg.awb_no,
												from: find_awb_leg.from,
												created_by: find_awb_leg.created_by,
												actual_pieces_flown: Number(egm_file_records[k].pieces),
												actual_weight_flown: Number(egm_file_records[k].weight),
												status: sails.config.custom.database_model_enums.awb_leg_status.completed
											});
											let update_blank_leg = await sails.helpers.awbSanitizer.with({
												station: req.body.station,
												awb_no: find_awb_leg.awb_no,
												savedBy: req.body.user,
											});


											let find_leg_op = await AWBLegOp.findOne({awb_leg: find_awb_leg.id, opening_status: sails.config.custom.awb_leg_ops_status.ready_to_departure, station: req.body.station,department: sails.config.custom.department_name.planner_ops,}).catch(err => console.log( err.message));
											console.log('find_leg_op    '+ JSON.stringify(find_leg_op));
										
											if (find_leg_op){
												let update_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
													id: find_leg_op.id,
													awb_leg: find_leg_op.awb_leg,
													station: req.body.station,
													awb_no: find_leg_op.awb_no,
													closing_status: sails.config.custom.awb_leg_ops_status.departed,				//Departed
													acted_at_time: Date.now(),
													acted_by: 'xxxxxTODOxxxxx',
												});
										
												console.log('updated leg op details'+JSON.stringify(update_leg_op));
												if (update_leg_op){
													
													let create_leg_op_euics_pending = await sails.helpers.planner.updateAwbLegOp.with({
														station: req.body.station,
														awb_no: update_leg_op.awb_no,
														awb_leg: update_leg_op.awb_leg.id,
														//op_name:
														department: sails.config.custom.department_name.central_ops,
														opening_status: sails.config.custom.awb_leg_ops_status.euics_pending,
														trigger_time: Date.now(),
														duration: 30
													});
														
													sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'addEUICSPendingLegOps', {euicsPendingLegOp: create_leg_op_euics_pending})
										
													let create_leg_op_pre_alert_pending = await sails.helpers.planner.updateAwbLegOp.with({
														station: req.body.station,
														awb_no: update_leg_op.awb_no,
														awb_leg: update_leg_op.awb_leg.id,
														//op_name:
														department: sails.config.custom.department_name.central_ops,
														opening_status: sails.config.custom.awb_leg_ops_status.pre_alert_pending,
														trigger_time: Date.now(),
														duration: 30
													});
														
													sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'addPreAlertPendingLegOps', {preAlertPendingLegOp: create_leg_op_pre_alert_pending})
										
													let create_leg_op_cap_a_pending = await sails.helpers.planner.updateAwbLegOp.with({
														station: req.body.station,
														awb_no: update_leg_op.awb_no,
														awb_leg: update_leg_op.awb_leg.id,
														//op_name:
														department: sails.config.custom.department_name.central_ops,
														opening_status: sails.config.custom.awb_leg_ops_status.cap_a_pending,
														trigger_time: Date.now(),
														duration: 30
													});
														
													sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'addCAPAPendingLegOps', {capAPendingLegOp: create_leg_op_cap_a_pending})
										
													let create_leg_op_e_awb_check_pending = await sails.helpers.planner.updateAwbLegOp.with({
														station: req.body.station,
														awb_no: update_leg_op.awb_no,
														awb_leg: update_leg_op.awb_leg.id,
														//op_name:
														department: sails.config.custom.department_name.central_ops,
														opening_status: sails.config.custom.awb_leg_ops_status.e_awb_check_pending,
														trigger_time: Date.now(),
														duration: 30
													});
														
													sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'addEAwbCheckPendingLegOps', {eAwbCheckPendingLegOp: create_leg_op_e_awb_check_pending})
										
												}
										
												sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'removeReadyToDepartureLegOps', {readyToDepartureLegOp: update_leg_op});
											
											}
										}
									}

									//creating attachment record for egm
									let create_attachment = await Attachment.create({ station: req.body.station, original_filename: uploaded_file.filename, new_filepath: ('.' + path + file_name), received_from: req.body.user, }).fetch().catch(err => console.log(err.message));

									let findBooklist = await BookList.find({id: booklist_id}).catch(err => console.log( err.message));

									console.log('findBooklist  '+JSON.stringify(findBooklist));
									update_booklist = await BookList.update({id: booklist_id}).set({egm_awbs : egm_awbs}).fetch().catch(err => console.log( err.message));

									update_booklist = update_booklist[0];
									//reference to the booklist
									let refToBooklist = await BookList.addToCollection(update_booklist.id, 'file_manifest').members(create_attachment.id);
								}

								myInterface.close();
							});
							
							////discarding awb legs
							if(legs_tobe_discarded.length > 0){
								for(let i =0; i< legs_tobe_discarded.length; i++){
									let discarded_leg = await AWBLeg.update({id: legs_tobe_discarded[i]},{
										void_on: Date.now(),// current timestamp
										void_reason: sails.config.custom.void_reason.egm_offloaded,
										status: sails.config.custom.database_model_enums.awb_leg_status.discarded 
									}).fetch().catch(err => res.json({errormsg: err.message}));
									discarded_leg = discarded_leg[0];
									let blank_awb_leg = await sails.helpers.awbSanitizer.with({
										station: discarded_leg['station'],
										awb_no: discarded_leg['awb_no'],
										savedBy: req.body.user,
									});
									//console.log('++++$$$$+restorrrrreeeeeeee++++ '+JSON.stringify(blank_awb_leg));
								
									//	Broadcasting the information that the AWB is added
									sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
								}
							}
							sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'changeInBooklist', {msg: 'change in booklist need to refresh operations'});
							sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'changeInBooklist', {msg: 'change in booklist need to refresh legs'});
						}
						//////file reading close at here				
						moveFile();
					}, async function(err) {
						if(err){
							console.log(err);
						} else{
							//res.redirect('/planner')
							res.ok();
						}
					}
				);
				sails.config.log.addOUTlog(req.user.username, "uploadEGMFile");
			});
		});
		//res.ok();
	},*/
	

};
////////////////////////////////////////////////////////////////////