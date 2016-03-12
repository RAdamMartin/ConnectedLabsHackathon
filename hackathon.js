var token = "42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5";
var devKey = "f9395b6cbc1896eb5a93f9e5fb28f033";

var boardId = "56e41c245958f895130cb056";

var my_lists = 'https://api.trello.com/1/boards/56e41c245958f895130cb056?lists=open&list_fields=name&fields=name,desc&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5'
var my_cards_and_lists = 'https://api.trello.com/1/boards/56e41c245958f895130cb056?cards=all&card_fields=idList,closed,desc,due,name&lists=open&list_fields=name&fields=name,desc&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5'

const https = require('https');

exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.6e3fa146-e20b-40c5-ac13-8dac152d78ef") {
             context.fail("Invalid Application ID");
        }


        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("MyColorIsIntent" === intentName) {
        // setColorInSession(intent, session, callback);
        listCardsOnList(intent, session, callback);
        // getWelcomeResponse(callback);
    } else if ("WhatsMyColorIntent" === intentName) {
        getColorFromSession(intent, session, callback);
        // getWelcomeResponse(callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    //var req = https.get('https://api.trello.com/1/boards/56e41c245958f895130cb056?lists=open&list_fields=name&fields=name,desc&key=f9395b6cbc1896eb5a93f9e5fb28f033',
    https.get(my_lists,
                  function(res){
                      res.on('data', function (chunk) {
                        var board = JSON.parse(chunk);
                        var sessionAttributes = {};
                        var cardTitle = "Welcome";
                        var speechOutput = '';
                        var lists = board.lists;
                        var cards = board.cards;
                        sessionAttributes = {
                            board : board,
                            lists : lists,
                            cards : cards
                        };
                        speechOutput = getListNames(sessionAttributes, 5);
                        // If the user either does not reply to the welcome message or says something that is not
                        // understood, they will be prompted again with this text.
                        var repromptText = "You can ask for cards from lists or by due date.  Or you can modify your cards and lists!  For example, say: What's due today?";
                        var shouldEndSession = false;

                        callback(sessionAttributes,
                            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                      });
                });
}

function listCardsOnList(intent, session, callback){
    var cardTitle = intent.name;
    var name = intent.slots.Color;
    var listId = ''
    var repromptText = "";
    var shouldEndSession = false;
    var speechOutput = "";

    repromptText = "I'm not sure what your favorite color is. You can tell me your " +
    "favorite color by saying, my favorite color is red";    

    if (name) {
        var favoriteColor = toTitleCase(name.value);
        listId = getListId(session.attributes, favoriteColor);
    } else {
        speechOutput = "I didn't understand that name. Please try again";
    }
    
    if (listId == ''){
        speechOutput = "I can't find that list. Please try again";
    }

    
    callback(session,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getListId(attributes, list){
    for (var i = 0; i < attributes.lists.length; i++){
        if (toTitleCase(attributes.lists[i].name) == list){
            return attributes.lists[i].id;
        }
    }
    return '';
}

function getListNames(attributes, max){
    var names = "Your lists are: ";
    if (max == -1 || max > attributes.lists.length){
        max = attributes.lists.length;
    } else if (max < attributes.lists.length){
        names = 'Your first ' + max + ' lists are: ';
    }
    
    for (var i = 0; i < max; i++){
        names += toTitleCase((attributes.lists[i]).name);
        if (i < max -2){
            names += ', ';
        } else if (i == max -2){
            names += ', and ';
        }
    }
    return names;
}

function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function createFavoriteColorAttributes(favoriteColor) {
    return {
        favoriteColor: favoriteColor
    };
}

function getColorFromSession(intent, session, callback) {
    var favoriteColor;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (session.attributes) {
        favoriteColor = session.attributes.favoriteColor;
    }

    if (favoriteColor) {
        speechOutput = "Your favorite color is " + favoriteColor + ". Goodbye.";
        shouldEndSession = true;
    } else {
        speechOutput = "I'm not sure what your favorite color is, you can say, my favorite color " +
            " is red";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}