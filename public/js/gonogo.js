var timeline  = []

var welcome = {
    type : 'html-keyboard-response',
    stimulus : "Affective No Go\nPress an key to begin"
}
timeline.push(welcome);

var instructions = {
    type: "html-keyboard-response",
    stimulus: "<p>In this experiment, a circle will appear in the center " +
        "of the screen.</p><p>If the circle is <strong>blue</strong>, " +
        "press the letter F on the keyboard as fast as you can.</p>" +
        "<p>If the circle is <strong>orange</strong>, press the letter J " +
        "as fast as you can.</p>" +
        "<div style='width: 700px;'>"+
        "<div style='float: left;'><img src='images/jspsychtest/blue.png'></img>" +
        "<p class='small'><strong>Press the F key</strong></p></div>" +
        "<div class='float: right;'><img src='images/jspsychtest/orange.png'></img>" +
        "<p class='small'><strong>Press the J key</strong></p></div>" +
        "</div>"+
        "<p>Press any key to begin.</p>",
    post_trial_gap: 2000
};

timeline.push(instructions);

/* test trials */
var test_stimuli = [
    { stimulus : 'images/jspsychtest/blue.png'},
    { stimulus : 'images/jspsychtest/orange.png'}
];

var fixation = {
    type: 'html-keyboard-response',
    stimulus: '<div style="font-size:60px;">+</div>',
    choices: jsPsych.NO_KEYS,
    trial_duration: 1000,
}

var test = {
    type: "image-keyboard-response",
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: ['f', 'j']
}

var test_procedure = {
    timeline: [fixation, test],
    timeline_variables: test_stimuli
}


timeline.push(test_procedure);

jsPsych.init({
    timeline: timeline
})