"use strict";
process.env.GOPATH = __dirname;

const hfc = require('hfc');
const util = require('util');
const fs = require('fs');
// const chain = hfc.newChain("targetChain");
const dsService  = require('./service/DSService');
const hlfService = require('./service/HfcService');
const basic = require('./basicFunctions');

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
 let envtId = evHub.registerChaincodeEvent(getChainCodeIDfromCLIArgs(), "evtsender", function(event) {
   console.log(util.format("Custom event received, payload: %j\n", event.payload.toString()));
   let eventJSON = JSON.parse(event.payload.toString());
   let eventBODY = eventJSON.Body;
   let eventTXID = eventJSON.TxId;

   if(eventBODY && eventBODY.UniId){
     let query = dsService.findAllDiplomaByCriterria(eventBODY).then(resp =>{
         console.log("success")  ;
        // //Get unique supplement requests
        // let uniqueUniIds = [...new Set(resp.map(item => item.UniId))];
        // //filter to get only the unique supplement Requests based on the university ID
        let added = [];
        let uniqueSupRequests = [...resp.filter(sup => {
              if(added.indexOf(sup.UniId) < 0){
                added.push(sup.UniId);
                return true;
              }
              return false;
         })];
        seqExecHlfServiceCalls(uniqueSupRequests);
     }).catch(err=>{
         console.log(err);
     });
   }
 });
})();




function seqExecHlfServiceCalls(arrayOfSupplements){
      console.log("seqExecHlfServiceCalls:: will call with")  ;
      console.log(arrayOfSupplements);
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
    //   console.log("asdfsad");
    //   console.log(index + ': ' + val);
    // });
}
