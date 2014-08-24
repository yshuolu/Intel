var express = require('express'),
	path = require('path'),
	morgan = require('morgan'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	bodyParser = require('body-parser'),
	auth = require('../../middlewares/auth'),
	env = process.env.NODE_ENV || 'development',
	config = require('../../config')[env];

//root dir
rootDir = path.join(__dirname, '..', '..');


//set up the app
module.exports = function(app, config){
	// all environments
	app.set('port', process.env.PORT || config.port);
	app.set('views', path.join(rootDir, 'views'));
	app.set('view engine', 'jade');
		
	//middleware settings
	app.use(morgan('dev'));
	app.use(cookieParser());
	app.use(session({secret: config.secret}));
	app.use(bodyParser());
	app.use(express.static(path.join(rootDir, 'public')));
}
