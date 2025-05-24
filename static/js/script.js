function get_random_entity(writeIn){
    fetch("/rand-entity")
    .then(response => response.text())
    .then(response => {
        document.getElementById(writeIn).value = response;
    });
}

function toggle_algorithms(){
    const algorithm = document.getElementById('algorithm');
    const testOtherAlgs = document.getElementById('testOtherAlgs');
    algorithm.disabled = !testOtherAlgs.checked;
    if(algorithm.disabled) {
        algorithm.value = "white-rabbit";
    }

}