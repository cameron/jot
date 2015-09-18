FROM debian:wheezy

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get install -y make gcc

ADD redis-2.8.6.tar.gz /.
RUN cd /redis-2.8.6 && make -j && make install

ADD redis.conf redis.conf

EXPOSE 6379

CMD ["/usr/local/bin/redis-server", "/redis.conf"]
