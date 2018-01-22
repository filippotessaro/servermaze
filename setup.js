// =================================================================
// get the packages we need ========================================
// =================================================================
var mongoose    = require('mongoose');

var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model

// =================================================================
// configuration ===================================================
// =================================================================
mongoose.Promise = global.Promise;
var options = {useMongoClient: true, user: config.database.user, pass: config.database.password};
mongoose.connect(config.database.uri, options); // connect to database




// create first sample user
// var filippo = new User({ 
// 	name: 'filippo',
// 	password: 'filippo',
// 	telefono: '3333333333',
// 	admin: true
// });
// filippo.save(function(err) {
// 	if (err) throw err;
// 	console.log('User saved successfully');
// 	process.exit()
// });
