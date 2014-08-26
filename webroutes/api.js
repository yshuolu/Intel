var env = process.env.NODE_ENV || 'development',
	config = require('../config')[env];

exports.list = function(req, res, next){
	res.render('apilist', {user: req.session.user, nav: 0});
}

exports.cell = function(req, res, next){
	var info = {
		title: '移动基站编号查询接口',
		description: '根据LAC和CELL号查询详细基站信息',
		address: '91yzh.com/cell/search',
		example: 'api.91yzh.com/cell/search?mnc=0&lac=1&cell=1&access_id=7afb1aed47efc13104&timestamp=1408924405&signature=3Yr33u',
		params: [
			['mnc', 'number', '运营商号码，0 代表移动，1 代表联通，其它代表电信'],
			['lac', 'number', '大区号'],
			['cell', 'number', '小区号'],
			['hex', 'bool', 'true代表使用16进制，默认10进制']
		],
		return: JSON.stringify([{
					mcc: 460,
					mnc: 0,
					lac: 1,
					cell: 1,
					lng: 113.55808,
					lat: 22.19444,
					o_lng: 113.55808,
					o_lat: 22.19444,
					precision: 1500,
					address: "特别行政区澳门特别行政区澳门半岛湾仔街道茂盛围加油站西北",
					province: "特别行政区",
					county: "澳门半岛",
					town: "湾仔街道",
					village: "茂盛围",
					city: "澳门特别行政区",
					street: "",
					streetno: ""
					}], null, 4)
	};

	switch (req.query.tab){
		case 'info':
			return res.render('api_info', {user: req.session.user, info: info, apiName: 'cell', index: 1});
			break;

		case 'trial':
			if (!req.session.user) return res.redirect('/signin');
			return res.render('cell_trial', {user: req.session.user, info: info, apiName: 'cell', index: 2, apiUrl: 'api.' + config.url});
			break;

		case 'offline':
			return res.render('api_offline', {user: req.session.user, info: info, apiName: 'cell', index: 3});
			break;

		default:
			var err = new Error('404 not found');
			err.status = 404;
			return next(err);
	}
}

exports.cellnearby = function(req, res, next){
	var info = {
		title: '移动基站经纬度查询接口',
		description: '查询某一经纬度坐标周边一定距离范围内的最近基站信息（最多10个）',
		address: '91yzh.com/cell/nearest',
		example: 'api.91yzh.com/cell/nearest?access_id=c2ddcce410a09ed964a&dis=1000&lat=41.27&lng=82.96&timestamp=1406905004&signature=9OlgMv%',
		params: [
			['lng', 'number', '经度'],
			['lat', 'number', '纬度'],
			['dis', 'number', '距离']
		],
		return: JSON.stringify([
					{
					mcc: 460,
					mnc: 0,
					lac: 1,
					cell: 1,
					lng: 113.55808,
					lat: 22.19444,
					o_lng: 113.55808,
					o_lat: 22.19444,
					precision: 1500,
					address: "特别行政区澳门特别行政区澳门半岛湾仔街道茂盛围加油站西北",
					province: "特别行政区",
					county: "澳门半岛",
					town: "湾仔街道",
					village: "茂盛围",
					city: "澳门特别行政区",
					street: "",
					streetno: ""
					}
				], null, 4)
	};

	switch (req.query.tab){
		case 'info':
			return res.render('api_info', {user: req.session.user, info: info, apiName: 'cellnearby', index: 1});
			break;

		case 'trial':
			if (!req.session.user) return res.redirect('/signin');
			return res.render('cellnearby_trial', {user: req.session.user, info: info, apiName: 'cellnearby', index: 2, apiUrl: 'api.' + config.url});
			break;

		case 'offline':
			return res.render('api_offline', {user: req.session.user, info: info, apiName: 'cellnearby', index: 3});
	}
}
