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
		sessionMaxAge: 900000,

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
		planLimit: [0, 500], //level0: 0; level1: 500

		/**
		 * Trial config
		 */
		trialLimit: 10, 
		trialInterval: 1 //trial interval in minutes 
	},

	production: {}
}

