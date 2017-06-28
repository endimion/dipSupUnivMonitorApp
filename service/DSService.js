const ds = require('../model/DSModel.js');
const DiplomaSupplement = ds.Schema;
// const conn = ds.connection;
const mongoose = require('mongoose');
/*
  Returns a promise
*/
module.exports.findAllDiplomaByCriterria = function(criteria){
  console.log("will query " );
  console.log(criteria);
  return DiplomaSupplement.find({
    'uniId':criteria.UniId
  }).exec();
};


module.exports.saveDipSup = function(diplomaSupplement){

}


module.exports.saveTestDS = function(){
  let testDS = new  DiplomaSupplement({
    name: 'testName2',
    uniId: 'testUniId',
    surname: 'surname',
    university: 'testUniversity',
    _id:  new mongoose.Types.ObjectId
  });

  console.log("will attempt to save");
  console.log(testDS);

  testDS.save(function(err) {
    if (err){console.log(err)}
    console.log('User created!');
  });

};
