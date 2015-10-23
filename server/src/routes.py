#! /usr/bin/env python


import bcrypt

from app import app
from schema import User, Note, Tag
from route_utils import *
import http_exceptions as exceptions
import validate


# TODO
# - notes by tag
# - notes with tags..?
# - delete notes/tags

@post('/users', {
  'email': validate.email,
  'password': validate.password
})
def create_account(email=None, password=None):
  result = User.by_email(email)
  if result:
    raise exceptions.BadRequest("Email in use")
  
  user = User()
  user.email = email
  user.password = bcrypt.hashpw(password, bcrypt.gensalt())
  user.save()
  init_session(user)
  return user.guid


@get('/session')
@require_login
def check_session():
  return req.user.guid


@delete('/session')
@require_login
def logout():
  clear_session()


@post('/session', {
  'email': validate.email,
  'password': validate.password
})
def login(email=None, password=None):

  user = User.by_email(email)
  if not user:
    raise exceptions.NotFound('User not found')

  hashed = user.password().value
  if bcrypt.hashpw(password, hashed) != hashed:
    raise exceptions.Unauthorized()

  init_session(user)
  return user.guid


@get('/users/<int:guid>/notes/<int:start>/<int:limit>')
@get('/users/<int:guid>/notes/<int:start>')
@get('/users/<int:guid>/notes')
@require_login
def notes(guid, start=0, limit=100):
  is_logged_in_as(guid)

  notes = req.user.notes(nodes=True, 
                             start=start,
                             limit=limit)
  return list(note.json() for note in notes)
  

@post('/users/<int:uid>/notes/<int:nid>', {
  optional('text'): unicode, 
  optional('tags'): list
})
@require_login
def update_note(uid, nid, text=None, tags=None):
  is_logged_in_as(uid)

  note = Note.by_guid(nid)
  if text:
    note.value = text

  if tags:
    add_tags = set(tags)

    for tag in note.tags(nodes=True):
      if tag.value not in add_tags:
        note.tags.remove(tag)
      else:
        add_tags.remove(tag)

    for tag in add_tags:
      note.tags.add(Tag(tag))

  note.save()
  return 


@post('/users/<int:uid>/notes')
@require_login
def create_note(uid):
  is_logged_in_as(uid)

  text = req.json.get('text', u'')
  note = Note(text, parent=req.user)

  tags = req.json.get('tags', [])
  for tag_str in tags:
    tag = req.user.tags.by_tag(tag_str)
    if not tag:
      tag = Tag(tag_str, parent=req.user)
    note.tags.add(tag)

  return note.json()


@get('/users/<eid>')
def get_user(eid):
  email, guid = (eid, None)[::'@' not in eid and -1 or 1]

  if email:
    result = User.by_email(email)
    if not result:
      return "Email available", 404
    return 'Email in use', 200

  return User.by_guid(guid)
    

@get('/users/<int:guid>/tags')
@require_login
def tags(guid):
  is_logged_in_as(guid)
  return list(tag.json() for tag in req.user.tags(nodes=True))


if __name__ == "__main__":
  app.run(port=8000, host='0.0.0.0')
