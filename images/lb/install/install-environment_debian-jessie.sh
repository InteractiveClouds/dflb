#!/usr/bin/env bash

export DEBIAN_FRONTEND=noninteractive

print_current_action() {
    echo
    echo " + $1"
    echo "----------------------------------------------------------------------"
    echo
}

print_current_action "installing packages"
apt-get update
apt-get install -y build-essential curl libpcre3 libpcre3-dev libtool git-core vim

print_current_action "installing nginx-perl"
curl -O http://zzzcpan.github.io/nginx-perl/nginx-perl-1.8.1.10.tar.gz
tar -xzvf nginx-perl-1.8.1.10.tar.gz
cd nginx-perl-1.8.1.10
perl Makefile.PL
ln -s /usr/lib/x86_64-linux-gnu/libperl.so.5.20 /usr/lib/x86_64-linux-gnu/libperl.so
make
make test
make install

print_current_action "installing node.js"
curl -sL https://deb.nodesource.com/setup_4.x | bash -
apt-get install -y nodejs

print_current_action "creating directories structure"
mkdir -p /var/lib/dreamface/src/dflb
mkdir -p /var/lib/dreamface/lbdata

print_current_action "installing DFLB"
cd /var/lib/dreamface/src/dflb
git clone https://github.com/InteractiveClouds/dflb.git .
git fetch
git checkout dev
npm install
mkdir -p /usr/local/nginx-perl/lib
cp lib/nginx_dfx_module/LBWorker.pm /usr/local/nginx-perl/lib/LBWorker.pm
cp lib/nginx_dfx_module/nginx-perl.conf /usr/local/nginx-perl/conf/nginx-perl.conf
rm /usr/local/nginx-perl/conf/nginx-perl.conf.default
