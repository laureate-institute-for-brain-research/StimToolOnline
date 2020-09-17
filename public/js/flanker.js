/**
 * Flanker Task
 * Use for Cognitive Control Study
 * @author James Touthang <jtouthang@laureateinstitute.org>
 */


// GLOBAL Variables
var nextLink;

/**
 * Retrieves the URL query value.
 * i.e. /?test=value : getQueryVariable('test') -> 'value'
 * @param {String} variable URL quiery name we want to get teh value for
 */
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return 'NULL'
}

/**
 * Save the current trial to file on the server
 */
function saveData(){
    row_data = jsPsych.data.get().last().json()
    trial_data = JSON.parse(jsPsych.data.get().json())
    // $.ajax({
    //     type : 'post',
    //     async : false,
    //     url : '/saveFlanker?' + $.param(expInfo) ,
    //     data : row_data,
    //     contentType: "application/json",
    //     dataType: 'json'
    // });

    // console.log(trial_data)

    $.ajax({
        type: "POST",
        url: '/save',
        data: {
            "trials_data": trial_data,
            "expInfo": expInfo
        },
        dataType: 'JSON',
        success:function(data) {
            console.log(data)
          }
    })

    
    
    // console.log(row_data);
}

//var csv is the CSV file with headers
function csvJSON(csv){

    var lines=csv.split("\n");
  
    var result = [];
  
    var headers=lines[0].split(",");
  
    for(var i=1;i<lines.length;i++){
  
        var obj = {};
        var currentline=lines[i].split(",");
  
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }
  
        result.push(obj);
  
    }
    
    //return result; //JavaScript object
    return result; //JSON
}



/**
 * Returns 4 types of symbols.
 * Left Congruency
 * Left InCongruency
 * Right Congruency
 * Right Incongruency
 * @param {String} direction 
 * @param {String} congruency 
 */
function getSymbol(direction,congruency){
    if(direction == 'left' && congruency == 'incongruent'){
        return ">><>>"
    }
    if(direction == 'left' && congruency == 'congruent'){
        return "<<<<<"
    }
    if(direction == 'right' && congruency == 'incongruent'){
        return "<<><<"
    }
    if(direction == 'right' && congruency == 'congruent'){
        return ">>>>>"
    }
}

/**
 * Returns True if the key press is the same direciton
 * Returns False if thhe key press is different direction
 * @param {String} direction either 'left' or 'right'
 * @param {Integer} key_presss numeric code for entered key
 */
function isCorrect(direction, key_presss){
    // 37 is <-
    // 39 is ->
    if(direction == 'left' && key_presss == 37){
        return true
    }
    if(direction == 'right' && key_presss == 39){
        return true
    }
    // Everything else is false
    return false
}

var id = getQueryVariable('subject')
var study = getQueryVariable('study')
var session = getQueryVariable('session')
var version = getQueryVariable('version')

function formatDate() {
    var d = new Date(),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();
    hour = d.getHours()
    minutes = d.getMinutes()

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day, hour,minutes ].join('_');
}


var expInfo = {
    'task': 'flanker',
    'participant' : getQueryVariable('subject'),
    'study' :study,
    'session' : session,
    'version': version,
    'date' : formatDate()
}


var timeline = [];

timeline.push({
    type: 'fullscreen',
    fullscreen_mode: true,
    message: "<p>Press the button below to start the task</p>",
    on_finish: ()=>{
        row_data = jsPsych.data.get().json()
        // $.ajax({
        //     type : 'post',
        //     async : false,
        //     url : '/saveFlanker?' + $.param(expInfo) ,
        //     data : row_data,
        //     contentType: "application/json",
        //     dataType: 'json'
        // });

        // $.ajax({
        //     type: "POST",
        //     url: '/save',
        //     data: {
        //         "trials_data": jsPsych.data.get().json(),
        //         "expInfo": expInfo
        //     },
        //     dataType: 'JSON',
        //     success:function(data) {
        //         console.log(data)
        //       }
        // })
        
        // console.log(row_data);
    }
    
});


/* define welcome message trial */
var welcome = {
    type: "html-keyboard-response",
    stimulus: "<p>Arrow Task</p> <br><br><br><p> Press any key to begin.</p>",
    on_load : () => {
        // document.body.style.backgroundColor = "black"; // Turns the background to black

        // // Used to hide initial elements in the container
        // idsToHide = ['logo','nametitle','id_label','session_label','study_label']

        // idsToHide.forEach((element) =>{
        //     document.getElementById(element).hidden = true;
        // });
    
    },
    on_finish: saveData

};
timeline.push(welcome);


// Instructions For the Task
var instructions = {

    type: 'instructions',
    pages: [
        `<div class="container"><p>For this task, please select either the left or right arrow key based on the direction of the middle arrow. 
        </p><p>There will be two arrows on each side of the middle arrow. 
        <br>These will sometimes face the same direction as the middle arrow and sometimes not. 
        </p><p>Ignore the direction of the arrows to the side of the middle arrow.</p></div>`,
        `<p>Example 1:<br> If you are shown:<br><div style="font-size:30px"> >>>>> </div>
        <br>The Correct answer is the ">" arrow and you should click the right key.
        <br>Remember to ignore the arrows to the side of the middle arrow.</p>`,
        `<p>Example 2:<br> If you are shown:<br><div style="font-size:30px"> >><>>  </div>
        <br>The Correct answer is the "<" arrow and you should click the left key.
        <br>Remember to ignore the arrows to the side of the middle arrow.</p>`,
        `<p>Example 3:<br> If you are shown:<br><div style="font-size:30px"> <<<<<   </div>
        <br>The Correct answer is the "<" arrow and you should click the left key.
        <br>Remember to ignore the arrows to the side of the middle arrow.</p>`,
        `<p>Example 4:<br> If you are shown:<br><div style="font-size:30px"> <<><<    </div>
        <br>The Correct answer is the ">" arrow and you should click the right key.
        <br>Remember to ignore the arrows to the side of the middle arrow.</p>`,
        '<h2>Click next to begin the task</h2>'
    ],
    show_clickable_nav: true,
    allow_keys: true,
    show_page_number : true,
    on_finish: saveData
}

timeline.push(instructions)

if(expInfo.session != 'NULL'){
    schedule_session = expInfo.session
}else {
    // Session not specified, use T1 instead
    schedule_session = '1'
}


//
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
                $.get('/schedules/flanker_T' + getQueryVariable('session') + '.csv', function (data) {
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
    // Iterate over the Schedule
    json_schedule.forEach(function(element, idx){
        trial_number = idx + 1
        // Ignore empty fields
        if(!element.direction && !element.congruency){
            return
        }
        
        // For Practice, only show 5 trials
        if ( (getQueryVariable('practice') == 'true') && (idx >= 5)) {
            return
        }
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


        // Image-Response
        // Show the symbol
        // Get Response

        symbol = getSymbol(element.direction, element.congruency)
        var symbol_response = {
            type : 'html-keyboard-response',
            stimulus : `
            <div>
                <div id="stim" style='font-size: 60px'>
                    ${symbol}
                </div>
            </div>
            `,
            choices : [37,39], // 37: <-   39:->
            trial_duration : 2000,
            data : {trial_number : trial_number, 
                test_part : 'symbol_response', 
                symbol: symbol,
                direction : element.direction,
                congruency : element.congruency
            },
            response_ends_trial : false,
            on_finish: function(data){
                if(isCorrect(data.direction, data.key_press)){
                    data.result = 'correct'
                    
                }else {
                    data.result = 'incorrect'
                }
                if (data.key_press) {
                    // Change Color after press
                    // console.log(document.getElementById('stim'))
                  }
                
                 // save data
                row_data = jsPsych.data.get().last().json()
                // console.log(jsPsych.data.get().json())
                $.ajax({
                    type : 'post',
                    async : true,
                    url : '/saveFlanker?' + $.param(expInfo) ,
                    data : row_data,
                    contentType: "application/json",
                    dataType: 'json'
                });
            }
        }

        timeline.push(symbol_response)


        // Add Breaks for Every 30 Trials
        // This is the block
        if( trial_number % 30 == 0 && trial_number != 180){
            var block_break = {
                type : 'html-keyboard-response',
                stimulus : `
                <div>
                    <div style='font-size: 35px'>
                        <span id="seconds">10</span> second break.
                        <br>
                        <br>
                        or press the Space Bar to continue
                    </div>
                </div>
                `,
                choices : [32], // 32 is the space bar
                trial_duration : 10000,
                data : {trial_number : trial_number, 
                    test_part : 'block_break', 
                    symbol: symbol,
                    direction : element.direction,
                    congruency : element.congruency
                },
                response_ends_trial : true,
                on_finish: function(data){
                    
                     // save data
                    row_data = jsPsych.data.get().last().json()
                    $.ajax({
                        type : 'post',
                        async : false,
                        url : '/saveFlanker?' + $.param(expInfo) ,
                        data : row_data,
                        contentType: "application/json",
                        dataType: 'json'
                    });
                },
                on_load: function(){
                    timeleft = 9;
                    
                    document.getElementById("seconds").style.fontWeight = 'bold';
                    document.getElementById("seconds").style.color = 'red';
                    var downloadTimer = setInterval(function(){
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
                        ,1000);
                }
            }
    
            timeline.push(block_break)
        }

        
        
    })

    // exit fullscreen mode
    timeline.push({
        type: 'fullscreen',
        fullscreen_mode: false
    });

    console.log('Timeline Length: ' + timeline.length)

    /* start the experiment */
    jsPsych.init({
        timeline: timeline,
        //display_element : 'taskdiv',
        on_finish: function() {
            // jsPsych.data.displayData();
            // go to next link
            window.location = nextLink
            
        },
        // show_preload_progress_bar: true
    });
}


var debrief_block = {
    type: "html-keyboard-response",
    stimulus: function() {

    var trials = jsPsych.data.get().filter({test_part: 'test'});
    var correct_trials = trials.filter({correct: true});
    var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
    var rt = Math.round(jsPsych.data.get().filter({'test_part': "target_detection"}).select('rt').mean());
    var points = jsPsych.data.get().filter({'test_part': "target_detection"}).last(1).values()[0].points;
    //console.log(data);

    return "<p>You Got "+points+" Points.</p>"+
    "<p>Your average response time was "+rt+"ms.</p>"+
    "<p>Press any key to complete the experiment. Thank you!</p>";

    }
};
// timeline.push(debrief_block);




