import sys
import time
import json
import functools

from flask import request as flask_req, got_request_exception, session

import http_exceptions as exceptions
from app import app
from schema import User


__ALL__ = ['get', 'post', 'require_json', 'is_logged_in_as', 'require_login', 'optional', 'init_session', 'json_spec', 'req']


class Request(object):
  ''' Wrapper for Flask.request to force request.json to appear
  as a dictionary if None. '''
  _json = {}

  def __getattr__(self, name):
    if name == 'json':
      if flask_req.json:
        return flask_req
      return self._json
    return getattr(flask_req, name)

  def __setattr__(self, name, val):
    if name == 'json':
      self._json = val
    super(Request, self).__setattr__(name, val)

req = Request()


default_headers = {
  'Content-type': 'application/json',
}

def return_json(endpoint):
  ''' Decorator for json encoding response objects and setting the mimetype '''
  @functools.wraps(endpoint)
  def json_endpoint(*args, **kwargs):
    
    code = 200
    headers = default_headers
    response = endpoint(*args, **kwargs)

    if type(response) is tuple:
      if len(response) == 2:
        response, code = response
      elif len(response) == 3:
        response, code, headers = response
        for header, val in default_headers.iteritems():
          headers.setdefault(header, val)

    return (json.dumps(response), code, headers)

  json_endpoint.__name__ = endpoint.__name__
  return json_endpoint


@app.errorhandler(exceptions.HTTPException)
@return_json
def errorhandler(error):
  import pdb; pdb.set_trace()
  return {'msg': e.msg}, error.response_code


def is_logged_in_as(guid):
  if not logged_in_guid() == guid:
    raise exceptions.Unauthorized
  return True


def logged_in_guid():
  guid = session.get('guid')
  if guid and session.get('expires', -1) > time.time():
    return guid
  return None


def require_login(fn):
  @functools.wraps(fn)
  def authd_endpoint(*args, **kwargs):
    guid = logged_in_guid()
    if guid:
      req.user = User.by_guid(guid)
      return fn(*args, **kwargs)
    raise exceptions.Unauthorized()
  return authd_endpoint


class optional(object):
  def __init__(self, spec):
    self.spec = spec


def _validate_and_convert(param, spec):
  ''' E.g.,
  _validate_and_convert(json {
    'email': str                 # validate using a type (will NOT coerce)
    'email': None                # no validation, but key is required
    'email': validator           # custom validator/converter
    'user': {'some': 'thing'}    # a sub-spec (dictionaries only)
    optional('email'): validator # optional key
  })
  '''

  # No validation
  if spec is None:
    return param

  # Basic type validation (no coercion)
  if type(spec) is type:
    if type(param) is not spec:
      raise exceptions.BadJson(spec)
    return param

  # Custom validator/converter
  if callable(spec):   
    return spec(param) 

  # Only remaining acceptable spec is a dict, so guard against programmer error
  if spec is not dict:
    raise exceptions.InternalServerError()

  # Dictionary
  for spec_key, spec_key_spec in spec.iteritems():
    if type(spec_key) is not optional and spec_key not in param:
      raise exceptions.InternalServerError()
    val = _validate_param(param[key], spec_key_spec)

  return spec


def json_spec(spec=None):
  def json_spec_dec(endpoint):
    @functools.wraps(endpoint)
    def new_endpoint(*args, **kwargs):
      req.json = _validate_and_convert(req.json, spec)
      if type(req.json) is dict:
        kwargs.update(req.json)
      return endpoint(*args, **kwargs)
    return new_endpoint
  return json_spec_dec


def init_session(user):
  session['guid'] = user.guid
  session['expires'] = time.time() + 3600*24*30


def method_route_decorator_factory(methods):
  ''' Returns a decorator that accepts a path argument and supplies the
  provided `methods` to flask.App.add_url_rule.
  
  Returned decorators also accept a `spec` kwarg, a dictionary that 
  will be used to validate request.json. Intended for POST methods. See
  _validate_and_convert() above.

  '''

  methods = type(methods) is str and [methods] or methods
  def method_route_decorator_args(path, spec=None):
    def method_route_decorator(endpoint):
      wrapper = return_json(endpoint)
      if json_spec:
        wrapper = json_spec(spec)(endpoint)
      wrapper = return_json(wrapper)
      endpoint.__name__ = endpoint.__name__ + '-'
      functools.update_wrapper(wrapper, endpoint)
      app.add_url_rule('/api' + path, wrapper.__name__, wrapper, methods=methods)
      return wrapper
    return method_route_decorator
  return method_route_decorator_args


get = method_route_decorator_factory('GET')
post = method_route_decorator_factory('POST')

