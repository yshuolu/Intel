exports.show = function(req, res){
	res.render('billing_info', {user: req.session.user, nav: 1});
}
