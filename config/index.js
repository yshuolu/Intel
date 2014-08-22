module.exports = {
	development: {
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
		sessionMaxAge: 9000000,

		/**
		 * Api server config
		 */
		timestampExpire: 15,
		allowedDomains: ['http://yun.com'],
		allowedHeaders: ['User-Email', 'User-Trial-Key'],

		/**
		 * Billing plan config
		 */
		billPlanInterval: 10, //10 minutes
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
		trialInterval: 1 //trial interval in minutes 
	},

	production: {
		planPolicy: {
			yearPlan: {interval: yearsToMillis(1), limit: 0}, //year plan has no request amount limit
			monthPlan1: {interval: monthsToMillis(1), limit: 300000}, //month vip1, 300 thousand
			monthPlan2: {interval: monthsToMillis(1), limit: 600000}, //month vip2, 600 thousand
			monthPlan3: {interval: monthsToMillis(1), limit: 900000}, //month vip3, 900 thousand
		}
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
