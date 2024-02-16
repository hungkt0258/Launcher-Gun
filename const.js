let config;
if (typeof process.env.NODE_ENV != 'undefined' && process.env.NODE_ENV.trim() === 'stage') {
    config = {
        host: 'http://127.0.0.1:81',
        debug: false
    }
} else if (typeof process.env.NODE_ENV != 'undefined' && process.env.NODE_ENV.trim() === 'development') {
    config = {
        host: 'http://127.0.0.1:81',
    }
} else {
    // Prod mode
    config = {
        host: 'http://127.0.0.1:81',
        debug: false
    }
}
module.exports = config;
