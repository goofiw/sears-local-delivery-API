
var request = require('request');
var secrets = require('../../secrets');

module.exports = {
  getQuote: getQuote
}

function formatAddress(address){
  return address.replace(/-/g, ' ');
}

function getQuote(req, res){
  var pickup_address = req.swagger.params.pickup_address.value,
      dropoff_address = req.swagger.params.dropoff_address.value;
  request.post('https://' + secrets.postmatesKey + ':@api.postmates.com/v1/customers/' + secrets.postmatesCustomerId + '/delivery_quotes',
      {form:{dropoff_address: formatAddress(dropoff_address), pickup_address: formatAddress(pickup_address)}}, function(error, resp, body){
                                                                                                 console.log(resp);
    if (error) {
      console.log('error: ', error)
      res.send(error);
    } else {
      res.send(JSON.parse(body));
    }      
  })
}
