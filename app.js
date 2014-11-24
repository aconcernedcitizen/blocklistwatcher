var pages = require("./PageHandler");
var users = require("./UserHandler");
var twitter = require("./TwitterHandler");
var queue = require("./QueueHandler");
var winston = require("winston");

exports.Main = function(config) {
	var logger = new (winston.Logger)({
		transports: [
			new winston.transports.File({ filename: config.LogFile })
		],
		exceptionHandlers: [
			new winston.transports.File({ filename: config.ExceptionLog })
		]
	});

	users.Init(config, logger, function(){
		twitter.Init(config, logger, users);
		pages.Init(config, logger, users);
		queue.Init(config, logger, users, twitter, pages);
	});

}
