'use strict';

function normalizeDigitsToTwo(n) {
	return n < 10 ? '0' + n : n;
}

function getReadableDate(timestamp, showTime) {
	var showTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	var date_separator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '-';
	var time_separator = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ':';

	var readable_date = 'NA';

	if (!isNaN(timestamp)) {
		var date = new Date(timestamp);
		readable_date = normalizeDigitsToTwo(date.getDate()) + date_separator + normalizeDigitsToTwo(date.getMonth() + 1) + date_separator + date.getFullYear();

		if (showTime) {
			readable_date += ', ' + normalizeDigitsToTwo(date.getHours()) + time_separator + normalizeDigitsToTwo(date.getMinutes());
		}
	}

	return readable_date;
}

function getTimestamp(date) {
	//	To be used only if date is of format 01-Apr-18 or 20190330
	var timestamp = 0;
	if (date) {
		var date_splits = date.split('-');
		if (date_splits.length === 3) {
			var currentYear = new Date().getFullYear();
			var shortYear = Number(date_splits[2]);
			if (shortYear > currentYear - 2000) {
				//	which means short year belongs to 20th century
				date_splits[2] = '' + (1900 + shortYear);
			} else {
				date_splits[2] = '' + (2000 + shortYear);
			}

			timestamp = new Date(date_splits[0] + '-' + date_splits[1] + '-' + date_splits[2]).getTime();
		} else if (date.length === 8) {
			timestamp = new Date(_.kebabCase([date.slice(0, 4), date.slice(4, 6), date.slice(6)])).getTime();
		}
	}

	return timestamp;
}