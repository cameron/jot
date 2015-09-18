class HTTPException(Exception):
  response_code = None
  msg = None
  def __init__(self, msg=None):
    if msg:
      self.msg = msg

class BadRequest(HTTPException):
  response_code = 400

class Unauthorized(HTTPException):
  response_code = 401
  msg = 'Unauthorized'
