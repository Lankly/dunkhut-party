'use strict'

// Constants
const helpers = require(`${__dirname}/helpers`);
const db = helpers.db;
const columns = ["assigned_to", "description", "start_time", "title"];

module.exports = function (app, skip_routes) {

  // Routes
  if (!skip_routes) {
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
        .catch(helpers.createErrorFunc(res));
    });
    app.post('/tasks/complete', function (req, res) {
      completeTask(getParam(req, "id"), getParam(req, "completed_by"))
        .then(helpers.createSuccessFunc(res))
        .catch(helpers.createErrorFunc(res));
    });
    app.post('/tasks/create', function (req, res) {
      let task = { };
      columns.forEach( (prop) => {
        task[prop] = req.param(prop) || req[prop] || null;
      });

      createTask(task)
        .then(helpers.createSuccessFunc(res, true))
        .catch(helpers.createErrorFunc(res));
    });
    app.post('/tasks/delete', function (req, res) {
      deleteTask(getParam(req, "id"))
        .then(helpers.createSuccessFunc(res))
        .catch(helpers.createErrorFunc(res));
    });
    app.post('/tasks/reopen', function (req, res) {
      reopenTask(getParam(req, "id"))
        .then(helpers.createSuccessFunc(res))
        .catch(helpers.createErrorFunc(res));
    });
  }

  // Functions

  let createTask = helpers.createCreateFunc('Tasks', columns);
  let deleteTask = helpers.createDeleteFunc('Tasks');
  function completeTask (id, completed_by) {
    return db.query(
      "UPDATE tasks SET completed_by = ${completed_by}, \
          date_completed = localtimestamp \
       WHERE id = ${id}", { id: id, completed_by: completed_by });
  }
  function reopenTask (id) {
    return db.query("UPDATE tasks \
        SET date_completed = NULL, completed_by = NULL \
        WHERE id = ${id}", { id: id });
  }

  function getCompletedTasks () {
    return db.any("SELECT * FROM tasks WHERE date_completed IS NOT NULL;");
  }
  function getIncompleteTasks () {
    return db.any("SELECT * FROM tasks WHERE date_completed IS NULL;");
  }

  
  // Helpers
  function getParam (req, param_name) {
    return req.param(param_name)
      || req.params[param_name]
      || req[param_name];
  }

  // Return all functions
  return {
    createTask: createTask,
    deleteTask: deleteTask,
    completeTask: completeTask,
    getCompletedTasks: getCompletedTasks,
    getIncompleteTasks: getIncompleteTasks,
  };
}

