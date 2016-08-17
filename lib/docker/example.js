const docker = require('./index.js');

docker.run('l_dfx', 'invoke', process.stdout, {
    'name'         : 'dfx_5',
    'VolumesFrom'  : ['dfx_data'],
    'ExposedPorts' : {
        '5001/tcp': {},
        '5002/tcp': {},
        '5003/tcp': {},
        '5049/tcp': {},
    },
    'PortBindings' : {
        '5001/tcp': [{ 'HostPort': '5001' }],
        '5002/tcp': [{ 'HostPort': '5002' }],
        '5003/tcp': [{ 'HostPort': '5003' }],
        '3049/tcp': [{ 'HostPort': '5049' }]
    },
    'Env' : [
         'DFM_camtime=5',
         ' DFM_notifications_URL=http://192.168.1.77:3050/notify'
    ]

})
.then(function(res){
    console.log(res);
}).fail(function(error){
    console.log(error);
})
