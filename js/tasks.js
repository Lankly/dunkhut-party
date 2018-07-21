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
    getIncompleteTasks().then( (data) => {
      console.log(data);
      res.render('tasks', { title: 'TODO', todo: data });
    })
      .catch( (err) => {
        res.end(JSON.stringify(err));
      });
  });
  app.post('/tasks/create', function (req, res) {
    let task = { };
    ["assigned_to", "description", "start_time", "title"].forEach( (prop) => {
      task[prop] = req.param(prop) || req[prop] || null;
    });

    createTask(task).then( (data) => {
      res.end(JSON.stringify({ status: 200 }));
    })
      .catch( (err) => {
        console.log(err);
        res.end(JSON.stringify(err));
      });
  });

  // Functions
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
    query += ")"

    // Ensure only our args get sent
    let new_task = {};
    args.forEach((arg) => { new_task[arg] = task[arg]; });

    console.log(query, new_task);

    return db.query(query, new_task);
  }

  function getCompletedTasks () {
    return db.any("SELECT * FROM tasks WHERE date_completed IS NOT NULL;");
  }

  function getIncompleteTasks () {
    return db.any("SELECT * FROM tasks WHERE date_completed IS NULL;");
  }
}

