/* ---- particles.js config ---- */

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
var new_color = colors[Math.floor(Math.random()*colors.length)];
$('#particles-js').css('background-color',new_color);

// var random_color = getRandomSubarray(colors, 1);
// document.getElementById('particles-js').style.backgroundColor = random_color[0]

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
            "value": ["#BD10E0", "#B8E986", "#50E3C2", "#FFD300", "#E86363"]
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
            "value": 5,
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
            "random": true,
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

// Browser Detect
window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};
  

disable_begin = false;

// When study list is change, than show input fields
// Show Session based on study
$('#study-list').change(function () {
    document.getElementById('id_div').style.display = 'block';
    document.getElementById('session_div').style.display = 'block'; // Show session dropdown

    two_session_studies = ['AAC-BET', 'BK_Pilot', 'CognitiveControl', 'Driving']
    if (!two_session_studies.includes(document.getElementById('study-list').value)) {
        var selectobject = document.getElementById("session-list");
        for (var i=0; i<selectobject.length; i++) {
            if (selectobject.options[i].value == 'T2')
                selectobject.remove(i);
        }
    }

    mobileonly_studies = ['Driving']
    // Fire modal to aler user that this study is mobile
    if (mobileonly_studies.includes(document.getElementById('study-list').value)) {
        if (!window.mobileCheck()) {
            $('#modalMobileWarning').modal({}); // Show Warning Modal
            document.getElementById('begin').classList.add('disabled')
            document.getElementById('begin').title = 'Disabled - please use a mobile device to begin.'
            
            disable_begin = true
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

    if (!disable_begin) {
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
    }
    

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

            // Clicking the Begn button in the skip modal
            document.getElementById('skip_begn').addEventListener('click', event => {
                event.preventDefault()
                var run_val = select_form.options[select_form.selectedIndex].value;
                var idx = select_form.options[select_form.selectedIndex].index - 1;
                // console.log(result)

                // if (result.respond.info.study == 'Driving') {
                //     var link = run_val + '&id=' + result.respond.info.subject + '&index=' + idx
                // } else {
                //     var link = run_val + '&id=' + result.respond.info.link + '&index=' + idx
                // }
                var link = run_val + '&id=' + result.respond.info.link + '&index=' + idx
                window.location.replace(link);
            })
        })
    


});

// study parameter set, than automatically set the study-list
if (getQueryVariable('study')) {
    // Check if it's a valid study in the study-list
    studies = []
    var sel = document.getElementById('study-list');
    for (var i=0, n=sel.options.length;i<n;i++) { 
        if (sel.options[i].value) studies.push(sel.options[i].value);
        }
    if (studies.includes(getQueryVariable('study'))) {
        $('#study-list').val(getQueryVariable('study')).trigger('change');
    } else {
        console.error('the study you specified (' + getQueryVariable('study') + ') is not in the list of studies:', studies)
    }
    
}

// session parameter set, than automaticaly set the session-list
if (getQueryVariable('session')) {
    sessions = []
    var sel = document.getElementById('session-list');
    for (var i=0, n=sel.options.length;i<n;i++) { 
        if (sel.options[i].value) sessions.push(sel.options[i].value);
    }
    if (sessions.includes(getQueryVariable('session'))) {
        $('#session-list').val(getQueryVariable('session')).trigger('change');
    } else {
        console.error('the session you specified (' + getQueryVariable('study') + ') is not in the list of sessions:', sessions)
    }
    
}

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
