exports.list = function(req, res){
	res.render('doclist', {user: req.session.user, nav: 2});
}

exports.restApiDoc = function(req, res){
	res.render('doc_restapi');
}

exports.signDoc = function(req, res){
	res.render('doc_sign');
}
