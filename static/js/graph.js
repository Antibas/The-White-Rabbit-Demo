let edgeId = 1;
const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);

const container = document.getElementById("graph");
const data = {
    nodes: nodes,
    edges: edges
};
// const loader = document.getElementById("loader");
// const results = document.getElementById("results");
// const error = document.getElementById("error");

let focused = "1"

let time = 0;
let pathLength = 0;
let pc = 0;
let ta = 0;
let paths = [];

let source;
let target;

const algo_body = document.getElementById("algorithm_body");

const options = {
    autoResize: true,
    height: '100%',
    width: '100%',
    nodes: {
        color: {
            border: "#000000",
            background: "#e6b000",
            highlight: {
                border: "#000000",
                background: "#e6b000"
            }
        },
        font: {
            size: 14
        },
        shape: "dot",
        size: 20
    },
    edges: {
        color: {
            color: "#000000"
        },
        font: {
            size: 10
        }
    },
    physics: {
        enabled: true,
        stabilization: {
            iterations: 100,
            updateInterval: 25,
            fit: true // fit the view to nodes after stabilizing
        }
    }
};

const network = new vis.Network(container, data, options);
network.once("stabilizationIterationsDone", function () {
    network.setOptions({
        physics: { enabled: false },
        interaction: { dragNodes: false }

    });

        // Fix positions
    nodes.get().forEach(node => {
        nodes.update({ id: node.id, fixed: { x: true, y: true } });
    });

    // Center the graph in the view
    network.fit({ animation: true });
    // network.fit({
    //     animation: {
    //         duration: 1000,
    //         easingFunction: "easeInOutQuad"
    //     }
    // });
});

function addNode(nodeId, label) {
    try{
        if(focused === "2") nodeId += "2";
        let nodeLabel = clearEntity(nodeId);
        label = round(Number(label), 2)
        // nodes.length == 0 || nodes.length == pathLength
        if(nodeLabel.startsWith(source) || nodeLabel.startsWith(target)){
            nodes.add({ id: nodeId, label: nodeLabel, color: {
                border: "#e6b000",
                background: "#000000",
                font: {
                    bold: {
                        mod: 'bold'
                    }
                },
                highlight: {
                    border: "#e6b000",
                    background: "#000000"
                }
            }});
        } else {
            nodes.add({ id: nodeId, label: `${nodeLabel}: ${label}` });
        }
    } catch(err) {
        console.log(err)
    }
}

function addEdge(label, from, to) {
    // if(label == "reached") return;
    if(focused === "2"){
        from += "2";
        to += "2";
    }
    label = clearEntity(label)
    edges.add({ id: edgeId, from: from, to: to, label: label });
    edgeId++;
}

const socket = io();
socket.on('connect', () => {
    console.log('Connected to WebSocket');
});

// socket.on('response', function(text){
//     console.log(text);
// })

function clearEntity(entity){
    return entity
        .replace("http://dbpedia.org/", "")
        .replace("http://www.wikidata.org/", "")
        .replace("http://yago-knowledge.org/", "")
        .replace("http://schema.org/", "")
        .replace("http://purl.org/", "")
        .replace("http://w3.org/", "")
        .replace("ontology/", "")
        .replace("resource/", "")
        .replace("property/", "")
        .replace("entity/", "")
}

function handleError(status, error_msg){
    document.getElementById("loader"+focused).classList.add("visually-hidden");
    document.getElementById("error"+focused).classList.remove("visually-hidden");
    document.getElementById("error"+focused).innerHTML = `<span class="fw-bold">Error ${status}:</span> ${error_msg}`
}

socket.on('response', function(data) {
    console.log(data);
    const message = document.getElementById("message"+focused);
    if(!JSON.stringify(data).startsWith("{")){
        message.innerText = data;
    } else if("error" in data){
        handleError(data['status'], data['error']);
        message.innerText = "";
    } else if(data['length']){
        document.getElementById("wait").innerHTML = "";
        document.getElementById("loader"+focused).classList.add("visually-hidden");
        document.getElementById("results"+focused).classList.remove("visually-hidden");

        time = data["time"];
        pathLength = data["length"];
        pc = data["PC"];
        ta = data["TA"];
        paths = data["path"];
        if(pathLength == 1) pathLength = Math.max(pathLength, paths.length);

        document.getElementById("time"+focused).innerHTML = `<span class="fw-bold">Time:</span> ${time} seconds`
        document.getElementById("length"+focused).innerHTML = `<span class="fw-bold">Length:</span> ${pathLength}`
        document.getElementById("pc"+focused).innerHTML = `<span class="fw-bold">PC:</span> ${pc}`
        document.getElementById("ta"+focused).innerHTML = `<span class="fw-bold">TA:</span> ${ta}`

        for(let path of paths){
            let label1 = clearEntity(path[0][0]);
            let label2 = clearEntity(path[2][0]);
            let edgeLabel = clearEntity(path[1]);
            if(edgeLabel == "reached") break;
            addNode(label1, path[0][1]);
            addNode(label2, path[2][1]);
            addEdge(edgeLabel, label1, label2)
        }
        message.innerText = "";
    } else if(data['current_path']){
        // let data2 = JSON.parse(clearEntity(data.trim()))
        let current_path = data['current_path'];
        let nodes = [];
        let similarity = "";
        for(node of current_path){
            nodes.push(clearEntity(node[0][0]))//+": "+String(round(Number(node[0][1]), 2)))
            nodes.push(clearEntity(node[2][0]))//+": "+String(round(Number(node[2][1]), 2)))
            similarity = String(round(Number(node[2][1]), 2))
        }
        document.getElementById("current_node"+focused).innerHTML = nodes.filter((value, index, array) => array.indexOf(value) === index).join("<br>&darr;<br>")//clearEntity(JSON.stringify(data['current_path']))
        document.getElementById("similarity"+focused).innerHTML = similarity;
        message.innerText = "";
    } else {
        handleError(504, "Timeout");
        message.innerText = "";
    }
});

function getAlgorithmBody(){
    let algorithm_body = algo_body.value;
    let ret = {};
    algorithm_body = algorithm_body.replace("ImmutableMultiDict", "")
        .replaceAll("(", "[")
        .replaceAll(")", "]")
        .replaceAll("'", "\"");
    algorithm_body = JSON.parse(algorithm_body)[0];
    for(let pair of algorithm_body){
        if(pair[1]) ret[pair[0]] = pair[1]
    }
    return ret;
}

function startAlgorithm(algorithm=undefined){
    let algorithm_body = getAlgorithmBody();
    if(algorithm){
        algorithm_body["algorithm"] = algorithm;
        focused = "2"
        document.getElementById("body2").classList.remove("visually-hidden")
        document.getElementById("query_expansion_button").classList.add("visually-hidden")
    }
    console.log(algorithm_body);
    const accuracy = document.getElementById("accuracy");
    const timeout = document.getElementById("timeout");
    const dataset = document.getElementById("dataset");
    const embedding = document.getElementById("embedding");
    algorithm_body["source"] = algorithm_body["source"].replaceAll(" ", "_");
    algorithm_body["target"] = algorithm_body["target"].replaceAll(" ", "_");
    source = algorithm_body["source"];
    target = algorithm_body["target"];
    accuracy.innerHTML = `Accuracy: ${"accuracy" in algorithm_body?algorithm_body["accuracy"]:1}`
    if(algorithm_body["timeout"]){
        timeout.innerHTML = `Timeout in ${algorithm_body["timeout"]} seconds`
    }
    else {
        timeout.innerHTML = "No timeout"
    }
    dataset.innerHTML = `Dataset: ${algorithm_body["dataset"]}`
    if(algorithm_body["algorithm"] === "embedding"){
        embedding.classList.remove("visually-hidden")
        embedding.innerHTML = `Embedding: ${algorithm_body["embedding"]}`
    }
    socket.send(JSON.stringify(algorithm_body));
}

document.addEventListener("DOMContentLoaded", (ev) => {
    startAlgorithm();
})

document.addEventListener("beforeunload", (ev) =>{
    socket.emit('disconnect_me');
})