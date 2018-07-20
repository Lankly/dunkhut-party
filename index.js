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
['resources', 'styles'].forEach((path) => {
  app.use(`/${path}`, express.static(__dirname + `/${path}`));
})

// Routes
app.get('/', function(req, res) {
  res.render('index', { title: 'dunkhut.party' });
})

// Start server
app.listen(3000);

