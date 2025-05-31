function get_random_entity(writeIn){
    fetch("/rand-entity")
    .then(response => response.text())
    .then(response => {
        document.getElementById(writeIn).value = response;
    });
}

function toggle_embedding(){
    const algorithm = document.getElementById('algorithm');
    const emb = document.getElementById('emb');
    const embedding = document.getElementById('embedding');
    if(algorithm.value == "embedding" && emb.classList.contains("visually-hidden")){
        emb.classList.remove("visually-hidden");
        embedding.readonly = true;
        embedding.required = true;
    } else {
        emb.classList.add("visually-hidden");
        embedding.readonly = false;
        embedding.required = false;
    }
}

function toggle_token(){
    const tk = document.getElementById('tk');
    const token = document.getElementById('token');
    if(algorithm.value == "llm" && tk.classList.contains("visually-hidden")){
        tk.classList.remove("visually-hidden");
        token.readonly = true;
        token.required = true;
    } else {
        tk.classList.add("visually-hidden");
        token.readonly = false;
        token.required = false;
    }
}

function round(number, digits){
    return Math.round(number * 10**digits) / 10**digits
}