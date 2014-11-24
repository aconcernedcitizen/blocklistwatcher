var https = require("https");
var parse5 = require("parse5");
var xmlserializer = require("xmlserializer");
var dom = require("xmldom").DOMParser;
var xpath = require("xpath");
var userhandler;
var cfg;

function ProcessPage(res){
	//Fetch HTML
	var html = "";
	//Assemble all of it (want to be lazy and use xpath, need a fully compliant xml to do so)
	res.on("data", function(data){ html += data; });

	//We have all the data now, html should be populated
	res.on("end", function(){
		console.log("Loaded page, processing for users...");
		//Turn the HTML into valid XML
		var xml = new dom().parseFromString(xmlserializer.serializeToString(new parse5.Parser().parse(html)));
		var xpathns = xpath.useNamespaces({"xhtml": "http://www.w3.org/1999/xhtml"});
		//Get users via xpath
		var users = xpathns("//xhtml:tr[@class='blocked-user']/xhtml:td/xhtml:a[@class='screen-name']/text()", xml);
		for(var uid in users){
			//Clean up the user by removing extra whitespace
			//TODO: Should check if there is a whitespace XML cleanup possible somewhere else rather than using this replace
			var user = users[uid].toString().replace(/[\n\r\s]/g, "");
			console.log("Processing user " + user + "...");
			userhandler.AddOrUpdateUser(user, new Date().getTime());
		}

		//Find the next page (if any)
		var nextpage = xpathns("//xhtml:li[@class='nav-page active']/following-sibling::xhtml:li[1]/xhtml:a/text()", xml).toString();
		if(nextpage != ""){
			setTimeout(function(){RequestPage(nextpage);}, cfg.SecondsBetweenPages * 1000);
		} else {
			console.log("Finished processing all pages.");

			var midnight = new Date();
			var now = midnight.getTime();

			midnight.setHours(24);
			midnight.setMinutes(0);
			midnight.setSeconds(0);
			midnight.setMilliseconds(0);
			
			setTimeout(function(){RequestPage(1);}, midnight.getTime() - now);
		}
	});
}

function RequestPage(id){
	console.log("Loading page number " + id + "...");

	var req = https.request(cfg.BlockListURL + "?page=" + id, ProcessPage);
	req.on("error", function(e) {
		console.log("Problem making request for page " + id + ": " + e.message);
	});
	req.end();
}

function Init(config, userHandle){
	cfg = config;
	userhandler = userHandle;

	//Kick off page 1 fetch after a second
	setTimeout(function(){RequestPage(1);}, 1000);
}

exports.Init = Init;
