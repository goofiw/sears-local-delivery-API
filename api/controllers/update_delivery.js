
var request = require('request');
var secrets = require('../../secrets');

module.exports = {
  getUpdate: getUpdate 
}

function getUpdate(req, res){
  var deliveryId = req.swagger.params.delivery_id.value;

  var quoteUrl = 'https://' + secrets.postmatesKey + ':@api.postmates.com/v1/customers/' + secrets.postmatesCustomerId + '/deliveries/' + deliveryId;
  
  request(quoteUrl, function(error, resp, body){
    if (error) {
      console.log('error: ', error)
      res.send(error);
    } else {
      res.send(JSON.parse(body));
    }      
  })
}
