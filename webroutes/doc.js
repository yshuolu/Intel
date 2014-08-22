exports.list = function(req, res){
	res.render('doclist');
}

exports.restApiDoc = function(req, res){
	res.render('doc_restapi');
}

exports.signDoc = function(req, res){
	res.render('doc_sign');
}