/**
 * Module dependencies.
 */
var express = require('express'),
	vhost = require('vhost'),
	mongoose = require('mongoose'),
	fs = require('fs'),
	Memcached = require('memcached'),
	env = process.env.NODE_ENV || 'development',
	config = require('./config')[env];

/**
 * Connect mongodb
 */
var connect = function(){
	var options = {server: {socketOptions: {keepAlive: 1}}, user: 'app', pass: 'wenhui'};
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
app.webApp = webApp;
app.apiApp = apiApp;

//subdomain settings
app.use(vhost('yun.com', webApp));      //webApp host yun.com
app.use(vhost('api.yun.com', apiApp));  //apiApp host api.yun.com

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

/**
 * Api app config
 */

//config the app
require('./config/apiapp/setapp')(apiApp, config);

//boot all controllers, there are no global routing config, it is MVC style
require('./config/apiapp/boot')(apiApp);			

//error handler
require('./config/apiapp/error').errorConfig(apiApp);

/**
 * Launch dispatcher app
 */
app.listen(config.port, function(){
	console.log('Express server listening on port ' + config.port);
});