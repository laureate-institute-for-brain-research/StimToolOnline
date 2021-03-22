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
// Show Session based on study
$('#study-list').change(function () {
    document.getElementById('id_div').style.display = 'block';
    document.getElementById('session_div').style.display = 'block'; // Show session dropdown

    two_session_studies = ['AAC-BET', 'BK_Pilot', 'CognitiveControl']
    if (!two_session_studies.includes(document.getElementById('study-list').value)) {
        var selectobject = document.getElementById("session-list");
        for (var i=0; i<selectobject.length; i++) {
            if (selectobject.options[i].value == 'T2')
                selectobject.remove(i);
}
    }
    
    document.getElementById('about_begin_div').style.display = 'block';
})

// About Function
document.getElementById("about").addEventListener("click", function(event){
    event.preventDefault()
    study = document.getElementById("study-list").value
    console.log(study)
    if (study) {
        $.getJSON('/study/' + study + '_T1.json', data => {
            document.getElementById('info-container').style.display = 'block';
            document.getElementById('info-title').innerHTML = study + ' Task List';
            // console.log(data)
            document.getElementById('info-text').innerHTML = data['text_html']

            console.log(data)
        })
    }

    else {
        // window.location.href = "/studies";
        document.getElementById('info-container').style.display = 'none';
    }
});

// Submit Logic
document.getElementById('begin').addEventListener('click', (event) => {
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

                next_link = '/link?id=' + result.info.link
                window.location.replace(next_link);
            } else {
                // Open Modal to Confirm Already Exists Subject
                $('#modalCenter').modal({});

                document.getElementById('errorMessage').innerText = result.message;
                document.getElementById('procceed_anyways').addEventListener('click', () => {
                    next_link = '/link?id=' + result.info.link
                    window.location.replace(next_link);
                });
            }
        }
    });

});

// Skip Logic.
// Create Ability to skip to Run
document.getElementById('skip').addEventListener('click', (event) => {
    event.preventDefault();
    var values = {};
    $.each($('#adduser').serializeArray(), function (i, field) {
        values[field.name] = field.value;
    });
    const adduser = new Promise((resolve, reject) => {
        $.ajax({
            type: "POST",
            url: '/adduser',
            data: values,
            dataType: 'JSON',
            success: function (result) {
                resolve(result)
            }
        });
    })
        .then((result) => {
            // Get The study list
            return new Promise((resolve, reject) => {
                url = '/study/' + result.info.study + '_' + result.info.session + '.json'
                $.getJSON(url, function (data) {
                    data.respond = result
                    resolve(data)
                });
            })
        })
        .then((result) => {
            // console.log(result)
            $('#modalSkipCenter').modal({});
            select_form = document.getElementById("run-list");
            // Add element to selec for each order
            for (var i = 0; i < result.order.length; i++){
                select_op = document.createElement("option")
                // console.log(elem)
                elem = result.order[i]
                select_op.value = elem
                
                if (elem.includes('completed')) {
                    continue
                }
                select_op.appendChild( document.createTextNode(elem) );

                // add opt to end of select box (sel)
                select_form.appendChild(select_op);
            }

            $("#modalSkipCenter").on("hidden.bs.modal", function () {
                // put your default event here
                select_form.length = 0;
            });

            document.getElementById('skip_begn').addEventListener('click', event => {
                event.preventDefault()
                var run_val = select_form.options[select_form.selectedIndex].value;
                var idx = select_form.options[select_form.selectedIndex].index - 1;
                // console.log(result)
                var link = run_val + '&id=' + result.respond.info.link + '&index=' + idx
                window.location.replace(link);
            })
        })
    


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
function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
  }
 // set random background color
colors = [
    '#4b3064',
    '#b61924',
    '#e86638',
    "#f0bd4a",
    "#de1874",
    "#b52236",
    "#e85733",
    "#7b8da7"
]

  var random_color = getRandomSubarray(colors, 1);
  console.log(random_color)
  document.getElementById('particles-js').style.backgroundColor = random_color[0]