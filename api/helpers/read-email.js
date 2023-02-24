/*	STEPS

	1. Create IMAP Object
	2. IMAP Listens for events - close, ready, error, mail, end
	3. IMAP fuctions are - [openBox], search, fetch, end, [closeBox]
	4. IMAP openBox will open specific mail box that exists on the server
	5. IMAP search will provide with UIDs
	6. IMAP fetch will provide us with each message from the connected inbox.
	7. Read each message from the fetch
	8. Read Subject line and the attachment
*/

const Imap = require('imap');
	
var imap;				//	Holds instance of current imap object
var current_mail_box;	//	Holds current mail box instance
var inspect = require('util').inspect;

var fs = require('fs');
var base64	= require('base64-stream');
var {promisify} = require('util');
var writeFileAsync = promisify(fs.writeFile);

var message_options = {
	bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)', '1'],
	markSeen: false,
	struct: true
}

let initImap = function(xoauth2) {
	if(!imap) {
		
		imap = new Imap({
			//user: "central@ttgroupglobal.com",//'idos19@outlook.com',
			//user: 'idos2020@outlook.com',
			//password: "Cops@2022",//'idos2019', 
			//host: 'imap.gmail.com',
			host: 'outlook.office365.com',
			port: 993,
			tls: true,
			connTimeout: 10000, // Default by node-imap 		
			authTimeout: 5000, // Default by node-imap, 		
			debug: console.log,//logx, // Or your custom function with only one incoming argument. Default: null 		
			tlsOptions: { rejectUnauthorized: false },		
			mailbox: "INBOX", // mailbox to monitor 		
			searchFilter: ["UNSEEN"/*, "FLAGGED"*/], // the search filter being used after an IDLE notification has been retrieved 	
			markSeen: false, // all fetched email willbe marked as seen and not fetched next time 		
			fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`, 		
			mailParserOptions: { streamAttachments: true }, // options to be passed to mailParser lib. 		
			attachments: true, // download attachments as they are encountered to the project directory 		
			attachmentOptions: { directory: "attachments/" }, // specify a download directory for attachments 
			xoauth2: xoauth2
		});
		
		registerImapListeners();
	}
			
	return imap;
}

let openImapConnection = async function() {
	/*if(!imap) {
		initImap();
	}*/
	if(imap) { 
		try {
			imap.connect();
		} catch (e) {console.log(e);}
	}
}

let closeImapConnection = function() {
	console.log('imap state before end = ' + imap.state);
	if(imap) {
		imap.end();
		console.log('imap state after end = ' + imap.state);
	}
}

let registerImapListeners = function() {
	if(imap) {
		console.log('registering imap listeners');
		
		imap.once('ready', on_imap_ready);
		imap.once('close', on_imap_close);
		imap.once('error', on_imap_error);
		imap.once('mail', on_imap_mail);
		imap.once('end', on_imap_end);
	}
}

let openMailBox = async function() {
	return new Promise((good, bad) => {
		if(can_use_imap()) {
			sails.config.log.addINlog('email-processing', 'openMailBox');
			imap.openBox('INBOX', false, function(err, box) {
				sails.config.log.addINlog('email-processing', 'openBox-INBOX');
				if (err) {
					print_error('E R R O R   I N   O P E N I N G   O F   I N B O X');
					logx(err);
					closeImapConnection();
					good(false);
					return;
					//throw err;
				}
				logx('I N B O X   I S   O P E N   N O W');
				print_imap_state();

				current_mail_box = box;

				sails.config.log.addOUTlog('email-processing', 'openBox-INBOX');
				good(true);
			});
			sails.config.log.addOUTlog('email-processing', 'openMailBox');
		} else {
			print_error('A V O I D E D   O P E N I N G   O F   I N B O X');
			good(false);
		}
	});
}

let closeMailBox = async function() {
	return new Promise((good, bad) => {
		if(can_use_imap() && is_mail_box_open())
			imap.closeBox(false, function(err) {
				current_mail_box = undefined;
				if(err) {
					print_error();
					good(false);
				} else {
					logx('M A I L   B O X   C O N N E C T I O N   C L O S E D');
					good(true);
				}
			});
		else {
			print_error('T H E R E   I S   N O   M A I L   B O X   T O   C L O S E');
			good(true);
		}
	});
}

let performReadMessages = async function() {
	logx('O P E N I N G   M A I L   B O X');
	let success = current_mail_box ? true : await openMailBox();
	
	let UIDs;
	if(success) {
		UIDs = await getUIDsOfUnreadMessages();
	}
	
	logx('UIDs = ' + JSON.stringify(UIDs));
	//let emailMessage = new EmailMessage([76163]);
	//await emailMessage.fetchMessageForUID();
		
	for(let i = 0; i < UIDs.length; i++) {
		let emailMessage = new EmailMessage(UIDs[i]);
		await emailMessage.fetchMessageForUID();
		logx('done reading message uid ' + UIDs[i])
	}
	
	await closeMailBox();
	closeImapConnection();
}

let getUIDsOfUnreadMessages = async function() {
	return new Promise(async (good, bad) => {
		if(can_use_imap()) {
			if(is_mail_box_open()) {
				let UIDs = await searchInbox();
				//logx(UIDs);
				good(UIDs);
			} else {
				print_error('T H E R E   I S   N O   M A I L   B O X   O P E N');
				good(false);
			}
		} else {
			print_error('C A N N O T   R E A D   I N B O X');
			good(false);
		}
	});
}

let searchInbox = async function() {
	return new Promise((good, bad) => {
		if(can_use_imap()) {
			let date = new Date();
			date.setDate(date.getDate() - 1);	//	Getting emails from past 1 dates
			console.log(date);
			imap.search(['UNSEEN',/*['FROM', sails.config.custom.white_listed_emails[0]],*/['SINCE', date]/*,['SUBJECT', 'IGMFORMAT']*/], function (err, UIDs) {
				if(err) {
					print_error('E R R O R   I N   S E A R C H I N G   M A I L   B O X');
					closeMailBox();
					logx(err);
					bad(err);
					return;
				}
				
				good(UIDs);
			});
		}			   
	});
}

function EmailMessage(uid) {
	
	this.uid = uid;
	
	this.subject;
	this.user;
	this.date;
	this.messageId;
	
	let self = this;
	
	this.printEmailMessage = function() {
		console.log('**********************');
		console.log('*> uid = ' + this.uid);
		console.log('*> subject = ' + this.subject);
		console.log('*> user = ' + this.user);
		console.log('*> date = ' + this.date);
		console.log('**********************');
	}
	
	this.fetchMessageForUID = function() {
		
		return new Promise((good, bad) => {
			if(imap) {
				imap.fetch(this.uid, message_options)
					.on('message', (msg, seqno) => {this.readEmailMessage(msg)})
					.once('error', err => {logx(error);print_error('E R R O R   R E A D I N G   E M A I L   UID = ' + this.uid);good(false);})
					.once('end', () => {console.log('end reading for uid = ' + this.uid); good(true);});
			}
		})
	}

	this.readEmailMessage = function(msg) {
		if(imap) {
			msg.on('body', this.on_email_body_rx)
				.once('attributes', this.on_email_attrs_rx)
				.once('end', () => {console.log('msg reading for uid = ' + this.uid);})
		}
	}

	this.on_email_body_rx = function(stream, info) {
		let buffer = '';
		stream.on('data', function(chunk) {
			buffer += chunk.toString('utf8');
		});

		stream.once('end', function() {
			sails.config.log.addINlog('email-processing', 'strem.once-end');
		//	let data = (prefix + 'Parsed header1234: %s', inspect(Imap.parseHeader(buffer)));
		//	logx(data);
			//logx(prefix + 'Parsed header$$$$$$$$$$$: %s', inspect(Imap.parseHeader(buffer)));
			logx('--------------------------------------------------------------------------------- ' + info.which);
			
			switch(info.which) {
				case 'HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)': {
					var data1 = [];
					data1 = Imap.parseHeader(buffer);
					
					self.subject = String(data1.subject).trim();
					self.user = String(data1.from);
					self.date = String(data1.date);
					self.messageId = String(data1['message-id']);
					
					self.printEmailMessage();
				}
				break;
				case '1': {
					/*sails.config.custom.getdumppath('uploads/' + sails.config.custom.deployment_name + '/' + 'station', function(err, path) {
						let subject_parts = {};
						let testValidSubLine = /^(CCN<IGMFORMAT>)\s+([0-9]{2}).*(\[CONSOLIDATED])$/;
						
						if(self.subject.match(testValidSubLine)) {
							let regex_date = /(\d{1,2}([.\-/])\d{1,2}([.\-/])\d{1,4})/g;
							let regex_igm_no = /(\d{7})/g;
							let regex_flight_no = /(EY)(\d{3,4})/g;
							//let testDate = /([0-9]{2})+[-]+([A-Z]{3})/g
							
							//let subject = 'CCN<IGMFORMAT> 22/01/2020 / IGM NO:1785024 / for EY254 / 22-JAN  [CONSOLIDATED]';
							let date_from_subject = self.subject.match(regex_date);
							let formatted_date = date_from_subject ? date_from_subject[0].split('/') : [];
							subject_parts.igm_date = formatted_date ? new Date(formatted_date[2] + '-' + formatted_date[1] + '-' + formatted_date[0]) : undefined;
							subject_parts.igm_number = self.subject.match(regex_igm_no) ? self.subject.match(regex_igm_no)[0] : '';
							subject_parts.flight_number = self.subject.match(regex_flight_no) ? self.subject.match(regex_flight_no)[0] : '';
						}
						
						if((subject_parts.igm_date && subject_parts.flight_number)) {
							var quotedPrintable = require('quoted-printable');
							var utf8 = require('utf8');
							let email_body = utf8.decode(quotedPrintable.decode(buffer));
							let filename = MOBIGIC subject_parts.igm_date.getTime() + '_' + subject_parts.flight_number + '_' + Date.now() + (subject_parts.igm_number ? '_' + subject_parts.igm_number : '') +  ".txt";
							let file = sails.config.appPath + path + filename;
							
							fs.writeFileSync(file, email_body);
							saveFileForSubjectline(file, filename, subject_parts, self.uid);
							logx(self.uid + " The file was saved! @ subj = " + self.subject + ', seqno = ' + self.uid + ', path = ' + sails.config.appPath + path + Date.now() + ".txt");
						} else {
							sails.config.log.addOUTlog('email-processing', 'incorrect subject = ' + self.subject);
						}
					});*/
				}
			}
			
			console.table(data1);
		});
	}

	this.on_email_attrs_rx = async function(attrs) {
		sails.config.log.addINlog('email-processing', 'on_email_attrs_rx');
		//logx('attrs = ' + JSON.stringify((attrs)));

		if (!isUserValid(self.user)){
			logx('sender :' + self.user);
			logx('Invalid user *****internal check for msg attributes');
		}
		else{
			logx('sender :' + self.user);
			let attachments = self.findAttachmentParts(attrs.struct);
			logx(self.user + '########## Has attachments: ' + attachments.length);
			for (let i = 0, len = attachments.length ; i < len; i++) {
				let attachment = attachments[i];
				logx(self.uid + ' Fetching attachment ' + (attachment.params ? attachment.params.name : "!!! OMG !!!"));
				let emailAttachment = new EmailAttachment(self.uid, self.messageId, self.user, self.subject, self.date, attachment);
				await emailAttachment.fetchEmailAttachment();
			}
		}
	}
	
	this.findAttachmentParts = function(struct, attachments) {
		try {
		sails.config.log.addINlog('email-processing', 'findAttachment');
		attachments = attachments ||	[];
		for (let i = 0, len = struct.length, r; i < len; ++i) {
			if (Array.isArray(struct[i])) {
				self.findAttachmentParts(struct[i], attachments);
			} else {
				if (struct[i].disposition && ['INLINE', 'ATTACHMENT'].indexOf(toUpper(struct[i].disposition.type)) > -1) {
					attachments.push(struct[i]);
				}
			}
		}
		sails.config.log.addOUTlog('email-processing', 'findAttachment');
		return attachments;
		} catch (e) {console.log(e)}
	}
}

function EmailAttachment(uid, messageId, user, subject, date, attachment) {
	
	this.uid = uid;
	this.messageId = messageId;
	this.user = user;
	this.subject = subject;
	this.date = date;
	this.attachment = attachment;
	this.filename = attachment.params ? attachment.params.name : ("" + Date.now() + ".pdf");
	this.encoding = attachment.encoding;
	
	let self = this;
	
	this.fetchEmailAttachment = function() {
		imap.fetch(this.uid , { //do not use imap.seq.fetch here
			bodies: [this.attachment.partID],
			struct: true
		}).on('message', this.readEmailAttachment);
	}
	
	this.readEmailAttachment = function(msg) {
		if(imap) {
			msg.on('body', self.on_attachment_body_rx)
				//.once('attributes', this.on_email_attrs_rx)
				.once('end', () => {console.log('attachment reading for uid = ' + self.uid);})
		}
	}
	
	this.on_attachment_body_rx = async function(stream, info) {
		let validatedSubjectLine = self.validateSubject(self.subject);

		logx("validatedSubjectLine, " + validatedSubjectLine);

		console.log(self.subject, validatedSubjectLine)

		if(validatedSubjectLine == 'invalid'){
			console.log('invalid subject id.******error');//stop here bcz subject line is invalid
			let reason = 'Invalid Subjectline';
			let data = await Email.update({ msg_id: messageId}, {reason: reason}).fetch();
			if(data) {
				console.log('reason inserted as invalid subject line');
			}
			
		}
		else{
			let splitSubjectLine = validatedSubjectLine.split('_');
			let fileStation = splitSubjectLine[1];

			if (validatedSubjectLine == 'AWB'){
				validatedSubjectLine = validateSubject(filename);
				console.log('this is validated subject line for AWB .........  '+ validatedSubjectLine);
				if(validatedSubjectLine == 'invalid'){
					console.log('invalid attachment name');//stop here bcz subject line is invalid
					let reason = 'Invalid in Attachment name';
					let data = Emails.update({ msg_id: messageId}, {reason: reason}).fetch();
					if(data) {
						console.log('reason inserted as invalid attachment name ');
					}

				}
			}

/////////////////////////////////////open Database entry for email is happen here//////////////////////


/////////////////////////////////////open Database entry for email is happen here//////////////////////

///////////////////////////////////open from here the folder is created by date wise///////
			console.log('date format from mail------> '+ self.date);
			let d = new Date(self.date);
			
			let fileMonth = (1 + d.getMonth()).toString();
			fileMonth = fileMonth.length > 1 ? fileMonth : '0' + fileMonth;

			let fileDate = d.getDate().toString();
			fileDate = fileDate.length > 1 ? fileDate : '0' + fileDate;

			//console.log('check this date format'+ fileDate + '/' + fileMonth + '/' + fileYear);
		
			//let fileTimestamp = Math.round(Date.parse(date) / 1000);
			//console.log('---------------------------------'+fileTimestamp);

			let path = await sails.config.custom.getdumppath('email_attachments/' + fileStation);

			let timestamp = new Date().getTime();
			let newFileName = (validatedSubjectLine + '_'+ timestamp ) + (self.filename.lastIndexOf(".") === -1 ? "" : self.filename.substr(self.filename.lastIndexOf(".")));
			console.log('this is new file name'+ newFileName);

			let newFileFullPath = path + newFileName;

			let writeStream = fs.createWriteStream(newFileFullPath);
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
			switch(toUpper(self.encoding)) {
				case 'BASE64': 
					stream.pipe(new base64.Base64Decode()).pipe(writeStream);
					break;
				case 'QUOTED-PRINTABLE': 
					stream.pipe(new base64.QuotedPrintableDecode()).pipe(writeStream);
					break;
				default: 
					stream.pipe(writeStream);
					break;
			}
			///////////////////////////////////close from here the data from attachment is saved in default
			
			//close this block is move file to specifide location
			let singleAttachment = await Attachment.create({ station: fileStation, original_filename: self.filename, new_filepath: newFileFullPath.substr(1), received_from: self.user, email_subject: self.subject}).fetch().catch(err => console.log(err.message));
			if(singleAttachment) {
				console.log('data inserted successfuly in Attachment model');
			}

			switch(splitSubjectLine[0]) {
				case 'AWB': {
					//here if the subjectline contains 8 digit awb no. then creating entry to the AWB database
					let awbNo = splitSubjectLine[2];
					console.log ('_______------awb is = = = awbNo ==='+ awbNo);
					
					if (awbNo.length == 8){
						console.log ('_______------awblength is = = ='+ awbNo.length);
						awbNo = String('125' + awbNo);
					}

					let validationResponse = await sails.helpers.validateAwbNumber.with({
						awb_no: awbNo,
						send_email: true,
						station: fileStation
					})

					if(validationResponse.data == false) {
						break;
					}
					
					if(awbNo.length == 11){
						// if revised/ same awb is arrived then discard the legs from booklist record wich are dident fly wrt awbno if onHand is true and planned departure is > current time stamp and from == station
						console.log('planned_departure '+timestamp +'awb_no ' +awbNo+ ' from '+ fileStation);

						let awb_exists = await AWBLeg.find({where: {planned_departure: {'>': timestamp}, awb_no: awbNo, from: fileStation, status: 'Pending'}}).populate('awb_info').catch(err => console.log( err.message));
						
						console.log ('this awb is ======  = ' + JSON.stringify(awb_exists)+'-------check length=====--'+awb_exists.length);

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
							let check_active_legs = await AWBLeg.find({where: {status: sails.config.custom.database_model_enums.awb_leg_status.pending, pieces: {'>': 0}, awb_no: createAwb.awb_no, from: fileStation, void_on: 0, station: fileStation }}).populate('awb_info').populate('awb_leg_ops').catch(err => console.log( err.message));
							
							//console.log('check_active_leg'+JSON.stringify(check_active_leg));
							if (check_active_legs && check_active_legs.length>0){
								//check_active_leg = check_active_leg[0];
								for (let i=0;i<check_active_legs.length;i++){
									if ((check_active_legs[i].awb_info.on_hand == true) && (check_active_legs[i].awb_info.pieces > 0)  && (check_active_legs[i].awb_leg_ops.length == 0)){
										//console.log('check_active_legs[i]'+JSON.stringify(check_active_legs[i]));
										console.log('from email processing');
										let awbLegOpCutoff = await sails.helpers.getAwbLegOpCutoff.with({
											opName: 'ready_to_rate_check',
											planned_departure: check_active_legs[i].planned_departure
										})

										let create_leg_op = await sails.helpers.planner.updateAwbLegOp.with({
											station: check_active_legs[i].from,
											awb_no: check_active_legs[i].awb_no,
											awb_leg: check_active_legs[i].id,
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
							}
							console.log('====addAWBToBeActioned createAwb details'+JSON.stringify(createAwb));

							//	Ensuring that we send the AWB for actioning only if the pieces are 0
							if(createAwb.pieces === 0) {
								sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'addAWBToBeActioned', {awb_info: createAwb});
							}
							sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'onHandforToBePlanned', {awb_info: createAwb});
							sails.sockets.broadcast(sails.config.custom.socket.room_name.planner,'onHandforBooklistRecord', {awb_info_id: createAwb.id});
						}

						let awbFromDB = await AWB.findOne({awb_no: awbNo});
						await AWB.addToCollection([awbFromDB.id], "file_awb").members([singleAttachment.id]);
					}
				}
					break;
				case 'HAWB': {
						let awbNo=splitSubjectLine[2];
						if (awbNo.length == 8){
							console.log ('_______------awblength is = = ='+ awbNo.length);
							awbNo = String('125' + awbNo);
						}
						let awbFromDB = await AWB.findOne({awb_no: awbNo});
						await AWB.addToCollection([awbFromDB.id], "file_house").members([singleAttachment.id]);
				}
					break;
				case 'MAN': {
					let booklistFromDB = await BookList.findOne({flight_no: splitSubjectLine[2]});
						await BookList.addToCollection([booklistFromDB.id], "file_manifest").members([singleAttachment.id]);
				
				}
					break;
				default: {
					let booklistFromDB = await BookList.findOne({flight_no: splitSubjectLine[2]});
						await BookList.addToCollection([booklistFromDB.id], "file_prealert").members([singleAttachment.id]);
				
				}
					break;
				
			}
		}

		return;
	}
	
	this.validateSubject = function(subject) {
		logx('IN validateSubject');
		logx('validateSubject ' + 'subject = ' + subject);

		//AWB 41276760 BOM (Airwaybill Copy).
		let test1 = /^(AWB)+[ ]+([0-9]{8})+[ ]+([A-Z]{3})$|^(AWB)+[ ]+([0-9]{11})+[ ]+([A-Z]{3})$/i;
	
		//HSE 81720111 BOM
		let test2 = /^(HSE)+[ ]+([0-9]{8})+[ ]+([A-Z]{3})$/i;
	
		//BOMMSG BA198/26JUN MAN
		let test3 = /^([A-Z]{6})+[ ]+([A-Z]{2})+([0-9]{3,5})+[\/]+([0-9]{2})+([A-Z]{3})+[ ]+MAN$/i;
	
		//BOMMSG BA198/26JUN COU (Courier Pre-alert).
		let test4 = /^([A-Z]{6})+[ ]+([A-Z]{2})+([0-9]{3,5})+[\/]+([0-9]{2})+([A-Z]{3})+[ ]+([A-Z]{3})$/i;
	
		//BOMMSG BA138/26JUN VAL (Valuable Pre-alert).
		let test5 = /^([A-Z]{6})+[ ]+([A-Z]{2})+([0-9]{3,5})+[\/]+([0-9]{2})+([A-Z]{3})+[ ]+VAL$/i;
	
		//AWB 82518866 OR 12582518866 HYD REVISED ( Revised Airwaybill sent after amendments).
		let test6 = /^(AWB)+[ ]+([0-9]{8})+[ ]+([A-Z]{3})+[ ]+REVISED$|^(AWB)+[ ]+([0-9]{11})+[ ]+([A-Z]{3})+[ ]+REVISED$/i;
	
		//BLR MSG BA118 31MAY MAN REVISED ( Revised Manifest copy).
		let test7 = /^([A-Z]{3})+[ ]+([A-Z]{3})+[ ]+([A-Z]{2})+([0-9]{3,5})+[ ]+([0-9]{2})+([A-Z]{3})+[ ]+(MAN REVISED)$/i;
	
		//AWB (attachments for multiple airwaybill copies)
		let test8 = /^(AWB)$/i;
	
		let subjectLine;
		
		//let test1 = /^([]{3})+([0-9]{8})+([A-Z]{3})$/i;
		if(test1.test(subject)){
			logx('validateSubject -' + 'Airwaybill Copy');
			//input AWB 41276760 BOM
			//awbnumber_stationcode_AWB this should be returned
			subject = subject.split(' ');
			let awb = subject[1];
			let station = subject[2];
			subjectLine = ('AWB' + '_' + station + '_' + awb);
		} 
		else if(test2.test(subject)){
			logx('validateSubject -' + 'House Copy');
			//input HSE 81720111 BOM
			//should return awbnumber_stationcode_HAWB
			subject = subject.split(' ');
			let awb = subject[1];
			let station = subject[2];
			subjectLine = ('HAWB' + '_' + station + '_' + awb);
		}
		else if(test3.test(subject)){
			logx('validateSubject -' + 'Manifest Copy');
			//input BOMMSG BA198/26JUN MAN 
			//should return date_flight no_station_MAN
			subject = subject.split(' ');
			let retriveDate = subject[1].split('/');
			let date = retriveDate[1];
			let flightNumber = retriveDate[0];
			let retriveStation = subject[0].split('MSG');
			let station = retriveStation[0];
			subjectLine = ('MAN' + '_' + station + '_'+flightNumber + '_' + date); 
		}
		else if(test4.test(subject)){
			logx('validateSubject -' + 'Courier Pre-Alert Copy');
			//input BOMMSG BA198/26JUN COU
			//should return date_flight no_station_COU
			subject = subject.split(' ');
			let retriveDate = subject[1].split('/');
			let date = retriveDate[1];
			let flightNumber = retriveDate[0];
			let retriveStation = subject[0].split('MSG');
			let station = retriveStation[0];
			subjectLine = (subject[2] + '_'+station+'_'+flightNumber + '_' + date); 
		}
		else if(test5.test(subject)){
			logx('validateSubject -' + 'Valuable Pre-Alert Copy');
			//input BOMMSG BA138/26JUN VAL
			//should return date_flight no_station_VAL
			subject = subject.split(' ');
			let retriveDate = subject[1].split('/');
			let date = retriveDate[1];
			let flightNumber = retriveDate[0];
			let retriveStation = subject[0].split('MSG');
			let station = retriveStation[0];
			subjectLine = ('VAL' + '_'+station+'_'+flightNumber + '_' + date); 
		}
		else if(test6.test(subject)){
			logx('validateSubject -' + 'Revised Airwaybill Copy');
			//input AWB 12582518866 HYD REVISED
			//should return awbnumber_stationcode_AWB
			subject = subject.split(' ');
			let awb = subject[1];
			let station = subject[2];
			subjectLine = ('AWB' + '_' + station + '_' + awb);
		}
		else if(test7.test(subject)){
			logx('validateSubject -' + 'Revised Manifest Copy');
			//input BLR MSG BA118 31MAY MAN REVISED
			//should return date_flight no_station_MAN
			subject = subject.split(' ');
			//let retriveDate = subject[3].split('/');
			let date = subject[3];
			let flightNumber = subject[2];
			let station = subject[0];
			subjectLine = ('MAN' + '_'+station+'_'+flightNumber + '_' + date); 
		}
		else if(test8.test(subject)){
			logx('validateSubject -' + 'Multiple Airwaybill Copy');
			subjectLine = ('AWB');
		}
		else{
			logx('validateSubject -' + 'Invalid Email Subject');
			subjectLine = ('invalid');
			console.log(subjectLine);
		}
	
		logx('OUT validateSubject');
		return subjectLine;
	}
}

async function saveFileForSubjectline(file, filename, subject_parts, prefix) {
	sails.config.log.addINlog('email-processing', 'saveFileForSubjectline');
	
	let igm_date = subject_parts.igm_date;
	let igm_number = subject_parts.igm_number;
	let flight_number = subject_parts.flight_number;

	//logx(splits[8]);

	let city_from_igm = await sails.helpers.cityFromIgm.with({
		igm_filepath: file,
		username: 'file-integrity-check-by-email-reader', 
	});

	let station;

	if(city_from_igm && city_from_igm.city_from_igm) {
		station = city_from_igm.city_from_igm;
	} else {

	}

	sails.config.custom.getdumppath('uploads/' + sails.config.custom.deployment_name + '/' + station, async function(err, path) {
		logx(prefix + ' subject = ' + JSON.stringify(subject_parts) + ', filename = ' + filename + ', station  = ' + station);
        /*MOBIGIC   fs.rename(file, sails.config.appPath + path + filename, async function(err){
			logx(prefix + err);

			let validate_igm_response = await sails.helpers.validateIgm.with({
				igm_filepath: sails.config.appPath + path + filename, 
				username: 'file-integrity-check', 
				igmCity: station, 
				igmNumber: 0, 
				igmDate: igm_date ? igm_date.getTime() : igm_date, 
				inwardDate: igm_date ? igm_date.getTime() : igm_date, 
				flightNumber: flight_number
			});

			let igm_pending = await IgmPending.create({
				igm_number: igm_number,
				//igm_date:
				flight_number: flight_number,
				flight_date: igm_date ? igm_date.getTime() : igm_date, 
				//inward_date:
				uploaded_by: 'email',
				filepath: path + filename,
				igm_city: station,
				status: validate_igm_response.err ? 'corrupt file' : 'available'
			});
		});*/
	});
	
	sails.config.log.addOUTlog('email-processing', 'saveFileForSubjectline');
}

//	E V E N T S    H A N D L I N G
let on_imap_close = function () {console.log('[now its close]'); print_imap_state();}
let on_imap_ready = function () {
	console.log('[now its ready]'); print_imap_state();
	//setTimeout(() => {imap.end()} , 5000);
	//	Since we are now ready, connected and authenticated, we should connect to the inbox
	if(can_use_imap()) {
		performReadMessages();
	} else {
		print_error('I M A P   N O T   R E A D Y');
	}
}

let on_imap_error = function (err) {console.log('[now its error]'); logx(err); print_imap_state();}

let on_imap_mail = function (messageCount) {console.log('[now its mail with new message = ' + messageCount + ']'); print_imap_state();}

let on_imap_end = function () {console.log('[now its end]'); print_imap_state(); imap = undefined;}

/*let on_mail_box_open = function(err, box) {
	sails.config.log.addINlog('email-processing', 'openBox-INBOX');
	if (err) {
		print_error('E R R O R   I N   O P E N I N G   O F   I N B O X');
		logx(err);
		closeImapConnection();
		throw err;
	}
	logx('I N B O X   I S   O P E N   N O W');
	print_imap_state();
	
	current_mail_box = box;

	sails.config.log.addOUTlog('email-processing', 'openBox-INBOX');
}*/

/*let on_mail_box_closed = function(err) {
	if(err) {
		print_error();
	} else {
		current_mail_box = undefined;
		logx('M A I L   B O X   C O N N E C T I O N   C L O S E D');
	}
}*/

//	H E L P E R S
let can_use_imap = function() {
	return (imap && imap.state == 'authenticated');
}

let is_mail_box_open = function() {
	return current_mail_box != undefined;
}

let print_imap_state = function() {
	if(imap) {
		console.log('imap.state = ' + imap.state);
	} else {
		console.log('I M A P   I S   N U L L   O R   U N D E F I N E D');
	}
}

let logx = function(msg) {
	sails.config.log.addlog(3, 'System', 'email-processing logx' /*+ new Date()*/, msg);
}

let print_error = function(error_text) {
	logx('READ EMAIL ERROR - ' + error_text);
	print_imap_state();
}

function toUpper(thing) { return thing && thing.toUpperCase ? thing.toUpperCase() : thing;}

function isUserValid(user){
	try {
	sails.config.log.addINlog('email-processing', 'isUserValid');
	sails.config.log.addOUTlog('email-processing', 'isUserValid');

	let isValid = false;
	if(user) {
		let emailList = user.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
		if(emailList.length == 1) {
			for(let i = 0; i < sails.config.custom.white_listed_emails.length; i++) {
				isValid = (emailList[0].toLowerCase().indexOf(sails.config.custom.white_listed_emails[i].toLowerCase()) != -1);
				if(isValid)
					break;
			}
		}
	}
		
	return isValid;
	} catch (e) {console.log(e)}
}

process.on('uncaughtException', function (error) {
	logx('- x - x - x - x - x - x - uncaughtException - x - x - x - x - x - x -');
	logx(error);
	logx(JSON.stringify(error));
	//logx(imap.state)
});

module.exports = {

	friendlyName: 'Read Emails',

	description: 'Validate each received email and handle attachments',

	inputs: {},

	exits: {
		success: {
			outputDescription: "Email's are valid .",
		}
	},
	//function check's for each email id if we found invalid email then we return json with index of invalid email and status true if success and false on failure.
	fn: async function (inputs, exits) {
		
		if(sails.config.environment == 'development') {
			//  MOBIGIC return exits.success();
		}

		let response = await sails.helpers.azure.getAuthTokens.with({for: sails.config.custom.email_credentials_for.read_email.name});
		if(response.errormsg) {
			sails.config.log.addlog(0, 'READ_EMAIL', 'HELPER', response.errormsg, "", "READ_EMAIL", "");
			return exits.success();
		}

		let access_token = await Settings.findOne({key: sails.config.custom.email_credentials_for.read_email.access_token_name});
		if(!access_token || !access_token.value) {
			sails.config.log.addlog(0, 'READ_EMAIL', 'HELPER', "The token does not exists for reading email", "", "READ_EMAIL", "");
			return exits.success();
		}

		let email = sails.config.custom.email_credentials_for.read_email.email_id;
        let xoauth2 = Buffer.from(`user=${email}${Buffer.from('01', 'hex').toString('ascii')}auth=Bearer ${access_token.value}${Buffer.from('0101', 'hex').toString('ascii')}`).toString('base64');

		print_imap_state();
		if(can_use_imap()) {
			//	Its a re-entry for imap, and since it is already created, we will not re-init.
			
			//	Since we have imap already available.
			//	Check if mail box is open for read, if it is open then read messages. If not, then we can open it first and read msgs
			if(is_mail_box_open()) {
				//await closeMailBox();	//	temporary checks while developing - To be deleted
				//await closeImapConnection();	//	temporary checks while developing - To be deleted
			} else {
				//openMailBox();
				//performReadMessages();
			}

			performReadMessages();
			
			exits.success();
			return;
		}
		try {
			initImap(xoauth2);
			//registerImapListeners();	//	This is now done directly once we have the imap being created. registering multiple times leads to callback being called as many times.
			openImapConnection();
			//closeImapConnection();
		} catch (e) {console.log(e);}
		
		exits.success();
	}
};


//	initImap
//	openImapConnection
//	registerImapListeners
//	openMailBox
//	searchInbox
//	fetchMessageForUID
//	readEmailMessage
//	closeImapConnection



//try{} catch (e) {console.log(e)} finally {console.log('-------- finally 1')}
