import sys

from flask import Flask, got_request_exception
import resources

app = Flask(__name__)
app.secret_key = 'righteous rabbit electrode pike for sooth and prithee'
app.dev = True # non-flask api

resources.setup_dbpool()

def debug(sender, exception, **kw):
  import sys
  import pdb
  import traceback
  traceback.print_exc()
  pdb.post_mortem(sys.exc_info()[2])

got_request_exception.connect(debug, app)
