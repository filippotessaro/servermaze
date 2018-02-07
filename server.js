// =================================================================
// get the packages we need ========================================
// =================================================================
var express 	= require('express');
var app         = express();
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model


// =================================================================
// configuration ===================================================
// =================================================================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens

mongoose.Promise = global.Promise;
var options = {useMongoClient: true, user: config.database.user, pass: config.database.password};
mongoose.connect(config.database.uri, options); // connect to database
const db = mongoose.connection;
db.on('error', err => {
  console.error(`Error while connecting to DB: ${err.message}`);
});
db.once('open', () => {
  console.log('DB connected successfully!');
});

app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// =================================================================
// routes ==========================================================
// =================================================================

// setup route to create the first user
app.get('/setup', function(req, res) {

	// create a sample user
	var nick = new User({ 
		name: 'filippo', 
		password: 'filippo',
		admin: true,
		telefono: '33333333' 
	});
	nick.save(function(err) {
		if (err) throw err;

		console.log('User saved successfully');
		res.json({ success: true });
	});
});

// basic route (http://localhost:8080)
app.get('/', function(req, res) {
	res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
var apiRoutes = express.Router(); 

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://localhost:8080/api/authenticate
apiRoutes.post('/authenticate', function(req, res) {
	console.log('authenticate')
	// find the user
	User.findOne({
		name: req.body.name
	}, function(err, user) {

		if (err) throw err;
		
		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
			console.log('autentication failed')
		} else if (user) {
			console.log('Autentication START')
			// check if password matches
			if (user.password != req.body.password) {
				res.json({ success: false, message: 'Authentication failed. Wrong password.' });
			} else {

				// if user is found and password is right
				// create a token
				var payload = {
					admin: user.admin	
				}
				var options = {
					expiresIn: 86400 // expires in 24 hours
				}
				var token = jwt.sign(payload, app.get('superSecret'), options);
				console.log('user_id:'+user._id + 'token creato!')
				console.log('token: '+ token)
				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token,
					user: user._id
				});
			}

		}

	});
});

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(req, res, next) {

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.params.token || req.headers['x-access-token'];

	// decode token
	if (token) {

		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {			
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });		
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;	
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({ 
			success: false, 
			message: 'No token provided.'
		});
		
	}
	
});

// ---------------------------------------------------------
// authenticated routes
// ---------------------------------------------------------
apiRoutes.get('/', function(req, res) {
	res.json({ message: 'Welcome to the coolest API on earth!' });
});

apiRoutes.route('/users')
.get(function(req, res) {
	User.find({}, function(err, users) {
		res.json(users);
	});
})
.post(function (req, res) {
	var user = new User();
	user.name = req.body.name;
	user.password = req.body.password;
	user.admin = req.body.admin;
	user.telefono = req.body.telefono;

	// save the bear and check for errors
	user.save(function (err) {
		if (err) { res.send(err); }
		res.json(user);
	});

})

apiRoutes.route('/users/:user_id')
.delete(function (req, res) {
	User.remove({
		_id: req.params.user_id
	}, function (err, bear) {
		if (err) { res.send(err); }
		res.json({ message: 'Successfully deleted' });
	});
})
.put(function (req, res) {
	User.findById(req.params.user_id, function (err, user) {
		if (err) { res.send(err); }
		// update the bears info
		user.name = req.body.name || user.name;
		user.password = req.body.password || user.password;
		user.admin = req.body.admin;
		user.telefono = req.body.telefono;
		// save the bear
		user.save(function (err) {
			if (err) { res.send(err); }
			res.json(user);
		});

	});
});

apiRoutes.route('/users/level/:user_id')
.put(function(req,res){
	User.findById(req.params.user_id, function (err, user) {
		if (err) { res.send(err); }
		// update the bears info
		var livello = {
			'numero' : req.body.numero,
			'numerotocchi': 0,
			'tempo': 0,
			'svolto': false
		}
		console.log(livello);
		 user.livelli.push(livello);
		// save the bear
		user.save(function (err) {
			if (err) { res.send(err); }
			res.json(user);
			console.log(user);
		});

	});
})
.get(function(req,res){
	User.findById(req.params.user_id, function (err, user) {
		if (err) { res.send(err); }
			console.log("Response all levels of user");
			res.json(user.livelli);
	});
})

//route con query dove metto levelid e userid
//get specifico livello
apiRoutes.route('/levels')
.get(function(req, res) {
	var level_id = req.query.levelId
	var user_id = req.query.userId
	User.findById(user_id, function (err, user) {
		if (err) { res.send(err); }
		console.log('utente trovato!')
		for(var i=0; user.livelli.length; i++){
			if(user.livelli[i]._id == level_id){
				console.log(user.livelli[i])
				res.json(user.livelli[i])
				break;
			}
		}
	});
  })
//modifica un determinato livello
  .put(function(req, res) {
	var level_id = req.query.levelId
	var user_id = req.query.userId
	var num = req.body.numerotocchi
	var time = req.body.tempo
	User.findById(user_id, function (err, user) {
		if (err) { res.send(err); }
		console.log('utente trovato!')
		for(var i=0; user.livelli.length; i++){
			if(user.livelli[i]._id == level_id){
				if(req.body.tempo > 0){
					user.livelli[i].numerotocchi = req.body.numerotocchi || user.livelli[i].numerotocchi
					user.livelli[i].tempo = req.body.tempo || user.livelli[i].tempo
					user.livelli[i].svolto = req.body.svolto || user.livelli[i].svolto
					user.save()
					// console.log(user.livelli[i])
					res.json('Ok!')
					console.log("Modificato livello utente")
					// res.json(user.livelli[i])
					res.status(200).end()
					break;
				}else{
					console.log("Non posso assegnare un tempo strano ad un livello")
					res.status(404).end();
				}
				
			}
		}
	});
  });

apiRoutes.get('/check', function(req, res) {
	res.json(req.decoded);
});

// middleware route to support CORS and preflighted requests
app.use(function (req, res, next) {
    //Enabling CORS
    res.header('Access-Control-Allow-Origin', '*');
    //Support header x-access-token for the authentication token
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-access-token');
    res.header('Content-Type', 'application/json');
    if (req.method == 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
        return res.status(200).json({});
    }
    // make sure we go to the next routes
    next();
});

app.use('/api', apiRoutes);

// =================================================================
// start the server ================================================
// =================================================================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
