#! /usr/bin/env python

import functools
import time
import json

from flask import Flask, request, session
import app_exceptions
import resources

from schema import User, Note, Tag


def return_json(endpoint):
  ''' Decorator for json encoding response objects and setting the mimetype '''
  @functools.wraps(endpoint)
  def json_endpoint(*args, **kwargs):

    try:
      response = endpoint(*args, **kwargs)
    except app_exceptions.HTTPException, e:
      response = e.msg, e.response_code

    default_headers = {'Content-type': 'application/json'}
    if type(response) is tuple:
      if len(response) == 2:
        response = response + (default_headers,)
      elif len(response) == 3:
        for k, v in default_headers.iteritems():
          response[2] = response[2].setdefault(k, v)
      return response
    return (json.dumps(response), 200, default_headers)

  json_endpoint.__name__ = endpoint.__name__
  return json_endpoint


def is_logged_in_as(guid):
  if not logged_in_guid == guid:
    raise app_exceptions.Unauthorized
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
      request.user = User.by_guid(guid)
      return fn(*args, **kwargs)
    raise app_exceptions.Unauthorized()
  return authd_endpoint


def method_route_decorator_factory(method):
  def method_route_decorator(path):
    def new_endpoint(endpoint):
      wrapper = app.route('/api/' + path, methods=[method])(return_json(endpoint))
      functools.update_wrapper(wrapper, endpoint)
      wrapper.__name__ = endpoint.__name__ + '-'
      return wrapper
    return new_endpoint
  return method_route_decorator


get = method_route_decorator_factory('GET')
post = method_route_decorator_factory('POST')

app = Flask(__name__)
app.secret_key = 'righteous rabbit electrode pike for sooth and prithee'


# TODO
# - notes by tag
# - notes with tags..?
# - delete notes/tags

@post('/user')
def post_users():
  email = request.json.get('email', None)
  if not email or len(email) == 0:
    raise app_exceptions.BadRequest("Missing email")

  password = request.json.get('password', None)
  if not password or len(password) < 6:
    raise app_exceptions.BadRequest("Password too short or missing")

  result = User.by_email(email)
  if result:
    raise app_exceptions.BadRequest("Email in use")
  
  user = User()
  user.email(email)
  user.password(password)
  _init_session(user)
  return user.guid


@post('/login')
def login():
  email = request.json.get('email', None)
  password = request.json.get('password', None)

  if not email or not password:
    raise BadRequest("Missing email or password")
    
  user = User.by_email(email)

  if password != user.password().value:
    raise app_exceptions.Unauthorized()

  _init_session(user)
  return user.guid


def _init_session(user):
  session['guid'] = user.guid
  session['expires'] = time.time() + 3600*24*30


@get('/user/<int:guid>/note/<int:start>/<int:limit>')
@get('/user/<int:guid>/note/<int:start>')
@get('/user/<int:guid>/note')
@require_login
def notes(guid, start=0, limit=100):
  is_logged_in_as(guid)

  notes = request.user.notes(nodes=True, 
                             start=start,
                             limit=limit)

  return list(note.json() for note in notes)
  

@post('/user/<int:guid>/note')
@require_login
def create_note(guid):
  is_logged_in_as(guid)

  text = request.json.get('text', None)
  if not text:
    raise app_exceptions.BadRequest("Missing text parameter")
  
  note = Note(text, parent=request.user)

  tags = request.json.get('tags', [])
  for tag_str in tags:
    tag = request.user.tags.by_tag(tag_str)
    if not tag:
      tag = Tag(tag_str, parent=request.user)
      tag.tag(tag_str)
    note.tags.add(tag)

  return note.json()


@get('/user/<eid>')
def get_user(eid):
  email, guid = (eid, None)[::'@' not in eid and -1 or 1]

  if email:
    result = User.by_email(email)
    if not result:
      return "Email available", 404
    return 'Email in use', 200

  return User.by_guid(guid)
    

@get('/user/<int:guid>/tag')
@require_login
def tags(guid):
  is_logged_in_as(guid)
  return list(tag.json() for tag in request.user.tags(nodes=True))


if __name__ == "__main__":
  resources.setup_dbpool()
  app.run(debug=True, use_reloader=False, port=8000, host='0.0.0.0')
