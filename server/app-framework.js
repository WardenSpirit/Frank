const { readFile } = require('fs');
const express = require('express');
const app = express();

console.log(__dirname + '/client...');
const path = __dirname.slice(0, __dirname.lastIndexOf('\\')) + '\\client';
console.log(path);
app.use(express.static(path));

app.get('/', (_request, response) => {
    readFile('./index.html', 'utf8', (err, html) => {
        if (err) {
            response.status(500).send('Sorry, I\'m not working. Better luck somewhere else.');
        }
        response.send(html);
    });
});

module.exports = app;