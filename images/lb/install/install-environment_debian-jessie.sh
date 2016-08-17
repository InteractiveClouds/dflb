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
mkdir /tmp/nginx
cd /tmp/nginx

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

# print_current_action "creating directories structure"
# mkdir -p /var/lib/dreamface/{src/{dflb},lbdata}
# 
# print_current_action "installing DFLB"
# cd /var/lib/dreamface/src/dflb
# git clone https://github.com/InteractiveClouds/dflb.git .
