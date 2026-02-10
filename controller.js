const http = require("http");

let minimaTimeNextValidRequest = new Date(1);

send_minima = function(req, res) {
	const userAddress = req.body.minimaUserAddress;
	const addressRegEx=/[0M]{1}x[0-9A-Za-z]{1,64}/;
  	var testResult = addressRegEx.test(userAddress);

    if (testResult == false) { // UserAddress failed RGEX test.
		res.render("faucet", {minimaStatusMessage: "*** Sorry, that was not a valid address.  It should be 0x... or Mx..."});
    } else {
		if (Date.now() < minimaTimeNextValidRequest) { // Not enough time elapsed since last NFT issued.
			const cooldownRemaining = Math.floor((minimaTimeNextValidRequest - Date.now())/1000);
			res.render("faucet", {minimaStatusMessage: "*** Sorry, the faucet is still recharging.  The next coin will go to the first person who asks for it after " + cooldownRemaining + " seconds from now."});
		} else {
			minimaTimeNextValidRequest = Date.now() + (1000*60) + Math.floor(Math.random() * (1000*60));; // e.g. 1000ms x 60s x 5m.  Includes a minimum time, to allow for the preceding transaction to be confirmed and the coin to become spendable.
			const nodeAddress = "http://localhost:9005";
			let sendableAmount = 0;
			let amount = 0;
			let url = "";
			
			// Step 1: Get balance and work out how much to send
			url = nodeAddress + "/balance%20tokenid:0x00";
			http.get(url, { insecureHTTPParser: true }, (response) => {
				let rawData = "";
				response.on("data", (chunk) => { // Learning JS: The data comes in chunks.
					rawData += chunk;
				});
				response.on("end", () => { // Learning JS: Triggered at the end of the data.
					let parsedData = JSON.parse(rawData);
					if (parsedData.status == true) {
						sendableAmount = parseFloat(parsedData.response[0].sendable); // Learning JS: parseFloat converts string to float.
						if (sendableAmount > 1) {
							amount = 0.0001;
						} else {
							amount = sendableAmount / 1000;
						}
						// Step 2: Send tokens
						url = nodeAddress + "/send%20amount:" + amount + "%20address:" + userAddress;
						http.get(url, { insecureHTTPParser: true }, (response) => {
							rawData = "";
							response.on("data", (chunk) => { // Learning JS: The data comes in chunks.
								rawData += chunk;
							});
							response.on("end", () => { // Learning JS: Triggered at the end of the data.
								parsedData = JSON.parse(rawData);
								if (parsedData.status == true) {
									res.render("faucet", {minimaStatusMessage: "*** Congratulations!  You have been sent a coin.  Now, check your wallet.  The coin should show up shortly, first in Transaction History, and then in Wallet"});
								} else {
									res.render("faucet", {minimaStatusMessage: "*** Sorry, the transaction to send you the coin failed.  We will need to investigate why.  Please come back another day."});
								}
							});
						})
					}
				});
			}).on("error", (error) => {
					console.error("Controller: When instructing node, error during request:", error);
					res.render("faucet", {minimaStatusMessage: "*** Sorry, communication with the node failed.  We will need to investigate why.  Please come back another day."});
			})
		}
	}
}

module.exports = {
	send_minima,
};
