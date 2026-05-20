const express = require("express");
const path = require("path");
const app = express();
const controller = require("./controller");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(_req, res) {
    res.render("faucet");
});

app.post("/address-submit-minima", controller.send_minima);

// JSON API for MiniDapp/lint clients (GET with query param)
app.get("/api/request", function(req, res) {
    res.set("Access-Control-Allow-Origin", "*");
    controller.api_send_minima(req, res);
});

app.listen(3000, function() {
    console.log("Server is running");
});
