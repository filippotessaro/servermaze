var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// var Livello = new Schema({
//     numero: Number,
// 	numerotocchi: Number,
// 	tempo: Number
// });

// set up a mongoose model
module.exports = mongoose.model('User', new Schema({ 
	name: String, 
	password: String, 
	admin: Boolean,
    telefono: String,
    livelli: [{
		numero: Number,
		numerotocchi: Number,
		tempo: Number,
		svolto: Boolean
	}]
}));