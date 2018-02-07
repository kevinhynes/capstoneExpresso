//Create router for all menu-item routes
const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

//Create instance of database, first checking if `process.env.TEST_DATABASE` exists
// ??? Why do we use different notation within migration.js?
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

//Validate menu item
///If menu item not found in MenuItem table -> 404
menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = `SELECT * FROM MenuItem WHERE id = $id`
  const values = {$id: menuItemId};
  db.get(sql, values, (err, menuItem) => {
    if (err) {
      next(err);
    } else if (menuItem) {
      next();
    } else {
      res.status(404).send();
    }
  })
})

//GET Requests - Items by menuId
menuItemsRouter.get('/', (req, res, next) => {
console.log(`req.params = ${JSON.stringify(req.params)}`)
  const menuId = req.params.menuId;
  db.all(`SELECT * FROM MenuItem WHERE menu_id = $menuId`,
    {$menuId: menuId}, (err, menuItems) => {
    if (err) {
      next(err);
    }
    else {
      //This test checks the menuItems (plural) object, 
      //all others below check for the menuItem object.
      res.status(200).json({menuItems: menuItems});
    } //end else
  }); //end db.all
}); //end menuItemsRouter

//POST Requests
menuItemsRouter.post('/', (req, res, next) => {
  //console.log(`req.body = ${JSON.stringify(req.body)}`)
  //console.log(`req.params = ${JSON.stringify(req.params)}`)
  const menuId = req.params.menuId;
  const menuItem = req.body.menuItem;
  if (menuItem.name && menuItem.description && menuItem.inventory && menuItem.price) {
    db.run('INSERT INTO MenuItem (name, description, inventory, price, menu_id) ' +
           'VALUES ($name, $description, $inventory, $price, $menu_id)',
           {$name: menuItem.name,
            $description: menuItem.description,
            $inventory: menuItem.inventory,
            $price: menuItem.price,
            $menu_id: menuId},
          function(err) {
            if (err) {
              next(err);
            }
            else {
              db.get('SELECT * FROM MenuItem WHERE id = $lastID',
                    {$lastID: this.lastID}, function(err, item) {
                      if (err) {
                        next(err);
                      }
                      else {
                        res.status(201).json({menuItem: item});
                      }
              }); //end db.get
            }
    }); //end db.run
  } else {
    res.status(400).send();
  }
});

//PUT Requests
menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  //console.log(`req.body = ${JSON.stringify(req.body)}`)
  //console.log(`req.params = ${JSON.stringify(req.params)}`)
  const menuId = req.params.menuId;
  const menuItemId = req.params.menuItemId;
  const menuItem = req.body.menuItem;
  const name = menuItem.name,
        description = menuItem.description,
        inventory = menuItem.inventory,
        price = menuItem.price;
  if (!name || !description || !inventory || !price) {
    res.status(400).send();
  }
  else {
    const sql = 'UPDATE MenuItem SET name = $name, description = $description, ' +
                'inventory = $inventory, price = $price ' +
                'WHERE id = $menuItemId';
    const values = {$name: name,
                    $description: description,
                    $inventory: inventory,
                    $price: price,
                    $menuItemId: menuItemId};
    db.run(sql, values, (err) => {
      if (err) {
        next(err);
      }
      else {
        db.get('SELECT * FROM MenuItem WHERE id = $menuItemId',
              {$menuItemId: menuItemId}, (error, item) => {
                res.status(200).json({menuItem: item});
        }); //end db.get
      }
    }); //end db.run
  }
}); //end menuItemsRouter

//DELETE Requests
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = 'DELETE FROM MenuItem WHERE id = $menuItemId';
  const values = {$menuItemId: req.params.menuItemId};
  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});



//Export for connection to parent router
module.exports = menuItemsRouter;
