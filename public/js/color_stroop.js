/**
 * Color Stroop Task
 * Use for Cognitive Control Study
 * @author James Touthang <jtouthang@laureateinstitute.org>
 */

// GLOBAL Variables
var nextLink;

var subject = getQueryVariable('subject')
var study = getQueryVariable('study')
var session = getQueryVariable('session')
var version = getQueryVariable('version')

var expInfo = {
    'task': 'color_stroop',
    'participant' : getQueryVariable('subject'),
    'study' :study,
    'session' : session,
    'version': version,
    'date' : formatDate()
}

// TASK Logic
var timeline = [];

timeline.push({
    type: 'fullscreen',
    fullscreen_mode: true,
    message: '<p>Press the button below to start experiment</p>',
    on_finish: ()=>{
        // row_data = jsPsych.data.get().json()
        // $.ajax({
        //     type : 'post',
        //     async : false,
        //     url : '/saveColorStroop?' + $.param(expInfo) ,
        //     data : row_data,
        //     contentType: "application/json",
        //     dataType: 'json'
        // });
        
        // console.log(row_data);
    }
    
});


/* define welcome message trial */
var welcome = {
    type: "html-keyboard-response",
    stimulus: "<p>Color Naming Task</p><br><br><p> Press any key to begin.</p>",

};
timeline.push(welcome);

// Audio Test
var instructions = {

    type: 'instructions',
    pages: [
        `<canvas id="vumeter" width="800" height="300"></canvas>
        <br><br><p>Please click "Allow" for the microphone to begin.</p><p>
        <br>Try speaking.<br>The VU meter should increase as you talk louder.
        <br><br>If it works, continue. 
        <br>If not, ask the administrator for help.</p>`,
    ],
    show_clickable_nav: true,
    allow_keys: true,
    show_page_number : true,
    on_load: function(){
        initAudio()
        audioContext = new AudioContext();        
    },
    on_finish: saveData
}

timeline.push(instructions)

// Instructions For the Task
var instructions = {

    type: 'instructions',
    pages: [
        `<div class="container"><p>For this task, you will say aloud the ink color of the words that are presented on the screen. 
        <br>The words that come up will be presented in either red, blue, or green ink.</p>`,
        `<p>The words themselves will be either “red,” “blue,” or “green.” 
        <br>Ignore reading the words themselves as the ink color will sometimes match the word and 
        <br>will sometimes be different from the word.</p>`,
        `<p>Example 1:<br>If you are shown:<br><br><font color="red">Red</font><br>
        <br>The correct answer is red so you should say "red" aloud.</p>`,
        `<p>Example 2:<br>If you are shown:<br><br><font color="green">Blue </font><br>
        <br>The correct answer is green so you should say "green" aloud.</p>`,
        `<p>Example 3:<br>If you are shown:<br><br><font color="blue">Blue </font><br>
        <br>The correct answer is blue so you should say "blue" aloud.</p>`,
        `<p>Example 4:<br>If you are shown:<br><br><font color="red">Green </font><br>
        <br>The correct answer is red so you should say "red" aloud.</p>`,
        '<h2>Click next to begin the task</h2>'
        
    ],
    show_clickable_nav: true,
    allow_keys: true,
    show_page_number : true,
    on_finish: startRecording
}

timeline.push(instructions)

if(expInfo.session != 'NULL'){
    schedule_session = expInfo.session
}else {
    // Session not specified, use T1 instead
    schedule_session = '1'
}

window.onload = function () {
    var id = getQueryVariable('id')
    // Get info Promize
	const getInfoPromise = new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: '/getInfo',
			data: { 'id': id },
			dataType: 'JSON',
			success: function (data) {
				resolve(data)
			}
		})
    })
        // Read getINFO 
		.then((values) => {
			console.log(values)
			if (values.subject && values.session && values.study) {
				expInfo.participant = values.subject
				expInfo.study = values.study
				expInfo.session = values.session
				expInfo.run_id = getQueryVariable('run')

                // set next link
                nextLink = '/link?id=' + values.link + '&index=' + parseInt(getQueryVariable('index')) + 1 // get next order.
                console.log('Next Link: ' + nextLink)

                console.log('expInfo: ')
                console.log(expInfo)

            }
            
            // Return AJAX promise to get schedule
            return new Promise((resolve, reject) => {
                $.get('/schedules/color_stroop_T' + getQueryVariable('session') + '.csv', function (data) {
                    resolve(data)
                })
            })
		
        })
    
        .then(data => {
            schedule = csvJSON(data)
            setupTask(schedule)
        })
}

function setupTask(json_schedule) {
    schedule.forEach(function(element, idx){
        trial_number = idx + 1
        // Ignore empty fields
        if(!element.direction && !element.congruency){
            return
        }
        

        /////////////   FOR TESTING LIMIT TO 4 Trials ///////////
        ////////////////////////////////////////////////////////
        
        // if(idx < 29){
        //     return
        // }
        ////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////

        // console.log(idx)

        var fixation = {
            type : 'html-keyboard-response',
            stimulus : '<div style="font-size:60px">+</div>',
            choices: jsPsych.NO_KEYS,
            trial_duration: 1000,
            data: {trial_number :trial_number, test_part: 'fixation', duration : 1000},
            on_load: ()=>{
                // document.body.style.backgroundColor = "grey";
                // document.body.style.backgroundImage = "none";
            },
            on_finish: saveData
    
        }
        timeline.push(fixation)

        var word_response = {
            type : 'html-keyboard-response',
            stimulus : `
            <div>
                <div style='font-size: 60px; color: ${element.ink_color}'>
                    ${element.word}
                </div>
            </div>
            `,
            trial_duration : 2000,
            data: {
                trial_number: trial_number, 
                test_part : 'word_response', 
                word: element.word,
                ink_color : element.ink_color,
                congruency : element.congruency
            },
            response_ends_trial : false,
            on_load: function(){

                console.log({
                    'word': element.word,
                    'ink': element.ink_color,
                    'trial_number': trial_number
                })
            },
            on_finish: function(data){

            }
        }

        timeline.push(word_response)


        // Add Breaks for Every 30 Trials
        // This is the block
        block_number = 1
        if( trial_number % 30 == 0 && trial_number != 180){
            var block_break = {
                type : 'html-keyboard-response',
                stimulus : `
                <div>
                    <div style='font-size: 35px'>
                        <span id="seconds">10</span> second break.
                        <br>
                        
                    </div>
                </div>
                `,
                trial_duration : 10000,
                data : {trial_number : '', 
                    test_part : 'break', 
                    word: element.word,
                    ink_color : element.ink_color,
                    congruency : element.congruency
                },
                response_ends_trial : false,
                on_finish: function(data){
                    startRecording()
                },
                on_load: function(){
                    stopRecording(block_number, 'color_stroop')
                    block_number++
                    timeleft = 9;
                    
                    document.getElementById("seconds").style.fontWeight = 'bold';
                    document.getElementById("seconds").style.color = 'red';
                    var downloadTimer = setInterval( function(){
                        timeleft--;
                        
                        try{
                            document.getElementById("seconds").innerHTML = timeleft;
                        }catch(err){
                            // error 
                        }
                        
                        // console.log('timer: ' + timeleft);
                        if(timeleft <= 0)
                            clearInterval(downloadTimer);
                        }
                        , 1000);
                }
            }
            timeline.push(block_break)
        }
    })

    timeline.push({
        type: 'fullscreen',
        fullscreen_mode: true,
    });

    jsPsych.init({
        timeline: timeline,
        //display_element : 'taskdiv',
        on_finish: function () {
            stopRecording(block_number, 'color_stroop')
            saveData()
            // jsPsych.data.displayData();
            // Should Redirect to the next task
            window.location = nextLink
        },
        
    });
}
