const express = require('express');
const path = require('path');
const app = express();


const clientPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientPath));

app.get('*', (_request, response) => {
    response.sendFile(path.join(clientPath, 'index.html'));
});


module.exports = app;