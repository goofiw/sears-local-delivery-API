var jsonQuery = require('json-query');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var secrets = require('../../secrets');

module.exports = {
  getProducts: getProducts
}
function getLocalProducts(searchResults, zip, cb) {
  var localBody,
      url,
      radius = 50;
  return cb(searchResults.SearchResults.Products.map(function(item){
    partNumber = item.Id.PartNumber.replace(/P/, '');
    url = 'http://api.developer.sears.com/v2.1/product/availability/pickup//Sears/json/' + partNumber + '/' + zip + '?maxDistance=' + radius + '&quantity=' + 1 + '&storeIndex=10&apikey=' + secrets.searsKey;
    console.log(url);
    request(url, function (error, response, localBody) {
      var storeInfo;
        if (error) {
          res.send(error);
        } else {
          localBody = JSON.parse(localBody);
          storeInfo = localBody.RefactorSPUPickupData.SPUStores; 
          console.log(storeInfo.length);
          if (storeInfo.length > 0) {
            item.storeInfo = storeInfo;
          }
        }
    })
    console.log(item);
    return item;
  }))
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
      localResults,
      zip,
      cb,
      nearestStore,
      latlong = req.swagger.params.latlong.value;
  request("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + latlong + "&sensor=false", function(err, response, locationBody){
    locationBody = JSON.parse(locationBody);
    zip = jsonQuery('results[types=postal_code].address_components', {data: locationBody});
    zip = jsonQuery('value[types=postal_code].short_name', {data: zip}).value;
    console.log(zip);
    request('http://api.developer.sears.com/v2.1/products/search/Sears/json/keyword/' + query + '?apikey=' + secrets.searsKey, function(error, resp, body){
      if (error) {
        res.send(error);
      } else {
        searchResults = JSON.parse(body);
        getLocalProducts(searchResults, zip, function(products){
             res.send(products);
          });
      }
    })
  })
}
