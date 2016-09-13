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
    exec_cmd "apt-get install -y apt-utils lsb-release"
fi

DISTRO=$(lsb_release -c -s)

PRE_INSTALL_PKGS="apt-utils "

if [ ! -x /usr/bin/curl ]; then
    PRE_INSTALL_PKGS="${PRE_INSTALL_PKGS}curl "
fi

if [ ! -x /usr/bin/git ]; then
    PRE_INSTALL_PKGS="${PRE_INSTALL_PKGS}git-core "
fi


if [ "X${PRE_INSTALL_PKGS}" != "X" ]; then
    exec_cmd "apt-get install -y ${PRE_INSTALL_PKGS} > /dev/null 2>&1"
fi

print_current_action "installing node.js"
curl -sL https://deb.nodesource.com/setup_4.x | bash -
apt-get install -y nodejs

print_current_action "creating directories structure"
mkdir -p /var/lib/dreamface/{lock-files,dfm_tmp_run,src/{dfx,dfc,dfm},data/{deploy,app_fsdb,run-scripts,deployonstart,resources,temptemplates,tmp,app_builds}}

print_current_action "installing DFX"
cd /var/lib/dreamface/src/dfx
git clone https://github.com/InteractiveClouds/dfx.git .

print_current_action "installing DFM"
cd /var/lib/dreamface/src/dfm
git clone https://github.com/InteractiveClouds/dfm.git .

print_current_action "installing DFC"
cd /var/lib/dreamface/src/dfc
git clone https://github.com/InteractiveClouds/dfc.git .

cat > /var/lib/dreamface/dfm.config.json <<EOT
{
    "dfx" : {
        "code" : {
            "path" : "/var/lib/dreamface/src/dfx",
            "git"  : {
                "branch" : "dev"
            }
        },
        "dev" : {
            "lock" : {
                "path" : "/var/lib/dreamface/lock-files/dev.lock"
            },
            "varpath" : "/var/lib/dreamface/",
            "run" : {
                "path" : "/var/lib/dreamface/run-scripts/dev.js"
            }
        },
        "dep" : {
            "lock" : {
                "path" : "/var/lib/dreamface/lock-files/dep.lock"
            },
            "varpath" : "/var/lib/dreamface/",
            "run" : {
                "path" : "/var/lib/dreamface/run-scripts/dep.js"
            }
        }
    },
    "dfc" : {
        "code" : {
            "path" : "/var/lib/dreamface/src/dfc",
            "git"  : {
                "branch" : "dev"
            }
        },
        "lock" : {
            "path" : "/var/lib/dreamface/lock-files/dfc.lock"
        },
        "varpath" : "/var/lib/dreamface/",
        "run" : {
            "path" : "/var/lib/dreamface/run-scripts/dfc.js"
        }
    },
    "logs" : {
        "path" : "/var/log/dreamface"
    },
    "daemon" : {
        "host" : "0.0.0.0",
        "port" : "3049",
        "pidfile" : "/var/lib/dreamface/lock-files/dfm.pid",
        "tmprun"  : "/var/lib/dreamface/dfm_tmp_run/"
    },
    "stat" : {
        "camtime" : "60",
        "inspectEvery" : "5000",
        "notifications" : {
            "URL" : "http://loadbalancer:3050/notify"
        }
    }
}
EOT

print_current_action "creating logs directory /var/log/dreamface"
mkdir -p /var/log/dreamface


print_current_action "installing grunt"
npm install -g grunt-cli

chmod +x /var/lib/dreamface/src/dfm/index.js 
chmod +x /var/lib/dreamface/src/dfm/daemon.js 
ln -s /var/lib/dreamface/src/dfm/index.js /usr/local/bin/dreamface
ln -s /var/lib/dreamface/src/dfm/daemon.js /usr/local/bin/dreamface-daemon
ln -s /var/lib/dreamface/dfm.config.json /usr/local/etc/dfm.config.json

print_current_action "updating dfm"
cd /var/lib/dreamface/src/dfm/
git fetch
git checkout dev
npm install

cat > /var/lib/dreamface/invoke.sh <<EOT
#!/usr/bin/env bash

node /var/lib/dreamface/src/dfm/server.js
EOT

chmod +x /var/lib/dreamface/invoke.sh
ln -s /var/lib/dreamface/invoke.sh /usr/local/bin/invoke

dreamface update norestart
