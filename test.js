var moment = require('moment-timezone');
console.log("LHR - 14:35, JFK - 17:30 - BA0115")
console.log("BOM - 19:05, BOM - 03:00 (next day)")
console.log(`BOM -`);

//console.log(moment('10-Nov-2019').tz("America/Los_Angeles").valueOf());
//console.log(moment(new Date('10-Nov-2019')).tz('Asia/Tokyo').format('DD/MM/YYYY HH:mm Z z'));
//console.log(moment(new Date('10-Nov-2019')).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm Z z'));
//console.log(moment(new Date('10-Nov-2019')).tz('Europe/London').format('DD/MM/YYYY HH:mm Z z'));

let tokyo = new moment.tz("2022-05-29 14:35", "Asia/Tokyo");
console.log(new moment().valueOf(), Date.now());
console.log("LHR", new moment.tz("2022-05-29 14:35", 'Europe/London').valueOf());
console.log("LHR", new moment.tz("2022-05-29 17:30", 'America/New_York').valueOf());
//console.log(`tokyo = ${tokyo} ${tokyo.valueOf()}`);
//console.log(`tokyo = ${tokyo.tz('Asia/Kolkata')} ${tokyo.valueOf()}`);
//console.log(`milli = 1653715800000, ${new moment.tz(1653715800000, 'Asia/Tokyo')}`);

let today = new moment();
console.log('today', today.date())
today.subtract(90, 'days')
for(let i = 90; i <= 100; i++) {
    console.log(`${i} days ago `, `path = /static_data/email_attachments/BOM/${today.subtract(1, 'days').format('YYYY/M/D')}`);
}
