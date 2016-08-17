var fs = require('fs');

module.exports = {
    docker_daemon: {
        useDefaultSettings: false,
        // host: '',
        // port: '',
        // ca: '',
        // cert: '',
        // key: ''
        protocol: 'https',
        checkServerIdentity : false,
        host : '192.168.99.100',
        port : process.env.DOCKER_PORT || 2376,
        ca   : fs.readFileSync('/Users/surr/.docker/machine/certs/ca.pem').toString('utf8'),
        cert : fs.readFileSync('/Users/surr/.docker/machine/certs/cert.pem').toString('utf8'),
        key  : fs.readFileSync('/Users/surr/.docker/machine/certs/key.pem').toString('utf8')
    }
}
