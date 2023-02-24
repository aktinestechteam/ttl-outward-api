/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {

	/***************************************************************************
	 *                                                                          *
	 * Default policy for all controllers and actions, unless overridden.       *
	 * (`true` allows public access)                                            *
	 *                                                                          *
	 ***************************************************************************/
	'agent': {
		"*": ['jwtAuthenticated', 'isAdmin']
	},

	'support':{
		'*': true
	},
	
	'AWB':{
		'updateAwbWithOnHand': true
	},
	
	"temp": {
		"*": true
	},
	
	'legops/departed': {
		'ccaApproved': true,
		'ccaRejected': true,
		'viewCCAForm': true,
		'approveccaform': true,
		'*': ['jwtAuthenticated']
	},
	'*': ["jwtAuthenticated"],
	'security/grant-csrf-token': ['jwtAuthenticated', "refreshSessionCookie"],
	'auth': {"*": true},
	'index': {
		'*': ["jwtAuthenticated", "refreshSessionCookie"]
	},
	'admin/stations': {
		'*': ["jwtAuthenticated", "isAdmin", "refreshSessionCookie"],
		'addairports': false
	},
	'admin/user': {
		'*': ["jwtAuthenticated", "isAdmin"]
	},
	'admin/consignees': {
		'*': ["jwtAuthenticated", "refreshSessionCookie"]
	},
	'admin/constants': {
		'*': ["jwtAuthenticated", "refreshSessionCookie"]
	},
	'admin/exchangerateslist': {
		'*': ["jwtAuthenticated", "refreshSessionCookie"]
	},
	'admin/shcCodes': {
		'*': ["jwtAuthenticated", "isAdmin", "refreshSessionCookie"]
	},
	'admin/planner': {
		'*': ["jwtAuthenticated", "isAdmin", "refreshSessionCookie"]
	},
	'admin/reasons': {
		'*': ["jwtAuthenticated", "isAdmin", "refreshSessionCookie"]
	},
	'budgetanalyzer': {
		'*': ["jwtAuthenticated", "isAdmin", "refreshSessionCookie"]
	},
	'vendor': {
		'*': ["jwtAuthenticated", "isAdmin", "refreshSessionCookie"]
	},
	'expenselogger': {
		'*': ["jwtAuthenticated", "isAdmin", "refreshSessionCookie"]
	},
	'station': {
		'*': ["jwtAuthenticated", "isAdmin", "refreshSessionCookie"]
	},
	'sector': {
		'*': ["jwtAuthenticated", "isAdmin", "refreshSessionCookie"]
	},
	'planner': {
		'*': ["jwtAuthenticated", "refreshSessionCookie"]
	},
	'/awb-planner' : true,
	"sanitizer" : true,
	"dummy": true,
	// "temp": {
	// 	"jwttestapi": ["jwtAuthenticated"]
	// },
	// "booklist":{
	// 	"getFlightDetails": ["jwtAuthenticated"]
	// } ,

	'legops/LockUnlockLegOp': {
		"*": ['jwtAuthenticated']
	},

	'azure/AzureController': {
		'*': true
	}
};
