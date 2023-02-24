const passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	LdapStrategy = require('passport-ldapauth').Strategy;
const JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

bcrypt = require('bcrypt-nodejs');

var static_configurations = false;

passport.serializeUser(function (user, cb) {
	cb(null, user);
});

passport.deserializeUser(function (user, cb) {
	/*User.findOne({_id: user.id}, function(err, user) {
		cb(err, user);
	});*/
	cb(null, user);
});

//	Local Strategy using username and password from the database
passport.use(new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password'
	},
	function (username, password, cb) {
		User.findOne({
			username: username
		}, function (err, user) {
			if (err) return cb(err);
			if (!user) return cb(null, false, {
				message: 'Username not found'
			});
			bcrypt.compare(password, user.password, function (err, res) {
				if (!res) return cb(null, false, {
					message: 'Invalid Password'
				});
				let userDetails = {
					username: user.username,
					id: user.id,
					role: user.role,
					iata_code: user.iata_code
				};
				return cb(null, userDetails, {
					message: 'Login Succesful'
				});
			});
		});
	}
));

//	managing strategies for LDAP authentication
if (static_configurations) {
	var opts = {
		server: {
			url: 'ldap://' + sails.config.globals.ldap_access_url + ':' + sails.config.globals.ldap_access_port,
			bindDN: 'cn=user1,cn=Users,dc=ttl,dc=local',
			bindCredentials: 'India12#',
			searchBase: "cn=Users,dc=ttl,dc=local",
			searchFilter: "(cn=Administrator)",
			//searchAttributes: ['memberOf']//	defaults to undefined or send as array [displayName, mail]
		},
		//usernameField: 'user1',
		//passwordField: 'India12#',
		credentialsLookup: function (req) {
			var a = {};
			a.username = req.body.username;
			a.password = req.body.password;
			return a;
		},
		passReqToCallback: true,
		handleErrorsAsFailures: true, //When true, unknown errors and ldapjs emitted errors are handled as authentication failures instead of errors (default: false).
		failureErrorCallback: function (err) {
			console.log('landed in failureErrorCallback')
		}, //	Optional, synchronous function that is called with the received error when handleErrorsAsFailures is enabled
	}

	passport.use(new LdapStrategy(opts,
		function (req, user, done) {
			return done(null, user);
		}
	));
} else {
	function getOpts(req, callback) {
		var username = req.body.username;
		var password = req.body.password;

		if (username && password) {
			var opts = {
				server: {
					url: 'ldaps://' + sails.config.globals.ldap_access_url + ':' + sails.config.globals.ldap_access_port,
					bindDN: 'cn=' + 'ldapbind' + ',cn=Users,dc=ttgroupglobal,dc=local',
					bindCredentials: 'Change@me!23@',
					searchBase: "cn=Users,dc=ttgroupglobal,dc=local",
					//searchFilter: "(cn=" + username + ")",
					searchFilter: "&(cn=" + username + ")(memberof=cn=outwarduser,cn=Users,dc=ttgroupglobal,dc=local)",
					//searchAttributes: ['memberOf']//	defaults to undefined or send as array [displayName, mail]
					tlsOptions: {
						rejectUnauthorized: false,
						ca: ['/home/ubuntu/ssl/ttdccert.crt']
					}
				},
				//usernameField: 'user1',
				//passwordField: 'India12#',
				credentialsLookup: function (req) {
					var a = {};
					a.username = req.body.username; //'user1';
					a.password = req.body.password; //'India12#';
					return a;
				},
				passReqToCallback: true,
				handleErrorsAsFailures: true, //When true, unknown errors and ldapjs emitted errors are handled as authentication failures instead of errors (default: false).
				failureErrorCallback: function (err) {
					console.log('landed in failureErrorCallback')
				}, //	Optional, synchronous function that is called with the received error when handleErrorsAsFailures is enabled
			}

			callback(null, opts);
		} else {
			callback('Either Password/Username was not provided', null);
		}
	}

	passport.use(new LdapStrategy(getOpts,
		function (req, user, done) {
			if (user) {
				return done(null, user);
			} else {
				return done('The user does not exist', null);
			}
		}
	));


	///		J W T
	passport.use("jwt-login", new LocalStrategy({
		usernameField: 'username',
		passportField: 'password',
	}, async function (username, password, cb) {
		
		console.log("username, password", username, password);
		let user = await TempUser.findOne({username: username})
			.catch(err => {
				if (err) return cb(err);
			});
		console.log('passport user', user);
		//  TODO: how to login usin phone
		if (user) {
			/*if (!user.enabled) {
				return cb(undefined, undefined, { message: 'User is disabled' });
			} else {
				bcrypt.compare(`${password}`, user.password, function (err, res) {
					if (!res) return cb(undefined, undefined, { message: 'Invalid password' });
					
					return cb(undefined, user, { message: 'Login Successfully' });
				});
			}*/
			if(user.password == password) {
				return cb(undefined, user, { message: 'Login Successfully' });
			} else {
				cb(undefined, undefined, { message: 'Invalid password' });
			}
		} else {
			return cb(undefined, undefined, { message: 'Username not found' });
		}
	}));
	
	//  To check if the provided JWT token is correct
	let opts = {}
	opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
	opts.secretOrKey = "kl8N@m30k>%<,$^aGN*adF@2i82yi7s)GH!2";
	//opts.issuer = 'accounts.examplesoft.com';
	//opts.audience = 'yoursite.net';

	passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
		//console.log('----- jwt_payload in JwtStrategy',jwt_payload);
		done(null, jwt_payload);//jwt-paylload is nothing but user in jwtauthenticate class
	}));
	
	//  To check if the provided JWT refreshToken is correct
	let refreshOpts = {}
	refreshOpts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
	refreshOpts.secretOrKey = "kl8N@m30k>%<,$^aGN*adF@2i82yi7s)GH!3";
	//refreshOpts.issuer = 'accounts.examplesoft.com';
	//refreshOpts.audience = 'yoursite.net';

	passport.use('refresh-token', new JwtStrategy(refreshOpts, function(jwt_payload, done) {
		//console.log('----- jwt_payload in JwtStrategy',jwt_payload);
		done(null, jwt_payload);//jwt-paylload is nothing but user in jwtauthenticate class
	}));

}
