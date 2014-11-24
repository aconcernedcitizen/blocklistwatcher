var twitter;
var userhandler;
var cfg;
var timer1;
var timer2;

//Prepate a tweet to notify the user
function ProcessUser(row){
	console.log("Alerting user " + row.Handle);
	console.log("%j", row);

	//TODO: 
	//Construct a better message
	//Should have URL at least in config
	var message = "@" + row.Handle;

	//Must be on list (last seen within 48 hours)
	if(row.DateLastSeen >= new Date().getTime() - 2 * 24 * 60 * 60 * 1000){
		message += " noticed on blocklist at ";
	} else { //Must be off list
		message += " missing from blocklist since ";
		
	}
 	message += new Date(row.DateLastSeen).toUTCString() + ". " + cfg.InfoURL;

	//Tweet to the user the info
	twitter.Tweet(message);

	//Mark the user as notified
	//If monitoring is 1 we won't bug them again so set it to 0
	userhandler.MarkAlerted(row.Handle, row.Monitoring == 1 ? 0 : 2);
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

//Init: bings in config, the user manager, and twitter clients
//Establishes the event cycle for triggering updates to the users for cleanup or notification
function Init(config, userHandle, twitterHandle){
	cfg = config;
	userhandler = userHandle;
	twitter = twitterHandle;

	UpdateUsers();
	ProcessNextUser();

	timer1 = setInterval(ProcessNextUser, cfg.SecondsBetweenTweets * 1000);
	timer2 = setInterval(UpdateUsers, cfg.HoursBetweenUserCleanups * 60 * 60 * 1000);
}

//Stops the event cycle
function Stop(){
	clearInterval(timer1);
	clearInterval(timer2);
}

exports.Init = Init;
exports.Stop = Stop;
