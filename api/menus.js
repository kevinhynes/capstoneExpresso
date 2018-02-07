//Create router for all menu routes
const express = require('express');
const menusRouter = express.Router();

//Create instance of database, first checking if `process.env.TEST_DATABASE` exists
// ??? Why do we use different notation within migration.js?
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Import and mount child routers
///menu items router
const menuItemsRouter = require('./menuItems.js');
menusRouter.use('/:menuId/menu-items', menuItemsRouter);

//Validate menu
///If menu not found in Menu table -> 404
menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = `SELECT * FROM Menu WHERE id = $id`
  const values = {$id: menuId};
  db.get(sql, values, (err, menu) => {
    if (err) {
      next(err);
    } else if (menu) {
      next();
    } else {
      res.status(404).send();
    }
  })
});

//GET Requests
menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (err, menus) => {
    if (err) {
      next (err);
    } else {
      console.log(JSON.stringify(menus));
      res.status(200).json({menus: menus})
      }
  })
});

//GET Requests by menu
menusRouter.get('/:menuId', (req, res, next) => {
  const sql = 'SELECT * FROM "Menu" WHERE "id" = $id';
  const menuID = req.params.menuId;
  db.get(sql, {$id: menuID}, (err, menu) => {
    if (menu === undefined) {
      return res.status(404).send();
    } else {
    console.log(JSON.stringify(menu));
    return res.status(200).json({menu: menu});
    };
  });//end db.get
});

//POST requests
menusRouter.post('/', (req, res, next) => {
  const newMenu = req.body.menu;
  if (newMenu.title) {
    db.run('INSERT INTO Menu (title) ' +
           'VALUES ($title)',
           {$title: newMenu.title},
            function(err) {
             if (err) {
               next(err);
             } else {
             db.get('SELECT * FROM Menu WHERE id = $lastID',
                    {$lastID: this.lastID}, function(err, getNewMenu) {
                      if (err) {
                        next(err);
                      } else {
                      res.status(201).json({menu: getNewMenu});
                    }
                  })//end db.get
                }
         })//end db.run
  } else {
    res.status(400).send();
  }
});

//PUT Requests
menusRouter.put('/:menuId', (req, res, next) => {
  const menuId = req.params.menuId;
  const updateMenu = req.body.menu;
  if (!updateMenu.title) {
    return res.sendStatus(400);
  }
  const sql = `UPDATE Menu SET title = $title WHERE id = $id`;
  const values = {$title: updateMenu.title, $id: menuId};
  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Menu WHERE id = $id`, {$id: menuId},
        (err, updatedMenu) => {
          res.status(200).json({menu: updatedMenu});
        });
    }
  });
});

//DELETE Requests
menusRouter.delete('/:menuId', (req, res, next) => {
  const menuSql = 'SELECT * FROM MenuItem WHERE menu_id = $id';
  const menuValues = {$id: req.params.menuId};
  db.get(menuSql, menuValues, (err, menu) => {
    if (err) {
      next(err);
    } else if (menu) {
      res.status(400).send();
    } else {
      const deleteSql = 'DELETE FROM Menu WHERE id = $id';
      const deleteValues = {$id: req.params.menuId};
      db.run(deleteSql, deleteValues, (err) => {
        if (err) {
          next(err);
        } else {
          res.status(204).send();
        }
      }); //end db.run
    }
  }); //end db.get
}); //end menusRouter.delete

//Export for connection to parent router
module.exports = menusRouter;
