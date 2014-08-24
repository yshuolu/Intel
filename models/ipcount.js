/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	env = process.env.NODE_ENV || 'development',
	config = require('../config')[env];

/**
 * Trial schema
 */

var IPCountSchema = Schema({
	ip: String, 
	remaining: {type: Number, default: config.ipCountLimit - 1},
	createdAt: {type: Date, default: Date.now}
});

//TTL index
IPCountSchema.index({createdAt: 1}, {expireAfterSeconds: config.ipCountAlive / 1000});

/**
 * Methods
 */
IPCountSchema.methods = {
    /**
     * Decrease the remaining api trial count
     *
     * @param {Number} amount
     * @param {Function} fn; fn(err)
     *
     * @api public
     */
    consume: function(fn){
    	if (this.remaining > 0){
    		this.update({$inc: {remaining: -1}}, fn);
    	}else{
    		var err = new Error();
    		err.name = 'IP_LIMIT';
    		fn(err);
    	}
        
    }

}

//
mongoose.model('IPCount', IPCountSchema);