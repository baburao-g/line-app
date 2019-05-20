'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
var AWS = require('aws-sdk');
var uuidv4 = require('uuid/v4');

// create AWS SDK config from env variables
AWS.config.update({
  accessKeyId: "accessKeyId",
  secretAccessKey: "secretAccessKey",
  region: "us-east-1"
});

const lexruntime = new AWS.LexRuntime();
let userId = uuidv4();

// create LINE SDK config from env variables
const config = {
  channelAccessToken: 'y9t/8lqjQULyWDpgIyGPpYR926prKaM5NfzqI9UyBUyIxqLCwiPumIuQLqycdfvqsN93BD+EyXI2/KYPwHNbwGY+Ib5i4gsnWX2ViljOhYFw514YcuGHOBu2qZEaejXOcMjEKB5+VxvZEUoQ+sFjaQdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'd4ad94455611c07577b82fe0aeb3dfe6',
};
// create LINE SDK client
const client = new line.Client(config);

// create Express app
const app = express();

// webhook callback
app.post('/callback', line.middleware(config), (req, res) => {
  if (req.body.destination) {
    console.log("Destination User ID: " + req.body.destination);
  }

  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  // handle events separately
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  return client.replyMessage(
    token,
    texts.map((text) => ({ type: 'text', text }))
  );
};

// callback function to handle a single event
function handleEvent(event) {
  if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
    return console.log("Test hook recieved: " + JSON.stringify(event.message));
  }

  if (event.type === 'message' && (event.message && event.message.type === 'text')) {
    return handleText(event.message, event.replyToken, event.source);
  }
  else {
    replyText(replyToken, `Unknown event: ${JSON.stringify(event)}`);
    throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

async function handleText(message, replyToken, source) {
  let substrings = ['Book','book','Reserve','reserve'];
  if (new RegExp(substrings.join("|")).test(message.text)) {
    userId = uuidv4();
}
  var params = {
    botAlias: 'PrimeCabBook', /* required, has to be '$LATEST' */
    botName: 'BookAPrimeTrip', /* required, the name of you bot */
    inputText: message.text, /* required, your text */
    userId: userId, /* required, arbitrary identifier */
  };

  lexruntime.postText(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      replyText(replyToken, data.message)
    }            // successful response
  });
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
