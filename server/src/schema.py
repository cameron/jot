
import databacon as db


class User(db.Entity):
  email = db.lookup.alias()
  email.flags.verification_status = db.flag.enum('unsent', 
                                                 'sent', 
                                                 'resent',
                                                 'confirmed')
  password = db.prop(unicode)
  notes = db.children('Note')
  tags = db.children('Tag')


class Note(db.Node):
  parent = User
  schema = unicode
  tags = db.relation('Tag')


class Tag(db.Node):
  parent = User
  schema = unicode
  tag = db.lookup.alias(uniq_to_parent=User)
  notes = db.relation(Note.tags) 


