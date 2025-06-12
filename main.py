from json import dump, loads
from random import choice
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
from os import getenv
from redis import from_url
from utils import import_datasets, load_nodes
from white_rabbit.utils.enums import EmbeddingType
from white_rabbit.utils.logger import LOGGER
from white_rabbit.utils.utils import load_model, timeout

load_dotenv(override=True)

app = Flask(__name__)


NODES = load_nodes()

# Redis configuration
app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
redis_url = from_url('redis://'+getenv('REDIS_HOST', 'redis')+":"+getenv('REDIS_PORT', '6379'))
app.config['SESSION_REDIS'] = redis_url

# Socket
socketio = SocketIO(app)

@app.route("/", methods=["GET"])
def index():
    return render_template('index.html')

@app.route("/about", methods=["GET"])
def about():
    return render_template('about.html')

@app.route("/graph", methods=["POST"])
def graph():
    body = request.form
    return render_template('graph.html', body=body)

@app.route("/rand-entity", methods=["GET"])
def get_random_entity():
    return str(choice(NODES))

@socketio.on("message")
def start_algorithm(msg: str):
    params = {}
    for param in loads(msg):
        if param[1]:
            params[param[0]] = param[1]
    
    source: str = params["source"]
    target: str = params["target"]
    
    dataset = import_datasets()[params["dataset"]]
    alg: str = params["algorithm"]
    embedding = params.get("embedding")
    if(alg.lower() in ["wr", "white-rabbit"]):
        algorithm = dataset.white_rabbit
        embedding = None
    elif(alg.lower() in ["qe", "query-expansion"]):
        algorithm = dataset.query_expansion
        embedding = None
    elif(alg.lower() == "embedding"):
        algorithm = dataset.embedding
        if embedding:
            embedding = EmbeddingType[embedding]
    elif(alg.lower() == "llm"):
        algorithm = dataset.llm
        embedding = None
    LOGGER.info(f'Starting algorithm with parameters: {params}')

    try:
        accuracy_threshold = float(params.get("accuracy", 1))
        if(accuracy_threshold <= 0 or accuracy_threshold > 1):
            raise ValueError()
    except ValueError:
        emit('response', {"status": 422, "error": "Invalid accuracy. Must be a float in (0, 1]"})
    
    try:
        timeout_seconds = int(params.get("timeout", 0))
    except ValueError:
        emit('response', {"status": 422, "error": "Invalid timeout. Changing to no timeout."})
        timeout_seconds = 0
    
    inputs = (source, target, accuracy_threshold) if not embedding else (source, target, embedding, accuracy_threshold)
    if timeout_seconds:
        time, length, pc, ta, path = timeout(algorithm, inputs, embedding_type=embedding or EmbeddingType.WIKI2VEC, timeout=timeout_seconds)
    else:
        embedding_type=embedding or EmbeddingType.WIKI2VEC
        try:
            model = load_model(embedding_type)
        except UserWarning:
            pass
        time, length, pc, ta, path = algorithm(model, *inputs)
    emit('response', {"time": time, "length": length, "PC": pc, "TA": ta, "path": path})

if __name__ == "__main__":
    LOGGER.info("Demo starting")
    # app.run(host=getenv("APP_HOST", "0.0.0.0"), port=getenv("APP_PORT", "8000"), debug=True)
    socketio.run(app, host=getenv("APP_HOST", "0.0.0.0"), port=getenv("APP_PORT", "8000"), debug=True, allow_unsafe_werkzeug=True)