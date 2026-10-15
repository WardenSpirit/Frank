const express = require('express');
const path = require('path');
const app = express();


const clientPath = path.join(__dirname, '..', 'client');
const sharedPath = path.join(__dirname, '..', 'shared');
app.use('/', express.static(clientPath));
app.use('/shared', express.static(sharedPath));

app.get('*', (_request, response) => {
    response.sendFile(path.join(clientPath, 'index.html'));
});


module.exports = app;