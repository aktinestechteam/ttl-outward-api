/**
 * IndexController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	index: function (req, res) {
		sails.config.log.addINlog(req, "index");
		sails.config.log.addOUTlog(req, "index");
		return res.redirect('/stations');
		/*if(req.user) {
			return res.view('pages/index');
			//res.redirect('/');
		} else {
			return res.view('pages/page-login');
			//return res.view('pages/page-login',{message: 'User Not Logged In'});
		}*/
	}

};