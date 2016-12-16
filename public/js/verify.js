
function checkTokenValidity(token){
    return $.ajax({
        url: "http://api.catchsense.com/v1/secret",
        type: "POST",
        data: JSON.stringify({token: token}),
        dataType: "json",
        contentType: "application/json; charset=utf-8"
    }).then(res => {
        return !res.error
    })
}

function alertInvalidToken() {
    alert("Access denied. Valid access token required.")
}
$('form').submit(function(e){
    e.preventDefault();
    token = document.getElementById("token").value;
    if(token !== ''){
        checkTokenValidity(token).then(success => {
            console.log(success)
            if (success) {
                window.location = "http://" + window.location.host + "/index.html";
                window.localStorage.setItem('cstoken', $('#token').val() );
                return;
            }
            alertInvalidToken()

        })
        .catch(err => {
            console.log(err)
            alertInvalidToken()
        })
        return;
    }

    alertInvalidToken()
});
