//Create router for all timesheets routes
const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

//Create instance of database, first checking if `process.env.TEST_DATABASE` exists
// ??? Why do we use different notation within migration.js?
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Validate timesheet
///If timesheet not found in Timesheet table -> 404
timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = `SELECT * FROM Timesheet WHERE id = $id`
  const values = {$id: timesheetId};
  db.get(sql, values, (err, timesheet) => {
    if (err) {
      next(err);
    } else if (timesheet) {
      next();
    } else {
      res.status(404).send();
    }
  })
})

//GET Requests by employee
timesheetsRouter.get('/', (req, res, next) => {
  const employeeID = req.params.employeeId;
  db.all(`SELECT * FROM Timesheet WHERE employee_id = $employeeID`,
    {$employeeID: employeeID}, (err, timesheets) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({timesheets: timesheets});
    } //end else
  }); //end db.all
}); //end timesheetsRouter

//POST Requests
timesheetsRouter.post('/', (req, res, next) => {
  const employeeID = req.params.employeeId;
  const timesheet = req.body.timesheet;
  if (timesheet.hours && timesheet.rate && timesheet.date) {
    //This should fail the Timesheet.name and Timesheet.description NOT NULL constraint
    //Sup w dat / may cause problems later?
    db.run('INSERT INTO Timesheet (hours, rate, date, employee_id) ' +
           'VALUES ($hours, $rate, $date, $employeeID) ',
           {$hours: timesheet.hours,
            $rate: timesheet.rate,
            $date: timesheet.date,
            $employeeID: employeeID},
          function(err) {
            if (err) {
              next(err);
            } else {
              db.get('SELECT * FROM Timesheet WHERE id = $lastID',
                    {$lastID: this.lastID}, function(err, sheet) {
                      if (err) {
                        next(err);
                      } else {
                        res.status(201).json({timesheet: sheet});
                      }
                    }); //end db.get
            }
          }); //end db.run
  } else {
    res.status(400).send();
  }
});


/* ayyyy lmao WHY CANT I GET PUT ROUTES TO WORK
//PUT Requests
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const timesheetID = req.params.timesheetId;
  const timesheet = req.body.timesheet;
  console.log(timesheetID, timesheet);
  if (timesheet.hours && timesheet.rate && timesheet.date) {
    const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate, ` +
        `date = $date ` +
        `WHERE id = $id`;
    const values = {$hours: timesheet.hours,
                    $rate: timesheet.rate,
                    $date: timesheet.rate,
                    $id: timesheetID};
    db.run(sql, values, (err) => {
      if (err) {
        next(err);
      } else {
        db.get('SELECT * FROM Timesheet WHERE id = $id', {$id: timesheetID},
              (err, sheet) => {
                if (err) {
                  next(err);
                } else {
                  res.status(200).json({timesheet: sheet});
                }
              })
      }
    })
  } else {
    res.status(400).send();
  }
})
*/

//PUT Requests
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const timesheetID = req.params.timesheetId;
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date;
  if (!hours || !rate || !date) {
    return res.sendStatus(400);
  }
  const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate, ` +
      `date = $date ` +
      `WHERE id = $id`;
  const values = {
    $hours: hours,
    $rate: rate,
    $date: date,
    $id: timesheetID
  };
  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE id = $id`, {$id: timesheetID},
        (error, sheet) => {
          res.status(200).json({timesheet: sheet});
        });
    }
  });
});

//DELETE Requests
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE id = $timesheetId';
  const values = {$timesheetId: req.params.timesheetId};
  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});

//Export for connection to parent router
module.exports = timesheetsRouter;
