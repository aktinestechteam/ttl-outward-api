const passport = require('passport');
const jwt = require('jsonwebtoken');
const voca = require('voca');

module.exports = {

	getlogin: function (req, res) {
		if (req.user) {
			if (req.user.role === 'user') {
				sails.config.globals.putinfolog(req, req.options.action, 'get', '1');
				res.redirect('/igm');
			} else if (req.user.role === 'admin') {
				sails.config.globals.putinfolog(req, req.options.action, 'get', '2');
				res.redirect('/stations');
			} else {
				sails.log.error(' - ' + new Date() + ' ERR - (getlogin - get)' + 'userrole may be the reason behind failure');
				res.view('pages/authentication-login');
			}
		} else {
			res.view('pages/authentication-login');
		}
	},
	getloginldap: function (req, res) {
		if (req.user) {
			if (req.user.role === 'user') {
				sails.config.globals.putinfolog(req, req.options.action, 'get', '1');
				res.redirect('/igm');
			} else if (req.user.role === 'admin') {
				sails.config.globals.putinfolog(req, req.options.action, 'get', '2');
				res.redirect('/stations');
			} else {
				sails.log.error(' - ' + new Date() + ' ERR - (getloginldap - get)' + 'userrole may be the reason behind failure');
				res.view('pages/authentication-login-ldap');
			}
		} else {
			//sails.log.error(' - ' + new Date() +' ERR - (getloginldap - get)' + 'May be user not found');
			res.view('pages/authentication-login-ldap');
		}
	},

	login: function (req, res) {
		passport.authenticate('local', function (err, user, info) {
			if ((err) || (!user)) {
				sails.log.error(' - ' + new Date() + ' ERR - (login - post)' + err);
				return res.redirect('/login');
				//return res.view('pages/authentication-login',{message: info.message});
				//res.view('/page-login', {message: info.message, layout: null});
				//return res.send({message: info.message,user});
			} else {
				req.logIn(user, function (err) {
					if (err) {
						sails.log.error(' - ' + new Date() + ' ERR - (login - post)' + err);
						res.send(err);
					} else {
						sails.log.info(user.username + ' - ' + new Date() + ' - User logged in');
						return res.redirect('/stations');
					}
				});
			}
		})(req, res);
	},

	loginldap: function (req, res) {
		passport.authenticate('ldapauth', async function (err, user, info) {
			if (err) {
				sails.log.error(' - ' + new Date() + ' ERR - (loginldap - post)' + err);
				return res.view('pages/authentication-login-ldap', {
					info: info
				});
			}

			if (user) {
				/////////////////////////////////	HACK

				// if (user.employeeType === 'AppAdmin')
				// 	user.employeeType = 'admin';

				// if (user.employeeType === 'User')
				// 	user.employeeType = 'user';

				/////////////////////////////////	HACK

				if (user.sAMAccountName/*user.division && (user.employeeType === 'admin' || user.employeeType === 'user')*/) {
					/*let localuser = await User.findOne({username: user.sAMAccountName});
					let response = await loginUser(req, localuser);
					console.log('error', JSON.stringify(response));
					if (response.token) {
						return res.json(sails.config.custom.jsonResponse(null, {localuser, accessToken: response.token.accessToken, refreshToken: response.token.refreshToken}));
					} else {
						return res.json(sails.config.custom.jsonResponse(response.err, null));
					}*/

					// user.username = user.sAMAccountName;
					// user.role = user.employeeType;
					// user.iata_code = user.division.split(',');

					let userToLogin = {
						email: user.mail,
						username: user.sAMAccountName,
						stations: user.division.split(',').map(station => station.trim()),
						departments: user.department.split(',').map(department => department.trim()),
						allow_edit: user.comment ? user.comment.trim().toLowerCase() == 'rw' : false	//	rw / ro
					}
					let response = await loginUser(req, userToLogin);
					
					if (response.token) {
						return res.json(sails.config.custom.jsonResponse(null, userToLogin, response.token.accessToken, response.token.refreshToken));
					} else {
						return res.json(sails.config.custom.jsonResponse(response.err, null));
					}
					/*req.logIn(user, function (err) {
						if (err) {
							sails.log.error(' - ' + new Date() + ' ERR - (loginldap - post)' + err);
							return next(err);
						}
						sails.log.info(user.username + ' - ' + new Date() + ' - User logged in');
						return res.redirect('/igm');
					});*/
				} else {
					sails.log.error(' - ' + new Date() + ' ERR - (loginldap - post)' + 'You are not authorized for access');
					return res.json(sails.config.custom.jsonResponse('You are not authorized for access', null));
				}
			} else {
				console.log('info', JSON.stringify(info));
				//info = voca.replaceAll(info, sails.config.globals.ldap_access_url, '***.***.***.***');
				//info = voca.replaceAll(info, sails.config.globals.ldap_access_port, '****');
				sails.log.error(' - ' + new Date() + ' ERR - (loginldap - post)' + info);
				return res.json(sails.config.custom.jsonResponse(JSON.stringify(info), null));
			}
		})(req, res);
	},

	logout: function (req, res) {
		req.logout();
		res.redirect('/login');
	}
};

async function loginUser(req, user) {
    return new Promise((good, bad) => {
        req.logIn(user, { session: false }, function (err) {
            let userDetails = {
                email: user.email,
                username: user.username,
				stations: user.stations,
				departments: user.departments,
				allow_edit: user.allow_edit ?? false
            };

            // let token = jwt.sign(userDetails, sails.config.custom.jwt_secret/*sails.config.local.jwtSecret*/, { expiresIn: sails.config.custom.jwt_expiry/*sails.config.local.jwtExpiry*/ });
            // let refreshToken = jwt.sign(userDetails, sails.config.custom.jwt_secret_refresh/*sails.config.local.jwtSecret*/, { expiresIn: sails.config.custom.jwt_expiry_refresh/*sails.config.local.jwtExpiry*/ });
            let token={
                accessToken: jwt.sign(userDetails, sails.config.custom.jwt_secret/*sails.config.local.jwtSecret*/, { expiresIn: sails.config.custom.jwt_expiry/*sails.config.local.jwtExpiry*/ }),
                refreshToken: jwt.sign(userDetails, sails.config.custom.jwt_secret_refresh/*sails.config.local.jwtSecret*/, { expiresIn: sails.config.custom.jwt_expiry_refresh/*sails.config.local.jwtExpiry*/ })

            }
            if (err) {
                bad({ err });
            } else {
                good({ token });
            }
        });
    });
}
