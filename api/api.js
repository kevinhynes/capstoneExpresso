//Create router for all api routes
const express = require('express');
const apiRouter = express.Router();

//Import and mount child routers
///employeesRouter
const employeeRouter = require('./employees.js');
apiRouter.use('/employees', employeeRouter);
///menusRouter
const menusRouter = require('./menus.js');
apiRouter.use('/menus', menusRouter);





//Export to connect to parent route
module.exports = apiRouter;
