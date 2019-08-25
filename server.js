

const express = require("express");
const bodyParser = require("body-parser");
const request = require('request');
let fs = require ('fs');
let https = require ('https');
let ejs = require('ejs');
//const CognitiveServicesCredentials = require("ms-rest-azure").CognitiveServicesCredentials;
//const TextAnalyticsAPIClient = require("azure-cognitiveservices-textanalytics");




const app = express();
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({
  extended: true
}));

var responseArray = [];
var keyPhrases = [];
var answerReceived = "";
var questionReceived = "";

app.get('/', (req, res) => {
  res.render('index', {bot_answer: answerReceived, bot_followup: questionReceived});
});

app.listen(3000, function() {
  console.log("server is running on port 3000");
});

// final working Code


let host = "firstbot.azurewebsites.net";

// NOTE: Replace this with a valid endpoint key.
// This is not your subscription key.
// To get your endpoint keys, call the GET /endpointkeys method.
let endpoint_key = "1cd08387-6b86-422e-ab16-0c15b4468261";

// NOTE: Replace this with a valid knowledge base ID.
// Make sure you have published the knowledge base with the
// POST /knowledgebases/{knowledge base ID} method.
let kb = "b859dec7-a364-4bb8-9aff-856c10be9cf3";

let method = "/qnamaker/knowledgebases/" + kb + "/generateAnswer";

var question = {
    'question': 'Hello',
    //'top': 3
};



// callback is the function to call when we have the entire response.
let response_handler = function (callback, response) {
    let body = '';
    response.on ('data', function (d) {
        body += d;
    });
    response.on ('end', function () {
// Call the callback function with the status code, headers, and body of the response.
		callback ({ status : response.statusCode, headers : response.headers, body : body });
    });
    response.on ('error', function (e) {
        console.log ('Error: ' + e.message);
    });
};

// Get an HTTP response handler that calls the specified callback function when we have the entire response.
let get_response_handler = function (callback) {
// Return a function that takes an HTTP response, and is closed over the specified callback.
// This function signature is required by https.request, hence the need for the closure.
	return function (response) {
		response_handler (callback, response);
	}
}

// callback is the function to call when we have the entire response from the POST request.
let post = function (path, content, callback) {
	let request_params = {
		method : 'POST',
		hostname : host,
		path : path,
		headers : {
			'Content-Type' : 'application/json',
			'Content-Length' : Buffer.byteLength(content),
			'Authorization' : 'EndpointKey ' + endpoint_key,
		}
	};

// Pass the callback function to the response handler.
	let req = https.request (request_params, get_response_handler (callback));
	req.write (content);
	req.end ();
}

// callback is the function to call when we have the response from the /knowledgebases POST method.
let get_answers = function (path, req, callback) {
// Send the POST request.
	post (path, req, function (response) {
		callback (response.body);
	});
};


let pretty_print_answer = function (s) {
	//return JSON.stringify(JSON.parse(s), null, 4);
  var data = JSON.parse(s);
  return data.answers[0].answer;
  //return data.answers["answer"];
};

let pretty_print_question = function (s) {
	//return JSON.stringify(JSON.parse(s), null, 4);
  var data = JSON.parse(s);
  if(data.answers[0].context.prompts[0] && data.answers[0].context.prompts[0].displayText){
    return data.answers[0].context.prompts[0].displayText;
  } else {
    return "";
  }
  //return data.answers["answer"];
};


app.post("/", function(req,res){
  question.question = req.body.quesFromUser;
  responseArray.push(req.body.quesFromUser);
  // Convert the request to a string.
  // here calling our API to get answer for our question

  let content = JSON.stringify(question);
  get_answers (method, content, function (result) {
  // Write out the response from the /knowledgebases/create method.
    answerReceived = pretty_print_answer(result);
//  	console.log (pretty_print_answer(result));
    questionReceived = pretty_print_question(result);
    // now checking if enough responses received
    if(responseArray.length >= 3){
      var str = "";
      for(var i = 0; i < responseArray.length; ++i){
        str = str + responseArray[i] + ".";
      }
      var posting = {
        "documents" : [
          {
            "id": "1",
            "language": "en",
            "text": str
          }
        ]
      };
      console.log(str);
      const options = {
        url: "https://firsttextana.cognitiveservices.azure.com/text/analytics/v2.1/keyPhrases",
        headers: {
          'Ocp-Apim-Subscription-Key': 'd0a510ba5ecb4882947f86028fde3b18' ,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(posting)
      };
      var jsonResponse = "";
      request.post(options, (error, response, body) => {
        if (error) {
          console.log('Error: ', error);
          return;
        }
        jsonResponse = JSON.parse(body);
        console.log('JSON Response\n');
        keyPhrases = jsonResponse.documents[0].keyPhrases;
        console.log(jsonResponse.documents[0].keyPhrases);
        res.render("ready");
      });

    } else{
      res.redirect("/");
    }
  });
});

keyPhrases.push("motivation", "memes", "jokes", "motivational quotes");

var resultsArray = [];
app.post("/resultImages", function(req, res){
  var querryArray = [];
  var len = keyPhrases.length;
  for(var i = 0; i < 20; ++i){
    var rando = Math.floor(Math.random() * len);
    querryArray.push(keyPhrases[rando]);
  }

     const SUBSCRIPTION_KEY = 'a1e1e52d233f4de2b1dfffec98bd55ab';

function bingWebSearch(query) {
  https.get({
    hostname: 'canadacentral.api.cognitive.microsoft.com',
    path:     '/bing/v7.0/images/search?q=' + encodeURIComponent(query),
    headers:  { 'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY },
  }, res => {
    let body = '';
    res.on('data', part => body += part);
    res.on('end', () => {
      for (var header in res.headers) {
        if (header.startsWith("bingapis-") || header.startsWith("x-msedge-")) {
  //        console.log(header + ": " + res.headers[header]);
        }
      }
      var index = Math.ceil(Math.random() * 10);

  //    console.log('\nJSON Response:\n');
      var JSONres = JSON.parse(body);
    //  console.dir(JSON.parse(body), { colors: false, depth: null });
    //console.log(JSONres.value[index].thumbnailUrl);
    resultsArray.push(JSONres.value[index].thumbnailUrl);
  });
    res.on('error', e => {
      console.log('Error: ' + e.message);
      throw e;
    });
  });
}

//bingWebSearch("motivational");
for(var i = 0; i < 20; ++i){
  let term = querryArray[i];
  bingWebSearch(term);
}

res.redirect("/search.ejs");
// res.render("search", {resultsArray:resultsArray});
});

app.get("/search.ejs", function(req, res){
  res.render("search", {resultsArray:resultsArray});
});
