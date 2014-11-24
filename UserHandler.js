var sqlite3 = require("sqlite3");
var db = null;
var cfg;

function SanityCheck(){
	if(db == null){
		throw "Database not initialized or an error has occured.";
	}
}

function CheckUserExists(user, callback){
	SanityCheck();
	db.get("select count(Handle) from users where Handle = $handle", { $handle: user }, callback); 
}

function AddOrUpdateUser(user, lastseen){
	console.log("Adding/Updating user " + user + " : Last seen " + new Date(lastseen).toUTCString());

	SanityCheck();
	//TODO: Catch and log any error
	db.run("insert or replace into users (Handle, DateAdded, DateLastSeen, Alerted, Monitoring) values ($handle, coalesce((select DateAdded from users where Handle = $handle), $date), $date, coalesce((select Alerted from users where Handle = $handle), 0), coalesce((select Monitoring from users where Handle = $handle), 1))", { $handle: user, $date: lastseen });
}

function MonitorUser(user){
	console.log("Marking user " + user + " as monitored.");

	SanityCheck();
	//TODO: Catch and log any error
        db.run("update users set Monitoring = 2 where Handle = $name", { $name: user });
}

function IgnoreUser(user){
	console.log("Marking user " + user + " as ignored.");

	SanityCheck();
	//TODO: Catch and log any error
        db.run("update users set Monitoring = 0 where Handle = $name", { $name: user });
}

function GetNextUserNotNotified(callback){
	console.log("Looking for a user to notify.");

	SanityCheck();
	//A user needing alerted is one who is on the list, not alerted, and not ignored (monitoring = 0)
	//or a user not on the list (LastSeen > 48 hours ago), not Alerted, and monitored (Monitoring = 2)
	//
	//Pick a random one
	db.get("select * from users where (DateLastSeen > $lastseen and Alerted = 0 and Monitoring = 1) or (DateLastSeen < $lastseen and Alerted = 0 and Monitoring = 2) order by random() limit 1", { $lastseen: new Date().getTime() - 2 * 24 * 60 * 60 * 1000 }, function(err, row) { 
                if(err != null){
                        console.log("Error occured fetching next user to tweet at: " + err);
                } else {
			callback(row);
                }
        });
}

function UpdateUsersVisibility(){
	console.log("Updatig users visibility, anyone last seen more than 48 hours ago is being marked as not alerted now.");

	SanityCheck();
	db.run("update users set Alerted = 0 where Monitoring > 0 and DateLastSeen < $lastseen", { $lastseen: new Date().getTime() - 2 * 24 * 60 * 60 * 1000 });
	//TODO: Catch and log any error
}

function MarkAlerted(user, monitoring){
	console.log("Marking user " + user + " as alerted.");

	SanityCheck();
        db.run("update users set Alerted = 1, Monitoring = $monitoring where Handle = $name", { $name: user, $monitoring: monitoring });
	//TODO: Catch and log any error
}

function Close(){
	SanityCheck();
	db.close();
}

function Init(config, callback){
	cfg = config;

	db = new sqlite3.Database(cfg.DBFile, function(err, o){
		if(err != null) {
			db = null;
		} else {
			console.log("Database loaded.");

			//Monitoring = 0: No longer sending messages, 1: Can be sent a single message, 2: Will send any number of messages
			db.run("create table if not exists users ( Handle text primary key, DateAdded integer not null, DateLastSeen integer not null, Alerted integer default 0, Monitoring integer default 1)", function(err){
				if(err != null){
					console.log("Error occured creating db table: " + err);
				}
				callback();
			});
		}
	});
}

exports.Init = Init;
exports.Close = Close;
exports.CheckUserExists = CheckUserExists;
exports.AddOrUpdateUser = AddOrUpdateUser;
exports.MonitorUser = MonitorUser;
exports.IgnoreUser = IgnoreUser;
exports.GetNextUserNotNotified = GetNextUserNotNotified;
exports.UpdateUsersVisibility = UpdateUsersVisibility;
exports.MarkAlerted = MarkAlerted;
