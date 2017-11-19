"use strict";

const functions = require("firebase-functions");
const axios = require("axios");

const env = require("./config.json");

console.log(env.subscriptionKey);

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    // Log the request header and body coming from API.AI to help debug issues.
    // See https://api.ai/docs/fulfillment#request for more.
    console.log("Request headers: " + JSON.stringify(request.headers));
    console.log("Request body: " + JSON.stringify(request.body));

    // An action is a string used to identify what tasks needs to be done
    // in fulfillment usally based on the corresponding intent.
    // See https://api.ai/docs/actions-and-parameters for more.
    let action = request.body.result.action;

    // Parameters are any entites that API.AI has extracted from the request.
    // See https://api.ai/docs/actions-and-parameters for more.
    const parameters = request.body.result.parameters;

    // Contexts are objects used to track and store conversation state and are identified by strings.
    // See https://api.ai/docs/contexts for more.
    const contexts = request.body.result.contexts;

    // Just testing
    console.log("Action: " + action);
    console.log("Params: " + parameters["Joke-subject"]);
    console.log("Contexts: " + contexts);

    // Initialize JSON we will use to respond to API.AI.
    let responseJson = {};

    // Create a handler for each action defined in API.AI
    // and a default action handler for unknown actions
    const actionHandlers = {
      "input.welcome": () => {
        // The default welcome intent has been matched, Welcome the user.
        // Define the response users will hear
        responseJson.speech = "Hello, welcome to my API.AI agent";
        // Define the response users will see
        responseJson.displayText = "Hello! Welcome to my API.AI agent :-)";
        // Send the response to API.AI
        response.json(responseJson);
      },
      "input.unknown": () => {
        // The default fallback intent has been matched, try to recover.
        // Define the response users will hear
        responseJson.speech = "I'm having trouble, can you try that again?";
        // Define the response users will see
        responseJson.displayText =
          "I'm having trouble :-/ can you try that again?";
        // Send the response to API.AI
        response.json(responseJson);
      },
      "input.time": () => {
        const now = new Date();

        responseJson.speech = "The time in England is " + now;
        responseJson.displayText = "The time in England is " + now;
        response.json(responseJson);
      },
      "input.dad": (request, response) => {
        console.log("Dad joke requested...");

        var config = {
          headers: { "User-Agent": "request", Accept: "application/json" }
        };

        const subject = parameters["Joke-subject"];

        if (!subject) {
          axios
            .get("http://icanhazdadjoke.com/", config)
            .then(function(res) {
              console.log("Done request");
              console.log(res.data);
              responseJson.speech = res.data.joke;
              responseJson.displayText = res.data.joke;
              response.json(responseJson);
            })
            .catch(function(error) {
              console.log(error);
            });
        } else {
          axios
            .get(
              "http://icanhazdadjoke.com/search?term=" +
                encodeURIComponent(subject),
              config
            )
            .then(function(res) {
              console.log("Done request");
              console.log(res.data);
              // console.log(res.data.results[0].joke);
              if (res.data.results[0]) {
                const resultsCount = res.data.results.length;

                const whichResultNumber = getRandomInt(0, resultsCount - 1);

                responseJson.speech = res.data.results[whichResultNumber].joke;
                responseJson.displayText =
                  res.data.results[whichResultNumber].joke;
                response.json(responseJson);
              } else {
                responseJson.speech =
                  "I am sorry I couldn't find any dad jokes about " +
                  subject +
                  "... Hi Sorry I Couldn't Find Any Dad Jokes About " +
                  titleCase(subject) +
                  "... I'm Dad.";
                responseJson.displayText =
                  "I am sorry I couldn't find any dad jokes about " +
                  subject +
                  "... Hi Sorry I Couldn't Find Any Dad Jokes About " +
                  titleCase(subject) +
                  "... I'm Dad.";
                response.json(responseJson);
              }
            })
            .catch(function(error) {
              console.log(error);
            });
        }
      },
      default: () => {
        // This is executed if the action hasn't been defined.
        // Add a new case with your action to respond to your users' intent!
        responseJson.speech =
          "This message is from API.AI's Cloud Functions for Firebase editor!";
        responseJson.displayText =
          "This is from API.AI's Cloud Functions for Firebase editor!";

        // Send the response to API.AI
        response.json(responseJson);
      }
    };

    // If the action is not handled by one of our defined action handlers
    // use the default action handler
    if (!actionHandlers[action]) {
      action = "default";
    }

    // Map the action name to the correct action handler function and run the function
    actionHandlers[action](request, response);
  }
);

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function titleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map(function(word) {
      return word.replace(word[0], word[0].toUpperCase());
    })
    .join(" ");
}
