const { readFile } = require('fs');
const express = require('express');
const app = express();

console.log(__dirname.slice(__dirname.lastIndexOf('/')) + "/client");
app.use(express.static(__dirname.slice(__dirname.lastIndexOf('/')) + "/client"));

app.get('/', (_request, response) => {
    readFile('./index.html', 'utf8', (err, html) => {
        if (err) {
            response.status(500).send('Sorry, I\'m not working. Better luck somewhere else.');
        }
        response.send(html);
    });
});

module.exports = app;