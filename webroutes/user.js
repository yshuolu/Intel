/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
	app = require('../app'),
	env = process.env.NODE_ENV || 'development',
	config = require('../config')[env],
	User = mongoose.model('User'),
	ObjectId = mongoose.Types.ObjectId;

/**
 * Register a new user
 */

exports.signup = function(req, res, next){
	var newUser = new User(req.body);

	newUser.save(function(err, user){
		if (err){
			if (err.name === 'ValidationError'){
				//validation error
				req.session.msg = {
					type: 'error', 
					content: '邮箱' + req.body.email + '已经存在，请使用新的email注册'
				};
				return res.redirect('/signup');

			}else{
				//internal error
				return next(err);
			}
		}

		//user register success
		req.session.user = user.toObject();

		res.redirect('/');
	});
}

exports.signupPage = function(req, res){
	if (req.session.user) return res.redirect('/');

	res.render('signup', {msg: req.session.msg});
	req.session.msg = null;
}

/**
 * User login
 */

exports.signin = function(req, res){
	User
		.findOne({email: req.body.email})
		.exec(function(err, user){
			//match password
			if (err){
				return next(err);
			}else if ( user && user.authenticate(req.body.pass) ){
				//generate a new session
				//bind user object id to this session
				req.session.regenerate(function(err){
					//attach user object to session
					req.session.user = user.toObject();

					//signin expire
					var maxAge = config.sessionMaxAge;
					req.session.cookie.expires = new Date(Date.now() + maxAge);
					req.session.cookie.maxAge = maxAge;

					if (req.session.user.isAdmin){
						res.redirect('/admin');
					}else{
						//for normal user
						res.redirect('/');
					}
				});
				
			}else{
				//login failed
				req.session.msg = {
					type: 'error', 
					content: '用户名或者密码错误'
				};
				res.redirect('/signin');
			}
		});
}

exports.signinPage = function(req, res){
	if (req.session.user) return res.redirect('/');

	res.render('signin', {msg: req.session.msg});
	req.session.msg = null;
}

/**
 * User Logout
 */

exports.signout = function(req, res){
	req.session.destroy(function(err){
		res.redirect('/');
	});
}

/**
 * Show user profile page
 */
exports.profile = function(req, res){
	res.render('profile', {user: req.user});
}