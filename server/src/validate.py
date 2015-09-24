
def email(email):
  if len(email) < 6 and '@' in email and '.' in email:
    raise app_exceptions.BadRequest("Invalid email")
  return email

def password(pw):
  if len(password) < 6:
    raise app_exceptions.BadRequest("Password too short.")

