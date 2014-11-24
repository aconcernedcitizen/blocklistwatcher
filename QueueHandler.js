var twitter;
var userhandler;
var pagehandler;
var logger;
var cfg;
var timer1;
var timer2;
var timer3;
var timer4;

function Pad(string, length, chr){
	if(string.length < length) {
		return Pad(chr + string, length, chr);
	} else {
		return string;
	}
}

function ShortDateFormat(date){
	var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	return date.getUTCDate() + " " + month[date.getUTCMonth()] + " " + date.getUTCFullYear() + " " + date.getUTCHours() + ":" + Pad(date.getUTCMinutes(), 2, "0");
}

//Prepate a tweet to notify the user
function ProcessUser(row){
	console.log("Alerting user " + row.Handle);
	console.log("%j", row);

	var message;
	var alertType = 1;

	//Must be on list (last seen within 48 hours)
	if(row.DateLastSeen >= new Date().getTime() - 2 * 24 * 60 * 60 * 1000){
		message = cfg.MessageTemplateOnList;
		alertType = 1;
	} else { //Must be off list
		message = cfg.MessageTemplateOffList;
		alertType = 2;
		
	}
	message = message.replace("{$username}", row.Handle);
	message = message.replace("{$lastseen}", ShortDateFormat(new Date(row.DateLastSeen)));
	message = message.replace("{$infourl}", cfg.InfoURL);

	//Tweet to the user the info
	twitter.Tweet(message, function(success){
		//If we succeeded mark them alerted
		if(success){
			userhandler.MarkAlerted(row.Handle, alertType, row.Monitoring == 1 ? 0 : row.Monitoring);
		}
	});
}

//Fetch the next user to process (alert them they are on or off the list if being monitored)
function ProcessNextUser(){
	userhandler.GetNextUserNotNotified(function(row){
		if(row == undefined){
			console.log("Everyone is currently notified!");
		} else {
			ProcessUser(row);
		}
	});
}

//Find all the users who have been off the list for 48 hours and mark them as not alerted
function UpdateUsers(){
	userhandler.UpdateUsersVisibility();
}

//Look for messages telling me to ignore or monitor someone
function CheckMessages(){
	twitter.CheckMentions();
}

function LoadUsers(){
	pagehandler.Load();
}

//Establishes the event cycle for triggering updates to the users for cleanup or notification
function Init(config, logHandle, userHandle, twitterHandle, pageHandle){
	cfg = config;
	logger = logHandle;
	userhandler = userHandle;
	twitter = twitterHandle;
	pagehandler = pageHandle;

	UpdateUsers();
	ProcessNextUser();
	CheckMessages();
	LoadUsers();

	timer1 = setInterval(ProcessNextUser, cfg.SecondsBetweenTweets * 1000);
	timer2 = setInterval(UpdateUsers, cfg.HoursBetweenUserCleanups * 60 * 60 * 1000);
	timer3 = setInterval(CheckMessages, cfg.SecondsBetweenMessageChecks * 1000);
	timer4 = setInterval(LoadUsers, cfg.HoursBetweenUserLoads * 60 * 60 * 1000);
}

//Stops the event cycle
function Stop(){
	clearInterval(timer1);
	clearInterval(timer2);
	clearInterval(timer3);
	clearInterval(timer4);
}

exports.Init = Init;
exports.Stop = Stop;
