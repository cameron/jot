from node:0.10-wheezy

ADD envrender /envrender

ADD nginx.list /etc/apt/sources.list.d/nginx.list
ADD nginx-signing.key /nginx-signing.key

RUN apt-key add /nginx-signing.key
RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get install -y nginx

WORKDIR /webclient
ADD client/package.json /webclient/package.json
ADD client/bower.json /webclient/bower.json
ADD client/.bowerrc /webclient/.bowerrc
RUN npm install && \
	node_modules/bower/bin/bower install --allow-root install

ADD nginx.conf /etc/nginx/nginx.conf
ADD env.staging /webclient/env.staging

ADD ./client/ /webclient
RUN export $(cat env.staging | xargs) && \
	node_modules/gulp/bin/gulp.js build


CMD ["/envrender", "-e", "nginx", "/etc/nginx/nginx.conf"]
