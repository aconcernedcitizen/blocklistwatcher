var pages = require("./PageHandler");
var users = require("./UserHandler");
var twitter = require("./TwitterHandler");
var queue = require("./QueueHandler");

exports.Main = function(config) {

	users.Init(config, function(){
		twitter.Init(config, users);
		queue.Init(config, users, twitter);
		pages.Init(config, users);
	});

}
