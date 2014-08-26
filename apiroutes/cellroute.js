/**
 * Module dependencies
 */

require('./cell');

var mongoose = require('mongoose'),
	express = require('express'),
	App = mongoose.model('App'),
	User = mongoose.model('User'),
	BillingPlan = mongoose.model('BillingPlan'),
	Cell = mongoose.model('Cell'),
	crypto = require('crypto'),
	newError = require('../config/apiapp/error').newError,
	config = require('../app').configObj,
	subfields = require('../utils/subfields').subfields,
	app = require('../app'),
	memcached = app.memcached;

//predefined hex radix
var HEX_RADIX = 16

//predefine page size
var PAGE_SIZE = 10;

/**
 * Middleware to authenticate the api access.
 * check if the request come from a valid app, and bind 
 * the app to req object
 */

exports.appAuth = function(){
	return function(req, res, next){
		//validate the timestamp
		if (!req.query.timestamp) return next(newError('INVALID_TIMESTAMP'));

		var requestTimestamp = parseInt(req.query.timestamp);

		if (isNaN(requestTimestamp)) return next(newError('INVALID_TIMESTAMP'));

		// var currentTimestamp = Date().getTime();

		if (new Date().getTime() - requestTimestamp * 1000 > config.timestampExpire){ 
			//reject the request as replay attack
			return next(newError('INVALID_TIMESTAMP'));
		}

		//check if the access id in params
		if (!req.query.access_id) return next(newError('INVALID_ACCESSID'));

		App
			.findOne({accessId: req.query.access_id})
			.populate('plan') // should populate billing object
			.exec(function(err, app){
				if (!err && app){
					req.app = app;

					if ( verifySignature(req) ){
						next();
					}else{
						next(newError('INVALID_SIGN'));
					}

				}else{
					next(newError('INVALID_ACCESSID'));
				}
			});
	}
}

/**
 * Middleware for new billing system.
 */

//No more support for default billing
exports.bill = function(){
	return function(req, res, next){
		var plan = req.app.plan;

		if (!plan || plan.isExpired(req.query.timestamp)){
			//no plan or current plan is expired, need to find a up to date plan
			BillingPlan.upToDatePlan(req.app, req.query.timestamp, function(err, validPlan){
				if (err) return next(err);

				if (!validPlan) return next(newError('NO_PLAN'));

				req.app.plan = validPlan._id;

				req.app.save(function(err){
					if (err) return next(err);

					validPlan.consume(1, function(err){return next(err);});
				});
			});

		}else {
			//+1
			return plan.consume(1, function(err){
				if (err && err.name === 'PLAN_OUT'){
					return next(newError('PLAN_OUT'));
				}else{
					return next(err);
				}
			});

		}
	}

}

/**
 * Local function to verify user request signature.
 * Calculate the signature of request and then compare it with 
 * that sent with user request.
 */

function verifySignature(req){
	//compose the param string first
	//sort the key of all params alphabetically
	var paramKeys = [];

	for (var key in req.query){
		if (key != 'signature'){
			paramKeys.push(key);
		}
	}

	paramKeys.sort();

	var paramString = '';
	for (var index in paramKeys){
		paramString += paramKeys[index] + '=' + req.query[paramKeys[index]] + '&';
	}

	paramString = paramString.slice(0, -1);

	//compose the string to sign
	//var hash = crypto.createHmac('sha1', 'ad').update('huahua').digest('hex');
	var stringToSign = encodeURIComponent(req.hostname+req.originalUrl.split('?')[0]) + '&' + encodeURIComponent(paramString);

	//sign this string with user's access_key, and encode the binary digest by base64
	//var accessKey = req.app.access_key;
	var signature = crypto.createHmac('sha256', req.app.accessKey).update(stringToSign).digest('base64');

	//compare the signatures
	return (signature === req.query.signature)
}

/**
 * Create cell router, which can be mounted on path which provide cell query service
 */
var router = express.Router();

//setup router
router.use(function(req, res, next){
	if (req.path !== '/search' && req.path !== '/nearest'){
		next(newError('NOT_FOUND'));
	}else{
		next();
	}
});
router.use('/search', sanitizeSearch);
router.use('/nearest', sanitizeNearest);
router.use(hitCache);
router.use('/search', search);
router.use('/nearest', nearest);
router.use(outputAndCache);

//export cell router
exports.router = router;

/**
 * Sanitize the params of search request
 */
function sanitizeSearch(req, res, next){
	/**
	 * There are two kinds of query. One is decimal lac and cell, which both of params should
	 * be number; and another one is hex lac and cell, which both of params should be string.
	 * Do sanitize and validation here!
	 */

	req.query.mnc = parseInt(req.query.mnc);

	if (!req.query.hex) {
		//sanitize, all params should be number
		req.query.lac = parseInt(req.query.lac);
		req.query.cell = parseInt(req.query.cell);

	}else{
		//sanitize, all params should be string,
		//and change the hex string to integer
		req.query.lac = parseInt(req.query.lac.toString().toUpperCase(), HEX_RADIX);
		req.query.cell = parseInt(req.query.cell.toString().toUpperCase(), HEX_RADIX);
	}

	//check if params are number
	if ( isNaN(req.query.mnc) || isNaN(req.query.lac) || isNaN(req.query.cell) ) {
		//param error
		next(newError('INVALID_PARAM'));
	}else{
		next();
	}
}

/**
 * Sanitize the params of nearest request
 */
function sanitizeNearest(req, res, next){
	//sanitize, all parameters should be number
	req.query.lng = parseFloat(req.query.lng);
	req.query.lat = parseFloat(req.query.lat);
	req.query.dis = parseFloat(req.query.dis);

	//validate params
	if (isNaN(req.query.lng) || isNaN(req.query.lat) || isNaN(req.query.dis)){
		next(newError('INVALID_PARAM'));
	}else{
		next();
	}
}

/**
 * Try to hit cache first
 */
function hitCache(req, res, next){
	//obtain cache key following the cache key policy for each path, the key is 'path&key=value&key=value'
	//first get all params that matters for the path
	var paramKeys = config.cacheKeyPolicy[req.path].params;
	paramKeys.sort();
	var key = req.path;
	paramKeys.forEach(function(paramKey){
		key += '&' + paramKey + '=' + req.query[paramKey];
	});

	req.cacheKey = key;

	//now we get the cache key and use it to hit cache
	memcached.get(req.cacheKey, function(err, data){
		res.cache = data;

		next();
	});
}

/**
 * DB logic for search
 */
function search(req, res, next){
	//if there is cache, pass
	if (res.cache) return next();

	//no cache, need to query mongodb
	Cell.findByLacAndCell(req.query.mnc, req.query.lac, req.query.cell, function(err, cells){
		if (err) return next(err);

		if (cells.length == 0) return next(newError('NO_RESULT'));

		//compose output json, which is an array
		res.result = [];

		//doc object to plain object
		cells.forEach(function(doc){ 
			var plainObject = doc.toObject();
			delete plainObject.loc;
			delete plainObject._id;
			delete plainObject.source;
			delete plainObject.isAdjusted;

			res.result.push(plainObject);
		});

		//get the final result, next
		next();
	});
}

/**
 * DB logic for nearest
 */
function nearest(req, res, next){
	//if there is cache, pass
	if (req.cache) return next();

	//search nearest cells
	Cell.findNearestCells(req.query.lng, req.query.lat, req.query.dis, PAGE_SIZE, function(err, cells){
		if (err) return next(err);

		if (cells.results.length == 0) return next(newError('NO_RESULT'));

		res.result = [];

		//assign value to the output object
		//res.result.count = cells.results.length;
		cells.results.forEach(function(item){
			delete item.obj.loc;
			delete item.obj._id;
			delete item.obj.source;
			delete plainObject.isAdjusted;

			res.result.push(item.obj);
		});

		//already get the output json object, next
		next();
	});
}

/**
 * Output the result first and cache it if it has not been cached before
 */
function outputAndCache(req, res, next){
	var output = res.cache || res.result;

	if (req.isTrial){
		trim = [];

		output.forEach(function(cell){
			trim.push(subfields(cell, ['lng', 'lat', 'address']));
		});

		res.json(trim);

	}else{
		res.json(output);
	}

	//cache if needed
	if (!res.cache){
		memcached.set(req.cacheKey, output, 0, function(err){
			//log error
		});
	}
}