"use strict";
process.env.GOPATH = __dirname;

const hfc = require('hfc');
const util = require('util');
const fs = require('fs');
// const chain = hfc.newChain("targetChain");
const dsService  = require('./service/DSService');
const hlfService = require('./service/HfcService');
const basic = require('./basicFunctions');
const log4js = require('log4js');
log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'logs/app.log', category: 'log' }
  ]
});
const logger = log4js.getLogger('log');
// chain.setKeyValStore( hfc.newFileKeyValStore(__dirname+'/tmp/keyValStore') );
//
// // Set the URL for member services
// chain.setMemberServicesUrl("grpc://172.17.0.1:7054");
//
// // Add a peer's URL
// chain.addPeer("grpc://172.17.0.1:7051");
// chain.eventHubConnect("grpc://172.17.0.1:7053");
// process.on('exit', function() {
//   chain.eventHubDisconnect();
// });

(function main(){
  basic.init();

 let evHub = basic.config.chain.getEventHub();
 let envtId = evHub.registerChaincodeEvent(process.env.CHAINCODE_ID, "evtsender", function(event) {
   logger.info(util.format("Custom event received, payload: %j\n", event.payload.toString()));
   let eventJSON = JSON.parse(event.payload.toString());
   let eventBODY = eventJSON.Body;
   let eventTXID = eventJSON.TxId;

   if(eventBODY && eventBODY.UniId){
     let query = dsService.findAllDiplomaByCriterria(eventBODY).then(supFromDb =>{
         logger.info("success")  ;
        // //Get unique supplement requests
        // let uniqueUniIds = [...new Set(resp.map(item => item.UniId))];
        // //filter to get only the unique supplement Requests based on the university ID
        let added = [];
        let uniqueSupRequests = [...supFromDb.filter(sup => {
              if(added.indexOf(sup.UniId) < 0){
                added.push(sup.UniId);
                return true;
              }
              return false;
         })].map(dbDipSup =>{
              //map the supplement from the DB to a full DiplomaSupplement Structure
              //owner value, denotes the eidas eid,  is retreived from the event,
              // the val. does not exist in the db
              return {
                "Owner" : eventBODY.EidHash,
                "Name" : dbDipSup.name,
                "Surname" : dbDipSup.surname,
                "University" : dbDipSup.university,
                "Authorized" : [],
                "Id" :  dbDipSup._id.valueOf()
              }
        });
        seqExecHlfServiceCalls(uniqueSupRequests);
     }).catch(err=>{
         logger.info(err);
     });
   }
 });
})();




function seqExecHlfServiceCalls(arrayOfSupplements){
      logger.info("seqExecHlfServiceCalls:: will call with")  ;
      logger.info(arrayOfSupplements);
     if(arrayOfSupplements.length > 0){
       hlfService.publishSupplement(arrayOfSupplements[arrayOfSupplements.length -1],"testUniversity")
       .then(resp => {
            arrayOfSupplements.pop()  ;
            seqExecHlfServiceCalls(arrayOfSupplements);
        })
       .catch( err =>{
            seqExecHlfServiceCalls(arrayOfSupplements.pop())
        });
     }
}



/**
  The chaincodeID is the first argument passed to the app (hence the index 2)
**/
function getChainCodeIDfromCLIArgs(){
    return process.argv[2]  ;
    // process.argv.forEach(function (val, index, array) {
    //   logger.info("asdfsad");
    //   logger.info(index + ': ' + val);
    // });
}
