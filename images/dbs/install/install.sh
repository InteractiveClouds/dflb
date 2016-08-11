#!/usr/bin/env bash

export DEBIAN_FRONTEND=noninteractive

bail() {
    echo 'Error executing command, exiting'
    exit 1
}

exec_cmd_nobail() {
    print_current_action "$1"
    bash -c "$1"
}

print_current_action() {
    echo
    echo " + $1"
    echo "----------------------------------------------------------------------"
    echo
}

exec_cmd() {
    exec_cmd_nobail "$1" || bail
}

if [ ! -x /usr/bin/lsb_release ]; then
    exec_cmd "apt-get update"
    exec_cmd "apt-get install -y lsb-release"
fi

DISTRO=$(lsb_release -c -s)

PRE_INSTALL_PKGS=""

if [ ! -x /usr/bin/curl ]; then
    PRE_INSTALL_PKGS="${PRE_INSTALL_PKGS}curl "
fi

if [ ! -x /usr/bin/git ]; then
    PRE_INSTALL_PKGS="${PRE_INSTALL_PKGS}git-core "
fi

if [ ! -x /usr/bin/redis-server ]; then
    PRE_INSTALL_PKGS="${PRE_INSTALL_PKGS}redis-server "
fi

MONGO_REPO=""

if [ "X${DISTRO}" == "Xwheezy" ]; then
    MONGO_REPO="deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.2 main"
fi

if [ "X${DISTRO}" == "Xjessie" ]; then
    MONGO_REPO="deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.2 main"
fi

if [ "X${DISTRO}" == "Xxenial" ]; then
#    MONGO_REPO="deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse"
    MONGO_REPO="deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.2 main"
fi

if [ "X${DISTRO}" == "Xtrusty" ]; then
    MONGO_REPO="deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse"
fi

if [ "X${DISTRO}" == "Xprecise" ]; then
    MONGO_REPO="deb http://repo.mongodb.org/apt/ubuntu precise/mongodb-org/3.2 multiverse"
fi

echo
echo "========================================================================="
echo "distribution name           : ${DISTRO}"
echo "mongo sourse repository     : ${MONGO_REPO}"
echo "packages required for setup : ${PRE_INSTALL_PKGS}"
echo "========================================================================="
echo

if [ "X${MONGO_REPO}" == "X" ]; then
    echo
    echo "Unknown distribution name : ${DISTRO}. Exiting"
    exit 1
fi

print_current_action "adding key and source for mongodb"
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "${MONGO_REPO}" | tee /etc/apt/sources.list.d/mongodb-org-3.2.list
# Populating Cache
exec_cmd 'apt-get update'

if [ "X${PRE_INSTALL_PKGS}" != "X" ]; then
    exec_cmd "apt-get install -y ${PRE_INSTALL_PKGS} > /dev/null 2>&1"
fi

print_current_action "installing node.js"
curl -sL https://deb.nodesource.com/setup_4.x | bash -
apt-get install -y nodejs

print_current_action "installing mongodb"
apt-get install -y mongodb-org
service mongod start

print_current_action "creating directories structure"
mkdir -p /var/lib/dreamface/{src/{dfx,dfc,dfm},deploy,app_fsdb,run-scripts,lock-files,deployonstart}

print_current_action "installing DFX"
cd /var/lib/dreamface/src/dfx
git clone https://github.com/InteractiveClouds/dfx.git .

print_current_action "installing DFM"
cd /var/lib/dreamface/src/dfm
git clone https://github.com/InteractiveClouds/dfm.git .

print_current_action "installing DFC"
cd /var/lib/dreamface/src/dfc
git clone https://github.com/InteractiveClouds/dfc.git .


print_current_action "installing dreamface run-scripts"

cat > /var/lib/dreamface/run-scripts/dev.js <<EOT
var path = require('path'),
    fs   = require('fs');

const
    THIS_PID = process.pid,
    PID_FILE_NAME = 'dev.lock',
    LOCK_FILE_OPTS = { encoding : 'utf8' },
    LOCK_FILE = path.join(__dirname, '..', 'lock-files', PID_FILE_NAME);

var another_pid, kill_error;
try {
    another_pid = fs.readFileSync(LOCK_FILE, LOCK_FILE_OPTS);
} catch (e ) {}


if ( another_pid ) {
    console.log('lockfile is found, pid is ', another_pid);
    console.log('trying to send SIGINT');
    try { process.kill(another_pid, 'SIGINT'); } catch (e){ kill_error = e }
    if ( !kill_error ) console.log('old process was killed');
    else if ( /ESRCH/.test(kill_error.toString()) ) {
        console.log('no process with the pid ' + another_pid + ' was found');
    } else {
        throw(kill_error);
        process.exit();
    }
}

fs.writeFileSync(LOCK_FILE, THIS_PID, LOCK_FILE_OPTS);
console.log('my pid is : ', THIS_PID);

setTimeout(function(){
    process.env['NODE_ENV'] = 'development';
    require('../src/dfx')
        .init({
            server_host : '0.0.0.0',
            auth_conf_path : path.resolve(__dirname, '../.auth.conf'),
    
            edition: 'development',
            storage: 'mongod',
            external_server_host: 'dfx.host',
            external_server_port: 3000,
    
            docker_daemon : {
                useDefaultSettings : true,
            },
    
            studio_version: 3,
        })
        .start();
}, 2000);
EOT

cat > /var/lib/dreamface/run-scripts/dep.js <<EOT
var path = require('path'),
    fs   = require('fs');

const
    THIS_PID = process.pid,
    PID_FILE_NAME = 'dep.lock',
    LOCK_FILE_OPTS = { encoding : 'utf8' },
    LOCK_FILE = path.join(__dirname, '..', 'lock-files', PID_FILE_NAME);

var another_pid, kill_error;
try {
    another_pid = fs.readFileSync(LOCK_FILE, LOCK_FILE_OPTS);
} catch (e ) {}


if ( another_pid ) {
    console.log('lockfile is found, pid is ', another_pid);
    console.log('trying to send SIGINT');
    try { process.kill(another_pid, 'SIGINT'); } catch (e){ kill_error = e }
    if ( !kill_error ) console.log('old process was killed');
    else if ( /ESRCH/.test(kill_error.toString()) ) {
        console.log('no process with the pid ' + another_pid + ' was found');
    } else {
        throw(kill_error);
        process.exit();
    }
}

fs.writeFileSync(LOCK_FILE, THIS_PID, LOCK_FILE_OPTS);
console.log('my pid is : ', THIS_PID);

setTimeout(function(){

    process.env['DFX_DO_NOT_RM_TEMP_DIRS'] = true;
    require('../src/dfx')
        .init({
            server_host : '0.0.0.0',
            auth_conf_path : path.resolve(__dirname, '../.auth.conf'),
    
            edition: 'deployment',
            storage: 'file',
            server_port: 3300,
    
            deploy_path: path.resolve(__dirname, '../deploy'),
            fsdb_path: path.resolve(__dirname, '../app_fsdb'),
            deploy_on_start_apps_from : path.join(__dirname, '..', 'deployonstart')
        })
        .start();
}, 2000);
EOT

cat > /var/lib/dreamface/run-scripts/dfc.js <<EOT
var path = require('path'),
    fs   = require('fs');

const
    THIS_PID = process.pid,
    PID_FILE_NAME = 'dfc.lock',
    LOCK_FILE_OPTS = { encoding : 'utf8' },
    LOCK_FILE = path.join(__dirname, '..', 'lock-files', PID_FILE_NAME);

var another_pid, kill_error;
try {
    another_pid = fs.readFileSync(LOCK_FILE, LOCK_FILE_OPTS);
} catch (e ) {}


if ( another_pid ) {
    console.log('lockfile is found, pid is ', another_pid);
    console.log('trying to send SIGINT');
    try { process.kill(another_pid, 'SIGINT'); } catch (e){ kill_error = e }
    if ( !kill_error ) console.log('old process was killed');
    else if ( /ESRCH/.test(kill_error.toString()) ) {
        console.log('no process with the pid ' + another_pid + ' was found');
    } else {
        throw(kill_error);
        process.exit();
    }
}

fs.writeFileSync(LOCK_FILE, THIS_PID, LOCK_FILE_OPTS);
console.log('my pid is : ', THIS_PID);

setTimeout(function(){

    require('../src/dfc')
    .init({
        server_port : 3100,
        dfx_servers : [
            {
                name : 'dfx',
                cfg  : {
                    address : 'http://localhost:3000/',
                    auth_conf_path : path.join(__dirname, '..', '.auth.conf')
                }
            }
        ]
    })
    .start();
}, 2000);
EOT


cat > /var/lib/dreamface/dfm.config.json <<EOT
{
    "dfx" : {
        "code" : {
            "path" : "/var/lib/dreamface/src/dfx",
            "git"  : {
                "branch" : "master"
            }
        },
        "dev" : {
            "lock" : {
                "path" : "/var/lib/dreamface/lock-files/dev.lock"
            },
            "run" : {
                "path" : "/var/lib/dreamface/run-scripts/dev.js"
            }
        },
        "dep" : {
            "lock" : {
                "path" : "/var/lib/dreamface/lock-files/dep.lock"
            },
            "run" : {
                "path" : "/var/lib/dreamface/run-scripts/dep.js"
            }
        }
    },
    "dfc" : {
        "code" : {
            "path" : "/var/lib/dreamface/src/dfc",
            "git"  : {
                "branch" : "master"
            }
        },
        "lock" : {
            "path" : "/var/lib/dreamface/lock-files/dfc.lock"
        },
        "run" : {
            "path" : "/var/lib/dreamface/run-scripts/dfc.js"
        }
    },
    "logs" : {
        "path" : "/var/log/dreamface"
    }
}
EOT

print_current_action "creating logs directory /var/log/dreamface"
mkdir -p /var/log/dreamface


print_current_action "installing grunt"
npm install -g grunt-cli

chmod +x /var/lib/dreamface/src/dfm/index.js 
ln -s /var/lib/dreamface/src/dfm/index.js /usr/local/bin/dreamface
ln -s /var/lib/dreamface/dfm.config.json /usr/local/etc/dfm.config.json

print_current_action "updating dfm"
cd /var/lib/dreamface/src/dfm/
npm install

echo
echo 
echo "========================================================================="
echo "  Dreamface X-Platform is installed"
echo
echo "  Ensure that you:"
echo "    - set appropriate branch at /var/lib/dreamface/dfm.config.json"
echo "    - shanged external_server_host, external_server_port"
echo "          at /var/lib/dreamface/run-scripts/dev.js"
echo "  Before run 'dreamface update'"
echo "========================================================================="
echo
#dreamface update
