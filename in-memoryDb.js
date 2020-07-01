const loki = require('lokijs');

var db = new loki('Example');

var vouchers = db.addCollection('vouchers');

module.exports = { vouchers };