apt-get update
apt-get install build-essential curl libpcre3 libpcre3-dev libtool
mkdir /tmp/nginx
cd $_

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

curl -O http://zzzcpan.github.io/nginx-perl/nginx-perl-1.8.1.10.tar.gz
tar -xzvf nginx-perl-1.8.1.10.tar.gz
cd nginx-perl-1.8.1.10
perl Makefile.PL
ln -s /usr/lib/x86_64-linux-gnu/libperl.so.5.20 /usr/lib/x86_64-linux-gnu/libperl.so
make
make test
make install
