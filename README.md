blocklistwatcher
================

An experiment to toy with learning node.js. Designed to monitor a twitter blocklist and alert users that they are on the list.
Can optionally monitor to alert them to being removed from the list as well.

This is a node.js module, and is generally used via calling Main and passing in a configuration object.
Example:
var app = require("blocklistwatcher");

app.Main({
        DBFile: "users.db",
        BlockListURL: "https://blocktogether.org/show-blocks/[blocklist id]",
        SecondsBetweenPages: 5 * 60,
        SecondsBetweenTweets: 90,
        HoursBetweenUserCleanups: 6,
        TwitterConsumerKey: "[Insert Twitter Consumer Key]",
        TwitterConsumerSecret: "[Insert Twitter Consumer Secret]",
        TwitterAccessToken: "[Insert Twitter Access Token]",
        TwitterAccessSecret: "[Insert Twitter Access Token Secret]",
        InfoURL: "[URL for users to learn more at]"
});

The messages are not yet easily configured, but is assembled in QueueHandler.js/ProcessUser(row). These are being worked on.

TODO:
- Monitor for tweets to control the service from users (giving them the option to be ignored or notified of removal, etc)
- More error condition handling and logging
- Ideally a better wrapper around sqlite that allows the batch updates to be done in transactions to improve performance
- Probably code cleanup/orginization (first node.js attempt, so probably did a lot poorly)

NodeJS Module Dependencies:
- sqlite3 (for the persistent database backend storage)
- xmldom (used by xpath)
- xmlserializer (used to take a parse5 dom and turn it into xml)
- parse5 (parse html into dom)
- twit (twitter api)
- xpath (for doing the block list retrieval and page navigation, very lazy approach)
