
var request = require('request');
var secrets = require('../../secrets');

module.exports = {
  getQuote: submitDelivery 
}


function formatAddress(address){
  return address.replace(/-/g, ' ');
}

function parseAddress(address){
  return address.replace(/\s/g, '-');
}

function toTitleCase(str){
  return str.replace(/\w\S*/g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function submitDelivery(req, res){
  var dropOff_latlong = req.swagger.params.drop_off_latlong.value,
      pickup_store = req.swagger.params.pickup_store_number.value,
      manifest = req.swagger.params.manifest.value,
      custPhone = req.swagger.params.phone_number.value,
      quoteId = req.swagger.params.quote_id.value;
      dropoffUrl,
      pickupUrl,
      pickup_address,
      dropoff_address;
  dropoffUrl = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + dropoff_latlong + "&sensor=false";
  request(dropoffUrl, function(error, response, dropOffBody){
    dropOffBody = JSON.parse(dropOffBody);
    dropoff_address =dropOffBody.results[0].formatted_address.slice(0,-5);
    console.log(dropoff_address)

    pickupUrl = 'http://api.developer.sears.com/v2.2/stores/storeInfo/Sears/json/unitnumber/' + pickup_store + '?apikey=' + secrets.searsKey;
    request(pickupUrl, function (error, response, pickupBody) {
      pickupBody = JSON.parse(pickupBody);
      var storeAddressInfo = pickupBody.showStoreInfo.getStoreInfo.stores.storeLocation[0].location.address;
      storeAddress = toTitleCase(storeAddressInfo.streetAddress) + ', ' + toTitleCase(storeAddressInfo.city) + ', ' + storeAddressInfo.state + ' ' + storeAddressInfo.zipCode;

      //dropoff_address = '4315 Wallingford Ave N, Seattle, WA 98103';
      //storeAddress = '1320-1322 North 41st Street, Seattle, WA 98103';
      var formData = {
        dropoff_address: dropoff_address, 
        pickup_address: storeAddress
      };
      console.log(formData);
      var quoteUrl = 'https://' + secrets.postmatesKey + ':@api.postmates.com/v1/customers/' + secrets.postmatesCustomerId + '/delivery_quotes';
      console.log(quoteUrl, '\n', dropoff_address, '\n', storeAddress);
      
      request.post({ url: quoteUrl,
          form:formData}, function(error, resp, body){
        if (error) {
          console.log('error: ', error)
          res.send(error);
        } else {
          res.send(JSON.parse(body));
        }      
      })
    })
  })
}
