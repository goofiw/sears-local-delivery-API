var jsonQuery = require('json-query');
var Promise = require('bluebird');
var join = Promise.join;
var request = Promise.promisify(require('request'));
var secrets = require('../../secrets');

module.exports = {
  getProducts: getProducts
}


function getLocalProduct(partNumber, zip) {
  var localBody,
      storeInfo,
      url,
      radius = 50;
       url = 'http://api.developer.sears.com/v2.1/product/availability/pickup//Sears/json/' + partNumber + '/' + zip + '?maxDistance=' + radius + '&quantity=' + 1 + '&storeIndex=10&apikey=' + secrets.searsKey;
  return request(url).spread(function(response, localBody) {
  var storeInfo;
      localBody = JSON.parse(localBody);
      storeInfo = localBody.RefactorSPUPickupData.SPUStores; 
      if (storeInfo[0] && storeInfo[0].SPUAvailabilityMsg === "In Stock Today") {
        console.log('STORE INFO   \n\n\n');
        return storeInfo;
      }
  }).catch(function(e) {console.log(e);});
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

function merge(obj1, obj2){
  var obj3 = {};
  for (var i in obj1) { obj3[i] = obj1[i]}
  for (var i in obj2) { obj3[i] = obj2[i]}
  return obj3;
}

function getProducts(req, res){
  var query = req.swagger.params.keyword.value,
      searchResults,
      localResults = [],
      zip,
      cb,
      nearestStore,
      latlong = req.swagger.params.latlong.value;
  request("http://maps.googleapis.com/maps/api/geocode/json?latlng=" + latlong + "&sensor=false").spread(function(response, locationBody){
      locationBody = JSON.parse(locationBody);
      zip = jsonQuery('results[types=postal_code].address_components', {data: locationBody});
      zip = jsonQuery('value[types=postal_code].short_name', {data: zip}).value;
      request('http://api.developer.sears.com/v2.1/products/search/Sears/json/keyword/' + query + '?apikey=' + secrets.searsKey).spread(function(response, searchResults){
        searchResults = JSON.parse(searchResults);
        products = searchResults.SearchResults.Products;
        Promise.map(products, function(item){
        var partNumber = item.Id.PartNumber.replace(/P/, '');
          return getLocalProduct(partNumber, zip).then(function(data){
            return [data, item];
          });
        }).then(function(localResults) {
          return localResults.filter(function(n){ return n[0] != undefined});
        }).then(function(filteredResults) {
          return filteredResults.map(function(item){ 
            item[0] = item[0][0];
            item = merge(item[0], item[1]);
            return item;
          })
        })
        .then(function(results) { console.log('testing \n\n\n\n\n\n\n\n\n'); res.send( {data:results})})
          .catch(function(e){console.log(e);})

    })
  })                
}
