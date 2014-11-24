var twit = require("twit");
var twitter;
var userhandler;
var cfg;

function Tweet(message){
	console.log("Tweeting '" + message + "'");

	twitter.post("statuses/update", { status: message }, function(err, data, res) {
		if(err != null){
			//TODO: Log this somewhere... in the db maybe?
			console.log("Error tweeting message: " + err);
		}
	});
}

function OnMessage(){
	//Someone tweeted at me, I might need to ignore or monitor them now
}

function Init(config, userHandle){
	cfg = config;
	userhandler = userHandle;
	twitter = new twit({
		consumer_key: cfg.TwitterConsumerKey,
		consumer_secret: cfg.TwitterConsumerSecret,
		access_token: cfg.TwitterAccessToken,
		access_token_secret: cfg.TwitterAccessSecret
	});
}

exports.Init = Init;
exports.Tweet = Tweet;
