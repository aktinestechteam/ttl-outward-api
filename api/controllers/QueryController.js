/**
 * QueryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

	getQueryAndClaimsRecords: async function (req, res) {
		sails.config.log.addINlog(req.user.username, "getQueryAndClaimsRecords");
		let queryAndClaimsRecords = {};

		let awbQuery = await AWBQuery.find({where:{ closed_on: 0}}).catch(err => console.log( err.message));
		//console.log('called from planner for leg');

		if (awbQuery.length > 0){
			for (let i = 0; i < awbQuery.length; i++){
				let awbInfo = await AWBInfo.findOne({where:{awb_no: awbQuery[i].awb_no}}).catch(err => console.log( err.message));
				awbQuery[i].awb_info = awbInfo;
			}
		}

		queryAndClaimsRecords.awbQueryRecords = awbQuery;
		// let awbClaim = [];
		let awbClaim = await AWBClaim.find().where({void_on: 0, status: {'!=' : sails.config.custom.awb_claim_status.barred}, status: {'!=' : sails.config.custom.awb_claim_status.closed}}).catch(err => console.log( err.message));
		
		if (awbClaim.length > 0){
			for (let i = 0; i < awbClaim.length; i++){
				let awbInfo = await AWBInfo.findOne({where:{awb_no: awbClaim[i].awb_no}}).catch(err => console.log( err.message));
				awbClaim[i].awb_info = awbInfo;
			}
		}

		queryAndClaimsRecords.awbClaimRecords = awbClaim;
		sails.config.log.addOUTlog(req.user.username, "getQueryAndClaimsRecords");
		res.json(sails.config.custom.jsonResponse(null, queryAndClaimsRecords));
	},
	

	joinQueryAndClaimsRoom: function(req, res) {
		sails.config.log.addINlog(req, "joinQueryAndClaimsRoom");
		sails.sockets.join(req, req.body.roomname, function(err) {
			if (err) {
				sails.config.log.addlog(1, req, "joinQueryAndClaimsRoom",err)
				return res.serverError(err);
			}
			console.log('in joinQueryAndClaimsRoom and will send json');
			sails.config.log.addOUTlog(req, "joinQueryAndClaimsRoom");
			return res.json({
				message: 'Subscribed to a room called '+req.body.roomname+'!'
			});
		});
		
	},

	getAWBQueryCount: async function(req, res) {
		let total_query_count = await AWBQuery.count({where:{ 'awb_no' : req.params.awb_no}}).catch(err => console.log( err.message));
		let open_query_count = await AWBQuery.count({where:{ 'awb_no' : req.params.awb_no, closed_on: 0}}).catch(err => console.log( err.message));
		res.json(sails.config.custom.jsonResponse(null, {total_query_count, open_query_count}));
	},

	getAWBQueries: async function(req, res){
		sails.config.log.addINlog(req.user.username, "getAWBQueries");
		console.log('call for getAWBQueries======='+ JSON.stringify(req.query));
		let queries = await AWBQuery.find({where:{ 'awb_no' : req.query.awb_no}}).populate('comments').catch(err => console.log( err.message));

		console.log('call for queries======='+ JSON.stringify(queries));
		res.json(sails.config.custom.jsonResponse(null, queries));
		sails.config.log.addOUTlog(req.user.username, "getAWBQueries");
	},

	createAWBQuery: async function (req, res){
		sails.config.log.addINlog(req.user.username, "createAWBQuery");
		console.log('call for createAWBQuery======='+ JSON.stringify(req.body));
		let create_awb_query = await AWBQuery.create({
			query_no: ('BAQ/'+req.body.awb_no+'/'+ new Date().getTime()),
			awb_no: req.body.awb_no,	
			station: req.body.station,
			raised_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
			query_text: req.body.query_text,
		}).fetch().catch(err => 
			sails.config.log.addlog(1, req, "createAWBQuery",err)
			);
		console.log('call for create_awb_query======='+ JSON.stringify(create_awb_query));
		sails.sockets.broadcast(sails.config.custom.socket.room_name.queryAndClaims, 'addAWBQuery', { awb_query: create_awb_query })
		res.json(sails.config.custom.jsonResponse(null, create_awb_query));
		sails.config.log.addOUTlog(req.user.username, "createAWBQuery");
	},

	createAWBQueryComment: async function (req, res) {
		sails.config.log.addINlog(req.user.username, "createAWBQueryComment");
		console.log('call for createAWBQueryComment======='+ JSON.stringify(req.body));
		let create_awb_query_comment = await AWBQueryComment.create({
			awb_query: req.body.awb_query,
			awb_no: req.body.awb_no,
			station: req.body.station,
			comment_text: req.body.comment_text,
			comment_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
		}).fetch().catch(err =>
			sails.config.log.addlog(1, req, "createAWBQueryComment",err)
		);
		console.log('call for create_awb_query_comment======='+ JSON.stringify(create_awb_query_comment));

		if(JSON.parse(req.body.close)) {
			await AWBQuery.update({id: req.body.awb_query}).set({
				closed_on: Date.now(),
				closed_by: req.user.username, //'XXXXXXXXTODOXXXXXXXX',
			});
		}
		
		res.json(sails.config.custom.jsonResponse(null, create_awb_query_comment));
		sails.config.log.addOUTlog(req.user.username, "createAWBQueryComment");
	}
};

////////////////////////////////////////////////////////////////////