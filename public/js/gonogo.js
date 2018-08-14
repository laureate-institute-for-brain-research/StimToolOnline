
// Paramaeters
TOTAL_TRIAL_NUMBER = 5
TOTAL_TRIALS_EACH = TOTAL_TRIAL_NUMBER / 4


var timeline = [];

timeline.push({
    type: 'fullscreen',
    fullscreen_mode: true,

});



/* define welcome message trial */
var welcome = {
    type: "html-keyboard-response",
    stimulus: "<p>GoNoGo Task </p> <br><br><br><p> Press any key to begin.</p>",
    on_load : () => {
        document.body.style.backgroundColor = "black";
        idsToHide = ['logo','nametitle','id_label','session_label','study_label']

        idsToHide.forEach((element) =>{
            document.getElementById(element).hidden = true;
        });
    
    //document.p.style.color = "white";
    }

};
timeline.push(welcome);


// Instructions For the Task
var instructions = {
    type: 'instructions',
    pages: [
        '<p>The task consists of individual trials in which you have to decide whether you do a simple detection task: <br>indicate with a button press in which side of the screen you see a circle. <br>Before the circles appear on the screen you will see one image that tells you if you have to do this button press or not and if you may win or lose money on the trial.</p>',
        '<p>There are 4 of these images and by trial and error you must find out which is the best strategy <br>(to press the button or not to press the button) when you see the circle in order to win as much money as you can and avoid losing as much money as you can.</p>',
        '<p>Some of the images predict that you will win money. Whether you win or not is probabilistic, but by figuring out the best strategy you can optimize the probability of winning £1. <br>The same applies for the images that predict losses. Whether you lose or not is probabilistic, but by figuring out the best strategy you can minimize the probability of losing £1. <br>For each image the best strategy may be to do the task but it may also be to hold your response.</p>',
        '<p>The meaning of each image will be held constant throughout the task. However, the task is not easy, so I encourage exploration of all options.</p>',
        '<p>On each trial you will see one image. You must not press any button at this point. After a short delay you will see the circle and then you must do the detection task (indicate in which side of the screen the circle is). After a short delay, you will see an upper arrow meaning that you win £1, a lower arrow meaning that you lose £1, and an horizontal bar meaning that you neither lose nor win. Critically, in this task you may not win even after doing a correct response and you may lose even after doing a correct response. However, for each image there is one strategy more advantageous than the other.</p>',
        '<p>So for the winning conditions you may either get the arrow up or the horizontal bar. For the losing condition you may either get the arrow down or the horizontal bar. By doing the right thing when the circle appears (do the task or holding your response) you can make the most favorable outcome more frequent.<p>',
        '<p>First, you will do 10 trials of the detection task and you will be informed when a response is correct and when it is incorrect or too late. Thereafter you will proceed with the proper task, which is divided in 4 parts. You can take a brake as long as you want between each part. All what you win will be counted and you will get paid cash at the end of the experiment with a maximum of £30 and a minimum of £15.<p>'
    ],
    show_clickable_nav: true,
    allow_keys: true,
    show_page_number : true
}

timeline.push(instructions)


/**
* Shuffles array in place. ES6 version
* @param {Array} a items An array containing the items.
*/
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


/**
 * Returns a Random Integer given a min and max
 * @param {Integer} min The Lower Bound for Random Number.
 * @param {Integer} max The Upper Boudn for Random Number.
 */
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

/**
 * Returns either win, lose, neither given a condition type and boolean variable
 * @param {String} type Trial Condition [a,b,c,d]
 * @param {Boolean} pressed Subject Response pressing the button or not
 */
function getResult(type, pressed){

    var rnd1 = Math.random()
    if (type == 'a'){
        // A: Go to Win Trial:
        // Pressed => 80% win : 20% neither
        // Not Pressed => 80% nothing : 20% win
        if(pressed){
            if(rnd1 > .8){
                return 'win'
            } else {
                return 'neither'
            }
        } else {
            if(rnd1 > .8){
                return 'neither'
            } else {
                return 'win'
            }
        }
        
    } else if(type == 'b'){
        // B: Go to Avoid :
        // Pressed => 80% nothing : 20% lose
        // Not Pressed => 80% lose : 20% nothing
        if(pressed){
            if(rnd1 > .8){
                return 'neither'
            } else {
                return 'lose'
            }
        } else {
            if(rnd1 > .8){
                return 'lose'
            } else {
                return 'neither'
            }
        }
    } else if(type == 'c'){
        // C: No Go to Win :
        // Pressed => 80% nothing : 20% win
        // Not Pressed => 80% win : 20% nothing
        if(pressed){
            if(rnd1 > .8){
                return 'neither'
            } else {
                return 'win'
            }
        } else {
            if(rnd1 > .8){
                return 'win'
            } else {
                return 'neither'
            }
        }
    } else if(type == 'd'){
        // D: No Go to Avoid :
        // Pressed => 80% lose : 20% nothing
        // Not Pressed => 80% nothing : 20% lose
        if(pressed){
            if(rnd1 > .8){
                return 'lose'
            } else {
                return 'neither'
            }
        } else {
            if(rnd1 > .8){
                return 'neither'
            } else {
                return 'lose'
            }
        }
    }
}




// Data Preparation:
a_type_total = 0 
b_type_total = 0
c_type_total = 0
d_type_total = 0




fractal_order = ['a','b','c','d']

decode_type = {
    'a' : 'A: Go To Win',
    'b' : 'B: Go to Avoid Losing',
    'c' : 'C: No Go to Win',
    'd' : 'D: No Go to Avoid Losing'
}

// A is always Go to Win
// B is always Go to Avoid
// C is always No Go to Win
// D is always No Go to Avoid

fractal_images = {}
//console.log(fractal_order)

// shuffle this every time this page loads to so that 
// The meaning of each fractal image is different for each subject
shuffle(fractal_order); 

f_num = 1
fractal_order.forEach((value) => {
    fractal_images[value] = '/images/gonogo_media/S' + f_num + '.bmp'
    f_num++
});
//console.log(fractal_images)

circle_position = {
    'a' : 'left',
    'b' : 'right',
    'c' : 'left',
    'd' : 'right'
}

POINTS = 0


// Make the Procedure for the Task!
for (let i = 1; i < TOTAL_TRIAL_NUMBER + 1; i++){
    Trial_Number = i;

    // Get Random Trial_type Constantly until each trial types have been used
    try_again = true
    //type = jsPsych.randomization.sampleWithoutReplacement(fractal_order, 1);
    //console.log(i + ' ' + type)
  
    while(try_again){
        // single sample without replacement
        type = jsPsych.randomization.sampleWithoutReplacement(['a','b','c','d'], 1);
        
        if(type == 'a'){
            if(a_type_total != TOTAL_TRIALS_EACH){
                try_again = false;
                a_type_total++;
            } else {
                try_again = true;
            }
        } else if(type == 'b'){
            //console.log('its b')
            if(b_type_total != TOTAL_TRIALS_EACH){
                try_again = false;
                b_type_total++;
            }else {
                try_again = true;
            }
        } else if(type == 'c'){
            //console.log('its c')
            if(c_type_total != TOTAL_TRIALS_EACH){
                try_again = false;
                c_type_total++;
            } else {
                try_again = true;
            }
        } else if(type == 'd'){
            if(d_type_total != TOTAL_TRIALS_EACH){
                try_again = false;
                d_type_total++
            } else {
                try_again = true;
            }
        } else {
            console.log('THis should never show')
        }
    }
    console.log(i + ' ' + type)

    // Show Fractal Image
    // Fractal Image meaning changes for every subject
    var fractal_cue = {
        type: "image-keyboard-response",
        stimulus : fractal_images[type],
        trial_duration : 1000, // show image for 1000 millisecond
        choices : jsPsych.NO_KEYS,
        data: {trial_number :Trial_Number, test_part: 'fractal_cue', result : type[0]},
    }

    timeline.push(fractal_cue)


    // First Fixation After the Image
    // Varies from 250 to 2000 ms

    var fixation_duration = getRandomIntInclusive(2000,250) // Get random delay from 250 >= x >= 2000
    var fixation = {
        type : 'html-keyboard-response',
        stimulus : '<div style="font-size:60px; color: rgb(255, 255, 255);">+</div>',
        choices: jsPsych.NO_KEYS,
        trial_duration: fixation_duration,
        data: {trial_number :Trial_Number, test_part: 'fixation', duration : fixation_duration}

    }
    timeline.push(fixation)


    // Target Detection Task
    // A circle is presented either on the left or right of screen depending on the trial type
    // Subject must either press a key to classify a trial as a "Go"
    // or NOT Press a key to classify a trial as "No Go"

    // Once subject makes a decision and outcome of either:
    // * win
    // * lose
    // * neither
    // Will be saved as the result for the trial.
    var target_detection = {
        type : 'html-keyboard-response',
        stimulus : `
        <div style='width: 700px;'>
            <div style='float: ${circle_position[type]}'>
                <img src="https://png.icons8.com/ios/100/cccccc/unchecked-circle.png">
            </div>
        </div>
        `,
        choices : [37,39], // 37: <-   39:->
        trial_duration : 1500,
        data : {trial_number : Trial_Number, test_part : 'target_detection'},
        on_finish: function(data){
            //var dataf = jsPsych.data.get().filter({'test_part': "target_detection"}).last(1).values()[0];
            var outcome = ''
            if(data.key_press){
                outcome = getResult(type, true)
            } else{
                outcome = getResult(type, false)
            }

            data.outcome = outcome
            
            if (outcome == 'win'){
                POINTS++;
                data.points = POINTS;
            } else if (outcome == 'lose'){
                POINTS--;
                data.points = POINTS;
            } else {
                data.points = POINTS;
            }
            console.log(outcome + ' : ' + POINTS)
        }
    }

    timeline.push(target_detection)


    // 2nd Fixation Point
    // This is just fixation point that occurs 1000ms after the subject has made a response
    var fixed_fixation = {
        type : 'html-keyboard-response',
        stimulus : '<div style="font-size:60px; color: rgb(0, 0, 255);">+</div>',
        choices: jsPsych.NO_KEYS,
        trial_duration: 1000,
        data: {trial_number : Trial_Number, test_part: 'fixed_fixation', duration : 1000}
    }

    timeline.push(fixed_fixation)


    // Outcome Trial Conditions:
    // The Image that should be displayed based on the result
    // of the Target Detection Task Portion

    // Each Outcome (win, lose, or neither)
    // Will display depending on the result
    
    var outcome_trial_condition_win = {
        timeline : [{
            type: "image-keyboard-response",
            stimulus : '/images/gonogo_media/up_arrow.png',
            trial_duration : 1000, 
            choices : jsPsych.NO_KEYS,
            data: {trial_number : Trial_Number,test_part: 'probability_outcome_win'}
        }],
        conditional_function : () =>{
            var data = jsPsych.data.get().filter({'test_part': "target_detection"}).last(1).values()[0];
            //console.log(data.trial_index + ': ' + 'Lose')
            
            if(data.outcome == 'win'){
                return true
            } else {
                return false
            }

        }
    }

    timeline.push(outcome_trial_condition_win)

    var outcome_trial_condition_lose = {
        timeline : [{
            type: "image-keyboard-response",
            stimulus : '/images/gonogo_media/down_arrow.png',
            trial_duration : 1000, 
            choices : jsPsych.NO_KEYS,
            data: {trial_number : Trial_Number,test_part: 'probability_outcome_lose'}
        }],
        conditional_function : () =>{
            // Only show sequene Lose part of the experiment if the target detection task portion had a button press
            var data = jsPsych.data.get().filter({'test_part': "target_detection"}).last(1).values()[0];
            //console.log(data.trial_index + ': ' + 'Lose')
            if(data.outcome == 'lose'){
                return true
            } else {
                return false
            }

        }
    }

    timeline.push(outcome_trial_condition_lose)

    var outcome_trial_condition_neither = {
        timeline : [{
            type: "image-keyboard-response",
            stimulus : '/images/gonogo_media/rectangle.png',
            trial_duration : 1000, 
            choices : jsPsych.NO_KEYS,
            data: {trial_number : Trial_Number,test_part: 'probability_outcome_neither'}
        }],
        conditional_function : () =>{
            // Only show sequene "Neither" part of the experiment if the target detection task portion had a button press
            var data = jsPsych.data.get().filter({'test_part': "target_detection"}).last(1).values()[0];
            //console.log(data.trial_index + ': ' + 'Neither')
            if(data.outcome == 'neither'){
                return true
            } else {
                return false
            }

        }
    }

    timeline.push(outcome_trial_condition_neither)


    // Final Delay after the outcome
    // The Duration ranges from 750 ms to 1500 ms

    var wait_duration = getRandomIntInclusive(750,1500)

    var posttrial_wait = {
        type: "html-keyboard-response",
        stimulus : '',
        trial_duration : wait_duration, 
        choices : jsPsych.NO_KEYS,
        data: {trial_number : Trial_Number, test_part: 'posttrial_wait', duration : wait_duration}
    }

    timeline.push(posttrial_wait)

    
    
    // console.log('a: ' + a_type_total);
    // console.log('b: ' + b_type_total);
    // console.log('c: ' + c_type_total);
    // console.log('d: ' + d_type_total);
    
}


/* test trials */
// var test_stimuli = [
//     { stimulus: "images/jspsychtest/blue.png", data: { test_part: 'test', correct_response: 'f' } },
//     { stimulus: "images/jspsychtest/orange.png", data: { test_part: 'test', correct_response: 'j' } }
// ];

// var fixation = {
//     type: 'html-keyboard-response',
//     stimulus: '<div style="font-size:60px; color: rgb(255, 255, 255);">+</div>',
//     choices: jsPsych.NO_KEYS,
//     trial_duration: function(){
//     return jsPsych.randomization.sampleWithoutReplacement([250, 500, 750, 1000, 1250, 1500, 1750, 2000], 1)[0];
//     },
//     data: {test_part: 'fixation' }
// }

// var test = {
//     type: "image-keyboard-response",
//     stimulus: jsPsych.timelineVariable('stimulus'),
//     choices: ['f', 'j'],
//     data: jsPsych.timelineVariable('data'),
//     on_finish: function(data){
//         if(data.key_press){
//         console.log('pressed key' + data.key_press)
//         data.correct = data.key_press == jsPsych.pluginAPI.convertKeyCharacterToKeyCode(data.correct_response);
//         }
    
//     },
// }

// var test_procedure = {
//     timeline: [fixation, test],
//     timeline_variables: test_stimuli,
//     repetitions: 1,
//     randomize_order: true
// }
// timeline.push(test_procedure);

/* define debrief */


// Probably not necessary but this shows the subject How many points he has accumulated
// And also his average resopnse time


// exit fullscreen mode
timeline.push({
    type: 'fullscreen',
    fullscreen_mode: false
  });

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
timeline.push(debrief_block);

/* start the experiment */


jsPsych.init({
    timeline: timeline,
    //display_element : 'taskdiv',
    on_finish: function() {
        jsPsych.data.displayData();
    }
});