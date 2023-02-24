/**
 * allow any authenticated user
 */
 const passport = require('passport');
 module.exports = function (req, res, ok) {
 
     passport.authenticate('jwt', {session: false}, function (err, user, info) {
             
         //console.log("jwtlogin policy err", err);
         //console.log("jwtlogin policy user", user);
         //console.log("jwtlogin policy info", info);
 
         // If there is no user, that means there is an error
         // return ok()
         if(user) {
             req.user = user;
             ok();
         } else {
             res.status(444);
             return res.json(sails.config.custom.jsonResponse(info.message, null));
         }
 
     })(req, res);
 };