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
    } else {
        emb.classList.add("visually-hidden");
        embedding.readonly = false;
    }
}