/*jslint es6 */
/*jslint node: true */
'use strict';

const basic = require('../basicFunctions');
const chainCodeQuery = require('../ChaincodeQuery.js');
const supUtils = require('../utils/SupplementUtils.js');
const util = require('util');
const signService = require('../service/SignService');

//pusblishes a diploma supplement on the blockchain
// from the data it retrieved from the database
exports.publishSupplement = function(dbDipSup, user){

  return new Promise(function(resolve,reject){
    let owner =dbDipSup.uniId;
    let university =dbDipSup.university;
    let _id = dbDipSup._id.valueOf();
    let name = dbDipSup.name;
    let surname =dbDipSup.surname;

    let supplement = {
        "Owner": owner,
        "Name": name,
        "Surname": surname,
        "University": university,
        "Authorized": [],
        "Id" : _id
    }
    let supString = JSON.stringify(supplement);
    let signature = signService.signHash(supUtils.generateSupplementHash(supString))
    supplement.Signature = signature;
    let finalSupString = JSON.stringify(supplement);
    let publishArgs = [finalSupString];

// '{"Owner":"'+ owner +'", "University":"'+university+'", "Name":"'+name+
//                           '", "Surname":"'+surname+'","Authorized":[],"Id":"'+_id+'"}' ];
    let _enrollAttr = [{name:'typeOfUser',value:'University'},{name:"eID",value:user}];
    let _invAttr = ['typeOfUser','eID'];
    let publishReq = {
      chaincodeID: basic.config.chaincodeID,
      fcn: "publish",
      args: publishArgs,
      attrs: _invAttr
    };

    let publishFnc = invokeCurryPromise(publishReq);
    // console.log("invokeCurryPromise");
    let tryToPublish = makeHfcCall(publishFnc,10,resolve,reject,user,_enrollAttr);
    tryToPublish();
  });

};




/**
* Wraps the invokation request to a promise and curries the fuction so as to take only the
*  user object as input.
@param invRequest, the invokation request object to publish a supplementRequest
*/
function invokeCurryPromise(invRequest){
  return function(user){
    return  new Promise(function(resolve,reject){
      console.log("will send invoke request:\n");
      console.log(invRequest);
      basic.invoke(user,invRequest)
      .then(rsp => {
        console.log("the response is: \n");
        console.log(rsp);
        resolve(rsp);
      }).catch(err => {
          console.log("the error is: \n");
        console.log(err);
        reject(err)
      });
    });
  }
}


/**
closure to include a counter, to attempt to publish for a max of 10 times;
  @param hfcFunc, the hyperledger function to call
  @param times, the times we will retry to call that function
  @param successCallback, function to call in case of successCallback
  @param failureCallback, function to call in case of failure
  @param user, the UserName of the user that will be enrolled
  @param enrollAttributes the attributes to enroll the user
**/
function makeHfcCall(hfcFunc,times,successCallback,failureCallback,user,enrollAttributes){
  return (function(){
      let counter = 0;
      // console.log("hfcFunc,times,retryFunction,successCallback,failureCallback");
      let innerFunction = function(){
          // firstStep(user,enrollAttributes)
          basic.enrollAndRegisterUsers(user,enrollAttributes)
          .then(hfcFunc)
          .then( rsp => {
            counter = times;
            successCallback(rsp);
          })
          .catch(err =>{
            if(counter < times){
              console.log("AN ERROR OCCURED!!! atempt:"+counter+"\n");
              console.log(err);
              counter ++;
              innerFunction();
            }else{
              console.log("HfcService");
              console.log(err);
              // failureCallback("failed, to get  supplements after " + counter + " attempts");
              try{
                let error = JSON.parse(util.format("%j",err));
                failureCallback(error.msg);
              }catch(e){
                console.log(e);
                failureCallback(util.format("%j",err));
              }
            }
          });
      };

      return innerFunction;
    })();
}
