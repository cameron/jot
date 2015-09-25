#! /usr/bin/env python

import re

html = '''
<html>
  <head>
    <link href="ss-pika.css" rel="stylesheet" />
    <style>
      body {
        padding: 3em;
        display: flex;
        flex-wrap: wrap;
      }
      cell {
        width: 90px;
        padding: .8em;
      }
      css {
        font-size: .8em;
      }
      css, icon {
        display: block;
      }
      icon {
        font-size: 2em;
      }
    </style>
  </head>
<body>'''
for cls in set(re.findall('\.ss-[a-zA-Z]+', open('_ss-pika.scss').read())):
  html += '<cell><icon class="%s"></icon><css>%s</css></cell>' % (cls[1:], cls[4:])
html += "</body></html>"
open('pika-doc.html', 'w').write(html)
