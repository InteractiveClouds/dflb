FROM debian:jessie

MAINTAINER surr <litichevskij.vova@gmail.com>

LABEL version="0.1"
LABEL description="DreamFace X-Platform"

EXPOSE 7000 3000 3100 3300 3049

RUN ["mkdir", "-p", "/tmp/install"]
COPY install/ /tmp/install/

RUN ["/tmp/install/install.sh"]

CMD ["invoke"]
