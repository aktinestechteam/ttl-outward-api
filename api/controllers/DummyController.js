/**
 * DummyController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    /*emailSending: async function (req, res) {
        sails.config.log.addINlog('system user', req.options.action);
        let ccaAprrovalMail = await sails.helpers.sendEmail.with({
            to: 'medha.halbe@ba.com',
            subject: 'CCA - ' + "1212154",
            html: '<p><h2><a href="' + sails.config.custom.base_url + '/ccaaprroval/' + "1212154" + '/approve"> Approve </a></h2></p>' + '<p><h2><a href="' + sails.config.custom.base_url + '/ccaaprroval/' + "1212154" + '/reject"> Reject </a></h2></p>',
        }, function (err) {
                if (err) {
                console.log(err);
            }
            console.log('returned from send email helper');
        });
        sails.config.log.addOUTlog('system user', req.options.action);
    }*/
};

