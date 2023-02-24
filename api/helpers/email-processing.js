module.exports = {

	friendlyName: 'Email Processing',

	description: 'Validate each received email and handle attachments',

	inputs: {
		key1: {type: 'string'},
		key2: {type: 'number'}
	},

	exits: {
		success: {
			outputDescription: "Email's are valid .",
		}
	},
	//function check's for each email id if we found invalid email then we return json with index of invalid email and status true if success and false on failure.
	fn: function (inputs, exits) {

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



var Imap = require('imap'),
inspect = require('util').inspect;
var fs = require('fs');
var base64	= require('base64-stream');
var {promisify} = require('util');
var writeFileAsync = promisify(fs.writeFile);
var Queue = require('better-queue');
var imap = new Imap({
	user: 'ocargo@zohomail.in',
	password: 'Mobigic@123',
	//host: 'imap.gmail.com',
	host: 'imap.zoho.in',
	port: 993,
	tls: true,
	connTimeout: 10000, // Default by node-imap 		
	authTimeout: 5000, // Default by node-imap, 		
	//debug: console.log, // Or your custom function with only one incoming argument. Default: null 		
	tlsOptions: { rejectUnauthorized: false },		
	mailbox: "INBOX", // mailbox to monitor 		
	searchFilter: ["UNSEEN", "FLAGGED"], // the search filter being used after an IDLE notification has been retrieved 		
	markSeen: true, // all fetched email willbe marked as seen and not fetched next time 		
	fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`, 		
	mailParserOptions: { streamAttachments: true }, // options to be passed to mailParser lib. 		
	attachments: true, // download attachments as they are encountered to the project directory 		
	attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments 
});

/////////////////////////////////////////////////////////////IMAP INITIALIZATION ////////////////////////////////

imap.once('ready', function() {
	sails.config.log.addINlog('email-processing', 'imap-ready');
	openMailBox();
	sails.config.log.addOUTlog('email-processing', 'imap-ready');
});

imap.once('error', function(err) {
	sails.config.log.addINlog('email-processing', 'imap-error');
	console.log(err);
	sails.config.log.addlogmin(0, 'email-processing', 'imap-error', err);
	sails.config.log.addOUTlog('email-processing', 'imap-error');
});

imap.once('end', function() {
	sails.config.log.addINlog('email-processing', 'imap-end');
	console.log('Connection ended');
	sails.config.log.addOUTlog('email-processing', 'imap-end');
});

imap.on('mail', function(numNewMsgs) {
	sails.config.log.addINlog('email-processing', 'imap-mail');
	console.log('[' + numNewMsgs +'] - New Emails');
	sails.config.log.addlogmin(3, 'email-processing', 'imap-mail', '[' + numNewMsgs +'] - New Emails');

	email_queue.push(numNewMsgs);
	//mailProcessing();
	sails.config.log.addOUTlog('email-processing', 'imap-mail');
});


imap.connect();
sails.config.log.addlogmin(3, 'email-processing', 'imap-connect', 'initiated IMAP connection');
//console.log(__dirname);

function toUpper(thing) { return thing && thing.toUpperCase ? thing.toUpperCase() : thing;}

function findAttachmentParts(struct, attachments) {
	sails.config.log.addINlog('email-processing', 'findAttachment');
	attachments = attachments ||	[];
	for (var i = 0, len = struct.length, r; i < len; ++i) {
		if (Array.isArray(struct[i])) {
			findAttachmentParts(struct[i], attachments);
		} else {
			if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) > -1) {
				attachments.push(struct[i]);
			}
		}
	}
	sails.config.log.addOUTlog('email-processing', 'findAttachment');
	return attachments;
}

function buildAttMessageFunction(attachment, user, subject, date, messageId) {
	//sails.config.log.addINlog('email-processing', 'buildAttMessageFunction');
	let filename = attachment.params.name;
	let encoding = attachment.encoding;
	let received_from = String(user);
	let email_subject = String(subject); 
	let msg_id = String(messageId);
	console.log('##################################'+received_from+email_subject);
	return function (single_msg, seqno) {
		sails.config.log.addINlog('email-processing', 'buildAttMessageFunction for single_msg');
		console.log('---' + user + '---' + subject + '---' + date);
		var prefix = '(#' + seqno + ') ';
		single_msg.on('body', async function(stream, info, res) {
			sails.config.log.addINlog('email-processing', 'single_msg-body');
			//Create a write stream so that we can stream the attachment to file;
			console.log(prefix + 'Streaming this attachment to file', filename, info);

		//////////////////here we have to validate user and if validate then only go for attachments storing/////////
			if (!isUserValid(user)){
				console.log('sender :' + user);
				console.log('Invalid user');
				
			}
			else{
				console.log('sender :' + user);
				let subjectLineandStation = validateSubject(subject);

				if(subjectLineandStation == 'invalid'){
					console.log('invalid subject id.******error');//stop here bcz subject line is invalid
					let reason = 'Invalid Subjectline';
					let data = await Email.update({ msg_id: msg_id}, {reason: reason}).fetch().catch(err => res.json({errormsg: err.message}));
					if(data) {
						console.log('reason inserted as invalid subject line');
					}
					
				}
				else{
					if (subjectLineandStation == 'AWB'){
						subjectLineandStation = validateSubject(filename);
						console.log('this is validated subject line for AWB .........  '+ subjectLineandStation);
						if(subjectLineandStation == 'invalid'){
							console.log('invalid attachment name');//stop here bcz subject line is invalid
							let reason = 'Invalid in Attachment name';
							let data = Emails.update({ msg_id: messageId}, {reason: reason}).fetch().catch(err => res.json({errormsg: err.message}));
							if(data) {
								console.log('reason inserted as invalid attachment name ');
							}

						}
						var subjectLine = subjectLineandStation;
						subjectLineandStation = subjectLineandStation.split('_');
						var fileStation = subjectLineandStation[1];
						console.log('this is validated subject line .........  '+ subjectLine);
						console.log('this is validated city .........  '+ fileStation);
					}
					else{
						var subjectLine = subjectLineandStation;
						subjectLineandStation = subjectLineandStation.split('_');
						var fileStation = subjectLineandStation[1];
						console.log('this is validated subject line .........  '+ subjectLine);
						console.log('this is validated city .........  '+ fileStation);
					}	
		/////////////////////////////////////open Database entry for email is happen here//////////////////////


		/////////////////////////////////////open Database entry for email is happen here//////////////////////

		///////////////////////////////////open from here the folder is created by date wise///////
					console.log('date format from mail------> '+date);
					let d = new Date(date);
					let fileYear = d.getFullYear();

					let fileMonth = (1 + d.getMonth()).toString();
					fileMonth = fileMonth.length > 1 ? fileMonth : '0' + fileMonth;

					let fileDate = d.getDate().toString();
					fileDate = fileDate.length > 1 ? fileDate : '0' + fileDate;

					console.log('check this date format'+ fileDate + '/' + fileMonth + '/' + fileYear);
				
					//let fileTimestamp = Math.round(Date.parse(date) / 1000);
					//console.log('---------------------------------'+fileTimestamp);

					sails.config.globals.getdumppath('email_attachments/' + fileStation, async function(err, path) {
						console.log(err);
						console.log(path);

						var writeStream = fs.createWriteStream(filename);
						// writeStream.on('finish', function() {
						// 	console.log(prefix + 'Done writing to file %s', filePath+'  ..'+filename);
						// });

						writeStream.on('error', function(e) {
							sails.config.log.addINlog('email-processing', 'writeStream-error'); 
							console.error(e);
							sails.config.log.addOUTlog('email-processing', 'writeStream-error');
						});
					
					
						//stream.pipe(writeStream); this would write base64 data to the file.
						//so we decode during streaming using 
						if (toUpper(encoding) === 'BASE64') {
							//the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
							stream.pipe(new base64.Base64Decode()).pipe(writeStream);
						//	splitDate(data);
						} else	{
							//here we have none or some other decoding streamed directly to the file which renders it useless probably
							stream.pipe(writeStream);
						//	splitDate(data);
						}
						///////////////////////////////////close from here the data from attachment is saved in default file by createWriterStream func///////


						let timestamp = new Date().getTime();
						let newFileName = (subjectLine + '_'+ timestamp );
						console.log('this is new file name'+ newFileName);
						//	close this block is to correct the filename for storing purpose
						
						//	open this block is move file to specifide location
						let current_path = (__dirname).split('api');
						//console.log(current_path);
						let root_path = current_path[0].slice(0,-1);
						//console.log(root_path);
						let defaultPath = root_path;
						let filePath = (defaultPath+'/'+path);
						var {promisify} = require('util');
						var fs1 = require('fs');
						var {join} = require('path');
						var mv = promisify(fs1.rename);

						let  moveFile = async () => {
							let original = join(defaultPath, filename);
							let target = join(filePath, newFileName); 
							await mv(original, target);
						}

						moveFile();
						//close this block is move file to specifide location
						let create_attachment = await Attachment.create({ station: fileStation, original_filename: filename, new_filepath: (filePath +'/'+newFileName), received_from: received_from, email_subject: email_subject}).fetch().catch(err => console.log(err.message));
						if(create_attachment) {
							console.log('data inserted successfuly in Attachment model');
						}

						//here if the subjectline contains 8 digit awb no. then creating entry to the AWB database
						let awb = parseInt(subjectLine);
						let awbNo = String(awb);
						console.log ('_______------awb is = = ='+awb+' awbNo ==='+ awbNo);
						
						if (awbNo.length == 8){
							console.log ('_______------awblength is = = ='+ awbNo.length);
							awbNo = String('125'+awbNo);
						}
						
						if(awbNo.length == 11){
						// if revised/ same awb is arrived then discard the legs from booklist record wich are dident fly wrt awbno if onHand is true and planned departure is > current time stamp and from == station
						console.log('planned_departure '+timestamp +'awb_no ' +awbNo+ '  from  '+ fileStation);
							let awb_exists = await AWBLeg.find({where: {planned_departure: {'>': timestamp}, awb_no: awbNo, from: fileStation, status: 'Pending'}}).populate('awb_info').catch(err => console.log( err.message));
							
							console.log ('this awb is ======  = '+JSON.stringify(awb_exists)+'-------check length=====--'+awb_exists.length);

							for (let i = 0; i < awb_exists.length; i++){
								if (awb_exists[i].awb_info.on_hand == true){
									console.log ('this awb is reviesed======  = '+JSON.stringify(awb_exists[i]));


									//	Voiding the exisitng leg
									// console.log('===++###$$$$srfrfdsfdsfds$$$########'+JSON.stringify(req.body));
									let voidAwbLeg = await sails.helpers.planner.updateAwbLeg.with({
										id: awb_exists[i].id,
										station: awb_exists[i].station,
										awb_no: awb_exists[i].awb_no,
										from: awb_exists[i].from,
										created_by: awb_exists[i].created_by,
										void_on: Date.now(),// current timestamp
										void_reason: sails.config.custom.void_reason.revised_awb,
									});

									sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'discardBooklistAwbLeg', {awbleg: voidAwbLeg});
									//let remaining_pieces =  -(Number(req.body.pieces));
									let blank_awb_leg = await sails.helpers.awbSanitizer.with({
										station: awb_exists[i].station,
										awb_no: awb_exists[i].awb_no,
										savedBy: "TODO",
									//	pieces: remaining_pieces
									});
									console.log('++++$$$$+restorrrrreeeeeeee++++ '+JSON.stringify(blank_awb_leg));
									if(blank_awb_leg) {
										//	Broadcasting the information that the AWB is added
										sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBePlanned', {blankAwbLeg: blank_awb_leg});
									}
									sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'changeInBooklist', {msg: 'change in booklist need to refresh operations'});
								}
							}
								
							if(awb_exists.length == 0){
								let createAwb = await sails.helpers.planner.updateAwb.with({awb_no: awbNo, 
									station: fileStation,
									src: fileStation,
									saved_by: 'Email',
									on_hand: true});
	
								//this is to create legop when record is onhand and having active leg in booklist
								let check_active_leg = await AWBLeg.findOne({where: {status: sails.config.custom.database_model_enums.awb_leg_status.pending, pieces: {'>': 0}, awb_no: createAwb.awb_no, void_on: 0}}).populate('awb_info').catch(err => console.log( err.message));
								//console.log('check_active_leg'+JSON.stringify(check_active_leg));
								if (check_active_leg){
									//check_active_leg = check_active_leg[0];
									if ((check_active_leg.awb_info.on_hand == true) && (check_active_leg.awb_info.pieces > 0)){
										//console.log('check_active_leg'+JSON.stringify(check_active_leg));
										console.log('from email processing');
										let awbLegOpCutoff = await sails.helpers.getAwbLegOpCutoff.with({
											opName: 'ready_to_rate_check',
											planned_departure: check_active_leg.planned_departure
										})

										let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
											station: check_active_leg.from,
											awb_no: check_active_leg.awb_no,
											awb_leg: check_active_leg.id,
											op_name: sails.config.custom.op_name.rate_check,
											department: sails.config.custom.department_name.planner_ops,
											opening_status: sails.config.custom.awb_leg_ops_status.ready_to_rate_check,
											trigger_time: Date.now(),
											//duration: sails.config.custom.cut_off_timer.ready_to_rate_check_duration
											cut_off_time: awbLegOpCutoff.cut_off_time
										});
										//console.log('created leg op details'+JSON.stringify(create_leg_op));
										//need to apply dispacher function for here
										// if(create_leg_op){
										// 	sails.sockets.broadcast(sails.config.custom.socket.room_name.operation,'addLegOps', {newLegOp: create_leg_op});
										// }
									}
								}
								console.log('====addAWBToBeActioned createAwb details'+JSON.stringify(createAwb));
								sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBeActioned', {awb_info: createAwb});
								sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'onHandforToBePlanned', {awb_info: createAwb});
								sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'onHandforBooklistRecord', {awb_info_id: createAwb.id});
							}
						}
					});
				}
			}
			sails.config.log.addOUTlog('email-processing', 'single_msg-body');
		});
		single_msg.once('end', function() {
			sails.config.log.addINlog('email-processing', 'msg-end');
			console.log(prefix + 'Finished attachment %s', filename);
			sails.config.log.addOUTlog('email-processing', 'msg-end');

		});
		sails.config.log.addOUTlog('email-processing', 'buildAttMessageFunction for single_msg');
	};
}


/////////////////////////////////////////////////////////user defined functions////////////////


// this fun is to validate the mailid of user
function isUserValid(user){
	sails.config.log.addINlog('email-processing', 'isUserValid');
	let preUser= 'Ajitkumar Dhadke <ajitkumar@mobigic.com>';
	sails.config.log.addOUTlog('email-processing', 'isUserValid');
	return (user == preUser)
}

// this function is to identifi the awwb from subjectline with regex
function validateSubject(subject) {

	sails.config.log.addINlog('email-processing', 'validateSubject');
	sails.config.log.addlogmin(3, 'email-processing', 'validateSubject', 'subject = ' + subject);
	//AWB 41276760 BOM (Airwaybill Copy).
	let test1 = /^(AWB)+[ ]+([0-9]{8})+[ ]+([A-Z]{3})$|^(AWB)+[ ]+([0-9]{11})+[ ]+([A-Z]{3})$/i;

	
	//HSE 81720111 BOM
	let test2 = /^(HSE)+[ ]+([0-9]{8})+[ ]+([A-Z]{3})$/i;

	//BOMMSG BA198/26JUN MAN 
	let test3 = /^([A-Z]{6})+[ ]+([A-Z]{2})+([0-9]{3})+[/]+([0-9]{2})+([A-Z]{3})+[ ]+MAN$/i;

	//BOMMSG BA198/26JUN COU (Courier Pre-alert).
	let test4 = /^([A-Z]{6})+[ ]+([A-Z]{2})+([0-9]{3})+[/]+([0-9]{2})+([A-Z]{3})+[ ]+COU$/i;

	//BOMMSG BA138/26JUN VAL (Valuable Pre-alert).
	let test5 = /^([A-Z]{6})+[ ]+([A-Z]{2})+([0-9]{3})+[/]+([0-9]{2})+([A-Z]{3})+[ ]+VAL$/i;

	//AWB 82518866 OR 12582518866 HYD REVISED ( Revised Airwaybill sent after amendments).
	let test6 = /^(AWB)+[ ]+([0-9]{8})+[ ]+([A-Z]{3})+[ ]+REVISED$|^(AWB)+[ ]+([0-9]{11})+[ ]+([A-Z]{3})+[ ]+REVISED$/i;

	//BLR MSG BA118 31MAY MAN REVISED ( Revised Manifest copy).
	let test7 = /^([A-Z]{3})+[ ]+([A-Z]{3})+[ ]+([A-Z]{2})+([0-9]{3})+[ ]+([0-9]{2})+([A-Z]{3})+[ ]+(MAN REVISED)$/i;

	//AWB (attachments for multiple airwaybill copies)
	let test8 = /^(AWB)$/i;

	let subjectLine;

	//let test1 = /^([]{3})+([0-9]{8})+([A-Z]{3})$/i;
	if(test1.test(subject)){
		sails.config.log.addlogmin(3, 'email-processing', 'validateSubject', 'Airwaybill Copy');
		//input AWB 41276760 BOM
		//awbnumber_stationcode_AWB this should be returned
		subject = subject.split(' ');
		let awb = subject[1];
		let station = subject[2];
		subjectLine = (awb + '_' + station + '_' + 'AWB');
	} 
	else if(test2.test(subject)){
		sails.config.log.addlogmin(3, 'email-processing', 'validateSubject', 'House Copy');
		//input HSE 81720111 BOM
		//should return awbnumber_stationcode_HAWB
		subject = subject.split(' ');
		let awb = subject[1];
		let station = subject[2];
		subjectLine = (awb + '_' + station + '_' + 'HAWB');
	}
	else if(test3.test(subject)){
		sails.config.log.addlogmin(3, 'email-processing', 'validateSubject', 'Manifest Copy');
		//input BOMMSG BA198/26JUN MAN 
		//should return date_flight no_station_MAN
		subject = subject.split(' ');
		let retriveDate = subject[1].split('/');
		let date = retriveDate[1];
		let flightNumber = retriveDate[0];
		let retriveStation = subject[0].split('MSG');
		let station = retriveStation[0];
		subjectLine = (date + '_'+station+'_'+flightNumber + '_' + 'MAN'); 
	}
	else if(test4.test(subject)){
		sails.config.log.addlogmin(3, 'email-processing', 'validateSubject', 'Courier Pre-Alert Copy');
		//input BOMMSG BA198/26JUN COU
		//should return date_flight no_station_COU
		subject = subject.split(' ');
		let retriveDate = subject[1].split('/');
		let date = retriveDate[1];
		let flightNumber = retriveDate[0];
		let retriveStation = subject[0].split('MSG');
		let station = retriveStation[0];
		subjectLine = (date + '_'+station+'_'+flightNumber+ '_' + 'COU'); 
	}
	else if(test5.test(subject)){
		sails.config.log.addlogmin(3, 'email-processing', 'validateSubject', 'Valuable Pre-Alert Copy');
		//input BOMMSG BA138/26JUN VAL
		//should return date_flight no_station_VAL
		subject = subject.split(' ');
		let retriveDate = subject[1].split('/');
		let date = retriveDate[1];
		let flightNumber = retriveDate[0];
		let retriveStation = subject[0].split('MSG');
		let station = retriveStation[0];
		subjectLine = (date + '_'+station+'_'+flightNumber+ '_' + 'VAL'); 
	}
	else if(test6.test(subject)){
		sails.config.log.addlogmin(3, 'email-processing', 'validateSubject', 'Revised Airwaybill Copy');
		//input AWB 12582518866 HYD REVISED
		//should return awbnumber_stationcode_AWB
		subject = subject.split(' ');
		let awb = subject[1];
		let station = subject[2];
		subjectLine = (awb + '_' + station + '_' + 'AWB');
	}
	else if(test7.test(subject)){
		sails.config.log.addlogmin(3, 'email-processing', 'validateSubject', 'Revised Manifest Copy');
		//input BLR MSG BA118 31MAY MAN REVISED
		//should return date_flight no_station_MAN
		subject = subject.split(' ');
		//let retriveDate = subject[3].split('/');
		let date = subject[3];
		let flightNumber = subject[2];
		let station = subject[0];
		subjectLine = (date + '_'+station+'_'+flightNumber+ '_'+ 'MAN'); 
	}
	else if(test8.test(subject)){
		sails.config.log.addlogmin(3, 'email-processing', 'validateSubject', 'Multiple Airwaybill Copy');
		subjectLine = ('AWB');
	}
	else{
		sails.config.log.addlogmin(3, 'email-processing', 'validateSubject', 'Invalid Email Subject');
		subjectLine = ('invalid');
		console.log(subjectLine);
	}

	sails.config.log.addOUTlog('email-processing', 'validateSubject');
	return subjectLine;
}



// this is function to open the inbox at once only when this process get initiated
function openMailBox() {
	sails.config.log.addINlog('email-processing', 'openMailBox');
	imap.openBox('INBOX', false, function(err, box) {
		sails.config.log.addINlog('email-processing', 'openBox-INBOX');
		if (err) {
			imap.end();
			throw err;
		} 
		sails.config.log.addOUTlog('email-processing', 'openBox-INBOX');
	//console.log(box);
	});
	sails.config.log.addOUTlog('email-processing', 'openMailBox');
}

// this is function to call the mail processing
//function mailProcessing(numNewMsgs){
var email_queue = new Queue(function (numNewMsgs, cb) {
	sails.config.log.addINlog('email-processing', 'email_queue');
	// Generate test SMTP service account from ethereal.email
	// Only needed if you don't have a real mail account for testing
	//sails.config.log.addINlog('helper', 'send-email-queue');
	imap.search(['UNSEEN'], function (err, results) {
		sails.config.log.addINlog('email-processing', 'imap.search-UNSEEN');
		if (err) throw err;
			console.log(results);
			// let unread = {};
			// unread = results;
			// console.log('unread array------'+unread);

		if(results && results.length > 0) {
			var f = imap.fetch(results, {
				bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)'],
				markSeen: true,
				struct: true
			});
			
			f.on('message', function (msg, seqno) {
				sails.config.log.addINlog('email-processing', 'f.on-message');
				console.log('Message #%d', seqno);
				var buffer ='';
				
				let subject;
				let user;
				let date;
				let messageId

				var prefix = '(#' + seqno + ') ';
				msg.on('body', function(stream, info) {
					sails.config.log.addINlog('email-processing', 'msg.on-body');
					let buffer = '';					
					stream.on('data', function(chunk) {
						buffer += chunk.toString('utf8');
					});

					stream.once('end', function() {
						sails.config.log.addINlog('email-processing', 'strem.once-end');
					//	let data = (prefix + 'Parsed header1234: %s', inspect(Imap.parseHeader(buffer)));
					//	console.log(data);
						//console.log(prefix + 'Parsed header$$$$$$$$$$$: %s', inspect(Imap.parseHeader(buffer)));
						console.log('---------------------------------------------------------------------------------');
						var data1 = [];
						data1 = Imap.parseHeader(buffer);

						//console.log('+++++++++++++--------'+data1);
						let data2 = JSON.stringify(data1);
						console.log('+++++++++++++'+data2);
						subject = String(data1.subject);
						user = String(data1.from);
						date = String(data1.date);
						messageId = String(data1['message-id']);
						//console.log(data2);
						sails.config.log.addOUTlog('email-processing', 'strem.once-end');
					});
					sails.config.log.addOUTlog('email-processing', 'msg.on-body');
				});
				
				msg.once('attributes', function(attrs) {
					sails.config.log.addINlog('email-processing', 'msg.once-attributes');
					console.log(inspect(attrs));
					let preUser= 'Ajitkumar Dhadke <ajitkumar@mobigic.com>';
					if (user != preUser){
						console.log('sender :' + user);
						console.log('Invalid user *****internal check for msg attributes');
						
					}
					else{
						console.log('sender :' + user);
						var attachments = findAttachmentParts(attrs.struct);
						console.log(user + ' Has attachments: %d', attachments.length);
						for (var i = 0, len=attachments.length ; i < len; i++) {
							var attachment = attachments[i];
							console.log(prefix + 'Fetching attachment %s', attachment.params ? attachment.params.name : "!!! OMG !!!");
							var f = imap.fetch(attrs.uid , { //do not use imap.seq.fetch here
								bodies: [attachment.partID],
								struct: true
							});
							//build function to process attachment message
							if (!attachment)
								console.log('no any attachment');
							else{
								console.log(attachment);
								f.on('message', buildAttMessageFunction(attachment, user, subject, date, messageId));
							}
						}
					}
					sails.config.log.addOUTlog('email-processing', 'msg.once-attributes');
				});
				msg.once('end', async function() {
					sails.config.log.addINlog('email-processing', 'msg.once-end');
					console.log(prefix + 'Finished email');
					let data = await Email.create({ msg_id: messageId, subject: subject, from: user}).fetch().catch(err => res.json({errormsg: err.message}));
					if(data) {
						console.log('data inserted successfuly in Email model');
					}
					sails.config.log.addOUTlog('email-processing', 'msg.once-end');
				});

				sails.config.log.addOUTlog('email-processing', 'f.on-message');
			});
			
			f.once('error', function(err) {
				sails.config.log.addINlog('email-processing', 'f.once-error');
				console.log('Fetch error: ' + err);
				sails.config.log.addOUTlog('email-processing', 'f.once-error');
			});
			
			f.once('end', function() {
				sails.config.log.addINlog('email-processing', 'f.once-end');
				console.log('Done fetching all messages!');
				sails.config.log.addOUTlog('email-processing', 'f.once-end');
				cb();
				//imap.end();
			});
		}
		else{
			cb();
		}
		sails.config.log.addOUTlog('email-processing', 'imap.search-UNSEEN');
	});
	sails.config.log.addOUTlog('email-processing', 'email_queue');
});

	}
};
