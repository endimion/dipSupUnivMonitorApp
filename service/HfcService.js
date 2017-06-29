/*jslint es6 */
/*jslint node: true */
'use strict';

const basic = require('../basicFunctions');
const chainCodeQuery = require('../ChaincodeQuery.js');
const supUtils = require('../utils/SupplementUtils.js');
const util = require('util');
const signService = require('../service/SignService');
const log4js = require('log4js');
log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'logs/app.log', category: 'log' }
  ]
});
const logger = log4js.getLogger('log');

//pusblishes a diploma supplement on the blockchain
// from the data it retrieved from the database
exports.publishSupplement = function(supplement, user){

  return new Promise(function(resolve,reject){
    // let supplement = {
    //     "Owner": owner,
    //     "Name": name,
    //     "Surname": surname,
    //     "University": university,
    //     "Authorized": [],
    //     "Id" : _id
    // }
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
    // logger.info("invokeCurryPromise");
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
      logger.info("will send invoke request:\n");
      logger.info(invRequest);
      basic.invoke(user,invRequest)
      .then(rsp => {
        logger.info("the response is: \n");
        logger.info(rsp);
        resolve(rsp);
      }).catch(err => {
          logger.info("the error is: \n");
        logger.info(err);
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
      // logger.info("hfcFunc,times,retryFunction,successCallback,failureCallback");
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
              logger.info("AN ERROR OCCURED!!! atempt:"+counter+"\n");
              logger.info(err);
              counter ++;
              innerFunction();
            }else{
              logger.info("HfcService");
              logger.info(err);
              // failureCallback("failed, to get  supplements after " + counter + " attempts");
              try{
                let error = JSON.parse(util.format("%j",err));
                failureCallback(error.msg);
              }catch(e){
                logger.info(e);
                failureCallback(util.format("%j",err));
              }
            }
          });
      };

      return innerFunction;
    })();
}
