var sqlite3 = require("sqlite3");
var db = null;
var logger;
var cfg;

//Makes sure a database exists to do anything with
function SanityCheck(){
	if(db == null){
		throw "Database not initialized or an error has occured.";
	}
}

//Checks if a user exists (no longer used)
function CheckUserExists(user, callback){
	SanityCheck();
	db.get("select count(Handle) from users where Handle = $handle", { $handle: user }, callback); 
}

//Adds or updates a user to the database
//There might be a better method for handling this, but this reduces the async calls
function AddOrUpdateUser(user, lastseen){
	console.log("Adding/Updating user " + user + " : Last seen " + new Date(lastseen).toUTCString());

	SanityCheck();
	db.run("insert or replace into users (Handle, DateAdded, DateLastSeen, Alerted, Monitoring) values ($handle, coalesce((select DateAdded from users where Handle = $handle), $date), $date, coalesce((select Alerted from users where Handle = $handle), 0), coalesce((select Monitoring from users where Handle = $handle), 1))", { $handle: user, $date: lastseen }, function(err){
		if(err != null){
			logger.error("Error adding/updating user in database: " + err);
		}
	});
}

//Adds or updates a chunk of users (allows running batches in a transaction, improves performance for ACID compliant dbs)
function AddOrUpdateUsers(userlist){
	console.log("Running transaction for " + userlist.length + " users.");
	//Run these in serial
	db.serialize(function(){
		db.run("begin transaction");
		for(var uid in userlist){
			AddOrUpdateUser(userlist[uid].user, userlist[uid].lastseen);
		}
		db.run("commit");
	});
	console.log("Commit transaction.");
}

//Marks a user as monitored (so they are continued to be alerted in the future)
function MonitorUser(user){
	console.log("Marking user " + user + " as monitored.");

	SanityCheck();
        db.run("update users set Monitoring = 2 where Handle = $name", { $name: user }, function(err){
                if(err != null){
                        logger.error("Error marking user as monitored in database: " + err);
                }
        });
}

//Marks a user as ignored (so we don't send them anything else)
function IgnoreUser(user){
	console.log("Marking user " + user + " as ignored.");

	SanityCheck();
        db.run("update users set Monitoring = 0 where Handle = $name", { $name: user }, function(err){
                if(err != null){
                        logger.error("Error marking user as ignored in database: " + err);
                }
        });
}

//Finds the next user to notify, randomly matching a set of criteria
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
			logger.error("Error fetching next user to notify from database: " + err);
                } else {
			callback(row);
                }
        });
}

//Resets everyone who hasn't been seen on the list for more than 48 hours to not alerted (so we can notify them of removal)
function UpdateUsersVisibility(){
	console.log("Updatig users visibility, anyone last seen more than 48 hours ago is being marked as not alerted now.");

	SanityCheck();
	db.run("update users set Alerted = 0 where Monitoring > 0 and DateLastSeen < $lastseen", { $lastseen: new Date().getTime() - 2 * 24 * 60 * 60 * 1000 }, function(err){
                if(err != null){
                        logger.error("Error updating users visibility in database: " + err);
                }
        });
}

//Marks a user as alerted, and adjusts monitoring state as needed
function MarkAlerted(user, monitoring){
	console.log("Marking user " + user + " as alerted.");

	SanityCheck();
        db.run("update users set Alerted = 1, Monitoring = $monitoring where Handle = $name", { $name: user, $monitoring: monitoring }, function(err){
                if(err != null){
                        logger.error("Error marking user as alerted in database: " + err);
                }
        });
}

function Close(){
	SanityCheck();
	db.close();
}

//Open the db and create the table we need if it doesn't exist
//We run the callback when everything is ready, so we don't attempt operations while no db/table exists yet
function Init(config, logHandle, callback){
	cfg = config;
	logger = logHandle;

	db = new sqlite3.Database(cfg.DBFile, function(err, o){
		if(err != null) {
			db = null;
		} else {
			console.log("Database loaded.");

			//Monitoring = 0: No longer sending messages, 1: Can be sent a single message, 2: Will send any number of messages
			db.run("create table if not exists users ( Handle text primary key, DateAdded integer not null, DateLastSeen integer not null, Alerted integer default 0, Monitoring integer default 1)", function(err){
				if(err != null){
					console.log("Error occured creating db table: " + err);
					logger.error("Error creating db table: " + err);
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
exports.AddOrUpdateUsers = AddOrUpdateUsers;
exports.MonitorUser = MonitorUser;
exports.IgnoreUser = IgnoreUser;
exports.GetNextUserNotNotified = GetNextUserNotNotified;
exports.UpdateUsersVisibility = UpdateUsersVisibility;
exports.MarkAlerted = MarkAlerted;
