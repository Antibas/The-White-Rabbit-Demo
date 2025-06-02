let edgeId = 1;
const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);

const container = document.getElementById("graph");
const data = {
    nodes: nodes,
    edges: edges
};
const loader = document.getElementById("loader");
const results = document.getElementById("results");
const error = document.getElementById("error");

let time = 0;
let pathLength = 0;
let pc = 0;
let ta = 0;
let paths = [];

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
        let nodeLabel = clearEntity(nodeId);
        label = round(Number(label), 2)
        // if(label == 0 || label == 1){
        if(nodes.length == 0 || nodes.length == pathLength){
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
    loader.classList.add("visually-hidden");
    error.classList.remove("visually-hidden");
    document.getElementById("error").innerHTML = `<span class="fw-bold">Error ${status}:</span> ${error_msg}`
}

socket.on('response', function(data) {
    console.log(data);
    if(!JSON.stringify(data).startsWith("{")){
        if(data.startsWith("Similarity between ")){
            let data2 = data
                .replace("Similarity between ", "")
                .trim()
                .split(":", 2);
            let entities = data2[0].split(" and ")
            let similarity = round(Number(data2[1].trim()), 2);
            if(entities[1]){
                document.getElementById("current_node").innerHTML = entities[1].trim();
                document.getElementById("similarity").innerHTML = similarity;
            }
        } else {
            document.getElementById("logger").innerText = data
        }
    } else if("error" in data){
        handleError(data['status'], data['error']);
    } else if(data['length']){
        document.getElementById("wait").innerHTML = "";
        loader.classList.add("visually-hidden");
        results.classList.remove("visually-hidden");

        time = data["time"];
        pathLength = data["length"];
        pc = data["PC"];
        ta = data["TA"];
        paths = data["path"];
        if(pathLength == 1) pathLength = Math.max(pathLength, paths.length);

        document.getElementById("time").innerHTML = `<span class="fw-bold">Time:</span> ${time} seconds`
        document.getElementById("length").innerHTML = `<span class="fw-bold">Length:</span> ${pathLength}`
        document.getElementById("pc").innerHTML = `<span class="fw-bold">PC:</span> ${pc}`
        document.getElementById("ta").innerHTML = `<span class="fw-bold">TA:</span> ${ta}`

        for(let path of paths){
            let label1 = clearEntity(path[0][0]);
            let label2 = clearEntity(path[2][0]);
            let edgeLabel = clearEntity(path[1]);
            if(edgeLabel == "reached") break;
            addNode(label1, path[0][1]);
            addNode(label2, path[2][1]);
            addEdge(edgeLabel, label1, label2)
        }
    } else {
        handleError(504, "Timeout");
    }
});

document.addEventListener("DOMContentLoaded", (ev) => {
    let algorithm_body = algo_body.value;
    algorithm_body = algorithm_body.replace("ImmutableMultiDict", "")
        .replaceAll("(", "[")
        .replaceAll(")", "]")
        .replaceAll("'", "\"");
    algorithm_body = JSON.parse(algorithm_body)[0];
    console.log(algorithm_body);
    // console.log(algorithm_body[5][0]);
    const accuracy = document.getElementById("accuracy");
    const timeout = document.getElementById("timeout");
    const dataset = document.getElementById("dataset");
    const embedding = document.getElementById("embedding");
    accuracy.innerHTML = `Accuracy: ${algorithm_body[5][1]||1}`
    if(algorithm_body[6][1]){
        timeout.innerHTML = `Timeout in ${algorithm_body[6][1]} seconds`
    }
    else {
        timeout.innerHTML = "No timeout"
    }
    dataset.innerHTML = `Dataset: ${algorithm_body[2][1]}`
    if(algorithm_body[0][1] === "embedding"){
        embedding.classList.remove("visually-hidden")
        embedding.innerHTML = `Embedding: ${algorithm_body[1][1]}`
    }
    socket.send(JSON.stringify(algorithm_body));
})