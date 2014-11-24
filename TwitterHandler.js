var twit = require("twit");
var twitter;
var userhandler;
var lastcheck = null;
var logger;
var cfg;

//Tweet a message out (typically alerting a user)
function Tweet(message, callback){
	console.log("Tweeting '" + message + "'");

	return;

	twitter.post("statuses/update", { status: message }, function(err, data, res) {
		if(err != null){
			console.log("Error tweeting message: " + err);
			logger.error("Error tweeting message: " + err);
			callback(false);
		} else {
			callback(true);
		}
	});
}

//Process a tweet to see if I need to do anything speical or not
function ProcessMessages(err, data, res){
	if(err != null){
		logger.error("Error fetching mentions: " + err);
	} else {
		console.log("Found " + data.length + " mentions, checking them...");
		if(data.length == 0){
			console.log("No new mentions to check.");
		} else {
			//Reverse chron, so the latest value is in top item
			lastcheck = data[0].id_str;

			for(tweet in data){
				var t = data[tweet];
	
				console.log("Checking tweet '" + t.text + "' from " + t.user.name + " (" + t.id_str + ")...");
				if(t.text.indexOf("ignore") > -1){
					userhandler.IgnoreUser(t.user.name);
				} else if(t.text.indexOf("monitor") > -1){
					userhandle.MonitorUser(t.user.name);
				}
	
			}
		}
	}
}

//Fetch mentions so I can process them for instructions
function CheckMentions(){
	console.log("Looking for new tweets since " + lastcheck + "...");

	if(lastcheck == null){
		twitter.get("statuses/mentions_timeline", {count: 500}, ProcessMessages);
	} else {
		twitter.get("statuses/mentions_timeline", {count: 500, since_id: lastcheck}, ProcessMessages);
	}
}

function Init(config, logHandle, userHandle){
	cfg = config;
	logger = logHandle;
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
exports.CheckMentions = CheckMentions;
