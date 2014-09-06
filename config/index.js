module.exports = {
	/**
	 * Development
	 */
	development: {
		/**
		 * Url
		 */
		url: 'yun.com',
		
		/**
		 * Mongodb config
		 */
		db: 'mongodb://localhost/data_platform_dev',

		/**
		 * Memcache config
		 */
		cacheServer: 'localhost:11211',

		/**
		 * Dispatch Server config
		 */
		port: 8888,

		/**
		 * Web server config
		 */
		secret: 'this is a secret',
		sessionMaxAge: daysToMillis(1),

		/**
		 * Api server config
		 */
		timestampExpire: minutesToMillis(15),
		allowedDomains: ['http://yun.com'],
		allowedHeaders: ['User-Email', 'User-Trial-Key'],

		/**
		 * Billing plan config
		 */
		planPolicy: {
			yearPlan: {interval: minutesToMillis(20), limit: 0}, //year plan has no request amount limit
			monthPlan1: {interval: minutesToMillis(10), limit: 300}, //month vip1, 300 thousand
			monthPlan2: {interval: minutesToMillis(10), limit: 600}, //month vip2, 600 thousand
			monthPlan3: {interval: minutesToMillis(10), limit: 900}, //month vip3, 900 thousand
		},

		/**
		 * Trial config
		 */
		trialLimit: 10, 
		trialInterval: minutesToMillis(10), //trial interval in minutes 

		/**
		 * IP count
		 */
		ipCountLimit: 10,
		ipCountAlive: minutesToMillis(1),

		/**
		 * Cache key policy
		 */
		cacheKeyPolicy: {
			'/search': {
				params: ['mnc', 'lac', 'cell']
			},
			'/nearest': {
				params: ['lng', 'lat', 'dis']
			}
		}
	},

	/**
	 * Production
	 */
	production: {
		/**
		 * Url
		 */
		url: '91yzh.com',

		/**
		 * Mongodb config
		 */
		db: 'mongodb://localhost/data_platform',

		/**
		 * Memcache config
		 */
		cacheServer: 'localhost:11211',

		/**
		 * Cache key policy
		 */
		cacheKeyPolicy: {
			'/search': {
				params: ['mnc', 'lac', 'cell']
			},
			'/nearset': {
				params: ['lng', 'lat', 'dis']
			}
		},

		/**
		 * Dispatch Server config
		 */
		port: 8888,

		/**
		 * Web server config
		 */
		secret: 'Go home shawn',
		sessionMaxAge: daysToMillis(7),

		/**
		 * Api server config
		 */
		timestampExpire: minutesToMillis(15),
		allowedDomains: ['http://91yzh.com'],
		allowedHeaders: ['User-Email', 'User-Trial-Key'],

		/**
		 * Billing plan config
		 */
		planPolicy: {
			yearPlan: {interval: yearsToMillis(1), limit: 0}, //year plan has no request amount limit
			monthPlan1: {interval: monthsToMillis(1), limit: 300000}, //month vip1, 300 thousand
			monthPlan2: {interval: monthsToMillis(1), limit: 600000}, //month vip2, 600 thousand
			monthPlan3: {interval: monthsToMillis(1), limit: 900000}, //month vip3, 900 thousand
		},

		/**
		 * IP count
		 */
		ipCountLimit: 10,
		ipCountAlive: minutesToMillis(1),

		/**
		 * Trial config
		 */
		trialLimit: 10, 
		trialInterval: daysToMillis(1)  
	}
}

//time convert function
function minutesToMillis(minutes){
	return minutes * 60 * 1000;
}

function hoursToMillis(hours){
	return hours * 60 * 60 * 1000;
}

function daysToMillis(days){
	return days * 24 * 60 * 60 * 1000;
}

function monthsToMillis(months){
	return months * 31 * 24 * 60 * 60 * 1000;
}

function yearsToMillis(years){
	return years * 365 * 24 * 60 * 60 * 1000;
}
