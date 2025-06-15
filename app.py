
from os import getenv
from flask import Flask
from redis import from_url


app = Flask(__name__)

# Redis configuration
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
redis_url = 'redis://'+getenv('REDIS_HOST', 'redis-server')+":"+getenv('REDIS_PORT', '6379')
redis_session = from_url(redis_url)
app.config['SESSION_REDIS'] = redis_session