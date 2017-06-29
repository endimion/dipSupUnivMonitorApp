const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let connection = mongoose.connect('mongodb://mongo/dipSup');
mongoose.Promise = Promise;


let dsSchema = new Schema({
  uniId : String,
	name: String,
	surname: String,
  university: String,
  _id: Schema.Types.ObjectId
});

let DiplomaSupplement = connection.model('DiplomaSupplement', dsSchema);

// make this available to our users in our Node applications
module.exports.Schema = DiplomaSupplement;
module.exports.connection = connection;
