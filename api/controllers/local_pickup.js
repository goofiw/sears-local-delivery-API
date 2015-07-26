var jsonQuery = require('json-query');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var secrets = require('../../secrets');

module.exports = {
  getProducts: getProducts
}
function getLocalProduct(partNumber, zip, cb) {
  var localBody,
      storeInfo,
      url,
      radius = 50;
       url = 'http://api.developer.sears.com/v2.1/product/availability/pickup//Sears/json/' + partNumber + '/' + zip + '?maxDistance=' + radius + '&quantity=' + 1 + '&storeIndex=10&apikey=' + secrets.searsKey;
  request(url, function (error, response, localBody) {
  var storeInfo;
    if (error) {
      res.send(error);
    } else {
      localBody = JSON.parse(localBody);
      storeInfo = localBody.RefactorSPUPickupData.SPUStores; 
      if (storeInfo[0] && storeInfo[0].SPUAvailabilityMsg === "In Stock Today") {
        return cb(storeInfo);
      }
    }
  });
}

function getNearestStore(zip){
  var nearestStore;
  request('http://api.developer.sears.com/v2.2/stores/storeInfo/Sears/json/zip/' + zip + '?apikey=' + secrets.searsKey, function(error, res, nearestStoreBody){
    nearestStoreBody = JSON.parse(nearestStoreBody);
    var stores = nearestStoreBody.showStoreInfo.getStoreInfo.stores.storeLocation;
    stores = jsonQuery("storeService[][servicesName=STORE PICK UP]", {data: stores});
    nearestStore = (stores.references[0][0].storeInfo.storeNumber);
    return nearestStore;
  })
}

function getProducts(req, res){
  var query = req.swagger.params.keyword.value,
      searchResults,
      localResults = [],
      zip,
      cb,
      nearestStore,
      latlong = req.swagger.params.latlong.value;
  request("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + latlong + "&sensor=false", function(err, response, locationBody){
    if (err) {
      res.send(err)
    }
    locationBody = JSON.parse(locationBody);
    zip = jsonQuery('results[types=postal_code].address_components', {data: locationBody});
    zip = jsonQuery('value[types=postal_code].short_name', {data: zip}).value;
    request('http://api.developer.sears.com/v2.1/products/search/Sears/json/keyword/' + query + '?apikey=' + secrets.searsKey, function(error, resp, body){
      if (error) {
        res.send(error);
      } else {
        searchResults = JSON.parse(body);
        function cbFunc(cb) {
          products = searchResults.SearchResults.Products
          products.forEach(function(item, idx){
            var partNumber = item.Id.PartNumber.replace(/P/, '')
            setTimeout(getLocalProduct(partNumber, zip, function(result){
              var responses = 0,
                  temp = [];
                if (result){
                  console.log('result  \n\n\n\n', result, 'end result \n\n\n');
                  console.log('item \n\n', item, 'end item \n\n\n\n');
                  temp = [result[0], item];
                  localResults.push(temp);
                  responses++;
                  console.log('\n\n\n local results ',localResults, "\n\n\n\n\n\n\n\n\n\n");
                }
                //if(products.length - 1 == responses) {
                //}
              }), 100 * idx);
          })
          return cb(localResults);
        }
        cbFunc(function(localResults){
          res.send(localResults);
        })
      }
    })
  })
}
