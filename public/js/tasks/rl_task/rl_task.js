/**
 * RL (Reinforcement Learning) Task
 * @author Aardron Robinson
 */

/*jshint -W069 */
/*Disable Warning Justification:
	Using bracket notation because it's familiar coding convention with python
	Counterpart
*/

var event_types = {
	'INSTRUCT_ONSET': 1,
	'TASK_ONSET': 2,
	'BLOCK_ONSET': 3,
	'TRIAL_ONSET': 4,
	'CHOICE': 5,
	'FEEDBACK': 6,
	'FIXATION_ONSET': 7,
	'AUDIO_ONSET': 8
}

var DEBUG_FLAG = false

var trials_data = []
var config_values = {}
var real_trial_order = []

var main_loop_count = 0
var last_trial_num = 0
var total_requests = 0

 import { core, data, sound, util, visual } from '/psychojs/psychojs-2021.2.3.js';
 const { PsychoJS } = core;
 const { TrialHandler } = data;
 const { Scheduler } = util;
 //some handy aliases as in the psychopy scripts;
 const { abs, sin, cos, PI: pi, sqrt } = Math;
const { round } = util;
 
import { Sound } from '/lib/sound-2020.1.js';

// TASK PARAMS
var LEFT_KEY = 'left'
var RIGHT_KEY = 'right'
var UP_KEY = 'up'
var keyList = [LEFT_KEY, RIGHT_KEY, UP_KEY]
var keyListTest = [LEFT_KEY, RIGHT_KEY]
var total_score = 0

var window_ratio = 4 / 3; // used for general stimuli sizing
var image_ratio = 4 / 3; // used for setting image sizes (this gets set to different image specific values throughout the code)

// global flags
var set_fixation_flag = true
var init_fixation_flag = true

// init psychoJS:
const psychoJS = new PsychoJS({
	debug: false
});

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}


window.onload = function () {
	var id = getQueryVariable('id')
	var study = getQueryVariable('study')

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
			// console.log(values)
			if (values.subject && values.session && values.study) {
				expInfo.participant = values.subject
				expInfo.study = values.study
				expInfo.session = values.session
				expInfo.run_id = getQueryVariable('run')

				// set next link
				psychoJS.setRedirectUrls(
					'/link?id=' + values.link + '&index=' + (parseInt(getQueryVariable('index')) + 1), // get next order.
					'/' // cancellation url
				)
			}
		
			// Return AJAX Promise to get Confit Params
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: '/js/tasks/rl_task/' + getQueryVariable('run'),
					dataType: 'json',
					success: (data) => {
						resolve(data)
					}
				})
			})
		
		})
	
		// Read RUN Config
		.then((values) => {

			resources.push({ name: 'run_schedule.xls', path: values.schedule })
			resources.push({ name: 'run_schedule_test.xls', path: values.schedule_test })
			resources.push({ name: 'run_schedule_explicit.xls', path: values.schedule_exp })
			resources.push({ name: 'instruct_schedule_p.csv', path: values.instruct_schedule_p })
			resources.push({ name: 'instruct_schedule_1.csv', path: values.instruct_schedule_1 })
			resources.push({ name: 'instruct_schedule_2.csv', path: values.instruct_schedule_2 })
			resources.push({ name: 'instruct_schedule_3.csv', path: values.instruct_schedule_3 })
			resources.push({ name: 'practice_schedule.csv', path: values.practice_schedule })
			resources.push({ name: 'config.csv', path: values.config})

			// Add file paths to expInfo
			if (values.schedule) expInfo.task_schedule = values.schedule
			if (values.schedule_test) expInfo.task_schedule_test = values.schedule_test
			if (values.schedule_exp) expInfo.task_schedule_exp = values.schedule_exp
			if (values.instruct_schedule_p) expInfo.instruct_schedule_p = values.instruct_schedule_p
			if (values.instruct_schedule_1) expInfo.instruct_schedule_1 = values.instruct_schedule_1
			if (values.instruct_schedule_2) expInfo.instruct_schedule_2 = values.instruct_schedule_2
			if (values.instruct_schedule_3) expInfo.instruct_schedule_3 = values.instruct_schedule_3
			if (values.practice_schedule) expInfo.practice_schedule = values.practice_schedule
			if (values.config) expInfo.task_config = values.config
			
			// Import the instruction slides
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: values.instruct_schedule_p,
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');

						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++){

								obj[headerRows[j]] = currentLine[j]
							}
							out.push(obj);

							if (obj.instruct_slide && obj.instruct_slide != '\n'){
								resources.push({ name: obj.instruct_slide, path: obj.instruct_slide })
							}

							if (obj.audio_path && obj.audio_path != '\n'){
								resources.push({ name: obj.audio_path, path: obj.audio_path })
							}
						}
						resolve(data)
					}
				})
				
			})
		})
		.then((values) => {
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: expInfo.instruct_schedule_1,
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');

						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++){
								obj[headerRows[j]] = currentLine[j]
							}
							out.push(obj);

							if (obj.instruct_slide && obj.instruct_slide != '\n'){
								resources.push({ name: obj.instruct_slide, path: obj.instruct_slide })
							}

							if (obj.audio_path && obj.audio_path != '\n'){
								resources.push({ name: obj.audio_path, path: obj.audio_path })
							}
						}
						resolve(data)
					}
				})
				
			})
		})
		.then((values) => {
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: expInfo.instruct_schedule_2,
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');

						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++){
								obj[headerRows[j]] = currentLine[j]
							}
							out.push(obj);
							console.log(obj)

							if (obj.instruct_slide && obj.instruct_slide != '\n'){
								resources.push({ name: obj.instruct_slide, path: obj.instruct_slide })
							}

							if (obj.audio_path && obj.audio_path != '\n'){
								resources.push({ name: obj.audio_path, path: obj.audio_path })
							}
						}
						resolve(data)
					}
				})
				
			})
		})
		.then((values) => {
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: expInfo.instruct_schedule_3,
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');

						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++){
								obj[headerRows[j]] = currentLine[j]
							}
							out.push(obj);

							if (obj.instruct_slide && obj.instruct_slide != '\n'){
								resources.push({ name: obj.instruct_slide, path: obj.instruct_slide })
							}

							if (obj.audio_path && obj.audio_path != '\n'){
								resources.push({ name: obj.audio_path, path: obj.audio_path })
							}
						}
						resolve(data)
					}
				})
				
			})
		})
		// Add Main Schedule stim_path to resources
		.then((values) => {			
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: expInfo.task_schedule,
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');
						
						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++){
								obj[headerRows[j]] = currentLine[j];	
							}
							// If there's media add to resources
						}

						resolve(data)
					}
				})
				
			})
		})
		// Add Main Schedule Test stim_path to resources
		.then((values) => {			
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: expInfo.task_schedule_test,
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');
						
						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++){
								obj[headerRows[j]] = currentLine[j];	
							}
							// If there's media add to resources
						}

						resolve(data)
					}
				})
				
			})
		})
		// Add Main Schedule Explicit stim_path to resources
		.then((values) => {			
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: expInfo.task_schedule_exp,
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');
						
						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++){
								obj[headerRows[j]] = currentLine[j];	
							}
							// If there's media add to resources
						}

						resolve(data)
					}
				})
				
			})
		})
		// Add config values resources
		.then((values) => {			
			// Add instrcution Images
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: expInfo.task_config,
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');
						
						for (var i=1; i<2; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++) {
								console.log(headerRows[j])
								console.log(currentLine[j])
								obj[headerRows[j]] = currentLine[j];	
							}
						}

						if (obj.L1_img != 'None' && obj.L1_img != undefined) {
							resources.push({ name: 'L1_img' , path: obj.L1_img  })
						}
						if (obj.M1_img != 'None' && obj.M1_img != undefined) {
							resources.push({ name: 'M1_img' , path: obj.M1_img  })
						}
						if (obj.H1_img != 'None' && obj.H1_img != undefined) {
							resources.push({ name: 'H1_img' , path: obj.H1_img  })
						}
						if (obj.L2_img != 'None' && obj.L2_img != undefined) {
							resources.push({ name: 'L2_img' , path: obj.L2_img  })
						}
						if (obj.M2_img != 'None' && obj.M2_img != undefined) {
							resources.push({ name: 'M2_img' , path: obj.M2_img  })
						}
						if (obj.H2_img != 'None' && obj.H2_img != undefined) {
							resources.push({ name: 'H2_img' , path: obj.H2_img  })
						}
						if (obj.L3_img != 'None' && obj.L3_img != undefined) {
							resources.push({ name: 'L3_img' , path: obj.L3_img  })
						}
						if (obj.M3_img != 'None' && obj.M3_img != undefined) {
							resources.push({ name: 'M3_img' , path: obj.M3_img  })
						}
						if (obj.H3_img != 'None' && obj.H3_img != undefined) {
							resources.push({ name: 'H3_img' , path: obj.H3_img  })
						}
						if (obj.L4_img != 'None' && obj.L4_img != undefined) {
							resources.push({ name: 'L4_img' , path: obj.L4_img  })
						}
						if (obj.M3_img != 'None' && obj.M3_img != undefined) {
							resources.push({ name: 'M4_img' , path: obj.M4_img  })
						}
						if (obj.H4_img != 'None' && obj.H4_img != undefined) {
							resources.push({ name: 'H4_img' , path: obj.H4_img  })
						}
						if (obj.L5_img != 'None' && obj.L5_img != undefined) {
							resources.push({ name: 'L5_img' , path: obj.L5_img  })
						}
						if (obj.M5_img != 'None' && obj.M5_img != undefined) {
							resources.push({ name: 'M5_img' , path: obj.M5_img  })
						}
						if (obj.H5_img != 'None' && obj.H5_img != undefined) {
							resources.push({ name: 'H5_img' , path: obj.H5_img  })
						}
						if (obj.L6_img != 'None' && obj.L6_img != undefined) {
							resources.push({ name: 'L6_img' , path: obj.L6_img  })
						}
						if (obj.M6_img != 'None' && obj.M6_img != undefined) {
							resources.push({ name: 'M6_img' , path: obj.M6_img  })
						}
						if (obj.H6_img != 'None' && obj.H6_img != undefined) {
							resources.push({ name: 'H6_img' , path: obj.H6_img  })
						}

						config_values = obj

						resolve(data)
					}
				})
				
			})
		})
		.then((values) => {			
			// Add practice Images
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: expInfo.practice_schedule,
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');
						
						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++){
								obj[headerRows[j]] = currentLine[j];	
							}
							// If there's media add to resources
						}

						resolve(data)
					}
				})
				
			})
		})
	
		
		.then((values) => {
			// Query Preceeds /getInfo
			if (getQueryVariable('participant')) expInfo.participant = getQueryVariable('participant')
			if (getQueryVariable('session')) expInfo.session = getQueryVariable('session')
			if (getQueryVariable('study')) expInfo.study = getQueryVariable('study')
			if (getQueryVariable('run')) expInfo.run_id = getQueryVariable('run')


			// If vanderbelt, send them to next run

			// Sanitze the resources. Needs to be clean so that psychoJS doesn't complain
			resources = sanitizeResources(resources)
			// expInfo.study = study
			psychoJS.start({
				expName, 
				expInfo,
				resources: resources,
			  })
			psychoJS._config.experiment.saveFormat = undefined // don't save to client side
		})
	
}

// open window:
psychoJS.openWindow({
	fullscr: (window.location.hostname != 'localhost'), // not full screen at localhost
	color: new util.Color('black'),
	units: 'height',
	waitBlanking: true
});

// store info about the experiment session:
let expName = 'RL Task';  // from the Builder filename that created this script
var expInfo = { 'participant': '' ,'session': '',  'run_id': '', 'date' : formatDate(), 'study': '', };

// schedule the experiment:
psychoJS.schedule(psychoJS.gui.DlgFromDict({
	dictionary: expInfo,
	title: expName
}));

waitForElm('.ui-dialog').then((elm) => {
	$("#buttonOk").button("option", "disabled", true);
	$('#progressMsg').on('DOMSubtreeModified', function () {
		if (document.getElementById('progressMsg').textContent == 'all resources downloaded') {
			$("#buttonOk").button("option", "disabled", false);
		}
	});
});

const flowScheduler = new Scheduler(psychoJS);
const dialogCancelScheduler = new Scheduler(psychoJS);
psychoJS.scheduleCondition(function () { return (psychoJS.gui.dialogComponent.button === 'OK'); }, flowScheduler, dialogCancelScheduler);

// flowScheduler gets run if the participants presses OK
flowScheduler.add(updateInfo); // add timeStamp
flowScheduler.add(experimentInit);

// INSTRUCTIONS BLOCK
// Runs through instructions
if (!getQueryVariable('skip_instructions')) {
	const instruct_pagesLoopScheduler = new Scheduler(psychoJS);
	flowScheduler.add(instruct_pagesLoopBegin, instruct_pagesLoopScheduler);
	flowScheduler.add(instruct_pagesLoopScheduler);
	flowScheduler.add(instruct_pagesLoopEndFirst);
}

// quit if user presses Cancel in dialog box:
dialogCancelScheduler.add(quitPsychoJS, '', false);

// Add Slides to resources
var resources = [
	{ name: 'practice_schedule.csv', path: '/js/tasks/rl_task/practice_schedule.csv' },
	{ name: 'PRACTICE_ready', path: '/js/tasks/rl_task/media/instructions/Slide16.JPG'},
	{ name: 'MAIN_ready1', path: '/js/tasks/rl_task/media/instructions/Slide17.JPG' },
	{ name: 'MAIN_ready2', path: '/js/tasks/rl_task/media/instructions/Slide18.JPG' },
	{ name: 'MAIN_ready3', path: '/js/tasks/rl_task/media/instructions/Slide19.JPG' },
	{ name: 'instr_check_items.csv', path: '/js/tasks/rl_task/media/instr_check.csv' },
	{ name: 'true_0', path: '/js/tasks/rl_task/media/true_opt_0.png' },
	{ name: 'true_1', path: '/js/tasks/rl_task/media/true_opt_1.png' },
	{ name: 'false_0', path: '/js/tasks/rl_task/media/false_opt_0.png' },
	{ name: 'false_1', path: '/js/tasks/rl_task/media/false_opt_1.png' },
	{ name: 'box', path: '/js/tasks/rl_task/media/box.gif' },
	{ name: 'outline', path: '/js/tasks/rl_task/media/outline.gif' }
]


var frameDur;
function updateInfo() {
	expInfo.date = util.MonotonicClock.getDateStr();  // add a simple timestamp
	expInfo.expName = expName;
	expInfo.psychopyVersion = '2021.2.3';
	expInfo.OS = window.navigator.platform;

	// store frame rate of monitor if we can measure it successfully
	expInfo.frameRate = psychoJS.window.getActualFrameRate();
	if (typeof expInfo.frameRate !== 'undefined')
		frameDur = 1.0 / Math.round(expInfo.frameRate);
	else
		frameDur = 1.0 / 60.0; // couldn't get a reliable measure so guess

	// add info from the URL:
	util.addInfoFromUrl(expInfo);

	return Scheduler.Event.NEXT;
}

var slideStim;
var slides;
var instructClock;

var kb;
var trialClock;
var toneClock;
var feedbackClock;
var respondClock;

// Stim from schedule
var low1
var mid1
var high1
var low2
var mid2
var high2
var low3
var mid3
var high3
var low4
var mid4
var high4
var low5
var mid5
var high5
var low6
var mid6
var high6
var low_score
var mid_score
var high_score
var box1
var box2
var box3
var out1
var out2
var out3
var exp_slider
var exp_slider_box
var exp_slider_txt_left
var exp_slider_txt_right
var exp_slider_txt
var exp_button
var exp_button_txt

var form_q1_txt
var form_q1_opt1
var form_q1_opt2
var form_q1_opf1
var form_q1_opf2
var form_q2_txt
var form_q2_opt1
var form_q2_opt2
var form_q2_opf1
var form_q2_opf2
var form_q3_txt
var form_q3_opt1
var form_q3_opt2
var form_q3_opf1
var form_q3_opf2
var form_submit

var instr_repeat_notice
var practice_repeat_notice

// timers
var t_end;
var readyClock;
var endClock;
var track;

var resp;
var thanksClock;
var thanksText;
var globalClock;
var routineTimer;


function experimentInit() {
	// Check if there is an practice
	if (getQueryVariable('practice') == 'true') {
		practice = true;
	}

	window_ratio = psychoJS.window.size[0]/psychoJS.window.size[1]
	
	// Initialize components for Routine "instruct"
	instructClock = new util.Clock();
	instructClock.reset()
	
	practice_repeat_notice = new visual.TextStim({
		win: psychoJS.window,
		name: 'sbmt',
		text: 'You will need to restart the practice since you did not get enough correct answers.\n\nPlease press ENTER to continue.',
		font: 'Arial',
		units: 'height',
		pos: [0, 0], height: 0.03, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	instr_repeat_notice = new visual.TextStim({
		win: psychoJS.window,
		name: 'sbmt',
		text: 'That was incorrect. You will need to go through the instructions again.\n\nPlease press ENTER to continue.',
		font: 'Arial',
		units: 'height',
		pos: [0, 0], height: 0.03, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	form_submit = new visual.TextStim({
		win: psychoJS.window,
		name: 'sbmt',
		text: 'Press ENTER to confirm answers',
		font: 'Arial',
		units: 'height',
		pos: [0, -0.1], height: 0.02, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});
		
	form_q1_txt = new visual.TextStim({
		win: psychoJS.window,
		name: 'q1',
		text: 'Your final payoff will depend on your choices during the task:',
		font: 'Arial',
		units: 'height',
		pos: [-0.8, 0.3], height: 0.02, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0, alignHoriz: 'left'
	});

	form_q2_txt = new visual.TextStim({
		win: psychoJS.window,
		name: 'q2',
		text: 'In the second and third phases of the task, you will know the results of your choices on each trial:',
		font: 'Arial',
		units: 'height',
		pos: [-0.8, 0.2], height: 0.02, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0, alignHoriz: 'left'
	});

	form_q3_txt = new visual.TextStim({
		win: psychoJS.window,
		name: 'q3',
		text: 'The position where a picture appears determines its value:',
		font: 'Arial',
		units: 'height',
		pos: [-0.8, 0.1], height: 0.02, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0, alignHoriz: 'left'
	});

	form_q1_opt1 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'true_0', units : 'height', 
		image : 'true_0', mask : undefined,
		ori : 0, pos : [0.25, 0.3], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q1_opt2 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'true_1', units : 'height', 
		image : 'true_1', mask : undefined,
		ori : 0, pos : [0.25, 0.3], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q1_opf1 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'false_0', units : 'height', 
		image : 'false_0', mask : undefined,
		ori : 0, pos : [0.5, 0.3], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q1_opf2 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'false_1', units : 'height', 
		image : 'false_1', mask : undefined,
		ori : 0, pos : [0.5, 0.3], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q2_opt1 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'true_0', units : 'height', 
		image : 'true_0', mask : undefined,
		ori : 0, pos : [0.25, 0.2], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q2_opt2 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'true_1', units : 'height', 
		image : 'true_1', mask : undefined,
		ori : 0, pos : [0.25, 0.2], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q2_opf1 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'false_0', units : 'height', 
		image : 'false_0', mask : undefined,
		ori : 0, pos : [0.5, 0.2], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q2_opf2 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'false_1', units : 'height', 
		image : 'false_1', mask : undefined,
		ori : 0, pos : [0.5, 0.2], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q3_opt1 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'true_0', units : 'height', 
		image : 'true_0', mask : undefined,
		ori : 0, pos : [0.25, 0.1], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q3_opt2 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'true_1', units : 'height', 
		image : 'true_1', mask : undefined,
		ori : 0, pos : [0.25, 0.1], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q3_opf1 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'false_0', units : 'height', 
		image : 'false_0', mask : undefined,
		ori : 0, pos : [0.5, 0.1], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	form_q3_opf2 = new visual.ImageStim({
		win : psychoJS.window,
		name : 'false_1', units : 'height', 
		image : 'false_1', mask : undefined,
		ori : 0, pos : [0.5, 0.1], size: [0.0975,0.039],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	slideStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'slide_stim', units : 'height', 
		image : undefined, mask : undefined,
		ori : 0, pos : [0, 0],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	readyStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'ready_stim', units : 'height', 
		image : 'PRACTICE_ready', mask : undefined,
		ori : 0, pos : [0, 0],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});
	

	kb = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	// Initialize components for Routine "trial"
	trialClock = new util.Clock();
	toneClock = new util.Clock();
	feedbackClock = new util.Clock();
	respondClock = new util.Clock();

	endClock = new util.Clock();

	resp = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	// Initiali comnponenents for Routine 'read'y
	readyClock = new util.Clock();
	// Initialize components for Routine "thanks"
	thanksClock = new util.Clock();
	thanksText = new visual.TextStim({
		win: psychoJS.window,
		name: 'thanksText',
		text: 'This is the end of the task run. Please wait for the upcoming survey and for all task data to be saved.\n This may take a while, so please be patient.\n There will be no payment if you do not progress to the follow-up page containg the submission code.\n Thank you!',
		font: 'Arial',
		units: 'height',
		pos: [0, 0], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	// Create some handy timers
	globalClock = new util.Clock();  // to track the time since experiment started
	routineTimer = new util.CountdownTimer();  // to track time remaining of each (non-slip) routine

	globalClock.reset() // start Global Clock

	mark_event(trials_data, globalClock, 'NA', 'NA', event_types['TASK_ONSET'],
				'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

/**
 * Reset the Stims back to their intiaiization configurations
 */
function instruct_pagesLoopBegin(thisScheduler) {
	// set up handler to look up the conditions

	
	slides = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'instruct_schedule_p.csv',
		seed: undefined, name: 'slides'
	});
	
	psychoJS.experiment.addLoop(slides); // add the loop to the experiment
	currentLoop = slides;  // we're now the current loop

	const snapshot = slides.getSnapshot();
	thisScheduler.add(importConditions(snapshot));
	thisScheduler.add(instructRoutineBegin(snapshot));
	thisScheduler.add(instructSlideRoutineEachFrame(snapshot, slides));
	thisScheduler.add(instructRoutineEnd(snapshot));
	thisScheduler.add(endLoopIteration(thisScheduler, snapshot));

	block_type = 'INSTRUCTIONS'
	mark_event(trials_data, globalClock, 0, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')

	return Scheduler.Event.NEXT;
}
function instruct_pagesLoopBegin1(thisScheduler) {
	// set up handler to look up the conditions
	
	slides = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'instruct_schedule_1.csv',
		seed: undefined, name: 'slides'
	});
	
	psychoJS.experiment.addLoop(slides); // add the loop to the experiment
	currentLoop = slides;  // we're now the current loop

	const snapshot = slides.getSnapshot();
	thisScheduler.add(importConditions(snapshot));
	thisScheduler.add(instructRoutineBegin(snapshot));
	thisScheduler.add(instructSlideRoutineEachFrame(snapshot, slides));
	thisScheduler.add(instructRoutineEnd(snapshot));
	thisScheduler.add(endLoopIteration(thisScheduler, snapshot));

	block_type = 'INSTRUCTIONS'
	mark_event(trials_data, globalClock, 0, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')

	return Scheduler.Event.NEXT;
}
function instruct_pagesLoopBegin2(thisScheduler) {
	// set up handler to look up the conditions
	
	slides = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'instruct_schedule_2.csv',
		seed: undefined, name: 'slides'
	});
	
	psychoJS.experiment.addLoop(slides); // add the loop to the experiment
	currentLoop = slides;  // we're now the current loop

	const snapshot = slides.getSnapshot();
	thisScheduler.add(importConditions(snapshot));
	thisScheduler.add(instructRoutineBegin(snapshot));
	thisScheduler.add(instructSlideRoutineEachFrame(snapshot, slides));
	thisScheduler.add(instructRoutineEnd(snapshot));
	thisScheduler.add(endLoopIteration(thisScheduler, snapshot));

	block_type = 'INSTRUCTIONS'
	mark_event(trials_data, globalClock, 0, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')

	return Scheduler.Event.NEXT;
}
function instruct_pagesLoopBegin3(thisScheduler) {
	// set up handler to look up the conditions
	
	slides = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'instruct_schedule_3.csv',
		seed: undefined, name: 'slides'
	});
	
	psychoJS.experiment.addLoop(slides); // add the loop to the experiment
	currentLoop = slides;  // we're now the current loop

	const snapshot = slides.getSnapshot();
	thisScheduler.add(importConditions(snapshot));
	thisScheduler.add(instructRoutineBegin(snapshot));
	thisScheduler.add(instructSlideRoutineEachFrame(snapshot, slides));
	thisScheduler.add(instructRoutineEnd(snapshot));
	thisScheduler.add(endLoopIteration(thisScheduler, snapshot));

	block_type = 'INSTRUCTIONS'
	mark_event(trials_data, globalClock, 0, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')

	return Scheduler.Event.NEXT;
}


var block_type;
var t;
var frameN;
var instructComponents;
var time_audio_end;
function instructRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'instruct'-------
		t = 0;
		instructClock.reset(); // clock
		frameN = -1;
		slideStim.setImage(instruct_slide)
		// update component parameters for each repeat
		kb.keys = undefined;
		kb.rt = undefined;
		// keep track of which components have finished
		instructComponents = [ slideStim];
	
		instructComponents.push(kb);

		instruct_prev_pressed = false
		
		if (audio_path) {
			track = new Sound({
				win: psychoJS.window,
				value: audio_path
			  });
			time_audio_end = t + track.getDuration()
			track.setVolume(1.0);
			track.play();
			mark_event(trials_data, globalClock, trials.thisIndex, block_type, event_types['AUDIO_ONSET'],
				'NA', instruct_slide, audio_path)
		}

		for (const thisComponent of instructComponents)
			if ('status' in thisComponent)
				thisComponent.status = PsychoJS.Status.NOT_STARTED;

		return Scheduler.Event.NEXT;
	};
}

var newSlide;
var instruct_prev_pressed = false
function instructSlideRoutineEachFrame(trials, slides) {
	return function () {
		//------Loop for each frame of Routine 'instruct'-------
		let continueRoutine = true; // until we're told otherwise
		// get current time
		t = instructClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
		// update/draw components on each frame

		// *instrText1* updates
		if (t >= 0 && slideStim.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			slideStim.tStart = t;  // (not accounting for frame time here)
			slideStim.frameNStart = frameN;  // exact frame index
			slideStim.setAutoDraw(true);
		}

		// New Slide Call, set it after pressing key
		if (newSlide) {
			console.log('setting new image', instruct_slide, 'index:',trials.thisIndex, 'Audio: ',audio_path)
			slideStim.setImage(instruct_slide)
			newSlide = false

			if (audio_path && !instruct_prev_pressed) {
				
				if (track && (track.status != PsychoJS.Status.NOT_STARTED) ) {
					track.stop()
					track = new Sound({
						win: psychoJS.window,
						value: audio_path
					});
					time_audio_end = t + track.getDuration()
					track.setVolume(1.0);
					track.play();
				} else {
					track = new Sound({
						win: psychoJS.window,
						value: audio_path
					});
					time_audio_end = t + track.getDuration()
					track.setVolume(1.0);
					track.play();
				}
			}
				
		}
		// *ready* updates
		if (t >= 0 && kb.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			kb.tStart = t;  // (not accounting for frame time here)
			kb.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			psychoJS.window.callOnFlip(function () { kb.clock.reset(); });  // t=0 on next screen flip
			psychoJS.window.callOnFlip(function () { kb.start(); }); // start on screen flip
			psychoJS.window.callOnFlip(function () { kb.clearEvents(); });
		}

		if (kb.status === PsychoJS.Status.STARTED) {

			let theseKeys = kb.getKeys({ keyList: ['right', 'left', 'z'], waitRelease: false });

			
			// Force Progression
			if (theseKeys.length > 0 && theseKeys[0].name == 'z') {  // at least one key was pressed

				slides.thisIndex++ // incremenet the index
				if (slides.thisIndex >= slides.nTotal) {
					// if we reached here, it means we reached the last and we should move on.
					continueRoutine = false 
				}
				trials = slides.getSnapshot() // get new snapshot after incrementing index
				psychoJS.importAttributes(trials.getCurrentTrial()); // import the attributes to main class
				newSlide = true
			}

			if (theseKeys.length > 0 && theseKeys[0].name == 'right') {  // at least one key was pressed
				// Verify if the audio has beend played
				instruct_prev_pressed = false
				if (audio_path && (t <= time_audio_end)) {
					return Scheduler.Event.FLIP_REPEAT;
				}
				
				slides.thisIndex++ // incremenet the index
				if (slides.thisIndex >= slides.nTotal) {
					// if we reached here, it means we reached the last and we should move on.
					continueRoutine = false 
				}
				trials = slides.getSnapshot() // get new snapshot after incrementing index
				psychoJS.importAttributes(trials.getCurrentTrial()); // import the attributes to main class
				newSlide = true
			}
			if (theseKeys.length > 0 && theseKeys[0].name == 'left') {
				// Presse the back button
				instruct_prev_pressed = true
				// Verify if the audio has beend played
				if (audio_path && (t <= time_audio_end)) {
					return Scheduler.Event.FLIP_REPEAT;
				}
				slides.thisIndex-- // decremenet the index
				if (slides.thisIndex < 0) {
					// If the index is 0, that means we reached the very first slide
					slides.thisIndex = 0
				} else {
					trials = slides.getSnapshot() 
					psychoJS.importAttributes(trials.getCurrentTrial());
					newSlide = true
				}
			}
		}

		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// check if the Routine should terminate
		if (!continueRoutine) {  // a component has requested a forced-end of Routine
			return Scheduler.Event.NEXT;
		}

		continueRoutine = false;  // reverts to True if at least one component still running
		for (const thisComponent of instructComponents)
			if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
				continueRoutine = true;
				break;
			}

		// refresh the screen if continuing
		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
			return Scheduler.Event.NEXT;
		}
	};
}

function instructRoutineEnd(trials) {
	return function () {
		//------Ending Routine 'instruct'-------
		for (const thisComponent of instructComponents) {
			if (typeof thisComponent.setAutoDraw === 'function') {
				thisComponent.setAutoDraw(false);
			}
		}
		// the Routine "instruct" was not non-slip safe, so reset the non-slip timer
		routineTimer.reset();

		return Scheduler.Event.NEXT;
	};
}

var readyComponents;
var readyStim;
function readyRoutineBegin(block_type) {
	return function () {
		//------Prepare to start Routine 'ready'-------
		t = 0;
		psychoJS.eventManager.clearEvents()
		readyClock.reset(); // clock
		frameN = -1;

		// Set readyStim based on block_type
		switch (block_type) {
			case 'PRACTICE':
				readyStim = new visual.ImageStim({
					win : psychoJS.window,
					name : 'ready_stim', units : 'height', 
					image : 'PRACTICE_ready', mask : undefined,
					ori : 0, pos : [0, 0],
					color : new util.Color([1, 1, 1]), opacity : 1,
					flipHoriz : false, flipVert : false,
					texRes : 128, interpolate : true, depth : 0
				});
				break
			case 'LEARN':
				readyStim = new visual.ImageStim({
					win : psychoJS.window,
					name : 'ready_stim', units : 'height', 
					image : 'MAIN_ready1', mask : undefined,
					ori : 0, pos : [0, 0],
					color : new util.Color([1, 1, 1]), opacity : 1,
					flipHoriz : false, flipVert : false,
					texRes : 128, interpolate : true, depth : 0
				});
				break
			case 'TEST':
				readyStim = new visual.ImageStim({
					win : psychoJS.window,
					name : 'break_stim', units : 'height', 
					image : 'MAIN_ready2', mask : undefined,
					ori : 0, pos : [0, 0],
					color : new util.Color([1, 1, 1]), opacity : 1,
					flipHoriz : false, flipVert : false,
					texRes : 128, interpolate : true, depth : 0
				});
				break
			case 'EXPL':
				readyStim = new visual.ImageStim({
					win : psychoJS.window,
					name : 'break_stim', units : 'height', 
					image : 'MAIN_ready3', mask : undefined,
					ori : 0, pos : [0, 0],
					color : new util.Color([1, 1, 1]), opacity : 1,
					flipHoriz : false, flipVert : false,
					texRes : 128, interpolate : true, depth : 0
				});
				break
			default:
				readyStim = new visual.ImageStim({
					win: psychoJS.window,
					name: 'ready_stim', units: 'height',
					image: 'MAIN_ready1', mask: undefined,
					ori: 0, pos: [0, 0],
					color: new util.Color([1, 1, 1]), opacity: 1,
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				track = undefined;
		}
		
		mark_event(trials_data, globalClock, 0, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')
	
		routineTimer.add(2.000000);
		// update component parameters for each repeat
		// keep track of which components have finished
		readyComponents = [readyStim];
		readyStim.setAutoDraw(true)
		resp.clearEvents()
		return Scheduler.Event.NEXT;
	};
}

function readyRoutineEachFrame() {
	return function () {
		//------Loop for each frame of Routine 'ready'-------
		let continueRoutine = true; // until we're told otherwise
		// get current time
		t = readyClock.getTime();
		if (resp.status == PsychoJS.Status.NOT_STARTED) {
			resp.start()

			if (track) {
				console.log('ready track: ',track)
				track.play()
			}
		}
	
		// update/draw components on each frame
		let theseKeys = resp.getKeys({ keyList: [RIGHT_KEY, 'right'], waitRelease: false });
		if (theseKeys.length > 0) {
			if(track) track.stop();
			continueRoutine = false
		}

		// check for quit (typically the Esc key)
		if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}
		// refresh the screen if continuing
		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
			resp.stop()
			return Scheduler.Event.NEXT;
		}
	};
}

function readyRoutineEnd(trials) {
	
	return function () {
		//------Ending Routine 'ready'-------
		for (const thisComponent of readyComponents) {
			if (typeof thisComponent.setAutoDraw === 'function') {
				thisComponent.setAutoDraw(false);
			}
		}
		return Scheduler.Event.NEXT;
	};
}


var trials;
var currentLoop;
var trial_type;
var current_block_size;
var correct_count_practice = 0;
function practiceTrialsLoopBegin(thisScheduler) {

	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'practice_schedule.csv',
		seed: undefined, name: 'trials'
	});

	last_trial_num = trials.nTotal
	current_block_size = config_values.practice_block_size

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop
	total_score = 0
	
	endClock.reset()
	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED
	init_fixation_flag = true
	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot));
		thisScheduler.add(trialRoutineRespond(snapshot));
		thisScheduler.add(trialRoutineEndPractice(snapshot));
		thisScheduler.add(endLoopIterationPractice(thisScheduler, snapshot));
	}
	trial_type = 'PRACTICE'
	correct_count_practice = 0
	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['BLOCK_ONSET'],
				'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

function shuffle(array) {
	let counter = array.length;

	/* While there are elements in the array */
	while (counter > 0) {
		/* Pick a random index */
		let index = Math.floor(Math.random() * counter);

		/* Decrease counter by 1 */
		counter--;

		/* And swap the last element with it */
		let temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}

	return array;
}; /* function shuffle(array) */

function randomGaussian(mean, standardDeviation) {

	var continuous_reward;

	if (randomGaussian.nextGaussian !== undefined) {
		var nextGaussian = randomGaussian.nextGaussian;
		delete randomGaussian.nextGaussian;
		continuous_reward = Math.round((nextGaussian * standardDeviation) + mean);
	} else {
		var v1, v2, s, multiplier;
		do {
			v1 = 2 * Math.random() - 1; // between -1 and 1
			v2 = 2 * Math.random() - 1; // between -1 and 1
			s = v1 * v1 + v2 * v2;
		} while (s >= 1 || s == 0);
		multiplier = Math.sqrt(-2 * Math.log(s) / s);
		randomGaussian.nextGaussian = v2 * multiplier;
		continuous_reward = Math.round((v1 * multiplier * standardDeviation) + mean);	        
	}
	if (continuous_reward > 99){
		continuous_reward = 99;
	} else if (continuous_reward < 1) {
		continuous_reward = 1;
	}
	return continuous_reward;
}; /* function randomGaussian(mean, standardDeviation) */

function trialsLoopBegin(thisScheduler) {

	endClock.reset()

	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED

	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule.xls',
		seed: undefined, name: 'trials'
	});

	main_loop_count = 0
	last_trial_num = trials.nTotal
	current_block_size = config_values.block_size

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop
	total_score = 0

	init_fixation_flag = true

	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot));
		thisScheduler.add(trialRoutineRespond(snapshot));
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	trial_type = 'MAIN'
	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['BLOCK_ONSET'],
				'LEARNING', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

function trialsLoopBeginTesting(thisScheduler) {

	endClock.reset()

	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED

	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule_test.xls',
		seed: undefined, name: 'trials'
	});

	main_loop_count = 0
	last_trial_num = trials.nTotal
	current_block_size = config_values.block_size

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop
	// total_score = 0

	init_fixation_flag = true

	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(trialRoutineBeginTesting(snapshot));
		thisScheduler.add(trialRoutineRespondTesting(snapshot));
		thisScheduler.add(trialRoutineEndTesting(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	trial_type = 'MAIN'
	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['BLOCK_ONSET'],
				'TESTING', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

function trialsLoopBeginExplicit(thisScheduler) {

	endClock.reset()

	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED

	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule_explicit.xls',
		seed: undefined, name: 'trials'
	});

	main_loop_count = 0
	last_trial_num = trials.nTotal
	current_block_size = config_values.block_size

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop
	// total_score = 0

	init_fixation_flag = true

	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(trialRoutineBeginExplicit(snapshot));
		thisScheduler.add(trialRoutineRespondExplicit(snapshot));
		thisScheduler.add(trialRoutineEndExplicit(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	trial_type = 'MAIN'
	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['BLOCK_ONSET'],
				'EXPLICIT', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

function instruct_pagesLoopEnd() {
	psychoJS.experiment.removeLoop(slides);
	return Scheduler.Event.NEXT;
}

var not_drawn = true;
var form_enter_pressed = false;
var not_drawn = true
var first_sel_made = false
var second_sel_made = false
var third_sel_made = false
var answer1 = 0
var answer2 = 0
var answer3 = 0
var notice_given = false
var form_off = false
var events_not_cleared = true
var mouseHandleInstr = new core.Mouse({ win: psychoJS.window, name: 'stimPath' })
function instruct_pagesLoopEndFirst() {
	psychoJS.experiment.removeLoop(slides);

	if (resp.status === PsychoJS.Status.NOT_STARTED) {
		// keep track of start time/frame for later
		resp.tStart = t;  // (not accounting for frame time here)
		resp.frameNStart = frameN;  // exact frame index

		// keyboard checking is just starting
		resp.clock.reset();  // t=0 on next screen flip
		resp.start(); // start on screen flip
		resp.clearEvents();
	}

	// check for quit (typically the Esc key)
	if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
		return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
	}

	if (not_drawn) {
		form_q1_txt.setAutoDraw(true)
		form_q1_opt1.setAutoDraw(true)
		form_q1_opf1.setAutoDraw(true)
		form_q2_txt.setAutoDraw(true)
		form_q2_opt1.setAutoDraw(true)
		form_q2_opf1.setAutoDraw(true)
		form_q3_txt.setAutoDraw(true)
		form_q3_opt1.setAutoDraw(true)
		form_q3_opf1.setAutoDraw(true)
		form_submit.setAutoDraw(true)
		not_drawn = false
		if (config_values.practice == 'false') {
			form_q1_txt.setAutoDraw(false)
			form_q1_opt1.setAutoDraw(false)
			form_q1_opf1.setAutoDraw(false)
			form_q2_txt.setAutoDraw(false)
			form_q2_opt1.setAutoDraw(false)
			form_q2_opf1.setAutoDraw(false)
			form_q3_txt.setAutoDraw(false)
			form_q3_opt1.setAutoDraw(false)
			form_q3_opf1.setAutoDraw(false)
			form_submit.setAutoDraw(false)
			// Learning BLOCK
			// Ready Routine
			const instruct_pagesLoopScheduler1 = new Scheduler(psychoJS);
			flowScheduler.add(instruct_pagesLoopBegin1, instruct_pagesLoopScheduler1);
			flowScheduler.add(instruct_pagesLoopScheduler1);
			flowScheduler.add(instruct_pagesLoopEnd);
			flowScheduler.add(readyRoutineBegin('LEARN'));
			flowScheduler.add(readyRoutineEachFrame());
			flowScheduler.add(readyRoutineEnd());
			const trialsLoopScheduler_learning = new Scheduler(psychoJS);
			flowScheduler.add(trialsLoopBegin, trialsLoopScheduler_learning);
			flowScheduler.add(trialsLoopScheduler_learning);
			flowScheduler.add(trialsLoopEnd);
			flowScheduler.add(thanksRoutineBegin(1));
			flowScheduler.add(thanksRoutineEachFrame());
			flowScheduler.add(thanksRoutineEnd());
			// Testing BLOCK
			// Ready Routine
			const instruct_pagesLoopScheduler2 = new Scheduler(psychoJS);
			flowScheduler.add(instruct_pagesLoopBegin2, instruct_pagesLoopScheduler2);
			flowScheduler.add(instruct_pagesLoopScheduler2);
			flowScheduler.add(instruct_pagesLoopEnd);
			flowScheduler.add(readyRoutineBegin('TEST'));
			flowScheduler.add(readyRoutineEachFrame());
			flowScheduler.add(readyRoutineEnd());
			const trialsLoopScheduler_testing = new Scheduler(psychoJS);
			flowScheduler.add(trialsLoopBeginTesting, trialsLoopScheduler_testing);
			flowScheduler.add(trialsLoopScheduler_testing);
			flowScheduler.add(trialsLoopEnd);
			flowScheduler.add(thanksRoutineBegin(2));
			flowScheduler.add(thanksRoutineEachFrame());
			flowScheduler.add(thanksRoutineEnd());
			// Explicit BLOCK
			// Ready Routine
			const instruct_pagesLoopScheduler3 = new Scheduler(psychoJS);
			flowScheduler.add(instruct_pagesLoopBegin3, instruct_pagesLoopScheduler3);
			flowScheduler.add(instruct_pagesLoopScheduler3);
			flowScheduler.add(instruct_pagesLoopEnd);
			flowScheduler.add(readyRoutineBegin('EXPL'));
			flowScheduler.add(readyRoutineEachFrame());
			flowScheduler.add(readyRoutineEnd());
			// 
			const trialsLoopScheduler_explicit = new Scheduler(psychoJS);
			flowScheduler.add(trialsLoopBeginExplicit, trialsLoopScheduler_explicit);
			flowScheduler.add(trialsLoopScheduler_explicit);
			flowScheduler.add(trialsLoopEnd);
			flowScheduler.add(thanksRoutineBegin(3));
			flowScheduler.add(thanksRoutineEachFrame());
			flowScheduler.add(thanksRoutineEnd());
			flowScheduler.add(quitPsychoJS, '', true);
			return Scheduler.Event.NEXT;
		}
	}

	if (first_sel_made && second_sel_made && third_sel_made && events_not_cleared) {
		resp.clearEvents()
		events_not_cleared = false
	}

	if (first_sel_made && second_sel_made && third_sel_made && !form_enter_pressed) {
		let theseKeys = resp.getKeys({ keyList: ['return'], waitRelease: false, clearEvents: true });
		if (theseKeys.length > 0) {
			form_enter_pressed = true
		}
	}

	if (form_q1_opt1.contains(mouseHandleInstr) && !form_enter_pressed) {
		if (mouseHandleInstr.getPressed()[0] == 1) {
			form_q1_opt2.setAutoDraw(true)
			form_q1_opf2.setAutoDraw(false)
			first_sel_made = true
			answer1 = 1
		}
	}
	if (form_q1_opf1.contains(mouseHandleInstr) && !form_enter_pressed) {
		if (mouseHandleInstr.getPressed()[0] == 1) {
			form_q1_opt2.setAutoDraw(false)
			form_q1_opf2.setAutoDraw(true)
			first_sel_made = true
			answer1 = 2
		}
	}

	if (form_q2_opt1.contains(mouseHandleInstr) && !form_enter_pressed) {
		if (mouseHandleInstr.getPressed()[0] == 1) {
			form_q2_opt2.setAutoDraw(true)
			form_q2_opf2.setAutoDraw(false)
			second_sel_made = true
			answer2 = 1
		}
	}
	if (form_q2_opf1.contains(mouseHandleInstr) && !form_enter_pressed) {
		if (mouseHandleInstr.getPressed()[0] == 1) {
			form_q2_opt2.setAutoDraw(false)
			form_q2_opf2.setAutoDraw(true)
			second_sel_made = true
			answer2 = 2
		}
	}

	if (form_q3_opt1.contains(mouseHandleInstr) && !form_enter_pressed) {
		if (mouseHandleInstr.getPressed()[0] == 1) {
			form_q3_opt2.setAutoDraw(true)
			form_q3_opf2.setAutoDraw(false)
			third_sel_made = true
			answer3 = 1
		}
	}
	if (form_q3_opf1.contains(mouseHandleInstr) && !form_enter_pressed) {
		if (mouseHandleInstr.getPressed()[0] == 1) {
			form_q3_opt2.setAutoDraw(false)
			form_q3_opf2.setAutoDraw(true)
			third_sel_made = true
			answer3 = 2
		}
	}

	if (answer1 == 1 && answer2 == 2 && answer3 == 2 && form_enter_pressed) {
		form_q1_txt.setAutoDraw(false)
		form_q1_opt1.setAutoDraw(false)
		form_q1_opt2.setAutoDraw(false)
		form_q1_opf1.setAutoDraw(false)
		form_q1_opf2.setAutoDraw(false)
		form_q2_txt.setAutoDraw(false)
		form_q2_opt1.setAutoDraw(false)
		form_q2_opt2.setAutoDraw(false)
		form_q2_opf1.setAutoDraw(false)
		form_q2_opf2.setAutoDraw(false)
		form_q3_txt.setAutoDraw(false)
		form_q3_opt1.setAutoDraw(false)
		form_q3_opt2.setAutoDraw(false)
		form_q3_opf1.setAutoDraw(false)
		form_q3_opf2.setAutoDraw(false)
		form_submit.setAutoDraw(false)
		notice_given = true // true cause no need for notice
	} else if (!(answer1 == 1 && answer2 == 2 && answer3 == 2) && !form_off && form_enter_pressed) {
		form_q1_txt.setAutoDraw(false)
		form_q1_opt1.setAutoDraw(false)
		form_q1_opt2.setAutoDraw(false)
		form_q1_opf1.setAutoDraw(false)
		form_q1_opf2.setAutoDraw(false)
		form_q2_txt.setAutoDraw(false)
		form_q2_opt1.setAutoDraw(false)
		form_q2_opt2.setAutoDraw(false)
		form_q2_opf1.setAutoDraw(false)
		form_q2_opf2.setAutoDraw(false)
		form_q3_txt.setAutoDraw(false)
		form_q3_opt1.setAutoDraw(false)
		form_q3_opt2.setAutoDraw(false)
		form_q3_opf1.setAutoDraw(false)
		form_q3_opf2.setAutoDraw(false)
		form_submit.setAutoDraw(false)
		instr_repeat_notice.setAutoDraw(true)
		form_off = true
	}

	if (form_off && form_enter_pressed) {
		let theseKeys = resp.getKeys({ keyList: ['return'], waitRelease: false, clearEvents: true });
		console.log(theseKeys)
		if (theseKeys.length > 0) {
			instr_repeat_notice.setAutoDraw(false)
			notice_given = true
		}
	}

	if (!notice_given) {
		return Scheduler.Event.FLIP_REPEAT;
	} else {
		not_drawn = true

		if (answer1 == 1 && answer2 == 2 && answer3 == 2) {
			// Single Slide
			flowScheduler.add(readyRoutineBegin('PRACTICE'));
			flowScheduler.add(readyRoutineEachFrame());
			flowScheduler.add(readyRoutineEnd());
		
			const practiceTrialsLoopScheduler = new Scheduler(psychoJS);
			flowScheduler.add(practiceTrialsLoopBegin, practiceTrialsLoopScheduler);
			flowScheduler.add(practiceTrialsLoopScheduler);
			flowScheduler.add(trialsLoopEndPractice);
		} else {
			not_drawn = true;
			form_enter_pressed = false;
			// doitonce = true;
			not_drawn = true
			first_sel_made = false
			second_sel_made = false
			third_sel_made = false
			answer1 = 0
			answer2 = 0
			answer3 = 0
			notice_given = false
			form_off = false
			events_not_cleared = true
			const instruct_pagesLoopScheduler = new Scheduler(psychoJS);
			flowScheduler.add(instruct_pagesLoopBegin, instruct_pagesLoopScheduler);
			flowScheduler.add(instruct_pagesLoopScheduler);
			flowScheduler.add(instruct_pagesLoopEndFirst);
		}

		return Scheduler.Event.NEXT;
	}
}

// SHow the points in the trial 
function trialsLoopEnd() {
	slideStim.setAutoDraw(false)

	psychoJS.experiment.removeLoop(trials);

	psychoJS.experiment.addData('globalClock', globalClock.getTime());

	return Scheduler.Event.NEXT;
}
var first_end_practice_entry = true
// SHow the points in the trial 
function trialsLoopEndPractice() {
	if (first_end_practice_entry) {
		slideStim.setAutoDraw(false)

		psychoJS.experiment.removeLoop(trials);

		psychoJS.experiment.addData('globalClock', globalClock.getTime());
		if (correct_count_practice < 7) {
			practice_repeat_notice.setAutoDraw(true)
		}
		first_end_practice_entry = false
		resp.start()
		resp.clearEvents()
	}
	if (correct_count_practice >= 7) {
		// Learning BLOCK
		// Ready Routine
		const instruct_pagesLoopScheduler1 = new Scheduler(psychoJS);
		flowScheduler.add(instruct_pagesLoopBegin1, instruct_pagesLoopScheduler1);
		flowScheduler.add(instruct_pagesLoopScheduler1);
		flowScheduler.add(instruct_pagesLoopEnd);
		flowScheduler.add(readyRoutineBegin('LEARN'));
		flowScheduler.add(readyRoutineEachFrame());
		flowScheduler.add(readyRoutineEnd());
		const trialsLoopScheduler_learning = new Scheduler(psychoJS);
		flowScheduler.add(trialsLoopBegin, trialsLoopScheduler_learning);
		flowScheduler.add(trialsLoopScheduler_learning);
		flowScheduler.add(trialsLoopEnd);
		flowScheduler.add(thanksRoutineBegin(1));
		flowScheduler.add(thanksRoutineEachFrame());
		flowScheduler.add(thanksRoutineEnd());
		// Testing BLOCK
		// Ready Routine
		const instruct_pagesLoopScheduler2 = new Scheduler(psychoJS);
		flowScheduler.add(instruct_pagesLoopBegin2, instruct_pagesLoopScheduler2);
		flowScheduler.add(instruct_pagesLoopScheduler2);
		flowScheduler.add(instruct_pagesLoopEnd);
		flowScheduler.add(readyRoutineBegin('TEST'));
		flowScheduler.add(readyRoutineEachFrame());
		flowScheduler.add(readyRoutineEnd());
		const trialsLoopScheduler_testing = new Scheduler(psychoJS);
		flowScheduler.add(trialsLoopBeginTesting, trialsLoopScheduler_testing);
		flowScheduler.add(trialsLoopScheduler_testing);
		flowScheduler.add(trialsLoopEnd);
		flowScheduler.add(thanksRoutineBegin(2));
		flowScheduler.add(thanksRoutineEachFrame());
		flowScheduler.add(thanksRoutineEnd());
		// Explicit BLOCK
		// Ready Routine
		const instruct_pagesLoopScheduler3 = new Scheduler(psychoJS);
		flowScheduler.add(instruct_pagesLoopBegin3, instruct_pagesLoopScheduler3);
		flowScheduler.add(instruct_pagesLoopScheduler3);
		flowScheduler.add(instruct_pagesLoopEnd);
		flowScheduler.add(readyRoutineBegin('EXPL'));
		flowScheduler.add(readyRoutineEachFrame());
		flowScheduler.add(readyRoutineEnd());
		// 
		const trialsLoopScheduler_explicit = new Scheduler(psychoJS);
		flowScheduler.add(trialsLoopBeginExplicit, trialsLoopScheduler_explicit);
		flowScheduler.add(trialsLoopScheduler_explicit);
		flowScheduler.add(trialsLoopEnd);
		flowScheduler.add(thanksRoutineBegin(3));
		flowScheduler.add(thanksRoutineEachFrame());
		flowScheduler.add(thanksRoutineEnd());
		flowScheduler.add(quitPsychoJS, '', true);
		// return Scheduler.Event.NEXT;
	} else {
		let theseKeys = resp.getKeys({ keyList: ['return'], waitRelease: false});
		if (theseKeys.length > 0) {
			practice_repeat_notice.setAutoDraw(false)
		} else {
			return Scheduler.Event.FLIP_REPEAT;
		}
		// Single Slide
		flowScheduler.add(readyRoutineBegin('PRACTICE'));
		flowScheduler.add(readyRoutineEachFrame());
		flowScheduler.add(readyRoutineEnd());
		const practiceTrialsLoopScheduler = new Scheduler(psychoJS);
		flowScheduler.add(practiceTrialsLoopBegin, practiceTrialsLoopScheduler);
		flowScheduler.add(practiceTrialsLoopScheduler);
		flowScheduler.add(trialsLoopEndPractice);
	}

	first_end_practice_entry = true
	return Scheduler.Event.NEXT;
}

// Recursively set multiplier to find one that both keeps the images ratio and keeps it in the window
function resize_image(image, image_ratio, multiplier) {
	// check if it is not in window ratio (with a 10% tolerance)
	if ((image_ratio * multiplier) > (window_ratio - (window_ratio * 0.1))) {
		// decrease multiplier to try and get it in tolerance
		resize_image(image, image_ratio, multiplier - 0.015)
	}
	else {
		//set size of image
		image.size = [parseFloat((image_ratio * multiplier).toPrecision(4)), parseFloat(multiplier)]
	}
}

var pressed;
var last_trial_num = 0;
var pos_score_array = [];
var box_arr = []
var left_score_txt = 0
var center_score_txt = 0
var right_score_txt = 0
var to_undraw = []

function trialRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		t = 0;
		trialClock.reset(); // clock
		toneClock.reset(); // toneclock
		frameN = -1;

		var low_pos = 0
		var mid_pos = 0
		var hi_pos = 0
		var low_score_txt = 0
		var mid_score_txt = 0
		var high_score_txt = 0
		to_undraw = []

		let mean_dict = {
			"L1": L_mean, "M1": M_mean, "H1": H_mean, "L2": L_mean, "M2": M_mean, "H2": H_mean,
			"L3": L_mean, "M3": M_mean, "H3": H_mean, "L4": L_mean, "M4": M_mean, "H4": H_mean,
			"L5": L_mean, "M5": M_mean, "H5": H_mean, "L6": L_mean, "M6": M_mean, "H6": H_mean
		}
		let variance_dict = {
			"L1": L_variance, "M1": M_variance, "H1": H_variance, "L2": L_variance, "M2": M_variance, "H2": H_variance,
			"L3": L_variance, "M3": M_variance, "H3": H_variance, "L4": L_variance, "M4": M_variance, "H4": H_variance,
			"L5": L_variance, "M5": M_variance, "H5": H_variance, "L6": L_variance, "M6": M_variance, "H6": H_variance
		}

		let options_array = options.split("_")
		if (options_array.length == 3) {
			pos_score_array = shuffle([[options_array[0], randomGaussian(mean_dict[options_array[0]], variance_dict[options_array[0]])], [options_array[1], randomGaussian(mean_dict[options_array[1]], variance_dict[options_array[1]])], [options_array[2], randomGaussian(mean_dict[options_array[2]], variance_dict[options_array[2]])]])
		} else {
			pos_score_array = shuffle([[options_array[0], randomGaussian(mean_dict[options_array[0]], variance_dict[options_array[0]])], [options_array[1], randomGaussian(mean_dict[options_array[1]], variance_dict[options_array[1]])], ""])
		}

		if (pos_score_array[0] != "") {
			if (pos_score_array[0][0].includes("L")) {
				low_pos = [window_ratio * -0.25, 0]
				low_score_txt = pos_score_array[0][1]
			} else if (pos_score_array[0][0].includes("M")) {
				mid_pos = [window_ratio * -0.25, 0]
				mid_score_txt = pos_score_array[0][1]
			} else {
				hi_pos = [window_ratio * -0.25, 0]
				high_score_txt = pos_score_array[0][1]
			}
			left_score_txt = pos_score_array[0][1]
		}

		if (pos_score_array[1] != "") {
			if (pos_score_array[1][0].includes("L")) {
				low_pos = [window_ratio * 0, 0]
				low_score_txt = pos_score_array[1][1]
			} else if (pos_score_array[1][0].includes("M")) {
				mid_pos = [window_ratio * 0, 0]
				mid_score_txt = pos_score_array[1][1]
			} else {
				hi_pos = [window_ratio * 0, 0]
				high_score_txt = pos_score_array[1][1]
			}
			center_score_txt = pos_score_array[1][1]
		}

		if (pos_score_array[2] != "") {
			if (pos_score_array[2][0].includes("L")) {
				low_pos = [window_ratio * 0.25, 0]
				low_score_txt = pos_score_array[2][1]
			} else if (pos_score_array[2][0].includes("M")) {
				mid_pos = [window_ratio * 0.25, 0]
				mid_score_txt = pos_score_array[2][1]
			} else {
				hi_pos = [window_ratio * 0.25, 0]
				high_score_txt = pos_score_array[2][1]
			}
			right_score_txt = pos_score_array[2][1]
		}

		low_score = new visual.TextStim({
			win: psychoJS.window,
			name: 'thanksText',
			text: low_score_txt,
			font: 'Arial',
			units: 'height',
			pos: low_pos, height: 0.05, wrapWidth: undefined, ori: 0,
			color: new util.Color('black'), opacity: 1,
			depth: 0.0
		});
		mid_score = new visual.TextStim({
			win: psychoJS.window,
			name: 'thanksText',
			text: mid_score_txt,
			font: 'Arial',
			units: 'height',
			pos: mid_pos, height: 0.05, wrapWidth: undefined, ori: 0,
			color: new util.Color('black'), opacity: 1,
			depth: 0.0
		});
		high_score = new visual.TextStim({
			win: psychoJS.window,
			name: 'thanksText',
			text: high_score_txt,
			font: 'Arial',
			units: 'height',
			pos: hi_pos, height: 0.05, wrapWidth: undefined, ori: 0,
			color: new util.Color('black'), opacity: 1,
			depth: 0.0
		});
		box1 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'box', mask: undefined,
			ori: 0, pos: [window_ratio * -0.25, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		box2 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'box', mask: undefined,
			ori: 0, pos: [window_ratio * 0, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		box3 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'box', mask: undefined,
			ori: 0, pos: [window_ratio * 0.25, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		box_arr = [box1, box2, box3]
		out1 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'outline', mask: undefined,
			ori: 0, pos: [window_ratio * -0.25, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		out2 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'outline', mask: undefined,
			ori: 0, pos: [window_ratio * 0, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		out3 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'outline', mask: undefined,
			ori: 0, pos: [window_ratio * 0.25, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		
		
		// Stimuli
		if (options.includes('1')) {
			if (options.includes("L")) {
				low1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L1_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low1.setAutoDraw(true)
				to_undraw.push(low1)
			}
			if (options.includes("M")) {
				mid1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M1_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid1.setAutoDraw(true)
				to_undraw.push(mid1)
			}
			if (options.includes("H")) {
				high1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H1_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high1.setAutoDraw(true)
				to_undraw.push(high1)
			}
		} else if (options.includes('3')) {
			if (options.includes("L")) {
				low3 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L3_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low3.setAutoDraw(true)
				to_undraw.push(low3)
			}
			if (options.includes("M")) {
				mid3 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M3_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid3.setAutoDraw(true)
				to_undraw.push(mid3)
			}
			if (options.includes("H")) {
				high3 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H3_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high3.setAutoDraw(true)
				to_undraw.push(high3)
			}
		} else if (options.includes('4')) {
			if (options.includes("L")) {
				low4 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L4_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low4.setAutoDraw(true)
				to_undraw.push(low4)
			}
			if (options.includes("M")) {
				mid4 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M4_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid4.setAutoDraw(true)
				to_undraw.push(mid4)
			}
			if (options.includes("H")) {
				high4 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H4_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high4.setAutoDraw(true)
				to_undraw.push(high4)
			}
		} else if (options.includes('5')) {
			if (options.includes("L")) {
				low5 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L5_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low5.setAutoDraw(true)
				to_undraw.push(low5)
			}
			if (options.includes("M")) {
				mid5 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M5_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid5.setAutoDraw(true)
				to_undraw.push(mid5)
			}
			if (options.includes("H")) {
				high5 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H5_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high5.setAutoDraw(true)
				to_undraw.push(high5)
			}
		} else if (options.includes('6')) {
			if (options.includes("L")) {
				low6 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L6_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low6.setAutoDraw(true)
				to_undraw.push(low6)
			}
			if (options.includes("M")) {
				mid6 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M6_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid6.setAutoDraw(true)
				to_undraw.push(mid6)
			}
			if (options.includes("H")) {
				high6 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H6_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high6.setAutoDraw(true)
				to_undraw.push(high6)
			}
		} else {
			if (options.includes("L")) {
				low2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L2_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low2.setAutoDraw(true)
				to_undraw.push(low2)
			}
			if (options.includes("M")) {
				mid2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M2_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid2.setAutoDraw(true)
				to_undraw.push(mid2)
			}
			if (options.includes("H")) {
				high2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H2_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high2.setAutoDraw(true)
				to_undraw.push(high2)
			}
		}
		let pos_to_mark = []
		console.log(pos_score_array)
		pos_score_array.forEach((item) => {
			if (item === "") {
				pos_to_mark.push("NA")
			} else {
				pos_to_mark.push(item)
			}
		})
		console.log(pos_to_mark)
		mark_event(trials_data, globalClock, trials.thisIndex, 'NA', event_types['TRIAL_ONSET'],
				'NA', 'NA', pos_to_mark[0] + "_" + pos_to_mark[1] + "_" + pos_to_mark[2])

		pressed = false

		return Scheduler.Event.NEXT;
	};
}

/**
 * Respond Routine
 * @param {*} trials 
 * @returns 
 */
function trialRoutineRespond(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise	
		let score_to_mark = 0
	
		// get current time
		t = respondClock.getTime();

		if (resp.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			resp.tStart = t;  // (not accounting for frame time here)
			resp.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			resp.clock.reset();  // t=0 on next screen flip
			resp.start(); // start on screen flip
			resp.clearEvents();
		}

		let theseKeys = resp.getKeys({ keyList: keyList, waitRelease: false });
		if (theseKeys.length > 0 && !pressed) {
			//console.log("key press")
			resp.keys = theseKeys[0].name;  // just the last key pressed
			resp.rt = theseKeys[0].rt;

			if (resp.keys == LEFT_KEY && pos_score_array[0] != "") {
				pressed = true
				mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['CHOICE'],
				resp.rt, 'left', 'NA')
				feedbackClock.reset()
				let ix = 0
				pos_score_array.forEach((arr) => {
					if (arr != "") {
						box_arr[ix].setAutoDraw(true)
					}
					ix ++
				})
				out1.setAutoDraw(true)
				low_score.setAutoDraw(true)
				mid_score.setAutoDraw(true)
				high_score.setAutoDraw(true)

				total_score += parseFloat(left_score_txt)
				score_to_mark = left_score_txt
				correct_count_practice += 1
				console.log(correct_count_practice)

			} else if (resp.keys == UP_KEY && pos_score_array[1] != "") {
				pressed = true
				mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['CHOICE'],
				resp.rt, 'middle', 'NA')
				feedbackClock.reset()
				let ix = 0
				pos_score_array.forEach((arr) => {
					if (arr != "") {
						box_arr[ix].setAutoDraw(true)
					}
					ix ++
				})
				out2.setAutoDraw(true)
				low_score.setAutoDraw(true)
				mid_score.setAutoDraw(true)
				high_score.setAutoDraw(true)

				total_score += parseFloat(center_score_txt)
				score_to_mark = center_score_txt
				correct_count_practice += 1
				console.log(correct_count_practice)

			} else if (resp.keys == RIGHT_KEY && pos_score_array[2] != "") {
				pressed = true
				mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['CHOICE'],
				resp.rt, 'right', 'NA')
				feedbackClock.reset()
				let ix = 0
				pos_score_array.forEach((arr) => {
					if (arr != "") {
						box_arr[ix].setAutoDraw(true)
					}
					ix ++
				})
				out3.setAutoDraw(true)
				low_score.setAutoDraw(true)
				mid_score.setAutoDraw(true)
				high_score.setAutoDraw(true)

				total_score += parseFloat(right_score_txt)
				score_to_mark = right_score_txt
				correct_count_practice += 1
				console.log(correct_count_practice)

			}
			mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FEEDBACK'],
					'NA', total_score, score_to_mark)
		}

		if (pressed && feedbackClock.getTime() >= parseFloat(config_values.learning_fb_duration)) {
			continueRoutine = false
		}

		// check if the Routine should terminate
		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
			to_undraw.forEach((stim) => {
				stim.setAutoDraw(false)
			})

			box1.setAutoDraw(false)
			box2.setAutoDraw(false)
			box3.setAutoDraw(false)
			out1.setAutoDraw(false)
			out2.setAutoDraw(false)
			out3.setAutoDraw(false)
			low_score.setAutoDraw(false)
			mid_score.setAutoDraw(false)
			high_score.setAutoDraw(false)

			endClock.reset()
			return Scheduler.Event.NEXT;
		}
	};
}

function trialRoutineBeginTesting(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		t = 0;
		trialClock.reset(); // clock
		toneClock.reset(); // toneclock
		frameN = -1;

		var low_pos = 0
		var mid_pos = 0
		var hi_pos = 0
		var low_pos2 = 0
		var mid_pos2 = 0
		var hi_pos2 = 0
		var low_score_txt = 0
		var mid_score_txt = 0
		var high_score_txt = 0
		var low_score_txt2 = 0
		var mid_score_txt2 = 0
		var high_score_txt2 = 0
		to_undraw = []

		let mean_dict = {
      "L1": L_mean, "M1": M_mean, "H1": H_mean, "L2": L_mean, "M2": M_mean, "H2": H_mean,
      "L3": L_mean, "M3": M_mean, "H3": H_mean, "L4": L_mean, "M4": M_mean, "H4": H_mean,
			"L5": L_mean, "M5": M_mean, "H5": H_mean, "L6": L_mean, "M6": M_mean, "H6": H_mean
		}
		let variance_dict = {
      "L1": L_variance, "M1": M_variance, "H1": H_variance, "L2": L_variance, "M2": M_variance, "H2": H_variance,
      "L3": L_variance, "M3": M_variance, "H3": H_variance, "L4": L_variance, "M4": M_variance, "H4": H_variance,
			"L5": L_variance, "M5": M_variance, "H5": H_variance, "L6": L_variance, "M6": M_variance, "H6": H_variance
		}

		let options_array = options.split("_")
		if (options_array.length == 3) {
			// switch lines to shuffle positions
			// pos_score_array = shuffle([[options_array[0], randomGaussian(mean_dict[options_array[0]], variance_dict[options_array[0]])], [options_array[1], randomGaussian(mean_dict[options_array[1]], variance_dict[options_array[1]])], [options_array[2], randomGaussian(mean_dict[options_array[2]], variance_dict[options_array[2]])]])
			pos_score_array = [[options_array[0], randomGaussian(mean_dict[options_array[0]], variance_dict[options_array[0]])], [options_array[1], randomGaussian(mean_dict[options_array[1]], variance_dict[options_array[1]])], [options_array[2], randomGaussian(mean_dict[options_array[2]], variance_dict[options_array[2]])]]
		} else {
			// switch lines to shuffle positions
			// pos_score_array = shuffle([[options_array[0], randomGaussian(mean_dict[options_array[0]], variance_dict[options_array[0]])], [options_array[1], randomGaussian(mean_dict[options_array[1]], variance_dict[options_array[1]])], ""])
			pos_score_array = [[options_array[0], randomGaussian(mean_dict[options_array[0]], variance_dict[options_array[0]])], "", [options_array[1], randomGaussian(mean_dict[options_array[1]], variance_dict[options_array[1]])]]
		}

		if (pos_score_array[0] != "") {
			if (pos_score_array[0][0].includes("L1") || pos_score_array[0][0].includes("L5") || pos_score_array[0][0].includes("L3")) {
				low_pos = [window_ratio * -0.15, 0]
				low_score_txt = pos_score_array[0][1]
			} else if (pos_score_array[0][0].includes("L2") || pos_score_array[0][0].includes("L6") || pos_score_array[0][0].includes("L4")) {
				low_pos2 = [window_ratio * -0.15, 0]
				low_score_txt2 = pos_score_array[0][1]
			} else if (pos_score_array[0][0].includes("M1") || pos_score_array[0][0].includes("M5") || pos_score_array[0][0].includes("M3")) {
				mid_pos = [window_ratio * -0.15, 0]
				mid_score_txt = pos_score_array[0][1]
			} else if (pos_score_array[0][0].includes("M2") || pos_score_array[0][0].includes("M6") || pos_score_array[0][0].includes("M4")) {
				mid_pos2 = [window_ratio * -0.15, 0]
				mid_score_txt2 = pos_score_array[0][1]
			} else if (pos_score_array[0][0].includes("H1") || pos_score_array[0][0].includes("H5") || pos_score_array[0][0].includes("H3")) {
				hi_pos = [window_ratio * -0.15, 0]
				high_score_txt = pos_score_array[0][1]
			} else {
				hi_pos2 = [window_ratio * -0.15, 0]
				high_score_txt2 = pos_score_array[0][1]
			}
			left_score_txt = pos_score_array[0][1]
		}

		if (pos_score_array[1] != "") {
			if (pos_score_array[1][0].includes("L1") || pos_score_array[0][0].includes("L5") || pos_score_array[0][0].includes("L3")) {
				low_pos = [window_ratio * 0, 0]
				low_score_txt = pos_score_array[1][1]
			} else if (pos_score_array[1][0].includes("L2") || pos_score_array[0][0].includes("L6") || pos_score_array[0][0].includes("L4")) {
				low_pos2 = [window_ratio * 0, 0]
				low_score_txt2 = pos_score_array[1][1]
			} else if (pos_score_array[1][0].includes("M1") || pos_score_array[0][0].includes("M5") || pos_score_array[0][0].includes("M3")) {
				mid_pos = [window_ratio * 0, 0]
				mid_score_txt = pos_score_array[1][1]
			} else if (pos_score_array[1][0].includes("M2") || pos_score_array[0][0].includes("M6") || pos_score_array[0][0].includes("M4")) {
				mid_pos2 = [window_ratio * 0, 0]
				mid_score_txt2 = pos_score_array[1][1]
			} else if (pos_score_array[1][0].includes("H1") || pos_score_array[0][0].includes("H5") || pos_score_array[0][0].includes("H3")) {
				hi_pos = [window_ratio * 0, 0]
				high_score_txt = pos_score_array[1][1]
			} else {
				hi_pos2 = [window_ratio * 0, 0]
				high_score_txt2 = pos_score_array[1][1]
			}
			center_score_txt = pos_score_array[1][1]
		}

		if (pos_score_array[2] != "") {
			if (pos_score_array[2][0].includes("L1") || pos_score_array[2][0].includes("L5") || pos_score_array[2][0].includes("L3")) {
				low_pos = [window_ratio * 0.15, 0]
				low_score_txt = pos_score_array[2][1]
			} else if (pos_score_array[2][0].includes("L2") || pos_score_array[2][0].includes("L6") || pos_score_array[2][0].includes("L4")) {
				low_pos2 = [window_ratio * 0.15, 0]
				low_score_txt2 = pos_score_array[2][1]
			} else if (pos_score_array[2][0].includes("M1") || pos_score_array[2][0].includes("M5") || pos_score_array[2][0].includes("M3")) {
				mid_pos = [window_ratio * 0.15, 0]
				mid_score_txt = pos_score_array[2][1]
			} else if (pos_score_array[2][0].includes("M2") || pos_score_array[2][0].includes("M6") || pos_score_array[2][0].includes("M4")) {
				mid_pos2 = [window_ratio * 0.15, 0]
				mid_score_txt2 = pos_score_array[2][1]
			} else if (pos_score_array[2][0].includes("H1") || pos_score_array[2][0].includes("H5") || pos_score_array[2][0].includes("H3")) {
				hi_pos = [window_ratio * 0.15, 0]
				high_score_txt = pos_score_array[2][1]
			} else {
				hi_pos2 = [window_ratio * 0.15, 0]
				high_score_txt2 = pos_score_array[2][1]
			}
			right_score_txt = pos_score_array[2][1]
		}

		low_score = new visual.TextStim({
			win: psychoJS.window,
			name: 'thanksText',
			text: low_score_txt,
			font: 'Arial',
			units: 'height',
			pos: low_pos, height: 0.05, wrapWidth: undefined, ori: 0,
			color: new util.Color('black'), opacity: 1,
			depth: 0.0
		});
		mid_score = new visual.TextStim({
			win: psychoJS.window,
			name: 'thanksText',
			text: mid_score_txt,
			font: 'Arial',
			units: 'height',
			pos: mid_pos, height: 0.05, wrapWidth: undefined, ori: 0,
			color: new util.Color('black'), opacity: 1,
			depth: 0.0
		});
		high_score = new visual.TextStim({
			win: psychoJS.window,
			name: 'thanksText',
			text: high_score_txt,
			font: 'Arial',
			units: 'height',
			pos: hi_pos, height: 0.05, wrapWidth: undefined, ori: 0,
			color: new util.Color('black'), opacity: 1,
			depth: 0.0
		});
		box1 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'box', mask: undefined,
			ori: 0, pos: [window_ratio * -0.25, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		box2 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'box', mask: undefined,
			ori: 0, pos: [window_ratio * 0, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		box3 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'box', mask: undefined,
			ori: 0, pos: [window_ratio * 0.25, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		box_arr = [box1, box2, box3]
		out1 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'outline', mask: undefined,
			ori: 0, pos: [window_ratio * -0.15, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		out2 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'outline', mask: undefined,
			ori: 0, pos: [window_ratio * 0, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		out3 = new visual.ImageStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			image: 'outline', mask: undefined,
			ori: 0, pos: [window_ratio * 0.15, 0], opacity: 1,
			size: [0.3,0.3],
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		
		
		// Stimuli
		if (options.includes('1')) {
			if (options.includes("L1")) {
				low1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L1_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low1.setAutoDraw(true)
				to_undraw.push(low1)
			}
			if (options.includes("M1")) {
				mid1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M1_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid1.setAutoDraw(true)
				to_undraw.push(mid1)
			}
			if (options.includes("H1")) {
				high1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H1_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high1.setAutoDraw(true)
				to_undraw.push(high1)
			}
		}
		if (options.includes('2')) {
			if (options.includes("L2")) {
				low2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L2_img', mask: undefined,
					ori: 0, pos: low_pos2, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low2.setAutoDraw(true)
				to_undraw.push(low2)
			}
			if (options.includes("M2")) {
				mid2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M2_img', mask: undefined,
					ori: 0, pos: mid_pos2, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid2.setAutoDraw(true)
				to_undraw.push(mid2)
			}
			if (options.includes("H2")) {
				high2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H2_img', mask: undefined,
					ori: 0, pos: hi_pos2, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high2.setAutoDraw(true)
				to_undraw.push(high2)
			}
		}
		if (options.includes('5')) {
			if (options.includes("L5")) {
				low5 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L5_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low5.setAutoDraw(true)
				to_undraw.push(low5)
			}
			if (options.includes("M5")) {
				mid5 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M5_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid5.setAutoDraw(true)
				to_undraw.push(mid5)
			}
			if (options.includes("H5")) {
				high5 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H5_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high5.setAutoDraw(true)
				to_undraw.push(high5)
			}
		}
		if (options.includes('6')) {
			if (options.includes("L6")) {
				low6 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L6_img', mask: undefined,
					ori: 0, pos: low_pos2, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low6.setAutoDraw(true)
				to_undraw.push(low6)
			}
			if (options.includes("M6")) {
				mid6 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M6_img', mask: undefined,
					ori: 0, pos: mid_pos2, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid6.setAutoDraw(true)
				to_undraw.push(mid6)
			}
			if (options.includes("H6")) {
				high6 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H6_img', mask: undefined,
					ori: 0, pos: hi_pos2, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high6.setAutoDraw(true)
				to_undraw.push(high6)
			}
    }
    if (options.includes('3')) {
			if (options.includes("L3")) {
				low3 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L3_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low3.setAutoDraw(true)
				to_undraw.push(low3)
			}
			if (options.includes("M3")) {
				mid3 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M3_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid3.setAutoDraw(true)
				to_undraw.push(mid3)
			}
			if (options.includes("H3")) {
				high3 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H3_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high3.setAutoDraw(true)
				to_undraw.push(high3)
			}
    }
    if (options.includes('4')) {
			if (options.includes("L4")) {
				low4 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L4_img', mask: undefined,
					ori: 0, pos: low_pos2, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low4.setAutoDraw(true)
				to_undraw.push(low4)
			}
			if (options.includes("M4")) {
				mid4 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M4_img', mask: undefined,
					ori: 0, pos: mid_pos2, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid4.setAutoDraw(true)
				to_undraw.push(mid4)
			}
			if (options.includes("H4")) {
				high4 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H4_img', mask: undefined,
					ori: 0, pos: hi_pos2, opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high4.setAutoDraw(true)
				to_undraw.push(high4)
			}
		}
		let pos_to_mark = []
		pos_score_array.forEach((item) => {
			if (item == "") {
				pos_to_mark.push("NA")
			} else {
				pos_to_mark.push(item)
			}
		})
		mark_event(trials_data, globalClock, trials.thisIndex, 'NA', event_types['TRIAL_ONSET'],
				'NA', 'NA', pos_to_mark[0] + "_" + pos_to_mark[1] + "_" + pos_to_mark[2])

		pressed = false

		return Scheduler.Event.NEXT;
	};
}

/**
 * Respond Routine
 * @param {*} trials 
 * @returns 
 */
function trialRoutineRespondTesting(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise	
		let score_to_mark = 0
	
		// get current time
		t = respondClock.getTime();

		if (resp.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			resp.tStart = t;  // (not accounting for frame time here)
			resp.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			resp.clock.reset();  // t=0 on next screen flip
			resp.start(); // start on screen flip
			resp.clearEvents();
		}

		let theseKeys = resp.getKeys({ keyList: keyListTest, waitRelease: false });
		if (theseKeys.length > 0 && !pressed) {
			resp.keys = theseKeys[0].name;  // just the last key pressed
			resp.rt = theseKeys[0].rt;

			if (resp.keys == LEFT_KEY && pos_score_array[0] != "") {
				pressed = true
				mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['CHOICE'],
				resp.rt, 'left', 'NA')
				feedbackClock.reset()
				out1.setAutoDraw(true)

				if (pos_score_array[0][0].charAt(0) != pos_score_array[2][0].charAt(0)) {
					console.log(pos_score_array)
					console.log(`adding ${left_score_txt}`)
					total_score += parseFloat(left_score_txt)
					score_to_mark = left_score_txt
				}
			} else if (resp.keys == RIGHT_KEY && pos_score_array[2] != "") {
				pressed = true
				mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['CHOICE'],
				resp.rt, 'right', 'NA')
				feedbackClock.reset()
				out3.setAutoDraw(true)

				if (pos_score_array[2][0].charAt(0) != pos_score_array[0][0].charAt(0)) {
					console.log(pos_score_array)
					console.log(`adding ${right_score_txt}`)
					total_score += parseFloat(right_score_txt)
					score_to_mark = right_score_txt
				}
			}
			mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FEEDBACK'],
					'NA', total_score, score_to_mark)
		}

		if (pressed && feedbackClock.getTime() >= parseFloat(config_values.testing_duration)) {
			continueRoutine = false
		}

		// check if the Routine should terminate
		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
			to_undraw.forEach((stim) => {
				stim.setAutoDraw(false)
			})
			box1.setAutoDraw(false)
			box2.setAutoDraw(false)
			box3.setAutoDraw(false)
			out1.setAutoDraw(false)
			out2.setAutoDraw(false)
			out3.setAutoDraw(false)

			endClock.reset()
			return Scheduler.Event.NEXT;
		}
	};
}

var mouseHandle;
var numClicks = 0;
var old_rating = 0;
var key_list_explicit = ['left', 'right']
function trialRoutineBeginExplicit(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		t = 0;
		trialClock.reset(); // clock
		toneClock.reset(); // toneclock
		frameN = -1;

		to_undraw = []
		
		// Stimuli
		if (options.includes('1')) {
			if (options.includes("L1")) {
				low1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L1_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low1.setAutoDraw(true)
				to_undraw.push(low1)
			}
			if (options.includes("M1")) {
				mid1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M1_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid1.setAutoDraw(true)
				to_undraw.push(mid1)
			}
			if (options.includes("H1")) {
				high1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H1_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high1.setAutoDraw(true)
				to_undraw.push(high1)
			}
		}
		if (options.includes('2')) {
			if (options.includes("L2")) {
				low2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L2_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low2.setAutoDraw(true)
				to_undraw.push(low2)
			}
			if (options.includes("M2")) {
				mid2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M2_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid2.setAutoDraw(true)
				to_undraw.push(mid2)
			}
			if (options.includes("H2")) {
				high2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H2_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high2.setAutoDraw(true)
				to_undraw.push(high2)
			}
		}
		if (options.includes('5')) {
			if (options.includes("L")) {
				low5 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L5_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low5.setAutoDraw(true)
				to_undraw.push(low5)
			}
			if (options.includes("M")) {
				mid5 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M5_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid5.setAutoDraw(true)
				to_undraw.push(mid5)
			}
			if (options.includes("H")) {
				high5 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H5_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high5.setAutoDraw(true)
				to_undraw.push(high5)
			}
		}
		if (options.includes('6')) {
			if (options.includes("L")) {
				low6 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L6_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low6.setAutoDraw(true)
				to_undraw.push(low6)
			}
			if (options.includes("M")) {
				mid6 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M6_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid6.setAutoDraw(true)
				to_undraw.push(mid6)
			}
			if (options.includes("H")) {
				high6 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H6_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high6.setAutoDraw(true)
				to_undraw.push(high6)
			}
    }
    if (options.includes('3')) {
			if (options.includes("L")) {
				low3 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L3_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low3.setAutoDraw(true)
				to_undraw.push(low3)
			}
			if (options.includes("M")) {
				mid3 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M3_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid3.setAutoDraw(true)
				to_undraw.push(mid3)
			}
			if (options.includes("H")) {
				high3 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H3_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high3.setAutoDraw(true)
				to_undraw.push(high3)
			}
		}
		if (options.includes('4')) {
			if (options.includes("L")) {
				low4 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L4_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low4.setAutoDraw(true)
				to_undraw.push(low4)
			}
			if (options.includes("M")) {
				mid4 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M4_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid4.setAutoDraw(true)
				to_undraw.push(mid4)
			}
			if (options.includes("H")) {
				high4 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H4_img', mask: undefined,
					ori: 0, pos: [0,0], opacity: 1,
					size: [0.3,0.3],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high4.setAutoDraw(true)
				to_undraw.push(high4)
			}
		}

		let ticks_arr = [...Array(101).keys()] // [0~100]
		exp_slider = new visual.Slider({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			mask: undefined, ori: 0, pos: [0, -0.25],
			opacity: 1, size: [1.0, 0.04],
			ticks: ticks_arr, color: 'grey',
			style: ['SLIDER'], markerColor: 'blue',
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		exp_slider.lineColor = 'grey'
		exp_slider.color = 'grey'
		exp_slider_txt= new visual.TextStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			mask: undefined, ori: 0, pos: [0, 0.25],
			height: 0.1, color: 'white',
			text: '',
			opacity: 1, flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		exp_slider_txt_left= new visual.TextStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			mask: undefined, ori: 0, pos: [-0.56, -0.25],
			height: 0.05, color: 'white',
			text: '0',
			opacity: 1, flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		exp_slider_txt_right= new visual.TextStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			mask: undefined, ori: 0, pos: [0.6, -0.25],
			height: 0.05, color: 'white',
			text: '100',
			opacity: 1, flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		exp_slider_box= new visual.ButtonStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			mask: undefined, ori: 0, pos: [0.005, -0.255],
			size: [1.0, 0.04], fillColor: 'blue', borderColor: 'blue',
			borderWidth: 0.01, letterHeight: 0.02,
			opacity: 1, flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		exp_slider.setAutoDraw(true)
		exp_slider_txt.setAutoDraw(true)
		exp_slider_box.setAutoDraw(true)
		exp_slider_txt_left.setAutoDraw(true)
		exp_slider_txt_right.setAutoDraw(true)
		to_undraw.push(exp_slider)
		to_undraw.push(exp_slider_txt)
		to_undraw.push(exp_slider_box)
		to_undraw.push(exp_slider_txt_left)
		to_undraw.push(exp_slider_txt_right)

		exp_button= new visual.Rect({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			mask: undefined, ori: 0, pos: [0, -0.35],
			size: [0.3,0.1], fillColor: 'white',
			opacity: 1, flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		exp_button_txt= new visual.TextStim({
			win: psychoJS.window,
			name: 'stimPath', units: 'height',
			mask: undefined, ori: 0, pos: [0, -0.35],
			height: 0.02, color: 'black',
			text: 'SUBMIT',
			opacity: 1, flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});
		exp_button.setAutoDraw(true)
		exp_button_txt.setAutoDraw(true)
		to_undraw.push(exp_button)
		to_undraw.push(exp_button_txt)

		mouseHandle = new core.Mouse({ win: psychoJS.window, name: 'stimPath' })
		numClicks = 0
		old_rating = 0
		key_list_explicit = ['left', 'right']

		pressed = false
		mark_event(trials_data, globalClock, trials.thisIndex, 'NA', event_types['TRIAL_ONSET'],
				'NA', 'NA' , options)

		return Scheduler.Event.NEXT;
	};
}

var enter_pressed = false

/**
 * Respond Routine
 * @param {*} trials 
 * @returns 
 */
function trialRoutineRespondExplicit(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise
		enter_pressed = false
	
		// get current time
		t = respondClock.getTime();

		if (resp.status === PsychoJS.Status.NOT_STARTED) {
			respondClock.reset()
			// keep track of start time/frame for later
			resp.tStart = t;  // (not accounting for frame time here)
			resp.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			resp.clock.reset();  // t=0 on next screen flip
			resp.start(); // start on screen flip
			resp.clearEvents();
		}

		if (exp_slider.markerPos != old_rating && exp_slider.markerPos !== undefined) {
			exp_slider_txt.setText(Math.round(exp_slider.markerPos))
		}
		old_rating = exp_slider.markerPos

		if (exp_button.contains(mouseHandle)) {
			if (mouseHandle.getPressed()[0] == 1 && exp_slider.markerPos !== undefined && !exp_slider._markerDragging) {
				numClicks++
			}
		}

		let theseKeys = resp.getKeys({ keyList: key_list_explicit, waitRelease: false, clear: false });
		if (theseKeys.length > 0) {

			if (theseKeys[theseKeys.length - 1].name == 'left' && theseKeys[theseKeys.length - 1].duration === undefined) {
				let current_val = exp_slider.markerPos
				console.log(current_val)
				if (current_val === undefined) {
					current_val = Math.random() * 100
				}
				exp_slider.markerPos = current_val - 0.5
				exp_slider.rating = current_val - 0.5
				exp_slider.setRating(current_val - 0.5)
				exp_slider.setMarkerPos(current_val - 0.5)
				exp_slider.refresh()
			}
			if (theseKeys[theseKeys.length - 1].name == 'right' && theseKeys[theseKeys.length - 1].duration === undefined) {
				let current_val = exp_slider.markerPos
				if (current_val === undefined) {
					current_val = Math.random() * 100
				}
				exp_slider.markerPos = current_val + 0.5
				exp_slider.rating = current_val + 0.5
				exp_slider.setRating(current_val + 0.5)
				exp_slider.setMarkerPos(current_val + 0.5)
				exp_slider.refresh()
			}
			if (theseKeys[theseKeys.length - 1].name == 'return' && exp_slider.markerPos !== undefined && !exp_slider._markerDragging) {
				enter_pressed = true
			}
		}
		if (exp_slider.markerPos !== undefined && !key_list_explicit.includes('return')) {
			resp.getKeys({ keyList: ['return'], waitRelease: false, clear: true });
			key_list_explicit = ['left', 'right', 'return']
		}

		if (numClicks >= 1 || enter_pressed) {
			mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['CHOICE'],
				respondClock.getTime(), exp_slider.markerPos, 'NA')
			continueRoutine = false
		}

		// check if the Routine should terminate
		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
			to_undraw.forEach((stim) => {
				stim.setAutoDraw(false)
			})

			endClock.reset()
			return Scheduler.Event.NEXT;
		}
	};
}

// Initial Fixation
// Show a 2 second fixation cross at the start of the first trial
function initialFixation(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise	
		if (trial_number != 1) continueRoutine = false // if not the firt trial, skip this routine

		if (!init_fixation_flag)
		{
			return Scheduler.Event.NEXT;
		}
	
		// get current time
		t_end = endClock.getTime();
		
		if (t_end >= 3) {
			continueRoutine = false
		}
		
		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// check if the Routine should terminate
		if (continueRoutine) { 
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
			init_fixation_flag = false
			
			endClock.reset()
			return Scheduler.Event.NEXT;
		}
	};
}

var key_map = {
	',': 'left',
	'.': 'right',
	'<': 'left',
	'>': 'right',
	'left': 'left',
	'right': 'right',
	'comma': 'left',
	'period': 'right'
}

function sendData() {
	total_requests += 1
	$.ajax({
        type: "POST",
        url: '/save',
		data: {
			"trials_data": trials_data,
			"expInfo": expInfo
		},
		success:function(data) {
			console.log(data)
		  }
	})
	.done(function (data) {
		total_requests -= 1
		console.log("success:")
		console.log(Date.now())
		console.log(data)
	})
	.fail(function (err) {
		console.log("ERR:")
		console.log(err)	
	})
}

/**
 * Trial Routine End
 * @param {*} trials 
 * @returns 
 */
function trialRoutineEnd(trials) { 
	return function () {
		//------Ending Routine 'trial'-------
		t = endClock.getTime()
		
		// hold the fixation for jitter time
		if (t <= 0.1) {
			return Scheduler.Event.FLIP_REPEAT;
		} else {
			resp.stop()
			resp.status = PsychoJS.Status.NOT_STARTED
			return Scheduler.Event.NEXT;
		}
	};
}

/**
 * Trial Routine End
 * @param {*} trials 
 * @returns 
 */
function trialRoutineEndPractice(trials) { 
	return function () {
		//------Ending Routine 'trial'-------
		t = endClock.getTime()

		// hold the fixation for jitter time
		if (t <= 0.1) {
			return Scheduler.Event.FLIP_REPEAT;
		} else {
			resp.stop()
			resp.status = PsychoJS.Status.NOT_STARTED
			return Scheduler.Event.NEXT;
		}
	};
}

function trialRoutineEndTesting(trials) { 
	return function () {
		//------Ending Routine 'trial'-------
		t = endClock.getTime()
		
		// hold the fixation for jitter time
		if (t <= 0.1) {
			return Scheduler.Event.FLIP_REPEAT;
		} else {
			resp.stop()
			resp.status = PsychoJS.Status.NOT_STARTED
			return Scheduler.Event.NEXT;
		}
	};
}

function trialRoutineEndExplicit(trials) { 
	return function () {
		//------Ending Routine 'trial'-------
		t = endClock.getTime()
		
		// hold the fixation for jitter time
		if (t <= 0.1) {
			return Scheduler.Event.FLIP_REPEAT;
		} else {
			resp.stop()
			resp.status = PsychoJS.Status.NOT_STARTED
			return Scheduler.Event.NEXT;
		}
	};
}

var readyComponents;
var thanksComponents;
var right_pressed = false;
function thanksRoutineBegin(phase_flag) {
	return function () {
		//------Prepare to start Routine 'thanks'-------
		// Clear Trial Components
		t = 0;
		thanksClock.reset(); // clock
		frameN = -1;
		routineTimer.reset()
		routineTimer.add(5.000000);
		let temp_total = 0
		right_pressed = false;

		// 1000 points =  $1
		console.log(Math.ceil((total_score/1000)*10)/10)
    if (phase_flag == 1) {
      if (config_values.money == 'true') {
        thanksText.setText(`You finished the first phase of the cognitive experiment.
									 So far, you have earned ${total_score} points = $${Math.ceil((total_score / 1000) * 10) / 10}
									 \n\n\nPress the right button to continue`)
      } else {
        thanksText.setText(`You finished the first phase of the cognitive experiment.
          So far, you have earned ${total_score} points.
          \n\n\nPress the right button to continue`)
      }
		}
    else if (phase_flag == 2) {
      if (config_values.money == 'true') {
        thanksText.setText(`You finished the second phase of the cognitive experiment.
									 So far, you have earned ${total_score} points = $${Math.ceil((total_score / 1000) * 10) / 10}
									 \n\n\nPress the right button to continue`)
      } else {
        thanksText.setText(`You finished the second phase of the cognitive experiment.
          So far, you have earned ${total_score} points.
          \n\n\nPress the right button to continue`)
      }
		}
    else {
      if (config_values.money == 'true') {
        thanksText.setText(`You finished the third and final phase of the cognitive experiment.
									 You have earned ${total_score} points = $${Math.ceil((total_score / 1000) * 10) / 10}
									 \n\n\nPress the right button to continue`)
      } else {
        thanksText.setText(`You finished the third and final phase of the cognitive experiment.
          You have earned ${total_score} points.
          \n\n\nPress the right button to continue`)
      }
		}

		// update component parameters for each repeat
		// keep track of which components have finished
		thanksText.status = PsychoJS.Status.NOT_STARTED;
		thanksComponents = []

		for (const thisComponent of thanksComponents)
			if ('status' in thisComponent)
				thisComponent.status = PsychoJS.Status.NOT_STARTED;

		return Scheduler.Event.NEXT;
	};
}

var frameRemains;
function thanksRoutineEachFrame(trials) {
	return function () {
		//------Loop for each frame of Routine 'thanks'-------
		let continueRoutine = true; // until we're told otherwise
		// get current time
		t = thanksClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
		// update/draw components on each frame

		// *thanksText* updates
		if (t >= 0.0 && thanksText.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			thanksText.tStart = t;  // (not accounting for frame time here)
			thanksText.frameNStart = frameN;  // exact frame index
			thanksText.setAutoDraw(true);
			console.log("drawing thanks score screen")
		}

		if (resp.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			resp.tStart = t;  // (not accounting for frame time here)
			resp.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			resp.clock.reset();  // t=0 on next screen flip
			resp.start(); // start on screen flip
			resp.clearEvents();
		}

		// check for quit (typically the Esc key)
		if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		continueRoutine = false;  // reverts to True if at least one component still running
		for (const thisComponent of thanksComponents)
			if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
				continueRoutine = true;
				break;
			}
		
		let theseKeys = resp.getKeys({ keyList: ['right'], waitRelease: false });
		if (theseKeys.length > 0) {
			console.log('right pressed now')
			continueRoutine = false
			right_pressed = true
		}

		if (right_pressed) {
			console.log('right pressed earlier')
			continueRoutine = false
		} else {
			continueRoutine = true
		}
		
		// reverts to true if we are still waiting for http requests to finish
		if (total_requests > 0) {
			continueRoutine = true
		}

		// refresh the screen if continuing
		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
			thanksText.setAutoDraw(false);
			console.log("ending thanks score screen")
			return Scheduler.Event.NEXT;
		}
	};
}

function thanksRoutineEnd(trials) {
	return function () {
		//------Ending Routine 'thanks'-------
		for (const thisComponent of thanksComponents) {
			if (typeof thisComponent.setAutoDraw === 'function') {
				thisComponent.setAutoDraw(false);
			}
		}
		return Scheduler.Event.NEXT;
	};
}

function endLoopIteration(thisScheduler, loop = undefined) {
	// ------Prepare for next entry------
	return function () {
		if (typeof loop !== 'undefined') {
			// ------Check if user ended loop early------
			if (loop.finished) {
				// Check for and save orphaned data
				if (psychoJS.experiment.isEntryEmpty())
				{
					psychoJS.experiment.nextEntry(loop);
				}
				thisScheduler.stop();
				
			} else {
				const thisTrial = loop.getCurrentTrial();
				if (typeof thisTrial === 'undefined' || !('isTrials' in thisTrial) || thisTrial.isTrials)
				{
					psychoJS.experiment.nextEntry(loop);
				}
			}
		}

		main_loop_count += 1
		console.log("should we send data???\n")
		console.log(`${main_loop_count} / ${last_trial_num}`)
		if (main_loop_count % 10 == 0) {
			console.log("sending data")
			sendData()
		}
		else if (main_loop_count == last_trial_num)
		{
			console.log("sending data last trial num")
			sendData()
		}

		return Scheduler.Event.NEXT;
	};
}

function endLoopIterationPractice(thisScheduler, loop = undefined) {
	// ------Prepare for next entry------
	return function () {
		if (typeof loop !== 'undefined') {
			// ------Check if user ended loop early------
			if (loop.finished) {
				// Check for and save orphaned data
				if (psychoJS.experiment.isEntryEmpty())
				{
					psychoJS.experiment.nextEntry(loop);
				}
				thisScheduler.stop();
				
			} else {
				const thisTrial = loop.getCurrentTrial();
				if (typeof thisTrial === 'undefined' || !('isTrials' in thisTrial) || thisTrial.isTrials)
				{
					psychoJS.experiment.nextEntry(loop);
				}
			}
		}

		main_loop_count += 1
		console.log("should we send data???\n")
		console.log(`${main_loop_count} / ${last_trial_num}`)
		if (main_loop_count % 10 == 0) {
			console.log("sending data")
			sendData()
		}
		else if (main_loop_count == last_trial_num)
		{
			console.log("sending data last trial num")
			sendData()
		}

		//sendData()

		return Scheduler.Event.NEXT;
	};
}


function importConditions(trials) {
	return function () {
		psychoJS.importAttributes(trials.getCurrentTrial());

		return Scheduler.Event.NEXT;
	};
}


function quitPsychoJS(message, isCompleted) {
	// Check for and save orphaned data
	if (psychoJS.experiment.isEntryEmpty()) {
		psychoJS.experiment.nextEntry();
	}

	psychoJS.window.close();
	psychoJS.quit({ message: message, isCompleted: isCompleted });

	return Scheduler.Event.QUIT;
}
