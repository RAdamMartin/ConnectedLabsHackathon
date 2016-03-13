var token = "42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5";
var devKey = "f9395b6cbc1896eb5a93f9e5fb28f033";

var boardId = "56e41c245958f895130cb056";
var dailyId = "56e4408fb254d9f1236f8d80";
var todoId = "56e49f558015cc9ceb75b59a";

var DAILY_GET = 'https://api.trello.com/1/lists/56e4408fb254d9f1236f8d80?cards=all&card_fields=idList,closed,desc,due,name&lists=open&list_fields=name&fields=name,desc&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5';

var TODO_GET = 'https://api.trello.com/1/lists/56e49f558015cc9ceb75b59a?cards=all&card_fields=idList,desc,due,name&lists=open&list_fields=name&fields=name,desc&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5';

var OPEN_CARDS_GET = 'https://api.trello.com/1/boards/56e41c245958f895130cb056?fields=&cards=open&card_fields=idList,closed,due,name&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5';

var ALL_CARDS_GET = 'https://api.trello.com/1/boards/56e41c245958f895130cb056?cards=all&card_fields=idList,closed,desc,due,name&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5';

var OTHER_ASSIGNMENTS_GET = 'https://api.trello.com/1/members/me?lists=open&boards=open&cards=open&card_fields=name,due,idList&fields=username&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5';


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


    switch(intentName){
        case "AMAZON.HelpIntent":
            getWelcomeResponse(callback);
            break;
        case "AMAZON.YesIntent":
            //TODO
            break;
        case "AMAZON.NoIntent":
            //TODO
            break;
        case "addCard":
            //TODO
            break;
        case "addDailyCard":
            //TODO
            break;
        case "postponeCard":
            //TODO
            break;
        case "completeCard":
            //TODO
            break;
        case "deleteCard":
            //TODO
            break;
        case "whatsDue":
            //TODO
            break;
        case "nextCard":
            //TODO
            break;
        case "previousCard":
            //TODO
            break;
        default :
            throw "Invalid intent"
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
    var speechOutput = 'Welcome to Alexa tasks with Trello.  Say "what\'s due today?" to find out what\'s due.';
    var repromptText = "You can also add tasks with due dates, or daily routine tasks.  For example, say add routine task make dinner to make a daily recurring task make dinner.";
    var shouldEndSession = false;
    var cardTitle = 'Welcome';

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
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

function getCardsFromList(intent, session, callback){
    //intent.slot.ListName
    https.get(my_cards_and_lists, function(res){
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
            // speechOutput = getListNames(sessionAttributes, 5);

            for(var i = 0; i < max; i++){
                if(list === intent.slot.ListName){
                    // for each(card in list){
                    //     cardList += intent.slot.CardName; 
                    // }
                }

            };
            // If the user either does not reply to the welcome message or says something that is not
            // understood, they will be prompted again with this text.
            var repromptText = "You can ask for cards from lists or by due date.  Or you can modify your cards and lists!  For example, say: What's due today?";
            var shouldEndSession = false;

            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        });
    });
}

function addCard(intent, session, callback){
    //Takes in card name and optional due date
    //If due date is null, sets session.attributes.cardName and return prompt
    //Else create card on to-do list
    
    var tempCardName = intent.slot.CardName;
    var tempDueDate = intent.slot.CardDue;
    
    if(tempDueDate === null){
        
    }
    
}

function addDueDate(intent, session, callback){
    //Asks if the user wants to make the task recurring
    //If yes - the task goes to DailyTasks list
    //Else - To-Do list


}

function addRoutine(intent, session, callback){
    //Takes in card name
    //Creates card on daily task list
}


function completeCard(intent, session, callback){
    //Takes in card name
    //If card is on daily move to completed, if on to-do delete
    
    
    
}


function resetDaily(intent, session, callback){
    //Move all cards from completed to daily
    
    
    
}

function getNextDue(intent, session, callback){
    //If session.cardIndex === undefined, send get request
    //Find next card on Daily list or with due date of today and return
    
    
    
}

function processUserResponse(intent, session, callback){
    //Check if intent response is NEXT or COMPLETE
    //Take appropriate action
    
    
    
}

function getAssigned(intent, session, callback){
    //BONUS
    
    
    
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