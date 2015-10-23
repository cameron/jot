class HTTPException(Exception):
  response_code = None
  msg = None
  def __init__(self, msg=None):
    if msg:
      self.msg = msg


class BadRequest(HTTPException):
  response_code = 400
  msg = "Bad request"


class Unauthorized(HTTPException):
  response_code = 401
  msg = 'Unauthorized'


class NotFound(HTTPException):
  response_code = 404
  msg = 'Not found'


class BadJson(BadRequest):
  def __init__(self, spec, val, keypath=''):
    msg = 'Invalid POST JSON. Expected %s, got %s at %s' % (str, val, keypath)
    super(BadJson, self).__init__(msg)


class InternalServerError(HTTPException):
  response_code = 500
  msg = "Internal server error"
