const
    Q  = require('q'),
    fs = require('fs'),
    CP = require('child_process');

exports.changeConfig = function ( configPath, config ) {

    var cnt = '';

    for (var tenant in config ) {
        cnt += tenant + '=' + config[tenant] + "\n"
    }

    cnt = cnt.replace(/\n$/, '');

    console.log('changing config to \n>' + cnt + '<\n');

    return writeFile(configPath, cnt)
    .then(function(){

        console.log('restarting nginx...');

        const
            D = Q.defer(),
            child = CP.spawn(
                'nginx-perl',
                ['-s', 'reload'],
                {
                    detached : true
                }
            )
            .on('error', function(error){
                console.error('NGINX ERROR : ', error);
            })
            .on('data', function(data){
                console.error('NGINX DATA : ', data);
            })
            .on('close', function(exitCode){

                console.error('NGINX EXIT CODE : ', exitCode);

                if ( exitCode !== 0 && exitCode !== 130 ) {
                    D.reject(Error('exit code is : ' + exitCode));
                } else {
                    D.resolve();
                }
            });

        child.unref();

        return D.promise;
    });
};

function writeFile ( filePath, content ) {
    const D = Q.defer();

    fs.writeFile(filePath, content, function (error) {
        error ? D.reject(error) : D.resolve();
    });

    return D.promise;
}
