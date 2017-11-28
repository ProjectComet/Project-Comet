//This is the account application

var express = require('express');
var request = require('request');
var bodyparser = require('body-parser');
var http = require('http');

var app = express();

app.use(express.static('website'));
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());


var ODMHost = process.env.ODM_HOST;
var ODMCreds = process.env.ODM_CREDS;
var cloudantHost = process.env.CLOUDANT_HOST;
var cloudantCreds = process.env.CLOUDANT_CREDS;

//UPDATE ID
app.put('/account/id/:id', function(appRequest, res){
	var options = { method: 'PUT',
	  url: cloudantHost + '/account/' + req.params.id,
	  headers: 
	   {
	     'cache-control': 'no-cache',
	     authorization: cloudantCreds,
	     'content-type': 'application/json' },
	  body: 
	  appRequest.body.driver,
	  json: true };

	request(options, function (error, response, body) {
	  if (error) throw new Error(error);

	  console.log(body);
	  res.end(body);
	});
})

//Show Detail on a User
app.get('/account/id/:id', function(req, res){
	var options = {
		method: 'GET',
		url: cloudantHost + '/account/'+req.params.id,
		qs: {include_docs: 'true', conflicts: 'true'},
		headers:
		{
			'cache-control': 'no-cache',
			authorization: cloudantCreds,
			'content-type': 'application/json' } };
	
	request(options, function (error, response, body) {
	  if (error) throw new Error(error);

 	 console.log(body);
 	 res.end(body);
	});

})

//GET GUID
app.get('/account/guid', function(req, res){

	var options = {
		method: 'GET',
		url: cloudantHost + '/_uuids',
		qs: {count: '1'},
		headers:
		{
			'cache-control': 'no-cache',
			authorization: cloudantCreds,
			'content-type': 'application/json' } };
	
	request(options, function (error, response, body) {
	  if (error) throw new Error(error);

 	 console.log(body);
 	 res.end(body);
	});

})

//List All Users
app.get('/account/list', function (req, res) {
	var options = { method: 'GET',
  		url: cloudantHost + '/account/_all_docs',
  		qs: { include_docs: 'true', conflicts: 'true' },
  		headers: 
   		{ 
     		'cache-control': 'no-cache',
     		authorization: cloudantCreds,
     		'content-type': 'application/json' } };

	request(options, function (error, response, body) {
  		if (error) throw new Error(error);

  		console.log(body);
    	res.end(body);
	});
})

//ADD A USER
//I can add comments here to document my changes!
app.post('/account', function (appRequest, res) {
	var ODMoptions = { method: 'POST',
  	url: ODMHost  + '/DecisionService/rest/v1/UWAutoRuleApp/DriverValidationRuleset',

  	headers: 
   		{ 'cache-control': 'no-cache',
     		authorization: ODMCreds,
     		'content-type': 'application/json' },
  	body: { autoRequestParam: 
   		appRequest.body},
  	json: true };
  	
  	console.log("here's the ODM URL:"+ODMHost);

	request(ODMoptions, function (error, response, ODMbody) {
		if (ODMbody.code === '500') {
  			var errorResponse = {};
  			console.log("responseFromODM:");
  			errorResponse.errorMessage = ODMbody;
  			var errorMessagesString = JSON.stringify(ODMbody);
  			res.end(errorMessagesString);
  			console.log(errorMessagesString);
  			
  		}else{
  			appRequest.body.driver.approved = ODMbody.autoResponseParam.approved;
  			appRequest.body.driver.reasons = ODMbody.autoResponseParam.messages;
  			console.log(ODMbody);
  		
  			var responseToConsumer = {};					
  		
	  		var cloudantOptions = { method: 'POST',
	  		url: cloudantHost + '/account',
	  		headers: 
	   			{ 
	     			'cache-control': 'no-cache',
	     			authorization: cloudantCreds,
					'content-type': 'application/json' },
	  		body: 
	   			appRequest.body.driver,
	  		json: true };

  		
  	request(cloudantOptions, function (error, response, body) {
  		if (ODMbody.code ==='500') {
  			var errorResponse = {};
  			console.log("responseFromCloudant:");
  			errorResponse.errorMessage = body;
  			var errorMessagesString = JSON.stringify(body);
  			res.end(errorMessagesString);
  			console.log(errorMessagesString);
  			
  		}else{
  			appRequest.body.driver.id = body.id;
  			var responseToConsumerString = JSON.stringify(appRequest.body.driver);
      		res.end(responseToConsumerString);
      		console.log(body);
  		}
  		
		});	
  		}
	});
});


//Delete User
app.delete('/account/id/:id', function (req, res){
	
	var options = { method: 'DELETE',
	  url: cloudantHost +'/account/'+req.params.id,
	  qs: { rev: req.query.rev },
	  headers: 
	   { 
	     'cache-control': 'no-cache',
	     authorization: cloudantCreds,
	     'content-type': 'application/json' }};

	request(options, function (error, response, body) {
	  if (error) throw new Error(error);

	  console.log(body);
      res.end(body);
	});
})

var server = app.listen(process.env.PORT,listening)

function listening() {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening at http://%s:%s", host, port);
  
}
