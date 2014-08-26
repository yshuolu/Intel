/**
 * Module dependencies.
 */
var express = require('express'),
	vhost = require('vhost'),
	mongoose = require('mongoose'),
	fs = require('fs'),
	Memcached = require('memcached'),
	env = process.env.NODE_ENV || 'development',
	config = require('./config')[env],
	errorHandler = require('errorhandler');

/**
 * Connect mongodb
 */
var connect = function(){
	var options = {server: {socketOptions: {keepAlive: 1}}, user: process.env.DB_USER, pass: process.env.DB_PASS};
	mongoose.connect(config.db, options);
}

connect();

//error handler
mongoose.connection.on('error', function(err){
    throw err;
});

//reconnect when disconnected
mongoose.connection.on('disconnected', function(){
    connect();
});

//connect success
mongoose.connection.once('open', function(){
    console.log('connect mongodb success');
});

/**
 * Memcache server
 */
var memcached = new Memcached(config.cacheServer);

/**
 * Create dispatch app, web app and api app
 */ 
var app = express(),
	webApp = express(),
	apiApp = express();

exports = module.exports = app; //export dispatcher app
app.memcached = memcached;
app.configObj = config;

app.webApp = webApp;
app.apiApp = apiApp;

//subdomain settings
app.use(vhost(config.url, webApp));      //webApp host yun.com
app.use(vhost('api.'+config.url, apiApp));  //apiApp host api.yun.com

/**
 * Init all models
 */
var modelsPath = __dirname + '/models/';
fs.readdirSync(modelsPath).forEach(function(file){
	if (~file.indexOf('.js')) require(modelsPath + file);
});

/**
 * Web app config
 */
require('./config/webapp/setapp')(webApp, config);
require('./config/webapp/route')(webApp);
require('./config/webapp/error')(webApp);

/**
 * Setup api app
 */
require('./setup/apiapp')(apiApp);

/**
 * Launch dispatcher app
 */
app.listen(config.port, function(){
	console.log('Express server listening on port ' + config.port);
});
