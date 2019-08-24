

const express = require("express");
const bodyParser = require("body-parser");
const request = require('request');
let fs = require ('fs');
let https = require ('https');
let ejs = require('ejs');

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

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
    'question': 'What is your name',
    'top': 3
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
	console.log ('Calling ' + host + path + '.');
// Send the POST request.
	post (path, req, function (response) {
		callback (response.body);
	});
};


let pretty_print_answer = function (s) {
	//return JSON.stringify(JSON.parse(s), null, 4);
  console.log(JSON.stringify(JSON.parse(s), null, 4));
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
  // Convert the request to a string.
  // here calling our API to get answer for our question

  let content = JSON.stringify(question);
  get_answers (method, content, function (result) {
  // Write out the response from the /knowledgebases/create method.
    answerReceived = pretty_print_answer(result);
//  	console.log (pretty_print_answer(result));
    questionReceived = pretty_print_question(result);
    res.redirect("/");
  });

});
