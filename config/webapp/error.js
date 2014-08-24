module.exports = function(app){
    app.use(_500());
	app.use(_404());
}

function _500(){
    return function(err, req, res, next){
        res.render('500');
    }
}

function _404(){
    return function(req, res, next){
        res.render('404');
    }
}