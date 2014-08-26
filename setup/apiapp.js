/**
 * Module dependencies.
 */
var cell = require('../apiroutes/cellroute'),
	trial = require('../apiroutes/trial'),
	newError = require('../config/apiapp/error').newError,
	errorHandler = require('../config/apiapp/error').errorHandler;
	_404 = require('../config/apiapp/error')._404;

module.exports = exports = function(app){
	//set up trial route
	//for all trial, tag request as trial
	app.use('/trial', function(req, res, next){
		req.isTrial = true;
		return next();
	});
	app.use('/trial', trial.allowCrossDomain());
	//for ip trial
	app.use('/trial/ip', trial.countIP());

	//for user trial
	app.use('/trial/user', trial.trialAuth());
	app.use('/trial/user', trial.countTrial());

	//mount cell router on those path
	app.use('/trial/ip/cell', cell.router);
	app.use('/trial/user/cell', cell.router);
	app.use('/trial/user/cell', cell.router);

	//
	app.use('/cell', cell.appAuth());
	app.use('/cell', cell.bill());

	//mount cell router on '/cell' path
	app.use('/cell', cell.router);

	//error hanlde here
	app.use(errorHandler());
	app.use(_404());
}