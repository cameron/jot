# vim: fileencoding=utf8:et:sw=4:ts=8:sts=4

import os

import databacon
import greenhouse

redis = greenhouse.patched("redis")


redispool = None

def setup_redispool():
    global redispool

    #TODO: cross-mount a unix domain socket
    host = "redis0.redis.dev.docker"
    port = 6379
    if "REDIS_PORT_6379_TCP_ADDR" in os.environ:
        host = os.environ["REDIS_PORT_6379_TCP_ADDR"]
        port = os.environ["REDIS_PORT_6379_TCP_PORT"]

    redispool = redis.ConnectionPool(host=host, port=port, db=0,
            socket_timeout=1.0)


def get_redis():
    return redis.Redis(connection_pool=redispool)


def setup_dbpool():
    #TODO: cross-mount a unix domain socket
    if os.environ.get('DB_PORT_5432_TCP_ADDR'):
        host = os.environ['DB_PORT_5432_TCP_ADDR']
        port = os.environ['DB_PORT_5432_TCP_PORT']
    else:
        host = '12.12.12.12'
        port = '5432'

    return databacon.connect({
        'shards': [{
            'shard': 0,
            'count': 4,
            'host': host,
            'port': port,
            'user': 'jot',
            'password': '',
            'database': 'jot',
        }],
        'lookup_insertion_plans': [[(0, 1)]],
        'shard_bits': 8,
        'digest_key': 'super secret',
    })


