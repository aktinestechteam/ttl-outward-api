/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
    //  ╦ ╦╔═╗╔╗ ╔═╗╔═╗╔═╗╔═╗╔═╗
    //  ║║║║╣ ╠╩╗╠═╝╠═╣║ ╦║╣ ╚═╗
    //  ╚╩╝╚═╝╚═╝╩  ╩ ╩╚═╝╚═╝╚═╝

    /***************************************************************************
     *                                                                          *
     * Make the view located at `views/homepage.ejs` your home page.            *
     *                                                                          *
     * (Alternatively, remove this and add an `index.html` file in your         *
     * `assets` directory)                                                      *
     *                                                                          *
     ***************************************************************************/
    "GET /csrfToken": {
        action: "security/grant-csrf-token"
    },
    'POST /getDetailedOutputReportAData': 'ChartController.getDetailedOutputReportAData',
    'POST /getDetailedOutputReportBData': 'ChartController.getDetailedOutputReportBData',
    'POST /getLifeCycleOfFlightData': 'ChartController.getLifeCycleOfFlightData',
    'POST /getQueueManagementAnalysisData': 'ChartController.getQueueManagementAnalysisData',
    'POST /getRecoveryProcessPerformanceData': 'ChartController.getRecoveryProcessPerformanceData',
    'POST /getAllOpsperformance': 'ChartController.getAllOpsperformance',
    'POST /getEAWBData': 'ChartController.getEAWBData',
    'POST /getOutOfRecoveryData': 'ChartController.getOutOfRecoveryData',
    'POST /getClaimsData': 'ChartController.getClaimsData',
    'POST /getRecoveryChartData': 'ChartController.getRecoveryChartData',
    'POST /getCentralOpsRateCheckData': 'ChartController.getCentralOpsRateCheckData',
    'POST /getCentralOpsPerformanceData': 'ChartController.getCentralOpsPerformanceData',
    'POST /getCentralOpsPerformanceMetNotMetData': 'ChartController.getCentralOpsPerformanceMetNotMetData',
    'POST /getCentralFinCCAData': 'ChartController.getCentralFinCCAData',
    'POST /getCentralFinTopData': 'ChartController.getCentralFinTopData',
    
    'GET /getPrealertDocs' : 'legops/DepartedController.getPrealertDocs',

    'POST /sanitize': 'SanitizerController.sanitizeAWB',
    'GET /getAWBKundali': 'AWBController.getAWBKundali',//axios call
	'GET /getStations': 'AWBController.getStations',//Not used from UI
	'GET /getAWBQueries': 'QueryController.getAWBQueries',//axios call
    'GET /getAWBQueryCount/:awb_no': 'QueryController.getAWBQueryCount',
	'POST /createAWBQuery': 'QueryController.createAWBQuery',//axios call
	'POST /createAWBQueryComment': 'QueryController.createAWBQueryComment',//axios call
	'POST /responseAWBQuery': 'QueryController.responseAWBQuery',//not used from UI
    
    // Post data of Room and Retrieve data of Station_Departement_Task wise 
    'POST /subscribeToFunRoom' : 'RoomController.subscribeToFunRoom',//socket
    'GET /getsdtlegops' : 'RoomController.getsdtlegops',//socket
    
	'GET /getQueryAndClaimsRecords': "QueryController.getQueryAndClaimsRecords",//socket

    'POST /uploadBooklistFile': 'BooklistController.uploadBooklistFile',//axios call
    'POST /uploadEGMFile': 'PlannerController.uploadEGMFile',//axios call
    'POST /manuallyDepart': 'PlannerController.manuallyDepart',//axios call
    'POST /uploadFlightsFile': 'FlightsController.uploadFlightsFile',//axios call
    'POST /createAwbWithInfoManually': 'AWBController.createAwbWithInfoManually',//socket
    'POST /updateAwbInfo': 'PlannerController.updateAwbInfo',//socket
    'POST /addAwbLeg': 'PlannerController.addAwbLeg',//axios call
    'POST /updateAwbWithOnHand': 'AWBController.updateAwbWithOnHand',//used for taking on hand

    //'GET /demo' : {view: 'DemoPages/demo'},
    'GET /demo1': { view: 'DemoPages/demo1' }, //not used from UI
    'GET /getFlightDetails': 'BooklistController.getFlightDetails',//axios call
    'GET /getAwbDetails': 'AWBController.getAwbDetails',//socket
    'GET /getAWBToBePlanned': 'PlannerController.getAWBToBePlanned',// not used in UI
    'GET /getAWBToBeActioned': 'PlannerController.getAWBToBeActioned',// not used in UI
    'GET /getBooklistRecords': 'PlannerController.getBooklistRecords',// socket
    'POST /discardBooklistRecord': 'PlannerController.discardBooklistRecord',//axios call
    'GET /getExistingRecords': 'PlannerController.getExistingRecords',//socket
	'GET /getPlannerRecords': 'PlannerController.getPlannerRecords',//socket
    // 'GET /getAirportOpsDeptLegOps' : 'legops/RCController.getAirportOpsDeptLegOps',

    'GET /getLegOps': 'OperationController.getLegOps',//socket
    'GET /getLegOp': 'OperationController.getLegOp',//socket

    // 'GET /getReadyToRateCheckLegOps' : 'legops/RCController.getReadyToRateCheckLegOps',
    // 'GET /getReadyToFDCLegOps' : 'legops/FDCController.getReadyToFDCLegOps',
    // 'GET /getReadyToDepartureLegOps' : 'legops/DepartedController.getReadyToDepartureLegOps',
    // 'GET /getRateCheckPendingLegOps' : 'legops/RCController.getRateCheckPendingLegOps',
    // 'GET /getRateCheckHoldLegOps' : 'legops/RCController.getRateCheckHoldLegOps',
    // 'GET /getRateCheckReferredLegOps' : 'legops/RCController.getRateCheckReferredLegOps',
    // 'GET /getFDCPendingLegOps' : 'legops/FDCController.getFDCPendingLegOps',
    // 'GET /getPreAlertPendingLegOps' : 'legops/DepartedController.getPreAlertPendingLegOps',
    // 'GET /getEUICSPendingLegOps' : 'legops/DepartedController.getEUICSPendingLegOps',
    // 'GET /getCAPAPendingLegOps' : 'legops/DepartedController.getCAPAPendingLegOps',
    // 'GET /getEAwbCheckPendingLegOps' : 'legops/DepartedController.getEAwbCheckPendingLegOps',
    // 'GET /getCCARequestLegOps' : 'legops/DepartedController.getCCARequestLegOps',
    // 'GET /getCCAPendingLegOps' : 'legops/DepartedController.getCCAPendingLegOps',
    // 'GET /getEUICSDiscrepancyPendingLegOps' : 'legops/DepartedController.getEUICSDiscrepancyPendingLegOps',
    // 'GET /getCAPADiscrepancyPendingLegOps' : 'legops/DepartedController.getCAPADiscrepancyPendingLegOps',
    // 'GET /getCentralOpsDeptLegOps' : 'legops/RCController.getCentralOpsDeptLegOps',


    //All are socket calls
    'POST /rateCheckPending': 'legops/RCController.rateCheckPending',
    'POST /rateCheckHold': 'legops/RCController.rateCheckHold',
    'POST /rateCheckReferred': 'legops/RCController.rateCheckReferred',
    'POST /readyToRateCheck': 'legops/RCController.readyToRateCheck',
	'POST /readyToFDC': 'legops/FDCController.readyToFDC',
	'POST /rmsReview': 'legops/RCController.rmsReview',
	'POST /rmsHubReview': 'legops/RCController.rmsHubReview',
    'POST /fdcPending': 'legops/FDCController.fdcPending',
    'POST /readyToDeparture': 'legops/DepartedController.readyToDeparture',

    'POST /preAlertPending': 'legops/DepartedController.preAlertPending',
    'POST /euicsPending': 'legops/DepartedController.euicsPending',
    'POST /capAPending': 'legops/DepartedController.capAPending',
    'POST /eAwbCheckPending': 'legops/DepartedController.eAwbCheckPending',
    'POST /euicsDiscrepancyPending': 'legops/DepartedController.euicsDiscrepancyPending',
	'POST /capADiscrepancyPending': 'legops/DepartedController.capADiscrepancyPending',
	'POST /readyToRecovery':'legops/DepartedController.readyToRecovery',
	'POST /p2Escalation':'legops/DepartedController.p2Escalation',
	'POST /p1Escalation':'legops/DepartedController.p1Escalation',
	'POST /escalation':'legops/DepartedController.escalation',
    'POST /ccaRequest': 'legops/DepartedController.ccaRequest',
	'POST /ccaPending': 'legops/DepartedController.ccaPending',
	'GET /getExistingCCARequest': 'legops/DepartedController/getExistingCCARequest',
	'GET /getExistingCCAApprovalRequest': 'legops/DepartedController/getExistingCCAApprovalRequest',
    'GET /getCCAForAWB/:awb_no': 'legops/DepartedController/getCCAForAWB',//axios call

    'GET /getAwbsforRecoveryDashboard': "DashboardController.getAwbsforRecoveryDashboard",

	'POST /rcfPending': 'legops/DepartedController.rcfPending',//socket as well

    //all three not used in UI
	'POST /ccaaprroval/:id/approve': 'legops/DepartedController.ccaApproved',
	'POST /ccaaprroval/:id/reject': 'legops/DepartedController.ccaRejected',
	'GET /approveccaform/:id': 'legops/DepartedController.approveccaform',
    'GET /viewccaform/:id': 'legops/DepartedController.viewCCAForm',

    "GET /": "IndexController.index",
    "GET /imlost": { view: "pages/imlost" },

    "GET /index": "IndexController.index",
    "POST /saveconsigneegstin": "admin/ConsigneesController.saveconsigneegstin",


    // routes for inward-cargo...............


    //'GET /constants': 'admin/ConstantsController.userconstant',
    "GET /constants": "admin/ConstantsController.getconstantlist",
    "POST /constants": "admin/ConstantsController.constants",
    "GET /consignees": "admin/ConsigneesController.getconsigneeslist",
    "POST /consignees": "admin/ConsigneesController.consignees",
    "GET /exchangerates": "admin/ExchangeRatesListController.getexchangerateslist",
    "POST /exchangerates": "BudgetAnalyzerController.exchangerateslist",
    // 'POST /exchangerates': 'admin/ExchangeRatesListController.exchangerateslist',
    "POST /deleteexchangerates": "admin/ExchangeRatesListController.deleteexchangerates",
   
    "GET /reasons": "ReasonsController.getReasonsList",//not used in UI
    'POST /raiseCCA': 'RaiseCCAController.raiseCCA',
    'POST /discardCCA': 'RaiseCCAController.discardCCA',
	"POST /addReason": "ReasonsController.addReason",//axios call
	"GET /fetchReasons": "ReasonsController.fetchReasons",//axios call
    "POST /deleteReason": "ReasonsController.deleteReason",//axios call
    "GET /airportlist": "admin/AirportListController.getairportlist",
    "POST /airportlist": "admin/AirportListController.airportlist",
    "POST /deleteairport": "admin/AirportListController.deleteairport",
    "GET /addairports": "admin/AirportListController.addairports",
    "GET /shccodes": "ShcCodesController.getShcCodes",
    "POST /addShcCode": "ShcCodesController.addShcCode",//axios call
    "GET /planner": "PlannerController.getPlanner",
    "GET /Operations": "OperationController.getOperation",
    'POST /delayFlight': 'OperationController.delayFlight',
    'GET /fetchShcCodes': 'ShcCodesController.fetchShcCodes',//axios call
    "POST /deleteShcCodes": "ShcCodesController.deleteShcCodes",//axios call
    // "GET /gst1codes": "admin/SHCController.getgstcodes",
    // "POST /gst1codes": "admin/SHCController.gstcodes",
    // "POST /delete1gstcodes": "admin/SHCController.deletegstcodes",

    'GET /fetchFlights': 'FlightsController.fetchFlights',//axios call
    'GET /flights': 'FlightsController.getFlights',
    'POST /addFlight': 'FlightsController.addFlight',//axios call
    'GET /createFlightSeasons': 'FlightsController.createFlightSeasons',//axios call
    'GET /seasonsFlights': 'FlightsController.seasonsFlights',//axios call

    "GET /getvendorlist": "VendorController.getvendorlist",
    "POST /createvendor": "VendorController.createvendor",
    "POST /deletevendor": "VendorController.deletevendor",

    "POST /exchangerates": "BudgetAnalyzerController.exchangerateslist",
    "POST /createbudget": "BudgetAnalyzerController.createbudget",
    "GET /getbudgetlist": "BudgetAnalyzerController.getbudgetlist",
    "POST /deletebudgetlist": "BudgetAnalyzerController.deletebudgetlist",

    "GET /getexpenselist": "ExpenseLoggerController.getexpenselist",
    "POST /createexpenselog": "ExpenseLoggerController.createexpenselog",
    "POST /deleteexpense": "ExpenseLoggerController.deleteexpense",
    "GET /add": "ExpenseLoggerController.add",

    "GET /getsectorlist": "SectorController.getsectorlist",
    "POST /createsector": "SectorController.createsector",
    "POST /deletesector": "SectorController.deletesector",

    //	FOR STATION CONTROLLER

    //'GET /stations':	'StationController.getStations',
    "POST /addStation": "StationController.addStation",//axios call
    "POST /deleteStation": "StationController.deleteStation",//axios call
    'GET /fetchStations': 'StationController.fetchStations',//axios call
    'GET /stations': 'StationController.stationlist',

    //  FOR CLAIMS
    'POST /saveClaim': 'ClaimController.saveClaim',//axios call
    'GET /getClaim/:awb_no': 'ClaimController.getClaim',//axios call
    'GET /getClaimForPrint': 'ClaimController.getClaimForPrint',

    //  FOR AGENTS
    'POST /uploadAgentList': 'AgentController.uploadAgentList',
    'GET /fetchAgents': 'AgentController.fetchAgents',

    // routes for theme
    //'/blank-page': {view: 'pages/blank-page'},
    //'/planner':{view: 'pages/planner'},
    //'/shccodes' : {view: 'pages/shccodes'},
    '/dashboard': { view: 'pages/index' },
    '/index2': { view: 'pages/index2' },
    '/demo': { view: 'DemoPages/demo' },
    '/demo2': async function(req, res) {
        let awbinfos = await AWBInfo.find({on_hand: false});
        res.view('DemoPages/demo2', {awbinfos});
    },
    '/getBooklistFiles':async function(req, res) {
        let files = await  Files.find().catch((err) => console.log(err));

        res.view('DemoPages/files', {files});
    },
    '/history/:awbNo': async function(req, res) {
        let awbInfo = await AWBInfo.find({awb_no: req.params.awbNo})
        awbInfo.map((info)=>{info.dataType = "AWB INFO"})
        let legs = await AWBLeg.find({awb_no: req.params.awbNo})
        legs.map((leg)=>{
            leg.dataType = "AWB Leg";
            awbInfo.push(leg)
        });
        let ops = await AWBLegOp.find({awb_no: req.params.awbNo})
        ops.map((op)=>{
            op.dataType = "AWB Leg OP"
            awbInfo.push(op)
        });

        awbInfo.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1)
        res.view('DemoPages/history', {awbInfo});
    },
    '/demo3': { view: 'DemoPages/demo3' },
    '/demo4': { view: 'DemoPages/demo4' },
    '/demo5': { view: 'DemoPages/demo5' },
    '/demoquery': { view: 'DemoPages/demoquery' },
    '/operation': { view: 'pages/operation' },
    '/ccaRequestForm': { view: 'DemoPages/ccaRequestForm' },

    //'/settings' : {view: 'pages/settings'},
    'GET /settings': 'SettingController.getSettings',
    'POST /createOrUpdateBA_Address': 'SettingController.createOrUpdateBA_Address',
    'POST /createOrUpdate': 'SettingController.createOrUpdate',

    'GET /getAllOpsDurations': 'SettingController.getAllOpsDurations',//axios call
    'POST /saveOpsDurations': 'SettingController.saveOpsDurations',//axios call

    'POST /createOrUpdateForCcaReportAuthority': 'SettingController.createOrUpdateForCcaReportAuthority',

    'POST /lockAwbLegOp':           'legops/LockUnlockLegOp.lockAwbLegOp',//axios call
    'POST /unlockAwbLegOp':         'legops/LockUnlockLegOp.unlockAwbLegOp',//axios call
    'POST /forceUnlockAwbLegOp':    'legops/LockUnlockLegOp.forceUnlockAwbLegOp',
    'GET /getLockedAwbOps':        'legops/LockUnlockLegOp.getLockedAwbOps',

    //'/': {view: 'pages/index'},
    //'/authentication-login': {view: 'pages/authentication-login'},
    '/authentication-register': { view: 'pages/authentication-register' },

    "GET /register": "admin/UserController.registeruser",
    "POST /register": "admin/UserController.adduser",
    "POST /deleteuser": "admin/UserController.deleteuser",
    "POST /changepassword": "admin/UserController.changepassword",

    "GET /awb": { view: "pages/awb" },

    //'/blank': {view: 'pages/blank'}
    "/error-403": {
        view: "pages/error-403"
    },
    "/error-404": {
        view: "pages/error-404"
    },
    "/error-405": {
        view: "pages/error-405"
    },
    "/error-500": {
        view: "pages/error-500"
    },
    '/charts': { view: 'pages/charts' },
    '/form-basic': { view: 'pages/form-basic' },
    '/form-wizard': { view: 'pages/form-wizard' },
    '/grid': { view: 'pages/grid' },
    '/icon-fontawesome': { view: 'pages/icon-fontawesome' },
    '/icon-material': { view: 'pages/icon-material' },
    '/pages-buttons': { view: 'pages/pages-buttons' },
    '/pages-invoice': { view: 'pages/pages-invoice' },
    '/pages-elements': { view: 'pages/pages-elements' },
    '/pages-calendar': { view: 'pages/pages-calendar' },
    '/pages-chat': { view: 'pages/pages-chat' },
    '/pages-gallery': { view: 'pages/pages-gallery' },
    "GET  /login": "AuthController.getlogin",
    "POST /login": "AuthController.login",//axios call
    // 'GET  /loginldap': 'AuthController.getloginldap',
    'POST /loginldap': 'AuthController.loginldap',
    'POST /jwtlogin': "TempController.jwtlogin",//axios call
    'POST /addtempuser': "TempController.addtempuser",
    'POST /jwttestapi': 'TempController.jwttestapi',
    "/logout": "AuthController.logout",
    'GET /resetTokens': 'TempController.resetTokens',

    '/tables': { view: 'pages/tables' },
    '/widgets': { view: 'pages/widgets' },

    "/awb-planner": function(req, res) {
        res.view('pages/awb-planner');
    },

    "GET /claims": {view: 'pages/claims'},

    "GET /sanitize/:awb_no/:station": "SupportController.sanitize",
    "GET /createRateCheck/:awb_no": "SupportController.createRateCheck",
    "GET /commands/:awb_no": "SupportController.commands",
    "GET /changeAWBStation/:awb_no/:station": "SupportController.changeAWBStation",
    "GET /changeAWBSrc/:awb_no/:station": "SupportController.changeAWBSrc",
    "GET /forceAWBToRCS/:awb_no": "SupportController.forceAWBToRCS",
    "GET /changeAWBPriorityClass/:awb_no/:priority_class": "SupportController.changeAWBPriorityClass",
    
    '/registeradmin': function(req, res) {
        var name = 'admin';
        var email = 'admin@admin.com';
        var password = 'admin';
        var iata_code = ['BLR', 'BOM', 'DEL', 'HYD', 'MAA'];
        var role = 'admin';

        if (name == undefined || name == null || name == '') {
            return res.view('pages/imlost', {
                error: 'User Name cannot be blank'
            });
        } else if (email == undefined || email == null || email == '') {
            return res.view('pages/imlost', {
                error: 'Email cannot be blank'
            });
            /*} else if (password == undefined || password == null || password == '') {
            	sails.log.error(req + ' - ' + new Date() +' ERR - (adduser - post) Password cannot be blank');
            	return res.view('pages/imlost', {error: 'Password cannot be blank'});
            */
        } else {
            User.findOrCreate({
                    username: name
                }, {
                    role: role,
                    iata_code: iata_code,
                    username: name,
                    email: email,
                    password: password
                })
                .exec(async(err, user, wasCreated) => {
                    if (err) {
                        return res.view('pages/imlost', {
                            error: 'Something went wrong while finding or creating user'
                        });
                    }
                    if (wasCreated) {
                        return res.redirect('/register');
                    } else {
                        User.update({
                                username: user.username
                            }, {
                                role: role,
                                iata_code: iata_code,
                                username: name,
                                email: email
                            }).fetch()
                            .exec(function(err, updatedUser) {
                                if (err) {
                                    return res.view('pages/imlost', {
                                        error: 'Something Happens During Updating'
                                    });
                                } else {
                                    return res.redirect('/register');
                                }
                            });
                    }
                });
        }
    },

    /***************************************************************************
     *                                                                          *
     * More custom routes here...                                               *
     * (See https://sailsjs.com/config/routes for examples.)                    *
     *                                                                          *
     * If a request to a URL doesn't match any of the routes in this file, it   *
     * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
     * not match any of those, it is matched against static assets.             *
     *                                                                          *
     ***************************************************************************/

    //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
    //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
    //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝

    //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
    //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
    //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝

    //  ╔╦╗╦╔═╗╔═╗
    //  ║║║║╚═╗║
    //  ╩ ╩╩╚═╝╚═╝

    'GET /probe': async (req, res) => {
        res.ok();
    },

    'GET /read': async function(req, res) {
        await sails.helpers.readEmail.with({});
        res.ok();
    },

    'GET /write': async function(req, res) {
        await sails.helpers.sendEmail.with({
            to: "naval@mobigic.com",
            subject: `Test email ${new Date()}`,
            body: `Sending Test email ${new Date()}`,
        })
        
        res.ok();
    },

    //  Azure OAuth2 Authentication and Access Key Management
    'GET /azure/tokens':                        'azure/AzureController.authenticate',
    'GET /azure/auth-redirect-read-email':      'azure/AzureController.handleReadEmailAuthentication',
    'GET /azure/auth-redirect-write-email':     'azure/AzureController.handleWriteEmailAuthentication',
    'GET /azure/refresh-token':                 'azure/AzureController.tokenRefresh',

    'GET /azure/authenticate': {view: 'oauth_authentication'},
    'GET /azure/auth-done': {view: 'thankyou'},

    'GET /correct-cca-requests': async function(req, res) {
        let cca_reqs = await CCARequest.find({}).select(['awb_no', 'station', 'cca_leg_op']).populate('cca_leg_op');
        for(let i = 0; i < cca_reqs.length; i++) {
            let awb = await AWBInfo.findOne({awb_no: cca_reqs[i].awb_no});
            if(awb) {
                
                if(cca_reqs[i].station != awb.station) {
                    console.log('for awb', awb.awb_no, cca_reqs[i].station, awb.station, cca_reqs[i].cca_leg_op.department);
                    await CCARequest.update({id: cca_reqs[i].id}).set({station: awb.station});
                }
            } else {
                console.log('skipping ', cca_reqs[i].awb_no);
            }
        }
        res.ok();
    }
};
