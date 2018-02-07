//Import express package and start express application
const express = require('express');
const app = express();

//Import dependency packages
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('errorhandler');
const sqlite3 = require('sqlite3');

//Use these middleware functions for all routes in server
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));
app.use(errorHandler());

//Import router and mount appropriately
const apiRouter = require('./api/api.js');
app.use('/api', apiRouter);

// ??? Still not sure what this line does
app.use(express.static('public'));
//Set up PORT
const PORT = process.env.PORT || 4000;

//Make server start listening for requests
app.listen(PORT, () => {
  console.log(`server.js is now listening on port ${PORT}`);
});

//Expose express application object for importing in other files
////I think this is used by the test files (`npm test`)
module.exports = app;
