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
        ca   : fs.readFileSync('/var/lib/dreamface/lbdata/docker.certs/ca.pem').toString('utf8'),
        cert : fs.readFileSync('/var/lib/dreamface/lbdata/docker.certs/cert.pem').toString('utf8'),
        key  : fs.readFileSync('/var/lib/dreamface/lbdata/docker.certs/key.pem').toString('utf8')
    }
}
