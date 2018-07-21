#!/usr/bin/env nodemon
var express = require('express');
var expressLayouts = require('express-ejs-layouts');
var app = express();

// Use EJS view engine + Layouts
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
app.use(expressLayouts);


// Resources
app.use('/resources', express.static(__dirname + '/resources'));

// Routes
app.get('/', function(req, res) {
  res.render('index', { title: 'dunkhut.party' });
})
app.get('/tasks', function(req, res) {
  res.render('tasks', {title: 'TODO' });
})

// Start server
app.listen(3000);

