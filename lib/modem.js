const
    Q  = require('q'),
    AR = require('./authRequest').getRequestInstance({}),

    dial = function (method, o, okStatuses) {

        if ( !okStatuses ) okStatuses = [200];

        return AR[method](o).then(function(response){

            if ( !~okStatuses.indexOf(response.status) ) {
                return Q.reject(response);
            }

            try { return JSON.parse(response.body.toString('utf8')); }
            catch (error) {
                console.error(
                    '[ERROR] modem : url "%s"\ncan not parse response body : %s',
                    o.url,
                    response.body.toString('utf8')
                );
                return Q.reject('can not parse response body');
            }
        });
    };

module.exports = {
    stat_all_servers : function () {
        return dial('get', {url : CFG.statServer.url});
    },
};
