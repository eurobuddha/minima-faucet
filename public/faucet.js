const minimaForm = document.getElementById("minimaFaucetForm");
const minimaInput = document.getElementById("minimaUserInput");
const minimaButton = document.getElementById("minimaButton");

minimaFaucetForm.addEventListener("submit", (event) => {
	event.preventDefault(); // prevent form from submitting
	var minimaInputText = minimaUserInput.value;
	var pattern = /^[0M]{1}x[0-9A-Za-z]{1,64}$/;
	if (!pattern.test(minimaInputText)) { // check input value
		return; // do nothing
	}
	minimaButton.disabled = true; // disable button
	document.getElementById("minimaSM").style.color="red";
	document.getElementById("minimaSM").style.fontWeight="bold";
	document.getElementById("minimaSM").textContent = "Request received!  Please wait about 20 seconds for an update.";
	minimaForm.submit(); // submit form
});
