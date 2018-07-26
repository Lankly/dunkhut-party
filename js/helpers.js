'use strict'

/*************
 * CONSTANTS *
 *************/

// Loading and initializing the library:
const pgp = require('pg-promise')({
  // Initialization Options
});
// Preparing the connection details:
const cn = 'postgres://dbuser:password@localhost:5432/postgres';
// Creating a new database instance from the connection details:
const db = pgp(cn);
exports.db = db;


/*************
 * FUNCTIONS *
 *************/

/**
 * These functions create standardized CRUD functions.
 */
exports.createCreateFunc = function (table_name, columns) {
  return function (params) {
    // Construct Query
    let query = `INSERT INTO ${table_name} ( ${columns.join(", ")} ) `
      + "VALUES (";
    // Add $1 ... $n
    columns.forEach((col) => { query += "${" + col + "}, "})
    // Remove last ", "
    query = query.slice(0, -2);
    // Finish values parentheses
    query += ") "
    // Ask to get back id of inserted record
    query += "RETURNING id;"

    return db.query(query, params);
  }
};
exports.createDeleteFunc = function (table_name) {
  return function (id) {
    return db.query(`DELETE FROM ${table_name} WHERE id = $\{id};`, { id: id });
  }
};

/**
 * Creates a function for setting the value of the specified column.
 */
exports.createColSetter = function (table_name, column) {
  return function (id, val) {
    return db.query(`UPDATE ${table_name}
        SET ${column} = $\{val}
        WHERE id = $\{id}`, { id: id, val: val });
  }
};

/**
 * Creates a success function for use in route promises.
 *
 * @param req {object} The req object passed to the route callback.
 * @param return_data {boolean} Set to true to return the data. 
 */
exports.createSuccessFunc = function (res, return_data) {
  return function (data) {
    let return_obj = { status: 200, message: "Success" };
    if (return_data) { return_obj.data = data };

    console.log("Returning:", return_obj);
    res.status(200).send(return_obj);
  };
};
/**
 * Creates an error function for use in route promises.
 */
exports.createErrorFunc = function (res) {
  return function (err) {
    console.log(err);

    res.status(500).send(err);
  };
};

