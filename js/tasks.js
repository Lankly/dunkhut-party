'use strict'

module.exports = function (app) {
  // Constants
  // Loading and initializing the library:
  const pgp = require('pg-promise')({
  // Initialization Options
  });
  // Preparing the connection details:
  const cn = 'postgres://dbuser:password@localhost:5432/postgres';
  // Creating a new database instance from the connection details:
  const db = pgp(cn);

  // Routes
  app.get('/tasks', function (req, res) {
    let todo = [];

    getIncompleteTasks().then( (data) => {
      todo = data;

      return getCompletedTasks();
    }).then( (completed) => {
      res.render('tasks', {
        title: 'TODO',
        todo: todo,
        completed: completed,
      });
    })
      .catch( (err) => {
        res.end(JSON.stringify(err));
      });
  });
  app.post('/tasks/complete', function (req, res) {
    completeTask(getParam(req, "id"), getParam(req, "completed_by"))
      .then( (data) => {
        res.end(JSON.stringify({status: 200, obj: data}));
      })
      .catch( (err) => {
        console.log(err);
        res.end(JSON.stringify(err));
      });
  });
  app.post('/tasks/create', function (req, res) {
    let task = { };
    ["assigned_to", "description", "start_time", "title"].forEach( (prop) => {
      task[prop] = req.param(prop) || req[prop] || null;
    });

    createTask(task).then( (data) => {
      res.end(JSON.stringify({ status: 200, obj: data }));
    })
      .catch( (err) => {
        console.log(err);
        res.end(JSON.stringify(err));
      });
  });
  app.post('/tasks/delete', function (req, res) {
    deleteTask(getParam(req, "id"))
      .then( (data) => {
        res.end(JSON.stringify({status: 200, obj: data}));
      })
      .catch( (err) => {
        console.log(err);
        res.end(JSON.stringify(err));
      });
  });
  app.post('/tasks/reopen', function (req, res) {
    reopenTask(getParam(req, "id"))
      .then( (data) => {
        res.end(JSON.stringify({ status: 200 }));
      })
      .catch( (err) => {
        console.log(err);
        res.end(JSON.stringify(err));
      });
  });

  // Functions
  function completeTask (id, completed_by) {
    return db.query(
      "UPDATE tasks SET completed_by = ${completed_by}, \
          date_completed = localtimestamp \
       WHERE id = ${id}", { id: id, completed_by: completed_by });
  }

  function createTask (task) {
    let args = ["assigned_to", "description", "start_time", "title"];

    // Construct Query
    let query = "INSERT INTO tasks (" + args.join(", ") + ") "
      + "VALUES (";
    // Add $1 ... $n
    args.forEach((arg) => { query += "${" + arg + "}, "})
    // Remove last ", "
    query = query.slice(0, -2);
    // Finish values parentheses
    query += ") "
    // Ask to get back id of inserted task
    query += "RETURNING id;"

    // Ensure only our args get sent
    let new_task = {};
    args.forEach((arg) => { new_task[arg] = task[arg]; });

    return db.query(query, new_task);
  }

  function deleteTask (id) {
    return db.query("DELETE FROM tasks WHERE id = ${id};", { id: id });
  }

  function getCompletedTasks () {
    return db.any("SELECT * FROM tasks WHERE date_completed IS NOT NULL;");
  }

  function getIncompleteTasks () {
    return db.any("SELECT * FROM tasks WHERE date_completed IS NULL;");
  }

  function reopenTask (id) {
    return db.query("UPDATE tasks \
        SET date_completed = NULL, completed_by = NULL \
        WHERE id = ${id}", { id: id });
  }

  // Helpers
  function getParam (req, param_name) {
    return req.param(param_name)
      || req.params[param_name]
      || req[param_name];
  }
}

