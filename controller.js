const http = require("http");

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes per address
const cooldowns = new Map(); // address -> expiryMs

const nodeAddress = "http://localhost:8005";
const addressRegEx = /^[0M]{1}x[0-9A-Za-z]{1,64}$/;

function nodeGet(url, callback) {
	http.get(url, { insecureHTTPParser: true }, (response) => {
		let rawData = "";
		response.on("data", (chunk) => { rawData += chunk; });
		response.on("end", () => { callback(null, JSON.parse(rawData)); });
	}).on("error", (error) => { callback(error, null); });
}

function doSend(userAddress, onSuccess, onCooldown, onInvalid, onError) {
	if (!addressRegEx.test(userAddress)) {
		onInvalid();
		return;
	}

	const now = Date.now();

	// opportunistic cleanup: drop expired entries to keep Map small
	for (const [addr, expiry] of cooldowns) {
		if (expiry <= now) cooldowns.delete(addr);
	}

	const expiry = cooldowns.get(userAddress);
	if (expiry && now < expiry) {
		onCooldown(Math.floor((expiry - now) / 1000));
		return;
	}
	cooldowns.set(userAddress, now + COOLDOWN_MS);

	nodeGet(nodeAddress + "/balance%20tokenid:0x00", function(error, parsedData) {
		if (error) {
			console.error("Controller: error during balance request:", error);
			onError();
			return;
		}
		if (parsedData.status == true) {
			var sendableAmount = parseFloat(parsedData.response[0].sendable);
			var amount = 0.0001;
			nodeGet(nodeAddress + "/send%20amount:" + amount + "%20address:" + userAddress, function(error, parsedData) {
				if (error) {
					console.error("Controller: error during send:", error);
					onError();
					return;
				}
				if (parsedData.status == true) {
					onSuccess(amount);
				} else {
					onError();
				}
			});
		}
	});
}

// HTML form handler (existing web faucet)
send_minima = function(req, res) {
	var addr = req.body.minimaUserAddress;
	doSend(addr,
		function() { res.render("faucet", { minimaStatusMessage: "*** Congratulations!  You have been sent a coin.  Now, check your wallet.  The coin should show up shortly, first in Transaction History, and then in Wallet" }); },
		function(secs) { res.render("faucet", { minimaStatusMessage: "*** Sorry, the faucet is still recharging.  The next coin will go to the first person who asks for it after " + secs + " seconds from now." }); },
		function() { res.render("faucet", { minimaStatusMessage: "*** Sorry, that was not a valid address.  It should be 0x... or Mx..." }); },
		function() { res.render("faucet", { minimaStatusMessage: "*** Sorry, communication with the node failed.  We will need to investigate why.  Please come back another day." }); }
	);
}

// JSON API handler (MiniDapp/lint clients via GET ?address=...)
api_send_minima = function(req, res) {
	var addr = req.query.address;
	if (!addr) {
		res.json({ status: false, message: "Missing address parameter" });
		return;
	}
	doSend(addr,
		function(amount) { res.json({ status: true, message: "Sent " + amount + " Minima to your address" }); },
		function(secs) { res.json({ status: false, message: "Faucet is recharging. Try again in " + secs + " seconds." }); },
		function() { res.json({ status: false, message: "Invalid address. Use 0x... or Mx... format." }); },
		function() { res.json({ status: false, message: "Node communication failed. Try again later." }); }
	);
}

module.exports = {
	send_minima,
	api_send_minima,
};
