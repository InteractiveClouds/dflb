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

print_current_action "installing packages"
exec_cmd "apt-get update"
exec_cmd "apt-get install -y build-essential curl libpcre3 libpcre3-dev libtool git-core"
exec_cmd "mkdir /tmp/nginx"
exec_cmd "cd /tmp/nginx"

#curl -o nginx_signing.key http://nginx.org/keys/nginx_signing.key
#apt-key add nginx_signing.key
#echo "" >> /etc/apt/sources.list
#echo "deb http://nginx.org/packages/debian/ jessie nginx" >> /etc/apt/sources.list
#echo "deb-src http://nginx.org/packages/debian/ jessie nginx" >> /etc/apt/sources.list
#apt-get update
#apt-get install nginx
#rm /etc/nginx/conf.d/default.conf
#rm /etc/nginx/conf.d/sites-enabled/*.conf
#cp ./nginx.conf /etc/nginx/nginx.conf
#nginx -s reload

print_current_action "installing nginx-perl"
exec_cmd "curl -O http://zzzcpan.github.io/nginx-perl/nginx-perl-1.8.1.10.tar.gz"
exec_cmd "tar -xzvf nginx-perl-1.8.1.10.tar.gz"
exec_cmd "cd nginx-perl-1.8.1.10"
exec_cmd "perl Makefile.PL"
exec_cmd "ln -s /usr/lib/x86_64-linux-gnu/libperl.so.5.20 /usr/lib/x86_64-linux-gnu/libperl.so"
exec_cmd "make"
exec_cmd "make test"
exec_cmd "make install"

print_current_action "installing node.js"
exec_cmd "curl -sL https://deb.nodesource.com/setup_4.x | bash -"
exec_cmd "apt-get install -y nodejs"

print_current_action "creating directories structure"
exec_cmd "mkdir -p /var/lib/dreamface/src/dflb"

print_current_action "installing DFLB"
exec_cmd "cd /var/lib/dreamface/src/dflb"
exec_cmd "git clone https://github.com/InteractiveClouds/dflb.git ."

