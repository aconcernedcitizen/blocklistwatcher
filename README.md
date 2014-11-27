blocklistwatcher
================

An experiment to toy with learning node.js. Designed to monitor a twitter blocklist and alert users that they are on the list.
Can optionally monitor to alert them to being removed from the list as well.

This is a node.js module, and is generally used via calling Main and passing in a configuration object.

Example:<pre>
var app = require("blocklistwatcher");

app.Main({
        DBFile: "users.db", //File to store user data in
        BlockListURL: "https://blocktogether.org/show-blocks/[blocklist id]",
        SecondsBetweenPages: 5 * 60, //Seconds between page fetches (try to be nice to the blocktogether.org server)
        HoursBetweenUserLoads: 24, //Hours between full user reloads (again, be nice to blocktogether.org)
        SecondsBetweenTweets: 90, //Seconds between sending out tweets (more than 60 should prevent twitter api limit problems)
        HoursBetweenUserCleanups: 6, //Hours between user cleanup cycles (how often it resets anyone not seen in the last 48 hours on the list)
        SecondsBetweenMessageChecks: 90, //Seconds between making a request for mentions (more than 60 should prevent twitter api limit problems)
        MessageTemplateOnList: "@{$username} just want to let you know you might be on a block list. For more info: {$infourl}", //Has a few variables, this is the string to generate the message to tweet. 140 char limit
        MessageTemplateOffList: "@{$username} it looks like you might not be on the block list anymore, since {$lastseen}", //Same as above, this is for being removed from the list
        TwitterConsumerKey: "[Insert Twitter Consumer Key]",
        TwitterConsumerSecret: "[Insert Twitter Consumer Secret]",
        TwitterAccessToken: "[Insert Twitter Access Token]",
        TwitterAccessSecret: "[Insert Twitter Access Token Secret]",
        InfoURL: "[URL for users to learn more at]" //Hopefully a url explaining what this bot was doing, letting the user know what is going on, and offering them the ability to message the bot for control options
        LogFile: "error.log", //File to log general errors too
        ExceptionLog: "exception.log" //If an exception occurs it will be stored here
});
</pre>

Control:
- mentioning the bot and using the string "ignore" anywhere in the message will cause the bot to no longer send messages to the user sending the mention
- mentioning the bot and using the string "monitor" anywhere in the message will cause the bot to continue to send updates to the user about being on or off the list (it will only ever send 1 message unless the user requests monitoring)

TODO:
- More error condition handling and logging probably
- Probably code cleanup/orginization (first node.js attempt, so probably did a lot poorly)
- More graceful twitter api recovery? It should maybe throw an exception instead of just continuing

NodeJS Module Dependencies:
- sqlite3 (for the persistent database backend storage)
- xmldom (used by xpath)
- xmlserializer (used to take a parse5 dom and turn it into xml)
- parse5 (parse html into dom)
- twit (twitter api)
- xpath (for doing the block list retrieval and page navigation, very lazy approach)
- winston (for logging to files)

Installation:
- npm install sqlite3 xmldom xmlserializer parse5 twit xpath winston
- put this project in node_modules/blocklistwatcher
- make app.js, include example code above, adjust as needed
- nodejs app.js to run it
