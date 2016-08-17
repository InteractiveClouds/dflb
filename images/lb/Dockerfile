FROM debian:jessie

MAINTAINER surr <litichevskij.vova@gmail.com>

LABEL version="0.1"
LABEL description="DreamFace Load Balancer"

EXPOSE 3000 3001 3002 3003

RUN ["mkdir", "-p", "/tmp/install"]
COPY install/ /tmp/install/

RUN ["/tmp/install/install-environment_debian-jessie.sh"]

CMD ["/bin/bash"]
