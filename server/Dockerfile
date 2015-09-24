from debian:wheezy

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get install -y gcc python-dev python-pip git procps curl libpq-dev libffi-dev

RUN git clone https://github.com/teepark/greenhouse
RUN cd greenhouse; python setup.py install

RUN git clone https://github.com/teepark/shorty
RUN cd shorty; python setup.py install

RUN git clone https://github.com/teepark/feather
RUN cd feather; python setup.py install

RUN git clone https://github.com/teepark/datahog
RUN cd datahog; git checkout 5d51fc8d9dc1; python setup.py install

RUN git clone https://github.com/cameron/databacon
RUN cd databacon; python setup.py install

RUN /usr/sbin/useradd jot

ADD requirements.txt /requirements.txt
RUN pip install -r requirements.txt

ADD ./src /srv/app

EXPOSE 8000

CMD ["/srv/app/routes.py"]
