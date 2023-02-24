const passport = require('passport');
const jwt = require('jsonwebtoken');

module.exports = {

    jwttestapi: async function(req, res) {
        res.ok();
    },

    addtempuser: async function(req, res) {
        let user = await TempUser.create({
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            stations: req.body.stations,
            departments: req.body.departments,
            allow_edit: req.body.allow_edit,
        }).fetch();
        res.json(sails.config.custom.jsonResponse(null, user));
    },

	jwtlogin: async function(req, res) {
        console.log(req.body);
        
        passport.authenticate('jwt-login', { session: false }, async function (err, user, info) {

            console.log("UserController JWT err", err);
            console.log("UserController JWT user", user);
            console.log("UserController JWT info", info);

            // If there is no user, that means there is an error
            if (user) {
                /*req.logIn(user, { session: false }, function (err) {
                    if (err) return res.send(err);
    
                    let userDetails = {
                        email: user.email,
                        name: user.name,
                        phone: user.phone,
                        role: user.role,
                        gender: user.gender,
                        id: user.id,
                    };
                    
                    let token = jwt.sign(userDetails, "sails.config.local.jwtSecret", {expiresIn: '20s'});

                    res.json(sails.config.custom.jsonResponse(null, user, token));
                });*/
                let response = await loginUser(req, user);
                if (response.token) {
                    res.json(sails.config.custom.jsonResponse(null, user, response.token.accessToken, response.token.refreshToken));
                } else {
                    res.json(sails.config.custom.jsonResponse(response.err, null));
                }

            } else {
                res.json(sails.config.custom.jsonResponse(info.message, null));
            }
        })(req, res);

        /*res.json(sails.config.custom.jsonResponse(null, {
            station_options: [
            //    'BLR', 
                'BOM', 
            //    'DEL', 
            //    'HYD', 
            //    'MAA'
            ],
            departments: [
                //sails.config.custom.department_name.planner_ops,
                //sails.config.custom.department_name.airport_ops, 
                sails.config.custom.department_name.central_ops, 
                sails.config.custom.department_name.central_fin, 
                sails.config.custom.department_name.central_rec
            ],
            isAdmin: false
        }));*/
    },

    resetTokens: async function (req, res) {
        sails.config.log.addINlog("system user", req.options.action);
        passport.authenticate("refresh-token", { session: false }, async function (err, user, info) {
            if (user) {
                req.user = user;
                let response = await loginUser(req, user);
                if (response.token) {
                    return res.json(sails.config.custom.jsonResponse(null, user, response.token.accessToken, response.token.refreshToken));
                } else {
                    return res.json(sails.config.custom.jsonResponse(response.err, null));
                }
            } else {
                res.status(444);
                res.json(sails.config.custom.jsonResponse(info.message, null));
            }
    
        })(req, res);
        sails.config.log.addOUTlog("system user", req.options.action);
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
				allow_edit: user.allow_edit
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