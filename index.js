const express = require('express');
const path = require('path');
const app = express();
const controller = require('./controller');

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(_req, res) {
    res.render('faucet');
});

app.post('/address-submit-minima', controller.send_minima);

app.listen(3000, function() {
    console.log('Server is running');
});
