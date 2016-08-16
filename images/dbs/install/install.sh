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

print_current_action "installing mongodb"
apt-get install -y mongodb-org

cat > /var/lib/dreamface/invoke.sh <<EOT
#!/usr/bin/env bash

service mongod start
service redis-server start
EOT

chmod +x /var/lib/dreamface/invoke.sh
ln -s /var/lib/dreamface/invoke.sh /usr/local/bin/invoke
