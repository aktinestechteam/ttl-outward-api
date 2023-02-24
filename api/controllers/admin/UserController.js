/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
	adduser: function (req, res) {
		sails.config.log.addINlog(req, "adduser");
		var name = req.body.inwardcargo_registeruser_username;
		var email = req.body.inwardcargo_registeruser_email;
		var password = req.body.inwardcargo_registeruser_password;
		var iata_code = req.body.inwardcargo_registeruser_city;
		var role = req.body.inwardcargo_registeruser_role;

		if (name == undefined || name == null || name == '') {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (adduser - post) User Name cannot be blank');
			sails.config.log.addlog(1, req, "adduser","User Name cannot be blank");
			return res.view('pages/imlost', {
				error: 'User Name cannot be blank'
			});
		} else if (email == undefined || email == null || email == '') {
			sails.log.error(req + ' - ' + new Date() + ' ERR - (adduser - post) Email cannot be blank');
			sails.config.log.addlog(1, req, "adduser","Email cannot be blank");
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
				.exec(async (err, user, wasCreated) => {
					if (err) {
						sails.log.error(req + ' - ' + new Date() + ' ERR - (adduser - post)' + err);
						sails.config.log.addlog(1, req, "adduser",err);
						return res.view('pages/imlost', {
							error: 'Something went wrong while finding or creating user'
						});
					}
					if (wasCreated) {
						sails.log.info(req + ' - ' + new Date() + ' INFO - (adduser - post) render register if newly created user');
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
							.exec(function (err, updatedUser) {
								if (err) {
									sails.config.log.addlog(1, req, "adduser",err);
									sails.log.error(req + ' - ' + new Date() + ' ERR - (adduser - post) ' + err);
									return res.view('pages/imlost', {
										error: 'Something Happens During Updating'
									});
								} else {
									sails.log.info(req + ' - ' + new Date() + ' INFO - (adduser - post) User updated successfully');
									return res.redirect('/register');
								}
							});
					}
				});
				sails.config.log.addOUTlog(req, "adduser");
		}
	},
	registeruser: function (req, res) {
		sails.config.log.addINlog(req, "registeruser");
		async.waterfall([
			function (callback) {
				Ports.find({
					where: {
						is_inward_port: true
					},
					sort: 'iata_code'
				}, function (err, ports) {
					if (err) {
						sails.config.log.addlog(1, req, "registeruser",err);
						sails.log.error(req + ' - ' + new Date() + ' ERR -  (registeruser - get)' + err);
						callback('Error in finding airport list', null);
					} else {
						sails.log.info(req + ' - ' + new Date() + ' INFO - (registeruser - get) Airport found successfully');
						callback(null, ports);
					}
				});
			},
			function (ports, callback) {
				User.find({
					where: {}
				}, function (err, users) {
					if (err) {
						sails.config.log.addlog(1, req, "registeruser",err);
						sails.log.error(req + ' - ' + new Date() + ' ERR - (registeruser - get)' + err);
						callback('Error in finding user list', null);
					} else {
						sails.log.info(req + ' - ' + new Date() + ' INFO - (registeruser - get) Users found successfully');
						callback(null, ports, users);
					}
				});
			}
		], function (err, ports, users) {
			if (err) {
				sails.log.error(req + ' - ' + new Date() + ' ERR - (registeruser - get)' + err);
				sails.config.log.addlog(1, req, "registeruser",err);
				return res.view('pages/imlost', {
					error: err
				});
			} else {
				sails.log.info(req + ' - ' + new Date() + ' INFO - (registeruser - get) render adduser page');
				return res.view('pages/adduser', {
					airportlistdetails: ports,
					userlist: users
				});
			}
		});
		sails.config.log.addOUTlog(req, "registeruser");
	},
	deleteuser: function (req, res) {
		sails.config.log.addINlog(req, "deleteuser");
		var deleteUserId = req.body.inwardcargo_users_delete_userid;
		User.destroy({
			'_id': deleteUserId
		}).exec(function (err, user) {
			if (err) {
				sails.config.log.addlog(1, req, "deleteuser",err);
				sails.log.error(req + ' - ' + new Date() + ' ERR - (deleteuser - post) ' + err);
				return res.view('pages/imlost', {
					error: 'Error while deleting user'
				});
			} else {
				sails.log.info(req + ' - ' + new Date() + ' INFO - (deleteuser - post) User deleted successfully');
				return res.send({
					result: true
				});
			}
		});
		sails.config.log.addOUTlog(req, "deleteuser");
	},
	changepassword: function (req, res) {
		sails.config.log.addINlog(req, "changepassword");
		var name = req.body.inwardcargo_updatepassword_username;
		var password = req.body.inwardcargo_updatepassword_password;
		//console.log(req.body);
		User.update({
				username: name
			}, {
				password: password
			}).fetch()
			.exec(function (err, updatedUser) {
				if (err) {
					sails.config.log.addlog(1, req, "changepassword",err);
					sails.log.error(req + ' - ' + new Date() + ' ERR - (changepassword - post)' + err);
					return res.view('pages/imlost', {
						error: 'Something Happens During Updating'
					});
				} else {
					sails.log.info(req + ' - ' + new Date() + ' INFO - (changepassword - post) Password updated successfully');
					sails.config.log.addOUTlog(req, "changepassword");
					return res.redirect('/register');
				}
			});
	}
};