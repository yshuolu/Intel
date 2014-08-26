/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Trial = mongoose.model('Trial'),
	newError = require('../config/apiapp/error').newError,
	IPCount = mongoose.model('IPCount'),
	config = require('../app').configObj;

/**
 * Middleware for user trial auth
 *
 * It's different from appAuth by that it's auth by user email and user trial key.
 * Attach user object to req object.
 */
exports.trialAuth = function(){
	return function(req, res, next){
		if (req.method === 'OPTIONS') return res.send('');

		//get user by email
		User.findByEmail(req.header('User-Email'), function(err, user){
			if (err) return next(err);
			if (!user) return next(newError('INVALID_TRIAL'));

			if ( user.trialKey === req.header('User-Trial-Key') ){
				req.user = user;
				next();
			}else{
				next(newError('INVALID_TRIAL'));
			}
		});
	};
}

/**
 * Middleware for api trial count
 *
 * Decrease the trial period remainings
 */
exports.countTrial = function(){
	return function(req, res, next){
		Trial.trialOfUser(req.user._id, function(err, trial){
			if (err) return next(err);

			if (!trial){
				var newTrial = new Trial({
					user: req.user._id
				});

				newTrial.renew(config.trialInterval, config.trialLimit, function(err){
					if (err) return next(err);

					//everything goes well
					return next();
				});

			}else if (trial.isExpired()){
				trial.renew(config.trialInterval, config.trialLimit, function(err){
					if (err) return next(err);

					//everything goes well
					return next();
				});

			}else if (trial.isExhausted()){
				return next(newError('TRIAL_OUT'));

			}else{
				trial.consume(1, function(err){
					if (err) return next(err);

					return next();
				});
			}
		});
	};
}

//CORS
exports.allowCrossDomain = function(){
	return function(req, res, next){
		res.header('Access-Control-Allow-Origin', config.allowedDomains);
		res.header('Access-Control-Allow-Headers', config.allowedHeaders);
		return next();
	}
}

//count IP
exports.countIP = function(){
	return function(req, res, next){
		IPCount
			.findOne({ip: req.ip})
			.exec(function(err, ip){
				if (err) return next(err);

				if (ip){
					ip.consume(function(err){
						if (err && err.name === 'IP_LIMIT'){
							return next(newError('TRIAL_OUT'));
						}else{
							return next(err);
						}
					});

				}else{
					var newIP = new IPCount({
						ip: req.ip
					});

					newIP.save(function(err){
						return next(err);
					});
				}
			});
	}
} 