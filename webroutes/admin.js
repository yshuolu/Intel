/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
	BillingPlan = mongoose.model('BillingPlan'),
	App = mongoose.model('App'),
	Invitation = mongoose.model('Invitation'),
	User = mongoose.model('User'),
	Order = mongoose.model('Order'),
	alphaId = require('../utils/alphaid'),
	env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    moment = require('moment-timezone');


exports.loadOrder = function(){
	return function(req, res, next){
		var orderId = alphaId.decode(req.body.shortId);

		if (isNaN(orderId)) return next('invalid short id');

		Order
			.findOne({orderId: orderId})
			.populate('app')
			.exec(function(err, order){
				if (err) return next(err);

				if (!order) return next('invalid short id');

				req.order = order;

				next();
			});
	}
}

/**
 * Create new invitation code
 */

exports.invite = function(req, res){
	var MAGIC = 'phineas';

	if (req.body.magic === MAGIC){
		//valid magic code
		var invitation = new Invitation({
			code: alphaId.encode( Math.round( Math.random() * 1000000 ) )
		});

		invitation.save(function(err){
			if (err) return next(err);

			//create invitation code success
			res.send(invitation.code + '\n');
		});
	}else{
		next('invalid magic');
	}
}


/**
 * Admin sign up.
 * The same sign up as normal user, except that it requires invitation code.
 */

exports.signup = function(req, res, next){
	Invitation
		.findOne({code: req.body.invitation})
		.exec(function(err, invitation){
			if (err) return next(err);

			if (!invitation) return next('invalid invitation code');

			//do get invitation code
			req.body.isAdmin = true;
			var admin = new User(req.body);
			admin.save(function(err, user){
				if (err) return next(err);

				req.session.user = user;

				//delete used invitation
				invitation.remove(function(err){
					if (err) return next(err);

					//
					res.redirect('/admin/orderlist');
				});
			});
		});
}

exports.signupPage = function(req, res, next){
	res.render('admin_signup');
}

/**
 * Show all pending orders for admin
 */
exports.pendingOrders = function(req, res, next){
	Order
		.find({pending: true})
		.populate('app')
		.sort({createdAt: -1})
		.exec(function(err, orders){
			if (err) return next(err);

			var pendingList = [];

			for (var index in orders){
				var order = orders[index].toObject();

				order.orderId = alphaId.encode(order.orderId);
				order.createdAt = moment(order.createdAt).format('l');

				pendingList.push(order);
			}

			res.render('pendinglist', {user: req.session.user, orders: pendingList, nav: 3});
		});
}

/**
 * Create next level 1 billing for user.
 */

exports.newBillingPlan = function(req, res, next){
	//
	//var appId = req.userApp._id;
	//var appId = req.order.app._id;

	//level 1
	//var level = 1;

	var order = req.order;

	//find the latest high level billing plan
	BillingPlan.latestPlanForApp(order.app._id, function(err, plan){
		var current = new Date();

		//if plan exists and not expired yet
		if (plan && current < plan.expire){
			current = plan.expire; //make continuous plan interval after the latest one
		}

		//create new billing plan
		var newPlan = new BillingPlan({
			app: order.app._id,
			type: order.type,
			start: current,
			expire: new Date( current.getTime() + config.planPolicy[order.type].interval ),
			// level: level
		});

		newPlan.save(function(err){
			if (err) return next(err);
			
			//finish order
			order.pending = false;
			order.save(function(err){
				if (err) return next(err);

				return res.redirect('/admin');
			});
			
		});

	});
}

/**
 * Local function to save an array of documents at once.
 */

function saveDocArray(array, fn){
	var reside = array.length;

	array.forEach(function(doc){
		doc.save(function(err){
			//error happens in other iteration
			if (reside == -1){
				return;
			}

			if (err) {
				reside = -1;
				return fn(err);
			}

			reside--;

			if (reside == 0){
				fn();
			}
		});
	});
}


function minutesToMilliseconds(minutes){
	return minutes * 60 * 1000;
}
