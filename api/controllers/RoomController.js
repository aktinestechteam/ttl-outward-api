
module.exports = {

    subscribeToFunRoom: function(req, res) {
        if (!req.isSocket) {
            return res.badRequest();
          }
        else{  
            sails.sockets.join(req, req.body.roomname, function(err) {
                if (err) {
                    return res.serverError(err);
                }
                console.log('in joinOperationRoom and will send json');
                return res.json({
                    message: 'Subscribed to a room called '+req.body.roomname+'!'
                });
            });
        }
    },

    getsdtlegops: async function(req, res){
        let response;
        try{
            console.log(req.query);
            if(req.query.station){
                response =  await AWBLegOp.find({where:{ 'station' : req.query.station, 'department' : req.query.department, 'opening_status' : req.query.task}}).catch(err => console.log( err.message));
            }else
            {
                response =  await AWBLegOp.find({where:{ 'department' : req.query.department, 'opening_status' : req.query.task}}).catch(err => console.log( err.message));
            }
            res.json(sails.config.custom.jsonResponse(null, response));
        }
        catch(e){
            sails.config.log.addlog(1, req, "getsdtlegops",e)
            console.log(e);
        }
    }
};