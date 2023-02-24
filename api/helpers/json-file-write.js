const cons = require('consolidate');
var fs = require('fs');
const { exit } = require('process');
module.exports = {


  friendlyName: 'Json file write',


  description: '',


  inputs: {
    called: {
      type: 'string',
      description: 'The called of the file to be saved.',
      required: true
    }
  },


  exits: {
    success: {
      description: 'File Saved.',
    },

  },


  fn: async function (inputs, exits) {
    switch (inputs.called) {
      case 'reason':
        {  let result = await Reason.find({
            where: { make_it_visible: true },
            select: ['code', 'category', 'explanation'],
            sort: 'code ASC'
          }).catch(err => console.log(err.message));

          fs.writeFile('./static_data/filesToBeInclude/reason_records.js', "var reason_records = " + JSON.stringify(result), (err) => {
            if (err) {
              console.error(err);
              return;
            };
            console.log("File has been Over Written for Reasons");
          });
        return exits.success(true);
        }
        break;
      case 'shc':
        { 
          let result = await SHC.find({
            where: { },
            select: ['code', 'explanation'],
            sort: 'code ASC'
          }).catch(err => console.log(err.message));

          fs.writeFile('./static_data/filesToBeInclude/shc_records.js', "var shc_records = " + JSON.stringify(result), (err) => {
            if (err) {
              console.error(err);
              return;
            };
            console.log("File has been over written for SHC");
          });
        return exits.success(true);
        }
        break;
      case 'station':
        { 
            let result = await Station.find({
            where: { },
            select: ['iata', 'name','country','tz'],
            sort: 'iata ASC'
          }).catch(err => console.log(err.message));

          fs.writeFile('./static_data/filesToBeInclude/station_records.js', "var station_records =" + JSON.stringify(result), (err) => {
            if (err) {
              console.error(err);
              return;
            };
            console.log("File has been over written for Station");
          });
          return exits.success(true);
        }
        break;
      case 'timezone':
        { 
          let result = await Reason.find({
            where: { make_it_visible: true },
            select: ['code', 'category', 'explanation'],
            sort: 'code ASC'
          }).catch(err => console.log(err.message));

          fs.writeFile('./static_data/filesToBeInclude/temp4.js', "var time_zone_records= " + JSON.stringify(result), (err) => {
            if (err) {
              console.error(err);
              return;
            };
            console.log("File has been over written for timezone");
          });
          return exits.success(result);
        }
        break;
      case 'agent': {
          let result = await Agent.find({
            where: {},
            select: ['billing_code', 'name', 'station'],
            sort: 'name ASC'
          }).catch(err => console.log(err.message));

          fs.writeFile('./static_data/filesToBeInclude/agent_records.js', "var agent_records= " + JSON.stringify(result), (err) => {
            if (err) {
              console.error(err);
              return;
            };
            console.log("File has been over written for agents");
          });
          return exits.success(result);
        }
        break;
        default :{
          console.log("erro Occured in File Exporting");}
    }
  }
};