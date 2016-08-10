var docker = require('./index.js');
var cont = {
    Image: 'ubuntu',
    Cmd: ['bash', '-c', 'uname -a'],
    name: 'ubuntu-test',
    Volumes:{'/tmp/app': {}}
};

docker.createContainer(cont).then(function(container){
    return docker.startContainer(container.id).then(function(res){
        console.log(res);
    })
}).fail(function(err){
    console.log(err);
})




