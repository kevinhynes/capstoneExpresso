//Create router for all employees routes
const express = require('express');
const employeesRouter = express.Router();

//Create instance of database, first checking if `process.env.TEST_DATABASE` exists
// ??? Why do we use different notation within migration.js?
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Import and mount child routers
///timesheetsRouter
const timesheetsRouter = require('./timesheets.js');
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

//Validate employee
///If employee not found in Employee table -> 404
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = `SELECT * FROM Employee WHERE id = $id`
  const values = {$id: employeeId};
  db.get(sql, values, (err, employee) => {
    if (err) {
      next(err);
    } else if (employee) {
      next();
    } else {
      res.status(404).send();
    }
  })
})

//GET Requests
const employeesGETSQL = 'SELECT * FROM "Employee" WHERE "is_current_employee" = 1';
employeesRouter.get('/', (req, res, next) => {
  db.all(employeesGETSQL, (err, employees) => {
    res.status(200).json({employees: employees});
  })
});

//GET Requests by employee
const employeeGETSQL = 'SELECT * FROM "Employee" WHERE "id" = $id';
employeesRouter.get('/:id', (req, res, next) => {
  const employeeID = req.params.id;
  db.get(employeeGETSQL, {$id: employeeID}, (err, employee) => {
    if (employee === undefined) {
      return res.status(404).send();
    } else {
    return res.status(200).json({employee: employee});
    };
  });//end db.get
});

//POST requests
employeesRouter.post('/', (req, res, next) => {
  const newEmployee = req.body.employee;
  if (newEmployee.name && newEmployee.position && newEmployee.wage) {
    db.run('INSERT INTO "Employee" (name, position, wage, is_current_employee) ' +
           'VALUES ($name, $position, $wage, $is_current_employee)',
           {$name: newEmployee.name,
            $position: newEmployee.position,
            $wage: newEmployee.wage,
            $is_current_employee: 1},
            function(err) {
             if (err) {
               return console.log(err);
             }
             db.get('SELECT * FROM Employee WHERE id = $lastID',
                    {$lastID: this.lastID}, function(err, getNewEmp) {
                      res.status(201).json({employee: getNewEmp})
             })//end db.get
    })//end db.run
  } else {
    res.status(400).send();
  }
});

//PUT Requests
employeesRouter.put('/:employeeId', (req, res, next) => {
  const employeeID = req.params.employeeId;
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentEmployee = req.body.employee.isCurrentEmployee;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }
  const sql = `UPDATE Employee SET name = $name, position = $position, ` +
      `wage = $wage, is_current_employee = $isCurrentEmployee ` +
      `WHERE id = $id`;
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: 1,
    $id: employeeID
  };
  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE id = $id`, {$id: employeeID},
        (error, updatedEmployee) => {
          res.status(200).json({employee: updatedEmployee});
        });
    }
  });
});

//DELETE Requests
employeesRouter.delete('/:id', (req, res, next) => {
  const retiredEmployeeID = req.params.id;
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE id = $id`,
        {$id: retiredEmployeeID}, function(err) {
            if (err) {
              next(err);
            } else {
              db.get('SELECT * FROM Employee WHERE id = $id',
                    {$id: retiredEmployeeID}, function(err, retiredEmployee) {
                      res.status(200).json({employee: retiredEmployee})
                    }); //end db.get
            }
        }); //end db.run
}); //end employeesRouter.delete

//Export for connection to parent router
module.exports = employeesRouter;
