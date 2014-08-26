/**
 * Module dependencies.
 */

//init models
require('./cell');

var app = require('../../app'),
	path = require('path'),
	util = require('util'),
	base = '/' + path.basename(__dirname), //get last component, aka controller name
	mongoose = require('mongoose'),
	Cell = mongoose.model('Cell'),
	memcached = app.memcached,
	newError = require('../../config/apiapp/error').newError;

/**
 * Set up the routing within this namespace
 */

//search the cell with LAC and CELL number: /cell
app.apiApp.magicGet(base, search, trim);

//search nearest cells with LNG, LAT and Dis: /cell/near
app.apiApp.magicGet(path.join(base, 'near'), searchNearest, trim);

//use as the IP trial
//may be modified later
app.apiApp.get('/iptrial', search, trim);

//predefined hex radix
var HEX_RADIX = 16

//predefine page size
var PAGE_SIZE = 10;


/**
 * Search cell with criteria and return cell info
 *
 * This method attach the outputObj to res object
 */

function search(req, res, next){
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
		return next(newError('INVALID_PARAM'));
	}

	//try to hit the cache first
	memcached.get(cacheKeyForCell(req), function(err, data){
		if (err) throw err;

		if (data){
			//hit cache
			res.outputObj = data;
			return next();

		}else{
			//did not hit the cache, query database now
			Cell.findByLacAndCell(req.query.mnc, req.query.lac, req.query.cell, function(err, cells){
				if (err) return res.send('internal error');

				if (cells.length == 0) return next(newError('NO_RESULT'));

				//compose output json, which is an array
				res.outputObj = [];

				//doc object to plain object
				cells.forEach(function(doc){ 
					var plainObject = doc.toObject();
					delete plainObject.loc;
					delete plainObject._id;
					delete plainObject.source;
					delete plainObject.isAdjusted;

					res.outputObj.push(plainObject);
				});

				//get the final result, next
				next();

				/**
				 * After sent the contents, cache them in memcached.
				 *
				 * Heads up: the cells include mongoose model objects, but after adding to cache
				 * it just change to plain object.
				 * So no more process here.
				 * Set cache item never expired.
				 */
				memcached.set(cacheKeyForCell(req), res.outputObj, 0, function(err){
					//todo:
					//handle error, not decided how to do it yet...
				});
			});
		}

	});
	
}

/**
 * Search nearest cells with longitude, latitude and distance
 *
 * To do:
 * Now this method just support search the first 10 nearest cells. We will do paging on results...
 */

function searchNearest(req, res, next){
	//sanitize, all parameters should be number
	var lng = parseFloat(req.query.lng);
	var lat = parseFloat(req.query.lat);
	var dis = parseFloat(req.query.dis);

	//validate params
	if (isNaN(lng) || isNaN(lat) || isNaN(dis)){
		return res.send(newError('INVALID_PARAM'));
	}

	//try to hit cache first
	memcached.get(cacheKeyForNearest(req), function(err, data){
		//to modify
		if (err) throw err;

		if (data){
			//hit cache
			res.outputObj = data;
			return next();

		}else{
			//search nearest cells
			Cell.findNearestCells(lng, lat, dis, PAGE_SIZE, function(err, cells){
				if (err) return next(err);

				if (cells.results.length == 0) return next(newError('NO_RESULT'));

				//process result
				//ignore the diagnose info
				//create the output json object
				res.outputObj = [];

				//assign value to the output object
				//res.outputObj.count = cells.results.length;
				cells.results.forEach(function(item){
					delete item.obj.loc;
					delete item.obj._id;
					delete item.obj.source;

					res.outputObj.push(item.obj);
				});

				//already get the output json object, next
				next();

				//after send the data, set cache
				memcached.set(cacheKeyForNearest(req), res.outputObj, 0, function(err){
					//todo:
					//handle error, not decided how to do it yet...
				});
			});
		}

	});

}

function trim(req, res){
	trimmedResult = [];

	res.outputObj.forEach(function(cell){
		trimmedResult.push(util.subfields(cell, ['lng', 'lat', 'address']));
	});

	res.json(trimmedResult);
}

// Todo:
// We can unify the cache fecth interface and use same function to generate the cache key!

/**
 * Compose key in memcached for cell search
 */

function cacheKeyForCell(req){
	var key = req.path + ' ' + JSON.stringify({mnc: req.query.mnc, lac: req.query.lac, cell: req.query.cell});

	return encodeURIComponent(key);
}

/**
 * Compose key in memcached for finding nearest cells
 */

function cacheKeyForNearest(req){
	var key = req.path + ' ' + JSON.stringify({lng: req.query.lac, lat: req.query.lat, dis: req.query.dis});

	return encodeURIComponent(key);
}