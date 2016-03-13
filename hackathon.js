var token = "42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5";
var devKey = "f9395b6cbc1896eb5a93f9e5fb28f033";

var boardId = "56e41c245958f895130cb056";
var dailyId = "56e4408fb254d9f1236f8d80";
var todoId = "56e49f558015cc9ceb75b59a";

var DAILY_GET = 'https://api.trello.com/1/lists/56e4408fb254d9f1236f8d80?cards=all&card_fields=idList,closed,desc,due,name&lists=open&list_fields=name&fields=name,desc&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5';

var TODO_GET = 'https://api.trello.com/1/lists/56e49f558015cc9ceb75b59a?cards=all&card_fields=idList,desc,due,name&lists=open&list_fields=name&fields=name,desc&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5';

var OPEN_CARDS_GET = 'https://api.trello.com/1/boards/56e41c245958f895130cb056?fields=&cards=open&card_fields=idList,due,name&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5';

var CLOSED_CARDS_GET = 'https://api.trello.com/1/lists/56e4408fb254d9f1236f8d80?cards=closed&card_fields=idList,closed&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5';

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
        //case "AMAZON.YesIntent":
            //TODO
        //    break;
        //case "AMAZON.NoIntent":
            //TODO
        //    break;
        case "AddCard":
            addCard(intent, session, callback);
            break;
        case "AddDailyCard":
            addRoutine(intent, session, callback);
            break;
        case "PostponeCard":
            //TODO
            break;
        case "CompleteCard":
            completeCard(intent, session, callback);
            break;
        case "DeleteCard":
            //TODO
            break;
        case "WhatsDue":
            whatsDue(intent, session, callback);
            break;
        case "NextCard":
            getNext(intent, session, callback);
            break;
        case "PreviousCard":
            getPrevious(intent, session, callback);
            break;
        case "GetAssigned":
            getAssigned(intent, session, callback);
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


function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}


function addCard(intent, session, callback){
    //Takes in card name and optional due date
    //If due date is null, sets session.attributes.cardName and return prompt
    //Else create card on to-do list
    //intent.slot.CardName
    
    var tempCardName = intent.slots.CardName.value;
    cardName = tempCardName.replace(/ /g, "%20");
    var dueDate = intent.slots.CardDue.value;
    //var listId = intent.slot.ListId;
    var postTrelo = "";
    
    console.log("1");
    if(dueDate !== undefined){
        postTrello = "/1/cards?name=" + cardName + "&idList=" + todoId + "&due=" + dueDate + "&urlSource=" + null + "&key=" + devKey + "&token=" + token;
        
    console.log("OPTIONS");
    var options = {
      //protocol: 'https:',
      hostname: 'api.trello.com',
      port:443,
      path: postTrello,
      method: 'POST',
      headers: {'Content-Type': 'application/form-data'}
    };
    console.log(postTrello);
    var req = https.request(options, function(res) {
        res.on('data', function(chunk){
        //var body = JSON.parse(chunk);
        
    console.log(chunk);
    //req.write("https://trello.com/1/cards?name=TestCard&idList=56e49f558015cc9ceb75b59a&due=null&urlSource=null&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5")
        var cardTitle = "New";
        var speechOutput = "The task has been added to your to-do list";
        var repromptText = "Please, talk to me, I am so lonely";
        var sessionAttributes = {};
        var shouldEndSession = false;
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));            
            
        });

    
    });
    
    
    req.end();
    }
    else { 
    console.log("NO DUE DATE");
        var sessionAttributes = {
            'cardName' : cardName
        }
        
        var cardTitle = "New";
        var speechOutput = "Please set due date for this task";
        var repromptText = "You are probably overthinking it";
        var shouldEndSession = false;
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
    
    
    //var link = "https://trelo.com/";
    
    // write data to request body
    
//https://trello.com/1/cards/name=TestCard&idList=56e49f558015cc9ceb75b59a&due=null&urlSource=null&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5
}

function addDueDate(intent, session, callback){
    //Asks if the user wants to make the task recurring
    //If yes - the task goes to DailyTasks list
    //Else - To-Do list
    
    console.log("ADD DUE DATE");
    intent.slots.CardName = session.sessionAttributes.CardName;
    
    if(intent.slots.CardName !== undefined){
        addCard(intent, session, callback);
    } else {
        var sessionAttributes = { };
        
        var cardTitle = "Error";
        var speechOutput = "Incorrect date. Please set due date for this task";
        var repromptText = "You are probably overthinking it";
        var shouldEndSession = false;
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        
    }
    
    
}



function addRoutine(intent, session, callback){
    //Takes in card name
    //Creates card on daily task list
    var tempCardName = intent.slots.CardName.value;
    cardName = tempCardName.replace(/ /g, "%20");
    //var dueDate = intent.slots.CardDue.value;
    //var listId = intent.slot.ListId;
    var postTrelo = "";
 
    postTrello = "/1/cards?name=" + cardName + "&idList=" + dailyId+ "&due=" + null + "&urlSource=" + null + "&key=" + devKey + "&token=" + token; 
    
    
    //var link = "https://trelo.com/";
    
    console.log("2");
    var options = {
      //protocol: 'https:',
      hostname: 'api.trello.com',
      port:443,
      path: postTrello,
      method: 'POST',
      headers: {'Content-Type': 'application/form-data'}
    };
    console.log(postTrello);
    var req = https.request(options, function(res) {
        res.on('data', function(chunk){
        //var body = JSON.parse(chunk);
        
    console.log(chunk);
    //req.write("https://trello.com/1/cards?name=TestCard&idList=56e49f558015cc9ceb75b59a&due=null&urlSource=null&key=f9395b6cbc1896eb5a93f9e5fb28f033&token=42150356c66b2564943af3e6e59bc4000c374574f5b1c8d9cfb8245ff12188d5")
        var cardTitle = "New";
        var speechOutput = "The task has been added to your to-do list";
        var repromptText = "Please, talk to me, I am so lonely";
        var sessionAttributes = {};
        var shouldEndSession = false;
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));            
            
        });

    
    });
    
    req.end();
}



function completeCard(intent, session, callback){
    var ind = session.attributes.cardIndex
    if (ind === undefined){
        whatsDue(intent,session,callback);
    } else {
        var cardId = session.attributes.cards[ind].id;
        var listId = session.attributes.cards[ind].idList;
    
        var putTrello = "/1/cards/"+cardId+"?closed=true&key=" + devKey + "&token=" + token; 
        console.log(putTrello);
        
        var options = {
              hostname: 'api.trello.com',
              port:443,
              path: putTrello,
              method: 'PUT'
            };
        var req = https.request(options, function(res) {
            res.on('data', function(chunk){
                console.log('a');
                var speechOutput = 'Completed task ' + session.attributes.cards[ind].name;
                var repromptText = 'Say Next, Previous or Complete';
                var shouldEndSession = false;    
                
                session.attributes.cards = session.attributes.cards.filter(function(card){return card.id != cardId});
                console.log(session.attributes.cards);
                callback(session.attributes, buildSpeechletResponse("Complete", speechOutput, repromptText, shouldEndSession));
            });
        });
        req.end();
    }
}

function resetDaily(intent, session, callback){
    //Move all cards from completed to daily
    var options = {
          hostname: 'api.trello.com',
          port:443,
          path: '',
          method: 'PUT'
        };
    https.get(CLOSED_CARDS_GET,
              function(res) {
                  res.on('data', 
                         function(chunk) {
                            var list = JSON.parse(chunk);
                            var cardTitle = "Reset";
                            var speechOutput = "Restarted your daily tasks!";
                            var repromptText = "Say what's due today to find out what you have to do!";
                            var cards = list.cards;
                            var shouldEndSession = false;
                            var i;
                            for (i = 0; i < cards.length; i++){
                                var cardId = cards[i].id;
                                options.path = "/1/cards/"+cardId+"?closed=false&key=" + devKey + "&token=" + token; 
                                var req = https.request(options, function(res) {
                                    res.on('data', function(chunk){
                                    });
                                });
                                req.end();
                            }
                            callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                          });
              });
}

function whatsDue(intent, session, callback){
    var d = new Date();
    var today = new Date();
    var dueDate = intent.slots.DueDate;
    var isToday = true;

    if (dueDate === undefined){
        d = new Date(d.toDateString());
    } else {
        d = new Date(dueDate.value);
        today = new Date(today.toDateString());
        if (d.getTime() != today.getTime()){
            isToday = false;
        }
    }
    
   
    
    https.get(OPEN_CARDS_GET,
              function(res) {
                  res.on('data', 
                         function(chunk) {
                            var board = JSON.parse(chunk);
                            var cardTitle = "Due";
                            var speechOutput = "";
                            var repromptText = "";
                            var cards = board.cards;
                            var shouldEndSession = false;
                            d=d.getTime();
                            var sessionAttributes = {cardIndex : -1, cards : cards, dueTime : d};
                            var match = false;
                            var i;
                            for (i = 0; i < cards.length; i++){
                                cardDate = new Date(cards[i].due);
                                cardDate = new Date(cardDate.toDateString());
                                if ((cards[i].idList == dailyId && isToday) || (cards[i].due != "null" && cardDate.getTime() == d)){
                                    match = true;
                                    break;
                                }
                            }
                            if (match){
                                speechOutput = cards[i].name;
                                repromptText = "Say Next, Previous or Complete";
                                sessionAttributes.cardIndex = i;
                            } else {
                                speechOutput = "All done!";
                                shouldEndSession = true;
                            }
                            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                          });
              });
}

function getNext(intent, session, callback){
    //If session.cardIndex === undefined, send get request
    //Find next card on Daily list or with due date of today and return
    if (session.cardIndex == -1){
        whatsDue(intent,session,callback);
    } else {
        d=session.attributes.dueTime;
        cards = session.attributes.cards;
        var match = false;
        var i = session.attributes.cardIndex+1;
        var shouldEndSession = false;
        for (;i < cards.length; i++){
            cardDate = new Date(cards[i].due);
            if (cards[i].idList == dailyId || (cards[i].due != "null" && cardDate.getTime() == d)){
                match = true;
                break;
            }
        }
        if (match){
            speechOutput = cards[i].name;
            repromptText = "Say Next, Previous or Complete";
            session.attributes.cardIndex = i;
        } else {
            speechOutput = "That's all the tasks!";
            session.attributes.cardIndex = i;
        }
        callback(session.attributes, buildSpeechletResponse("Next", speechOutput, repromptText, shouldEndSession));
    }
    
}

function getPrevious(intent, session, callback){
    //If session.cardIndex === undefined, send get request
    //Find next card on Daily list or with due date of today and return
    if (session.cardIndex == -1){
        whatsDue(intent,session,callback);
    } else {
        d=session.attributes.dueTime;
        cards = session.attributes.cards;
        var match = false;
        var i = session.attributes.cardIndex-1;
        var shouldEndSession = false;
        for (;i >=0; i--){
            cardDate = new Date(cards[i].due);
            if (cards[i].idList == dailyId || (cards[i].due != "null" && cardDate.getTime() == d)){
                match = true;
                break;
            }
        }
        if (match){
            speechOutput = cards[i].name;
            repromptText = "Say Next, Previous or Complete";
            session.attributes.cardIndex = i;
        } else {
            speechOutput = "Back at the beginning!";
        }
        callback(session.attributes, buildSpeechletResponse("Next", speechOutput, repromptText, shouldEndSession));
    }
    
}

function getAssigned(intent, session, callback){
    var d = new Date();
    var today = new Date();
    var dueDate = intent.slots.DueDate;
    var isToday = true;

    if (dueDate === undefined){
        d = new Date(d.toDateString());
    } else {
        d = new Date(dueDate.value);
        today = new Date(today.toDateString());
        if (d.getTime() != today.getTime()){
            isToday = false;
        }
    }
    https.get(OTHER_ASSIGNMENTS_GET,
              function(res) {
                  res.on('data', 
                         function(chunk) {
                            var board = JSON.parse(chunk);
                            var cardTitle = "Due";
                            var speechOutput = "";
                            var repromptText = "";
                            var cards = board.cards;
                            var shouldEndSession = false;
                            d=d.getTime();
                            var sessionAttributes = {cardIndex : -1, cards : cards, dueTime : d};
                            var match = false;
                            var i;
                            for (i = 0; i < cards.length; i++){
                                cardDate = new Date(cards[i].due);
                                cardDate = new Date(cardDate.toDateString());
                                if (cards[i].due != "null" && cardDate.getTime() == d){
                                    match = true;
                                    break;
                                }
                            }
                            if (match){
                                speechOutput = cards[i].name;
                                repromptText = "Say Next, Previous or Complete";
                                sessionAttributes.cardIndex = i;
                            } else {
                                speechOutput = "All done!";
                                shouldEndSession = true;
                            }
                            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                          });
              });
}
// --------------- Helpers that build all of the responses -----------------------


function posBuilderNoDue(cardName, cardDesc, listId){
    var postTrello = "https://api.trello.com/1/cards?key=" + devKey + "&token=" + token + "&name=" + CARDNAME + "&desc=" + CARDDESC + "&idList=" + listId;
}

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