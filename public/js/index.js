/* ---- particles.js config ---- */

particlesJS("particles-js", {
    "particles": {
        "number": {
            "value": 100,
            "density": {
                "enable": true,
                "value_area": 800 
            }
        },
        "color": {
            "value": "#ffffff"
        },
        "shape": {
            "type": "circle",
            "stroke": {
                "width": 0,
                "color": "#000000"
            },
            "polygon": {
                "nb_sides": 5
            },
            "image": {
                "src": "img/github.svg",
                "width": 100,
                "height": 100
            }
        },
        "opacity": {
            "value": 0.5,
            "random": false,
            "anim": {
                "enable": false,
                "speed": 1,
                "opacity_min": 0.1,
                "sync": false
            }
        },
        "size": {
            "value": 3,
            "random": true,
            "anim": {
                "enable": false,
                "speed": 40,
                "size_min": 0.1,
                "sync": false
            }
        },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": "#ffffff",
            "opacity": 0.4,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 6,
            "direction": "none",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
                "enable": false,
                "rotateX": 600,
                "rotateY": 1200
            }
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "repulse"
            },
            "onclick": {
                "enable": true,
                "mode": "push"
            },
            "resize": true
        },
        "modes": {
            "grab": {
                "distance": 140,
                "line_linked": {
                    "opacity": 1
                }
            },
            "bubble": {
                "distance": 400,
                "size": 40,
                "duration": 2,
                "opacity": 8,
                "speed": 3
            },
            "repulse": {
                "distance": 200,
                "duration": 0.4
            },
            "push": {
                "particles_nb": 4
            },
            "remove": {
                "particles_nb": 2
            }
        }
    },
    "retina_detect": true
});
  
// To Allow Tooltip on this page
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})

// When study list is change, than show input fields
$('#study-list').change(function () {
    document.getElementById('id_div').style.display = 'block';
    document.getElementById('session_div').style.display = 'block';
    document.getElementById('about_begin_div').style.display = 'block';
})

// About Function
document.getElementById("about").addEventListener("click", function(event){
    event.preventDefault()
    study = document.getElementById("study-list").value
    // alert(study)
    if (study == 'BK_Pilot'){
        // window.location.href = "/studies";
        document.getElementById('info-container').style.display = 'block';
        document.getElementById('info-title').innerHTML = study + ' Task List';
        document.getElementById('info-text').innerHTML = "<p>This study includes the following tasks: <ul><li>Horizon Task - Run 1</li><li>Horizon Task - Run 2</li></ul></p>";
    }
    else if (study == 'AAC-BET'){
        // window.location.href = "/studies";
        document.getElementById('info-container').style.display = 'block';
        document.getElementById('info-title').innerHTML = study + ' Task List';
        document.getElementById('info-text').innerHTML = "<p>This study includes the following tasks: <ul><li>Horizon Task - Run 1</li><li>Horizon Task - Run 2</li><li>Limited Offer Task - Run 1</li></ul></p>";
    }

    else {
        // window.location.href = "/studies";
        document.getElementById('info-container').style.display = 'none';

    }
});





$(document).ready(() => {
    var form = document.getElementById("adduser");
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        var values = {};
        $.each($('#adduser').serializeArray(), function (i, field) {
            values[field.name] = field.value;
        });
        // console.log(values)
        $.ajax({
            type: "POST",
            url: '/adduser',
            data: values,
            dataType: 'JSON',
            success: function (result) {
                console.log(result);
                if (result.message == 'ok') {
                    window.location.replace(result.link);
                } else {
                    // Open Modal to Confirm Already Exists Subject
                    $('#modalCenter').modal({});

                    document.getElementById('errorMessage').innerText = result.message;
                    document.getElementById('procceed_anyways').addEventListener('click', () => {
                        window.location.replace(result.link);
                    });
                }
            }
        });

    });
});

if(performance.navigation.type == 2){
    location.reload(true);
 }
// // Begin Logic
// document.getElementById("begin").addEventListener("click", function(event){
//     event.preventDefault()
//     study = document.getElementById("study-list").value;
//     // alert(study)
//     if (study == 'BK_Pilot'){
//         // window.location.href = "/studies";
//         window.location.href="/studies";
//     }
//     if (study == 'AAC-BET'){
//         // window.location.href = "/studies";
//         window.location.href="/studies";
//     }
// }); 