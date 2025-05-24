from random import choice
from flask import Flask, render_template
from dotenv import load_dotenv
from os import getenv
from redis import from_url
from white_rabbit.utils.logger import LOGGER

load_dotenv(override=True)

app = Flask(__name__)

def __load_nodes():
    with open("white_rabbit/config/nodes.conf") as nodes_file:
        return list(node.strip() for node in nodes_file.readlines())

NODES = __load_nodes()

# Redis configuration
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
redis_url = from_url('redis://'+getenv('REDIS_HOST', 'redis')+":"+getenv('REDIS_PORT', '6379'))
app.config['SESSION_REDIS'] = redis_url

@app.route("/", methods=["GET"])
def index():
    return render_template('index.html')

@app.route("/rand-entity", methods=["GET"])
def get_random_entity():
    return str(choice(NODES))

if __name__ == "__main__":
    LOGGER.info("Demo starting")
    app.run(host=getenv("APP_HOST", "0.0.0.0"), port=getenv("APP_PORT", "8000"), debug=True)