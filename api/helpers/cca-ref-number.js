module.exports = {


	friendlyName: 'CCA Reference Number',


	description: '',


	inputs: {
		date: {
			type: 'number'
		},
		generate_number_for: {
			type: 'string'
		},
		slash_between_month_year: {
			type: 'boolean'
		}
	},

	exits: {

	},

	fn: async function (inputs, exits) {
		var date = inputs.date;
		var generate_number_for = inputs.generate_number_for;

		if (date && generate_number_for) {
			date = new Date(inputs.date); //	translate the timestamp into date object
			var month = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : '' + (date.getMonth() + 1);
			var year = date.getFullYear().toString().substr(-2);
			var queryyear = year;
			//	Since we want to roll the numbering system from 01 April,we check for the month 4.
			if ((date.getMonth() + 1) < 1) {
				queryyear = year - 1;
			}
			var inwardcargonumbersystem = {};
			inwardcargonumbersystem.number_identifier = generate_number_for + '_' + queryyear;
			InwardcargoNumberSystem.findOrCreate(inwardcargonumbersystem, inwardcargonumbersystem)
				.exec(function (err, inwardcargonumbersys, wasCreated) {
					if (err) {
						sails.log.error(' - ' + new Date() + ' ERR - (do-invoice-number - helper)' + err);
						return exits.success({
							error: 'Something Happend During Creating Series Number Record'
						});
					} else {
						var seq_number = inwardcargonumbersys.number_sequence;
						seq_number++;
						InwardcargoNumberSystem.update({
							id: inwardcargonumbersys.id
						}, {
							number_sequence: seq_number
						}).fetch().exec(function (err, updatedInwardcargoNumberSys) {
							if (err) {
								sails.log.error(' - ' + new Date() + ' ERR - (do-invoice-number - helper)' + err);
								return res.send({
									error: 'Something Happens During Updating Or Inserting the series number'
								});
							} else {
								var leadingzero = '' + updatedInwardcargoNumberSys[0].number_sequence;
								var max_id_length = 4; //	We want to have a 6 digit number
								while (leadingzero.length < max_id_length) {
									leadingzero = ('0' + leadingzero);

								}
								return exits.success(generate_number_for + '/' + month + (inputs.slash_between_month_year ? '/' : '') + year + '/' + leadingzero);
							}
						});
					}
				});
		} else {
			sails.log.error(' - ' + new Date() + ' ERR - (do-invoice-number - helper)' + 'error in input values');
			return exits.success({
				error: 'error in input values'
			});
		}
	}


};
