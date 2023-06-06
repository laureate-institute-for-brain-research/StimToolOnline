/**
 * Emotional Faces
 * A modifieid task from House/Faces
 * https://www.sciencedirect.com/science/article/pii/S0960982220315864
 * @author James Touthang <james@touthang.info>
 */

/*jshint -W069 */
/*Disable Warning Justification:
	Using bracket notation because it's familiar coding convention with python
	Counterpart
*/

var event_types = {
	'INSTRUCT_ONSET': 1,
	'TASK_ONSET': 2,
	'FIXATION_ONSET': 3,
	'FACE_ONSET': 4,
	'TONE_ONSET': 5,
	'CHOICE_ONSET': 6,
	'RESPONSE': 7,
	'BLOCK_ONSET': 8,
	'FEEDBACK': 9,
	'AUDIO_ONSET': 10,
	'PREDICTION_ONSET': 11,
	'PREDICTION': 12
}

var trials_data = []

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

// TASAK PARAMS
var practice = false;
var LEFT_KEY = 'comma'
var RIGHT_KEY = 'period'
var keyList = [LEFT_KEY, RIGHT_KEY]

var highOfferVal = 80

// global flags
var set_fixation_flag = true
var init_fixation_flag = true

var incorrect_rating = false

var response_for_result = null;

var mark_feedback = true;

var total_trials = 0
var total_score = 0
var converted_tot = 0

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
					url: '/js/tasks/emotional_faces_v2/' + getQueryVariable('run'),
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
			resources.push({ name: 'run_schedule2.xls', path: values.schedule2 })
			// resources.push({ name: 'run_schedule3.xls', path: values.schedule3 })
			resources.push({ name: 'instruct_schedule.csv', path: values.instruct_schedule })

			// Add file paths to expInfo
			if (values.schedule) expInfo.task_schedule = values.schedule
			if (values.instruct_schedule) expInfo.instruct_schedule = values.instruct_schedule
			
			// Import the instruction slides
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: values.instruct_schedule,
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

								// if (headerRows[j] == " ") {
								// 	console.log('empyt string')
								// }
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
						// console.log(out)
						// console.log(resources)
						resolve(data)
					}
				})
				
			})
		})
		// Add Media to Resrouces
		.then((values) => {			
			// Add instrcution Images
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: '/js/tasks/emotional_faces_v2/rate_faces_schedule_full.csv',
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');
						
						// console.log('faces:',allRows)

						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++){
								obj[headerRows[j]] = currentLine[j];	
							}
							// If there's media add to resources
							if (obj.stim_paths && obj.stim_paths != undefined) {
								resources.push({ name: obj.stim_paths , path: obj.stim_paths  })
							}
							
						}

						resolve(data)
					}
				})
				
			})
		})

		// Add Main Schedule stim_path to resources
		.then((values) => {			
			// Add instrcution Images
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: values.schedule,
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
							if (obj.stim_paths != 'None' && obj.stim_paths != undefined) {
								resources.push({ name: obj.stim_paths , path: obj.stim_paths  })
							}
							
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
			console.log(expInfo)

			// Sanitze the resources. Needs to be clean so that psychoJS doesn't complain
			resources = sanitizeResources(resources)
			console.log(resources)
			// expInfo.study = study
			psychoJS.start({
				expName, 
				expInfo,
				resources: resources,
			  })
			psychoJS._config.experiment.saveFormat = undefined // don't save to client side
			
			// console.log(psychoJS)
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
let expName = 'Emotional Faces';  // from the Builder filename that created this script
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
	flowScheduler.add(instruct_pagesLoopEnd);
}


// RATE BLOCK
// Runs through all the faces and subject just chooses Angry or Sad for EACH face.
if (!getQueryVariable('skip_rate_faces')) {
	const rateFacesLoopScheduler = new Scheduler(psychoJS);
	flowScheduler.add(rateFacesLoopBegin, rateFacesLoopScheduler);
	flowScheduler.add(rateFacesLoopScheduler);
	flowScheduler.add(trialsLoopEnd);
}


// PRACTICE BLOCK
if (!getQueryVariable('skip_practice')) {
	// Single Slide
	flowScheduler.add(readyRoutineBegin('PRACTICE'));
	flowScheduler.add(readyRoutineEachFrame());
	flowScheduler.add(readyRoutineEnd());

	const practiceTrialsLoopScheduler = new Scheduler(psychoJS);
	flowScheduler.add(practiceTrialsLoopBegin, practiceTrialsLoopScheduler);
	flowScheduler.add(practiceTrialsLoopScheduler);
	flowScheduler.add(trialsLoopEnd);
}



// MAIN BLOCK
// Ready Routine
flowScheduler.add(readyRoutineBegin('MAIN'));
flowScheduler.add(readyRoutineEachFrame());
flowScheduler.add(readyRoutineEnd());

const trialsLoopScheduler = new Scheduler(psychoJS);
flowScheduler.add(trialsLoopBegin, trialsLoopScheduler);
flowScheduler.add(trialsLoopScheduler);
flowScheduler.add(trialsLoopEnd);

// MAIN BLOCK
// Ready Routine
flowScheduler.add(readyRoutineBegin('MAIN2'));
flowScheduler.add(readyRoutineEachFrame());
flowScheduler.add(readyRoutineEnd());

const trialsLoopScheduler2 = new Scheduler(psychoJS);
flowScheduler.add(trialsLoopBegin2, trialsLoopScheduler2);
flowScheduler.add(trialsLoopScheduler2);
flowScheduler.add(trialsLoopEnd);

// MAIN BLOCK
// Ready Routine
// flowScheduler.add(readyRoutineBegin('MAIN3'));
// flowScheduler.add(readyRoutineEachFrame());
// flowScheduler.add(readyRoutineEnd());

// const trialsLoopScheduler3 = new Scheduler(psychoJS);
// flowScheduler.add(trialsLoopBegin3, trialsLoopScheduler);
// flowScheduler.add(trialsLoopScheduler);
// flowScheduler.add(trialsLoopEnd);

flowScheduler.add(thanksRoutineBegin());
flowScheduler.add(thanksRoutineEachFrame());
flowScheduler.add(thanksRoutineEnd());
flowScheduler.add(quitPsychoJS, '', true);

// quit if user presses Cancel in dialog box:
dialogCancelScheduler.add(quitPsychoJS, '', false);


// Add Slides to resources
var resources = [
	{ name: 'practice_schedule.csv', path: '/js/tasks/emotional_faces_v2/practice_schedule.csv' },
	{ name: 'rate_faces_schedule.csv', path: '/js/tasks/emotional_faces_v2/rate_faces_schedule.csv' }, // faces lists
	{ name: 'user.png', path: '/js/tasks/emotional_faces_v2/media/user.png' },
	{ name: 'user_filled.png', path: '/js/tasks/emotional_faces_v2/media/user_filled.png' },
	{ name: 'PRACTICE_ready', path: '/js/tasks/emotional_faces_v2/media/instructions/Slide15.jpeg'},
	{ name: 'MAIN_ready', path: '/js/tasks/emotional_faces_v2/media/instructions/Slide16.jpeg' },
	{ name: 'PRACTICE_ready_audio.mp3', path: '/js/tasks/emotional_faces_v2/media/instructions_audio/Slide15.mp3' },
	{ name: 'MAIN_ready_audio.mp3', path: '/js/tasks/emotional_faces_v2/media/instructions_audio/Slide16.mp3'},
	{ name: 'male.png', path: '/js/tasks/emotional_faces_v2/media/male.png' },
	{ name: 'female.png', path: '/js/tasks/emotional_faces_v2/media/female.png' },
	{ name: 'high_tone.mp3', path: '/js/tasks/emotional_faces_v2/media/tones/high_tone.mp3' },
	{ name: 'low_tone.mp3', path: '/js/tasks/emotional_faces_v2/media/tones/low_tone.mp3' },
	{ name: 'rightangry.JPG', path: '/js/tasks/emotional_faces_v2/media/rightangry.JPG' },
	{ name: 'wrongangry.JPG', path: '/js/tasks/emotional_faces_v2/media/wrongangry.JPG' },
	{ name: 'slowangry.JPG', path: '/js/tasks/emotional_faces_v2/media/slowangry.JPG' },
	{ name: 'rightsad.JPG', path: '/js/tasks/emotional_faces_v2/media/rightsad.JPG' },
	{ name: 'wrongsad.JPG', path: '/js/tasks/emotional_faces_v2/media/wrongsad.JPG' },
	{ name: 'slowsad.JPG', path: '/js/tasks/emotional_faces_v2/media/slowsad.JPG' },
	{ name: 'BREAK.jpeg', path: '/js/tasks/emotional_faces_v2/media/BREAK.jpeg' },
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
var boxColor = '#0074B7'
var selectColor = '#FFFFFF'
const angryColor = '#ff0015'
const sadColor = '#83acdd'

var question_data;
var desiredGender = 'male'; // default gender is male

var slideStim;
var slides;
var instructClock;
var instrBelow;

var ready;
var trialClock;
var toneClock;
var stimClock;
var respondClock;

var stimImageStim;

var prediction_text;

var response_text
var left_text;
var left_rect;
var right_text;
var right_rect;

var score_bar;
var score_slide;
var score_bar_top_text;
var score_bar_bottom_text;
var score_bar_midtop_text;
var score_bar_midbottom_text;
var score_bar_mid_text;
var score_bar_midline;

var tot_score_bar;
var tot_score_bar_midline;
var tot_score_slide;
var tot_score_bar_left_text;
var tot_score_bar_right_text;
var tot_score_bar_midleft_text;
var tot_score_bar_midright_text;
var tot_score_bar_mid_text;

var correct_score_text;
var correct_text;

var offer_stim_text;
var offer_rect;
var profile_outline;

var currentTrialNumber;

var totalDates = 0;
var totalPointsTracker;

var points_fixation_stim;

var og_positions = {
	'tot_score_bar': '',
	'tot_score_bar_midline': '',
	'tot_score_slide': '',
	'tot_score_bar_left_text': '',
	'tot_score_bar_right_text': '',
	'tot_score_bar_midleft_text': '',
	'tot_score_bar_midright_text': '',
	'tot_score_bar_mid_text': '',
	'left_text': '',
	'left_rect': '',
	'right_text': '',
	'right_rect': '',
	'score_bar': '',
	'score_slide': '',
	'score_bar_top_text': '',
	'score_bar_bottom_text': '',
	'score_bar_midtop_text': '',
	'score_bar_midbottom_text': '',
	'score_bar_mid_text': '',
	'score_bar_midline': '',
}

var t_end;

var readyClock;
var isiClock;
var endClock;
var gameNumtracker;
var track;

var resp;
var thanksClock;
var thanksText;
var globalClock;
var routineTimer;
var feedbackTimer;
var feedback_result_stim;
var rightangryStim;
var wrongangryStim;
var slowangryStim;
var rightsadStim;
var wrongsadStim;
var slowsadStim;
function experimentInit() {
	// Check if there is an practice
	if (getQueryVariable('practice') == 'true') {
		practice = true;
		console.log("PRACTICE SESSION!")
	}
	// Initialize components for Routine "instruct"
	instructClock = new util.Clock();
	instructClock.reset()

	instrBelow = new visual.TextStim({
		win: psychoJS.window,
		name: 'instrBelow',
		text: 'Press any key to Continue',
		font: 'Arial',
		units: 'height',
		pos: [0, -0.8], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
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

	breakStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'break_stim', units : 'height', 
		image : 'BREAK.jpeg', mask : undefined,
		ori : 0, pos : [0, 0],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});
	
	

	ready = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	// Initialize components for Routine "trial"
	trialClock = new util.Clock();
	toneClock = new util.Clock();
	stimClock = new util.Clock();
	respondClock = new util.Clock();
	


	// Initial the Text Position of the Band
	response_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'response_text',
		text: 'Angry or Sad Face?',
		font: 'Arial',
		units: 'height',
		pos: [0, 0.06], height: 0.07, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});


	left_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'left_text',
		text: 'Angry',
		font: 'Arial',
		units: 'norm',
		pos: [-0.3, 0], height: 0.09, wrapWidth: undefined, ori: 0,
		color: new util.Color(angryColor), opacity: 1,
		depth: 0.0
	});

	left_rect = new visual.Rect({
		win: psychoJS.window,
		name: 'left_rect',
		width: 0.16,
		height: 0.09,
		lineWidth: 3.5,
		units: 'norm',
		pos: [-0.3, 0 ], ori: 0,
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	right_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'right_text',
		text: 'Sad',
		font: 'Arial',
		units: 'norm',
		pos: [ 0.3, 0], height: 0.09, wrapWidth: undefined, ori: 0,
		color: new util.Color(sadColor), opacity: 1,
		depth: 0.0
	});

	right_rect = new visual.Rect({
		win: psychoJS.window,
		name: 'right_rect',
		width: 0.16,
		height: 0.09,
		lineWidth: 3.5,
		units: 'norm',
		pos: [ 0.3, 0 ], ori: 0,
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	score_bar = new visual.Rect({
		win: psychoJS.window,
		name: 'right_rect',
		width: 0.06,
		height: 0.8,
		lineWidth: 3.5,
		units: 'norm',
		pos: [ 0.23, 0 ], ori: 0,
		lineColor: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});
	
	score_bar_midline = new visual.Rect({
		win: psychoJS.window,
		name: 'right_rect',
		width: 0.06,
		height: 0.01,
		lineWidth: 3.5,
		units: 'norm',
		pos: [0.23, -0.18], ori: 0,
		fillColor: new util.Color('#4d4d4d'),
		lineColor: new util.Color('#4d4d4d'), opacity: 1,
		depth: 0.0
	});

	score_slide = new visual.Rect({
		win: psychoJS.window,
		name: 'right_rect',
		width: 0.06,
		height: 0.01,
		lineWidth: 3.5,
		units: 'norm',
		pos: [0.23, 0.4], ori: 0,
		fillColor: new util.Color('grey'),
		lineColor: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	score_bar_top_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'bar_top_text',
		text: '+75',
		font: 'Arial',
		units: 'norm',
		pos: [ 0.29, 0.38], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	score_bar_midtop_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'bar_top_text',
		text: '+50',
		font: 'Arial',
		units: 'norm',
		pos: [ 0.29, 0.19], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	score_bar_bottom_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'bar_bottom_text',
		text: '-25',
		font: 'Arial',
		units: 'norm',
		pos: [ 0.29, -0.37], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	score_bar_midbottom_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'bar_bottom_text',
		text: '0',
		font: 'Arial',
		units: 'norm',
		pos: [ 0.29, -0.18], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	score_bar_mid_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'bar_bottom_text',
		text: '+25',
		font: 'Arial',
		units: 'norm',
		pos: [ 0.29, 0], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	tot_score_bar = new visual.Rect({
		win: psychoJS.window,
		name: 'right_rect',
		width: 1.05,
		height: 0.06,
		lineWidth: 3.5,
		units: 'norm',
		pos: [ 0, -0.4 ], ori: 0,
		lineColor: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	tot_score_bar_midline = new visual.Rect({
		win: psychoJS.window,
		name: 'right_rect',
		width: 0.005,
		height: 0.06,
		lineWidth: 3.5,
		units: 'norm',
		pos: [0, -0.4], ori: 0,
		fillColor: new util.Color('#4d4d4d'),
		lineColor: new util.Color('#4d4d4d'), opacity: 1,
		depth: 0.0
	});

	tot_score_slide = new visual.Rect({
		win: psychoJS.window,
		name: 'right_rect',
		width: 0.01,
		height: 0.06,
		lineWidth: 0.1,
		units: 'norm',
		pos: [-0.5, -0.4], ori: 0,
		fillColor: new util.Color('#13aed1'),
		lineColor: new util.Color('#13aed1'), opacity: 1,
		depth: 0.0
	});

	tot_score_bar_left_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'bar_top_text',
		text: '-$$$',
		font: 'Arial',
		units: 'norm',
		pos: [ -0.5, -0.3], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	tot_score_bar_midleft_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'bar_top_text',
		text: '-$',
		font: 'Arial',
		units: 'norm',
		pos: [ -0.25, -0.3], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	tot_score_bar_right_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'bar_bottom_text',
		text: '+$$$',
		font: 'Arial',
		units: 'norm',
		pos: [ 0.5, -0.3], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	tot_score_bar_midright_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'bar_bottom_text',
		text: '+$',
		font: 'Arial',
		units: 'norm',
		pos: [ 0.25, -0.3], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	tot_score_bar_mid_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'bar_bottom_text',
		text: '0',
		font: 'Arial',
		units: 'norm',
		pos: [ 0, -0.3], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('grey'), opacity: 1,
		depth: 0.0
	});

	currentTrialNumber  = new visual.TextStim({
		win: psychoJS.window,
		name: 'trialTracker',
		text: 'Trial Number: ',
		font: 'Arial',
		units: 'norm',
		pos: [0, -0.7], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	gameNumtracker = new visual.TextStim({
		win: psychoJS.window,
		name: 'gameTracker',
		text: '1/80',
		font: 'Arial',
		units: 'norm',
		pos: [0, -0.8], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	totalPointsTracker = new visual.TextStim({
		win: psychoJS.window,
		name: 'pointsTracker',
		text: 'Total points: 0',
		font: 'Arial',
		units: 'norm',
		pos: [0, -0.9], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('#00fa40'), opacity: 1,
		depth: 0.0
	});

	points_fixation_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'pointsTracker',
		text: 'X',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0], height: 0.12, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	feedback_result_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'feedback_text',
		text: 'CORRECT',
		font: 'Arial',
		units: 'norm',
		pos: [0, -0.5], height: 0.12, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	correct_score_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'correct_score_text',
		text: '0',
		font: 'Arial',
		units: 'norm',
		pos: [0.04, -0.165], height: 0.11, wrapWidth: undefined, ori: 0,
		color: new util.Color('#00ff00'), opacity: 1,
		depth: 0.0
	});

	correct_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'correct_text',
		text: 'Correct!',
		font: 'Arial',
		units: 'norm',
		pos: [-0.15, -0.165], height: 0.11, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	prediction_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'correct_text',
		text: 'Angry or Sad?',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0], height: 0.25, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	rightangryStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'rightangry', units : 'height', 
		image : 'rightangry.JPG', mask : undefined,
		ori : 0, pos : [0, 0], opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});
	wrongangryStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'wrongangry', units : 'height', 
		image : 'wrongangry.JPG', mask : undefined,
		ori : 0, pos : [0, 0], opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});
	slowangryStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'slowangry', units : 'height', 
		image : 'slowangry.JPG', mask : undefined,
		ori : 0, pos : [0, 0], opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	rightsadStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'rightsad', units : 'height', 
		image : 'rightsad.JPG', mask : undefined,
		ori : 0, pos : [0, 0], opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});
	wrongsadStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'wrongsad', units : 'height', 
		image : 'wrongsad.JPG', mask : undefined,
		ori : 0, pos : [0, 0], opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});
	slowsadStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'slowsad', units : 'height', 
		image : 'slowsad.JPG', mask : undefined,
		ori : 0, pos : [0, 0], opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	endClock = new util.Clock();
	isiClock = new util.Clock();

	resp = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	// Initiali comnponenents for Routine 'read'y
	readyClock = new util.Clock();
	// Initialize components for Routine "thanks"
	thanksClock = new util.Clock();
	thanksText = new visual.TextStim({
		win: psychoJS.window,
		name: 'thanksText',
		text: 'This is the end of the task run. Please wait for the upcoming survey and for all task data to be saved. Thank you!',
		font: 'Arial',
		units: 'height',
		pos: [0, 0], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	og_positions['left_text'] = [-0.3, 0]
	og_positions['left_rect'] = [-0.3, 0]
	og_positions['right_text'] = [0.3, 0]
	og_positions['right_rect'] = [0.3, 0]
	og_positions['score_bar'] = [0.23, 0]
	og_positions['score_bar_midline'] = [0.23, -0.18]
	og_positions['score_slide'] = [0.23, 0.4]
	og_positions['score_bar_top_text'] = [0.29, 0.38]
	og_positions['score_bar_midtop_text'] = [0.29, 0.19]
	og_positions['score_bar_bottom_text'] = [0.29, -0.37]
	og_positions['score_bar_midbottom_text'] = [0.29, -0.18]
	og_positions['score_bar_mid_text'] = [0.29, 0]
	og_positions['tot_score_bar'] = [ 0, -0.4 ]
	og_positions['tot_score_bar_midline'] = [ 0, -0.4 ]
	og_positions['tot_score_slide'] = [-0.5, -0.4]
	og_positions['tot_score_bar_left_text'] = [ -0.5, -0.3]
	og_positions['tot_score_bar_midleft_text'] = [ -0.25, -0.3]
	og_positions['tot_score_bar_right_text'] = [ 0.5, -0.3]
	og_positions['tot_score_bar_midright_text'] = [ 0.25, -0.3]
	og_positions['tot_score_bar_mid_text'] = [ 0, -0.3]

	// Tone Sounds
	// high_tone = new Sound({
	// 	win: psychoJS.window,
	// 	value: 'high_tone.mp3'
	// });

	// low_tone = new Sound({
	// 	win: psychoJS.window,
	// 	value: 'low_tone.mp3'
	// });


	// Create some handy timers
	globalClock = new util.Clock();  // to track the time since experiment started
	routineTimer = new util.CountdownTimer();  // to track time remaining of each (non-slip) routine

	feedbackTimer = new util.CountdownTimer(1); 

	globalClock.reset() // start Global Clock

	mark_event(trials_data, globalClock, 'NA', 'NA', event_types['TASK_ONSET'],
				'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

/**
 * Reset the Stims back to their intiaiization configurations
 */
function resetRects() {

	// left_rect = new visual.Rect({
	// 	win: psychoJS.window,
	// 	name: 'left_rect',
	// 	width: 0.16,
	// 	height: 0.09,
	// 	lineWidth: 3.5,
	// 	units: 'norm',
	// 	pos: [-0.3, 0 ], ori: 0,
	// 	lineColor: new util.Color('white'), opacity: 1,
	// 	depth: 0.0
	// });

	left_rect.width = 0.16;
	left_rect.height = 0.09;

	// right_rect = new visual.Rect({
	// 	win: psychoJS.window,
	// 	name: 'right_rect',
	// 	width: 0.16,
	// 	height: 0.09,
	// 	lineWidth: 3.5,
	// 	units: 'norm',
	// 	pos: [ 0.3, 0 ], ori: 0,
	// 	lineColor: new util.Color('white'), opacity: 1,
	// 	depth: 0.0
	// });

	right_rect.width = 0.16;
	right_rect.height = 0.09;
}

function instruct_pagesLoopBegin(thisScheduler) {
	// set up handler to look up the conditions

	
	slides = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'instruct_schedule.csv',
		seed: undefined, name: 'slides'
	});

	// console.log(slides)
	
	psychoJS.experiment.addLoop(slides); // add the loop to the experiment
	currentLoop = slides;  // we're now the current loop

	var currentInstructIndex = 0
	var maxInstructions = slides.nTotal

	const snapshot = slides.getSnapshot();
	thisScheduler.add(importConditions(snapshot));
	thisScheduler.add(instructRoutineBegin(snapshot));
	thisScheduler.add(instructSlideRoutineEachFrame(snapshot, slides));
	thisScheduler.add(instructRoutineEnd(snapshot));
	thisScheduler.add(endLoopIteration(thisScheduler, snapshot));

	// console.log(thisScheduler)
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
		// console.log(instruct_slide)
		slideStim.setImage(instruct_slide)
		// update component parameters for each repeat
		ready.keys = undefined;
		ready.rt = undefined;
		// keep track of which components have finished
		instructComponents = [ slideStim];
	
		instructComponents.push(ready);

		console.log("InstructionSlides Index: ", trials.thisIndex)
		instruct_prev_pressed = false
		
		if (audio_path) {
			track = new Sound({
				win: psychoJS.window,
				value: audio_path
			  });
			console.log(audio_path)
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


var continueRoutine;
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
			// instrText1.setAutoDraw(true);
		}

		// New Slide Call, set it after pressing key
		// console.log(track.status)
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
					// console.log(audio_path)
					track.setVolume(1.0);
					track.play();
				} else {
					track = new Sound({
						win: psychoJS.window,
						value: audio_path
					});
					time_audio_end = t + track.getDuration()
					// console.log(audio_path)
					track.setVolume(1.0);
					track.play();
				}
			}
				
		}
		// *ready* updates
		if (t >= 0 && ready.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			ready.tStart = t;  // (not accounting for frame time here)
			ready.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			psychoJS.window.callOnFlip(function () { ready.clock.reset(); });  // t=0 on next screen flip
			psychoJS.window.callOnFlip(function () { ready.start(); }); // start on screen flip
			psychoJS.window.callOnFlip(function () { ready.clearEvents(); });
		}

		if (ready.status === PsychoJS.Status.STARTED) {

			let theseKeys = ready.getKeys({ keyList: ['right', 'left', 'z'], waitRelease: false });

			
			// Force Progression
			if (theseKeys.length > 0 && theseKeys[0].name == 'z') {  // at least one key was pressed

				slides.thisIndex++ // incremenet the index
				if (slides.thisIndex >= slides.nTotal) {
					// if we reached here, it means we reached the last and we should move on.
					continueRoutine = false 
				}
				trials = slides.getSnapshot() // get new snapshot after incrementing index
				psychoJS.importAttributes(trials.getCurrentTrial()); // import the attributes to main class
				//console.log(trials)
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
				//console.log(trials)
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
					//console.log(trials)
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

var frameRemains;

var readyComponents;
var readyStim;
var breakStim;
function readyRoutineBegin(block_type) {
	return function () {
		//------Prepare to start Routine 'ready'-------
		t = 0;
		psychoJS.eventManager.clearEvents()
		readyClock.reset(); // clock
		frameN = -1;

		// Set readyStim based on block_type
		console.log('block_type: ',block_type)
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
				track = new Sound({
					win: psychoJS.window,
					value: 'PRACTICE_ready_audio.mp3'
				});
				track.setVolume(1.0);
				break
			case 'MAIN':
				readyStim = new visual.ImageStim({
					win : psychoJS.window,
					name : 'ready_stim', units : 'height', 
					image : 'MAIN_ready', mask : undefined,
					ori : 0, pos : [0, 0],
					color : new util.Color([1, 1, 1]), opacity : 1,
					flipHoriz : false, flipVert : false,
					texRes : 128, interpolate : true, depth : 0
				});
				track = new Sound({
					win: psychoJS.window,
					value: 'MAIN_ready_audio.mp3'
				});
				track.setVolume(1.0);
				break
			case 'MAIN2':
				readyStim = new visual.ImageStim({
					win : psychoJS.window,
					name : 'break_stim', units : 'height', 
					image : 'BREAK.jpeg', mask : undefined,
					ori : 0, pos : [0, 0],
					color : new util.Color([1, 1, 1]), opacity : 1,
					flipHoriz : false, flipVert : false,
					texRes : 128, interpolate : true, depth : 0
				});
				break
			case 'MAIN3':
				readyStim = new visual.ImageStim({
					win : psychoJS.window,
					name : 'break_stim', units : 'height', 
					image : 'BREAK.jpeg', mask : undefined,
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
					image: 'MAIN_ready', mask: undefined,
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


var faces;
function rateFacesLoopBegin(thisScheduler) {;
	faces = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'rate_faces_schedule.csv',
		seed: undefined, name: 'faces'
	});

	psychoJS.experiment.addLoop(faces); // add the loop to the experiment
	currentLoop = faces;  // we're now the current loop
	endClock.reset()
	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED

	for (const thisTrial of faces) {
		const snapshot = faces.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(rateFacesRoutingBegin(snapshot));
		thisScheduler.add(rateFacesRespond(snapshot));
		thisScheduler.add(rateFacesFeedback(snapshot));
		thisScheduler.add(rateFacesEnd(snapshot)); 
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	mark_event(trials_data, globalClock, 'NA', 'RATE_FACES', event_types['BLOCK_ONSET'],
			'NA', 'NA', 'NA')
	return Scheduler.Event.NEXT;
}


var trials;
var currentLoop;
var trial_type;
function practiceTrialsLoopBegin(thisScheduler) {
	totalDates = 0; // reset the totalDates
	time_point = 0;
	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'practice_schedule.csv',
		seed: undefined, name: 'trials'
	});

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	total_trials = trials.trialList.length
	total_trials = 300 // This is a good enough estimate
	//total_score = Math.round(total_trials/2) // initialize to 0 tick
	total_score = 500/2
	currentLoop = trials;  // we're now the current loop
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
		thisScheduler.add(trialRoutinePlayTone(snapshot));
		thisScheduler.add(trialRoutineShowPredictionStim(snapshot)); // show the result 
		thisScheduler.add(trialRoutinePredictionRespond(snapshot));
		thisScheduler.add(trialRoutineShowStim(snapshot)); 
		thisScheduler.add(trialRoutineRespond(snapshot));
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	trial_type = 'PRACTICE'
	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['BLOCK_ONSET'],
				'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

function trialsLoopBegin(thisScheduler) {
	totalDates = 0; // reset the totalDates
	time_point = 0;
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

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop
	total_trials = trials.trialList.length
	//total_score = Math.round(total_trials / 2) // init to 0 tick
	total_score = 500/2

	init_fixation_flag = true

	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot));
		thisScheduler.add(trialRoutinePlayTone(snapshot));
		thisScheduler.add(trialRoutineShowPredictionStim(snapshot)); // show the result 
		thisScheduler.add(trialRoutinePredictionRespond(snapshot));
		thisScheduler.add(trialRoutineShowStim(snapshot)); // show the result 
		thisScheduler.add(trialRoutineRespond(snapshot));
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	trial_type = 'MAIN'
	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['BLOCK_ONSET'],
				'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}
function trialsLoopBegin2(thisScheduler) {
	totalDates = 0; // reset the totalDates
	time_point = 0;
	endClock.reset()

	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED

	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule2.xls',
		seed: undefined, name: 'trials'
	});

	main_loop_count = 0
	last_trial_num = trials.nTotal

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop
	total_trials = trials.trialList.length
	//total_score = Math.round(total_trials / 2) // init to 0 tick
	//total_score = 500

	init_fixation_flag = true

	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot));
		thisScheduler.add(trialRoutinePlayTone(snapshot));
		thisScheduler.add(trialRoutineShowPredictionStim(snapshot)); // show the result 
		thisScheduler.add(trialRoutinePredictionRespond(snapshot));
		thisScheduler.add(trialRoutineShowStim(snapshot)); // show the result 
		thisScheduler.add(trialRoutineRespond(snapshot));
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	trial_type = 'MAIN'
	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['BLOCK_ONSET'],
				'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}
function trialsLoopBegin3(thisScheduler) {
	totalDates = 0; // reset the totalDates
	time_point = 0;
	endClock.reset()

	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED

	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule3.xls',
		seed: undefined, name: 'trials'
	});

	main_loop_count = 0
	last_trial_num = trials.nTotal

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop
	//total_score = Math.round(total_trials / 2) // init to 0 tick
	//total_score = 500

	init_fixation_flag = true

	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot));
		thisScheduler.add(trialRoutinePlayTone(snapshot));
		thisScheduler.add(trialRoutineShowPredictionStim(snapshot)); // show the result 
		thisScheduler.add(trialRoutinePredictionRespond(snapshot));
		thisScheduler.add(trialRoutineShowStim(snapshot)); // show the result 
		thisScheduler.add(trialRoutineRespond(snapshot));
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	trial_type = 'MAIN'
	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['BLOCK_ONSET'],
				'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

function instruct_pagesLoopEnd() {
	psychoJS.experiment.removeLoop(slides);
	return Scheduler.Event.NEXT;
}

// SHow the points in the trial 
function trialsLoopEnd() {
	currentTrialNumber.setAutoDraw(false)
	totalPointsTracker.setAutoDraw(false)
	slideStim.setAutoDraw(false)

	psychoJS.experiment.removeLoop(trials);

	psychoJS.experiment.addData('globalClock', globalClock.getTime());

	return Scheduler.Event.NEXT;
}

// RoutineBegin for RateFaces
var result;
var correct_key;
function rateFacesRoutingBegin(trials) {
	return function () {
		// Initialize the image
		stimImageStim = new visual.ImageStim({
			win : psychoJS.window,
			name : 'stimPath', units : 'height', 
			image : stim_paths, mask : undefined,
			ori : 0, pos : [0, 0.2], opacity : 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});
		stimImageStim.setAutoDraw(true) // show image

		left_text.pos[1] = og_positions['left_text'][1]
		left_rect.pos[1] = og_positions['left_rect'][1]
		right_text.pos[1] = og_positions['right_text'][1]
		right_rect.pos[1] = og_positions['right_rect'][1]

		// For This block move the text slighty down
		left_text.pos[1] = -0.2
		left_rect.pos[1] = left_text.pos[1]
		
		right_text.pos[1] = -0.2
		right_rect.pos[1] = right_text.pos[1]

		if (window.screen.width >= 2560)
		{
			left_text.pos[1] = -0.4
			left_rect.pos[1] = left_text.pos[1]
			
			feedback_result_stim.pos[1] = -0.6
		
			right_text.pos[1] = -0.4
			right_rect.pos[1] = right_text.pos[1]
		}
	
		if (window.screen.width <= 1280)
		{
			left_text.pos[1] = -0.4
			left_rect.pos[1] = left_text.pos[1]

			feedback_result_stim.pos[1] = -0.6
		
			right_text.pos[1] = -0.4
			right_rect.pos[1] = right_text.pos[1]
		}
	

		left_text.setAutoDraw(true) // show left text (angry)
		right_text.setAutoDraw(true) // show right text (sad)

		left_rect.setAutoDraw(false)
		right_rect.setAutoDraw(false)
		resetRects() // reset rect stims
		

		//console.log("Face: ", stim_paths)
	
		resp.keys = undefined;
		resp.rt = undefined;
		pressed = false;
		too_slow = false;
		respond_time = undefined;
		result = undefined;

		// Get the Correct KEY, used for feedbackRoutine
		if (stim_type == 'angry') {
			correct_key = LEFT_KEY 
		} else if(stim_type == 'sad') {
			correct_key = RIGHT_KEY 
		}
		
		mark_event(trials_data, globalClock, trials.thisIndex, 'RATE_FACES', event_types['FACE_ONSET'],
			resp.rt, key_map[resp.keys] , result)
		
	
		return Scheduler.Event.NEXT;
	};
}
var respond_time;
const button_fb_duration = 0.3 // durating of the feedback button press
// Show the Face and let Subject give response (without time limit)
function rateFacesRespond(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise

		// console.log(resp.clock.getTime())
		// Get User Input
		if (resp.status === PsychoJS.Status.NOT_STARTED /*|| incorrect_rating*/) {
			// keep track of start time/frame for later
			resp.tStart = t;  // (not accounting for frame time here)
			resp.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			resp.clock.reset();  // t=0 on next screen flip
			resp.start(); // start on screen flip
			resp.clearEvents();
		}
		let theseKeys = resp.getKeys({ keyList: keyList, waitRelease: false });
		if (!pressed && theseKeys.length > 0) {
			resp.keys = theseKeys[0].name;  // just the last key pressed
			resp.rt = theseKeys[0].rt;

			pressed = true
			respond_time = resp.clock.getTime()

			if (resp.keys == LEFT_KEY) {
				response = 'angry'
				left_rect.setAutoDraw(true)
				// left_rect.fillColor = new util.Color(selectColor)
				left_rect.lineColor = new util.Color(selectColor)
				left_rect.height = 0.12
				left_rect.width = 0.26

				right_rect.setAutoDraw(false)
				
			} else if (resp.keys == RIGHT_KEY) {
				response = 'sad'
				right_rect.setAutoDraw(true)
				// right_rect.fillColor = new util.Color(selectColor)
				right_rect.lineColor = new util.Color(selectColor)
				right_rect.height = 0.11
				right_rect.width = 0.18

				left_rect.setAutoDraw(false)
			}
			result = getResult(key_map[resp.keys])
			if (result == 'incorrect') {
				feedback_result_stim.setText('Incorrect. Please Try Again.')

				// Save Data on each Press
				mark_event(trials_data, globalClock, trials.thisIndex, 'RATE_FACES', event_types['RESPONSE'],
				resp.rt, key_map[resp.keys] , result)

				resp.keys = undefined;
				resp.rt = undefined;

				incorrect_rating = true
				resp.status = PsychoJS.Status.NOT_STARTED
				pressed = false

				feedback_result_stim.setAutoDraw(true)
				if (resp.keys == LEFT_KEY) {
					left_rect.setAutoDraw(true)
					left_rect.lineColor = new util.Color(selectColor)
	
					right_rect.setAutoDraw(false)
				} else if (resp.keys == RIGHT_KEY) {
					right_rect.setAutoDraw(true)
					right_rect.lineColor = new util.Color(selectColor)
	
					left_rect.setAutoDraw(false)
				}
				
				return Scheduler.Event.FLIP_REPEAT;
			} else {
				feedback_result_stim.setText('Correct')
				incorrect_rating = false
			}
			

			// Save Data on each Press
			mark_event(trials_data, globalClock, trials.thisIndex, 'RATE_FACES', event_types['RESPONSE'],
				resp.rt, key_map[resp.keys] , result)

			resp.keys = undefined;
			resp.rt = undefined;
		}

		// Show Slight Feedback
		if ((resp.clock.getTime() >= (respond_time + button_fb_duration)) && incorrect_rating == false) {
			// Continue Routine After Pressing Key

			// Prepare for next routin
			feedbackTimer.reset()
			return Scheduler.Event.NEXT;
		}

		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}
		return Scheduler.Event.FLIP_REPEAT;
	};
}

/**
 * Rate Faces Routine Feedback
 * @param {*} trials 
 * @returns 
 */
function rateFacesFeedback(trials) {
	return function () {
		let continueRoutine = true;
		 
		let t = feedbackTimer.getTime()
		// console.log('FEEDBACK: ',result)
		if (feedback_result_stim.status == PsychoJS.Status.NOT_STARTED) {
			feedback_result_stim.setAutoDraw(true)

			
			resp.clock.reset();  // t=0 on next screen flip
			resp.start(); // start on screen flip
			resp.clearEvents();

			mark_event(trials_data, globalClock, trials.thisIndex, 'RATE_FACES', event_types['FEEDBACK'],
				'NA', 'NA' , 'NA')
		}

		let theseKeys = resp.getKeys({ keyList: [correct_key], waitRelease: false });
		if (theseKeys.length > 0) {
			result = getResult(theseKeys[0].name)
		}

		// For Correct Trials, just show text and go to next routine
		if (result == 'correct' && t <= 0 ) {
			continueRoutine = false;
			if (correct_key == LEFT_KEY) {
				left_rect.setAutoDraw(true)
			} else {
				right_rect.setAutoDraw(true)
			}
		}

		// For incorrect trials, wait for keyboard press
		if (result == 'incorrect' && theseKeys.length > 0) {
			// continueRoutine = false;// just go to next face after clicking correct key
			respond_time = resp.clock.getTime()
			feedback_result_stim.setText('correct')

			if (correct_key == LEFT_KEY) {
				left_rect.setAutoDraw(true)
			} else {
				right_rect.setAutoDraw(true)
			}
		}

		// Another exit is after some time after the correct press was entered
		// This is for the incorrect trials
		// Show Slight Feedback
		// if (resp.clock.getTime() >= (respond_time + 1)) {
		// 	// Continue Routine After Pressing Key
		// 	continueRoutine = false;
		// }
	
		 
		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		} else {
			return Scheduler.Event.NEXT;
		}

	};
}


/**
 * Rate Faces Routine End
 * @param {*} trials 
 * @returns 
 */
function rateFacesEnd(trials) {
	return function () {
		stimImageStim.setAutoDraw(false)
		stimImageStim.status = PsychoJS.Status.NOT_STARTED		 
		
		left_text.setAutoDraw(false)
		left_text.status = PsychoJS.Status.NOT_STARTED
		left_rect.setAutoDraw(false)
		left_rect.status = PsychoJS.Status.NOT_STARTED

		right_text.setAutoDraw(false)
		right_text.status = PsychoJS.Status.NOT_STARTED
		right_rect.setAutoDraw(false)
		right_rect.status = PsychoJS.Status.NOT_STARTED

		feedback_result_stim.setAutoDraw(false)
		feedback_result_stim.status = PsychoJS.Status.NOT_STARTED
		 
		resp.stop()
		resp.status = PsychoJS.Status.NOT_STARTED
		sendData()
		return Scheduler.Event.NEXT;
	};
}


var accepted;
var waited;
var high_offer;
// var theseKeys;
var missed;
var pressed;
var showed_missed;
var offer_withdrew;
var saved;
var globalTrialNumber = 0;
var starting_index = 0
var lastTimePoint;

var high_tone;
var low_tone;
var tone_sound;
var stim_image;
var too_slow;

function trialRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		t = 0;
		trialClock.reset(); // clock
		toneClock.reset(); // toneclock
		frameN = -1;

		

		// Set High or Low Tone
		if (tone == 'high') {
			//tone_sound = high_tone

			tone_sound = new Sound({
				win: psychoJS.window,
				value: 'high_tone.mp3'
			});
		} else if (tone == 'low') {
			//tone_sound = low_tone

			tone_sound = new Sound({
				win: psychoJS.window,
				value: 'low_tone.mp3'
			});
		}

		// Set the Sounds Ojbect 
		tone_sound.setVolume(1.0);

		// Initialize the image
		stimImageStim = new visual.ImageStim({
			win : psychoJS.window,
			name : 'stimPath', units : 'height', 
			image : stim_paths, mask : undefined,
			ori : 0, pos : [0, 0], opacity : 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});
		stimImageStim.status = PsychoJS.Status.NOT_STARTED // set image Status
	
		currentTrialNumber.setText(`Trial: ${trial_number} / ${trials.nStim}`)
		console.log("Trial Number: ", trial_number, ' Tone: ', tone, stim_paths)

		endClock.reset()

		resetRects() // reset rect stims
	
		resp.keys = undefined;
		resp.rt = undefined;
		pressed = false;
		too_slow = false;

		left_text.pos[1] = og_positions['left_text'][1]
		left_rect.pos[1] = og_positions['left_rect'][1]
		right_text.pos[1] = og_positions['right_text'][1]
		right_rect.pos[1] = og_positions['right_rect'][1]

		// For This block move the text slighty down
		left_text.pos[0] = -0.25
		left_text.pos[1] = -0.5
		left_rect.pos[0] = left_text.pos[0]
		left_rect.pos[1] = left_text.pos[1]
		
		right_text.pos[0] = 0.25
		right_text.pos[1] = -0.5
		right_rect.pos[0] = right_text.pos[0]
		right_rect.pos[1] = right_text.pos[1]

		correct_text.height = 0.11

		if (window.screen.width >= 2560)
		{
			left_text.pos[0] = -0.25
			left_text.pos[1] = -0.7
			left_rect.pos[0] = left_text.pos[0]
			left_rect.pos[1] = left_text.pos[1]
			
			feedback_result_stim.pos[1] = -0.7
		
			right_text.pos[0] = 0.25
			right_text.pos[1] = -0.7
			right_rect.pos[0] = right_text.pos[0]
			right_rect.pos[1] = right_text.pos[1]

			score_bar.pos[0] = .32
			score_bar_midline.pos[0] = .32
			score_slide.pos[0] = .32
			score_bar_top_text.pos[0] = .38
			score_bar_bottom_text.pos[0] = .38
			score_bar_midtop_text.pos[0] = .38
			score_bar_midbottom_text.pos[0] = .38
			score_bar_mid_text.pos[0] = .38

			tot_score_bar.pos[1] = -0.5
			tot_score_bar_midline.pos[1] = -0.5
			tot_score_slide.pos[1] = -0.5
			tot_score_bar_left_text.pos[1] = -0.4
			tot_score_bar_right_text.pos[1] = -0.4
			tot_score_bar_midleft_text.pos[1] = -0.4
			tot_score_bar_midright_text.pos[1] = -0.4
			tot_score_bar_mid_text.pos[1] = -0.4

			correct_text.height = 0.16
			correct_score_text.height = 0.16
			correct_score_text.pos[0] = 0.085
		}
	
		if (window.screen.width <= 1280)
		{
			left_text.pos[0] = -0.25
			left_text.pos[1] = -0.7
			left_rect.pos[0] = left_text.pos[0]
			left_rect.pos[1] = left_text.pos[1]

			feedback_result_stim.pos[1] = -0.7
		
			right_text.pos[0] = 0.25
			right_text.pos[1] = -0.7
			right_rect.pos[0] = right_text.pos[0]
			right_rect.pos[1] = right_text.pos[1]

			score_bar.pos[0] = .32
			score_bar_midline.pos[0] = .32
			score_slide.pos[0] = .32
			score_bar_top_text.pos[0] = .38
			score_bar_bottom_text.pos[0] = .38
			score_bar_midtop_text.pos[0] = .38
			score_bar_midbottom_text.pos[0] = .38
			score_bar_mid_text.pos[0] = .38

			tot_score_bar.pos[1] = -0.5
			tot_score_bar_midline.pos[1] = -0.5
			tot_score_slide.pos[1] = -0.5
			tot_score_bar_left_text.pos[1] = -0.4
			tot_score_bar_right_text.pos[1] = -0.4
			tot_score_bar_midleft_text.pos[1] = -0.4
			tot_score_bar_midright_text.pos[1] = -0.4
			tot_score_bar_mid_text.pos[1] = -0.4
			correct_text.height = 0.16
			correct_score_text.height = 0.16
			correct_score_text.pos[0] = 0.085
		}

		left_text.refresh()
		right_text.refresh()
		left_rect.refresh()
		right_rect.refresh()

		trial_type = stim_type + '_' + intensity
		mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['TONE_ONSET'],
			'NA', 'NA', tone)
		// Play Tone
		if (tone_sound) {
			tone_sound.play();
		}
		return Scheduler.Event.NEXT;
	};
}


var time_point;
var missed_timepoint;
var feedback_break;
var feedback_break_time_end;
var fixation_time_end;

function trialRoutinePlayTone(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise

		// get current time
		t = toneClock.getTime();
		// console.log(t)

		// // Play Tone
		// if (tone_sound) {
		// 	tone_sound.play();
		// }

		// Tone plays for only 300ms
		if (t >= 1.0) {
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
			stimClock.reset(); // stimclock
			return Scheduler.Event.NEXT;
		}
	};
}

function trialRoutineShowPredictionStim(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise

		t = stimClock.getTime()
		// Space for 200ms then show stim for 150ms
		if (t >= 0.05 && stimImageStim.status == PsychoJS.Status.NOT_STARTED) {
			prediction_text.setAutoDraw(true)
		}

		if (t >= 0.05 + STIM_DURATION) {
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
			// Clear Stim
			// prediction_text.setAutoDraw(false)
			prediction_text.status = PsychoJS.Status.FINISHED;

			respondClock.reset(); // response Clock
			return Scheduler.Event.NEXT;
		}
	};
}

var go_to_delay = false;
function trialRoutinePredictionRespond(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise	

		
	
		// get current time
		t = respondClock.getTime();
		// console.log(t)

		// Draw the Texts
		if (left_text.status == PsychoJS.Status.NOT_STARTED) {
			mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['PREDICTION_ONSET'],
				'NA', 'NA' , 'NA')
			// response_text.setAutoDraw(true)
			left_text.setAutoDraw(true)
			right_text.setAutoDraw(true)
			prediction_text.setAutoDraw(true)

			// TODO: Edit this mark event
			// mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['PREDICTION'],
			// 	'NA', 'NA' , 'NA')
		}

		// // animate the sliding bar
		// if (old_t != 0 && !pressed) {
		// 	// animate based on window refresh time, 
		// 	// in such a way that it goes from the top of the bar to the bottom in response_duration seconds.
		// 	score_slide.pos[1] -= (score_bar.height / (response_duration / (t - old_t)))
		// 	score_slide.draw()
		// 	score_slide.refresh()
		// 	score_bar.refresh()
		// 	score_bar_midline.refresh()
		// 	score_bar_top_text.refresh()
		// 	score_bar_bottom_text.refresh()
		// 	score_bar_midtop_text.refresh()
		// 	score_bar_midbottom_text.refresh()
		// 	score_bar_mid_text.refresh()
		// }

		// old_t = t

		// Get Resposne Keys
		// Get User Input
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
		if (!pressed && theseKeys.length > 0) {
			resp.keys = theseKeys[0].name;  // just the last key pressed
			resp.rt = theseKeys[0].rt;

			pressed = true

			if (resp.keys == LEFT_KEY) {
				response_for_result = LEFT_KEY
				//console.log('Pressed Left')
				response = 'angry'
				left_rect.setAutoDraw(true)
				// left_rect.fillColor = new util.Color(selectColor)
				left_rect.lineColor = new util.Color(selectColor)
				left_rect.height += 0.02
				left_rect.width += 0.02

				right_rect.setAutoDraw(false)

				//calculate possible score as function of time
				// y = mx + b = ((y2 - y1)/(x2 - x1))x - b
				// correct_score = Math.round(((((-50) - (50)) / (response_duration - 0)) * t) + 50)
				
			} else if (resp.keys == RIGHT_KEY) {
				response_for_result = RIGHT_KEY
				//console.log('Pressed Right')
				response = 'sad'
				right_rect.setAutoDraw(true)
				// right_rect.fillColor = new util.Color(selectColor)
				right_rect.lineColor = new util.Color(selectColor)
				right_rect.height += 0.02
				right_rect.width += 0.02

				left_rect.setAutoDraw(false)

				//calculate possible score as function of time
				// y = mx + b = ((y2 - y1)/(x2 - x1))x - b
				// correct_score = Math.round(((((-50) - (50)) / (response_duration - 0)) * t) + 50)
			}

			// Save Data on each Press
			mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['PREDICTION'],
					resp.rt, key_map[resp.keys] , getResult(key_map[resp.keys]))
			resp.keys = undefined;
			resp.rt = undefined;

			t = respondClock.reset();

			// If there is response_duration is false, then just go to
			// the next trial
			if (response_duration == 'false') {
				// continueRoutine = false
				go_to_delay = true
			}
		}

		// Go to Next Routine After the allowed duration
		// if (t >= 1.0) {
		if (pressed) {

			// Set too_slow flag to true if they never pressed the a key
			// if (!pressed) too_slow = true
			if (t >= 0.5) {
				go_to_delay = true
				if (t >= 1.0) {
					continueRoutine = false
				}
			}
		}

		if (go_to_delay)
		{
			left_text.setAutoDraw(false)
			right_text.setAutoDraw(false)
			left_rect.setAutoDraw(false)
			right_rect.setAutoDraw(false)
			prediction_text.setAutoDraw(false)
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
			// Clear Routine Stim
			response_text.setAutoDraw(false)
			response_text.status = PsychoJS.Status.NOT_STARTED
			left_text.setAutoDraw(false)
			left_text.status = PsychoJS.Status.NOT_STARTED
			left_rect.setAutoDraw(false)
			left_rect.status = PsychoJS.Status.NOT_STARTED

			right_text.setAutoDraw(false)
			right_text.status = PsychoJS.Status.NOT_STARTED
			right_rect.setAutoDraw(false)
			right_rect.status = PsychoJS.Status.NOT_STARTED

			stimImageStim.setAutoDraw(false)
			// score_bar.setAutoDraw(false)
			// score_bar_midline.setAutoDraw(false)
			// score_slide.setAutoDraw(false)
			// score_bar_top_text.setAutoDraw(false)
			// score_bar_bottom_text.setAutoDraw(false)
			// score_bar_midtop_text.setAutoDraw(false)
			// score_bar_midbottom_text.setAutoDraw(false)
			// score_bar_mid_text.setAutoDraw(false)

			// // reset score bar
			// score_slide.pos[1] = 0.4
			// score_slide.refresh()
			// old_t = 0

			// set_fixation_flag = true
			go_to_delay = false
			resp.status = PsychoJS.Status.NOT_STARTED
			pressed = false
			endClock.reset()
			return Scheduler.Event.NEXT;
		}
	};
}

/**
 * Show Stim Eithe the Sad or Angry Faces
 * @param {*} trials trial snapshot
 */
const STIM_DURATION = 0.150 // duration of the image
function trialRoutineShowStim(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise

		t = stimClock.getTime()
		// Space for 200ms then show stim for 150ms
		if (t >= 0.05 && stimImageStim.status == PsychoJS.Status.NOT_STARTED) {
			stimImageStim.setAutoDraw(true)
		
			mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FACE_ONSET'],
				'NA', 'NA' , stim_paths)
		}

		if (t >= 0.05 + STIM_DURATION) {
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
			// Clear Stim
			stimImageStim.setAutoDraw(false)
			stimImageStim.status = PsychoJS.Status.FINISHED;

			respondClock.reset(); // response Clock
			return Scheduler.Event.NEXT;
		}
	};
}

/**
 * Returns Either correct or incorrect depending on response
 * @param {*} response 
 */
function getResult(response) {
	// stim_type is a global variable
	if ((response == LEFT_KEY || response == 'left') && stim_type == 'angry') {
		return 'correct'
	} else if ((response == RIGHT_KEY || response == 'right') && stim_type == 'sad') {
		return 'correct'
	}
	return 'incorrect'
}

var old_t = 0
var correct_score = 0

var response;
/**
 * Respond Routine
 * @param {*} trials 
 * @returns 
 */
function trialRoutineRespond(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise	
		
	
		// get current time
		t = respondClock.getTime();

		// Draw the Texts
		if (left_text.status == PsychoJS.Status.NOT_STARTED) {
			// response_text.setAutoDraw(true)
			left_text.setAutoDraw(true)
			right_text.setAutoDraw(true)
			stimImageStim.setAutoDraw(true)
			score_bar.setAutoDraw(true)
			score_bar_midline.setAutoDraw(true)
			score_slide.setAutoDraw(true)
			score_bar_top_text.setAutoDraw(true)
			score_bar_bottom_text.setAutoDraw(true)
			score_bar_midtop_text.setAutoDraw(true)
			score_bar_midbottom_text.setAutoDraw(true)
			score_bar_mid_text.setAutoDraw(true)

			mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['CHOICE_ONSET'],
				'NA', 'NA' , 'NA')
		}

		// animate the sliding bar
		if (old_t != 0 && !pressed) {
			// animate based on window refresh time, 
			// in such a way that it goes from the top of the bar to the bottom in response_duration seconds.
			score_slide.pos[1] -= (score_bar.height / (response_duration / (t - old_t)))
			score_slide.draw()
			score_slide.refresh()
			score_bar.refresh()
			score_bar_midline.refresh()
			score_bar_top_text.refresh()
			score_bar_bottom_text.refresh()
			score_bar_midtop_text.refresh()
			score_bar_midbottom_text.refresh()
			score_bar_mid_text.refresh()
		}

		old_t = t

		// Get Resposne Keys
		// Get User Input
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
		if (!pressed && theseKeys.length > 0) {
			resp.keys = theseKeys[0].name;  // just the last key pressed
			resp.rt = theseKeys[0].rt;

			pressed = true

			if (resp.keys == LEFT_KEY) {
				response_for_result = LEFT_KEY
				//console.log('Pressed Left')
				response = 'angry'
				left_rect.setAutoDraw(true)
				// left_rect.fillColor = new util.Color(selectColor)
				left_rect.lineColor = new util.Color(selectColor)
				left_rect.height += 0.02
				left_rect.width += 0.02

				right_rect.setAutoDraw(false)

				//calculate possible score as function of time
				// y = mx + b = ((y2 - y1)/(x2 - x1))x - b
				correct_score = Math.round(((((-25) - (75)) / (response_duration - 0)) * t) + 75)
				
			} else if (resp.keys == RIGHT_KEY) {
				response_for_result = RIGHT_KEY
				//console.log('Pressed Right')
				response = 'sad'
				right_rect.setAutoDraw(true)
				// right_rect.fillColor = new util.Color(selectColor)
				right_rect.lineColor = new util.Color(selectColor)
				right_rect.height += 0.02
				right_rect.width += 0.02

				left_rect.setAutoDraw(false)

				//calculate possible score as function of time
				// y = mx + b = ((y2 - y1)/(x2 - x1))x - b
				correct_score = Math.round(((((-25) - (75)) / (response_duration - 0)) * t) + 75)
			}

			// Save Data on each Press
			mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['RESPONSE'],
					resp.rt, key_map[resp.keys] , getResult(key_map[resp.keys]))
			resp.keys = undefined;
			resp.rt = undefined;

			// If there is response_duration is false, then just go to
			// the next trial
			if (response_duration == 'false') {
				continueRoutine = false
			}
		}

		// Go to Next Routine After the allowed duration
		if (response_duration != 'false' && t >= response_duration) {

			// Set too_slow flag to true if they never pressed the a key
			if (!pressed) too_slow = true
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
			// Clear Routine Stim
			response_text.setAutoDraw(false)
			response_text.status = PsychoJS.Status.NOT_STARTED
			left_text.setAutoDraw(false)
			left_text.status = PsychoJS.Status.NOT_STARTED
			left_rect.setAutoDraw(false)
			left_rect.status = PsychoJS.Status.NOT_STARTED

			right_text.setAutoDraw(false)
			right_text.status = PsychoJS.Status.NOT_STARTED
			right_rect.setAutoDraw(false)
			right_rect.status = PsychoJS.Status.NOT_STARTED

			stimImageStim.setAutoDraw(false)
			score_bar.setAutoDraw(false)
			score_bar_midline.setAutoDraw(false)
			score_slide.setAutoDraw(false)
			score_bar_top_text.setAutoDraw(false)
			score_bar_bottom_text.setAutoDraw(false)
			score_bar_midtop_text.setAutoDraw(false)
			score_bar_midbottom_text.setAutoDraw(false)
			score_bar_mid_text.setAutoDraw(false)

			// reset score bar
			score_slide.pos[1] = 0.4
			score_slide.refresh()
			old_t = 0

			set_fixation_flag = true
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
		
		if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
			points_fixation_stim.color = new util.Color('white')
			points_fixation_stim.setText('+')
			points_fixation_stim.setAutoDraw(true)
			//console.log('Initial Fixation')

			mark_event(trials_data, globalClock, 'NA', trial_type, event_types['FIXATION_ONSET'],
				'NA', 'NA' , 'NA')

		}

		if (t_end >= 3) {
			continueRoutine = false
			points_fixation_stim.setAutoDraw(false)
			points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
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
			points_fixation_stim.setAutoDraw(false)
			points_fixation_stim.status = PsychoJS.Status.NOT_STARTED

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
		// dataType: 'JSON',
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
function trialRoutineEnd(trials) { //TODO: Change this so that there is a jittered fixation (with event) after the potential too slow feedback.
	return function () {
		//------Ending Routine 'trial'-------
		t = endClock.getTime()

		if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED)
		{

			if (too_slow) {
				// //rightangryStim.setAutoDraw(false)
				points_fixation_stim.setText('')
				// mark_event(trials_data, globalClock, 'NA', trial_type, event_types['FEEDBACK'],
				// 	'NA', 'NA', 'too slow')
				points_fixation_stim.setAutoDraw(true)
			} else {
				if (t < 1.5) {
					if (response_for_result == LEFT_KEY && stim_type == 'angry') {
						rightangryStim.setAutoDraw(true)
						correct_score_text.setText(correct_score)
						if (correct_score < 0) {
							correct_score_text.color = new util.Color('#ff0000')
						}
						else {
							correct_score_text.setText("+" + correct_score)
							correct_score_text.color = new util.Color('#00ff00')
						}
						correct_score_text.setAutoDraw(true)
						correct_text.setAutoDraw(true)
						if (mark_feedback == true) {
							total_score += correct_score
							mark_feedback = false
							mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FEEDBACK'],
								'NA', correct_score, 'correct angry')
						}
					}
					else if (response_for_result == RIGHT_KEY && stim_type == 'angry') {
						wrongangryStim.setAutoDraw(true)
						if (mark_feedback == true) {
							total_score -= 50
							mark_feedback = false
							mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FEEDBACK'],
								'NA', -50, 'wrong angry')
						}
					}
					else if (response_for_result == LEFT_KEY && stim_type == 'sad') {
						wrongsadStim.setAutoDraw(true)
						if (mark_feedback == true) {
							total_score -= 50
							mark_feedback = false
							mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FEEDBACK'],
								'NA', -50, 'wrong sad')
						}
					}
					else if (response_for_result == RIGHT_KEY && stim_type == 'sad') {
						rightsadStim.setAutoDraw(true)
						correct_score_text.setText(correct_score)
						if (correct_score < 0) {
							correct_score_text.color = new util.Color('#ff0000')
						}
						else {
							correct_score_text.setText("+" + correct_score)
							correct_score_text.color = new util.Color('#00ff00')
						}
						correct_score_text.setAutoDraw(true)
						correct_text.setAutoDraw(true)
						if (mark_feedback == true) {
							total_score += correct_score
							mark_feedback = false
							mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FEEDBACK'],
								'NA', correct_score, 'correct sad')
						}
					}

					// // score range 0 - 16800
					// if (total_score <= 0)
					// {
					// 	total_score = 0
					// }
					// tot_score_slide.pos[0] = ((0.5 - (-0.5)) / ((total_trials * 50))) * (total_score) - 0.5
					// if (tot_score_slide.pos[0] < -0.5)
					// {
					// 	tot_score_slide.pos[0] = -0.5
					// }
					// else if (tot_score_slide.pos[0] > 0.5)
					// {
					// 	tot_score_slide.pos[0] = 0.5
					// }


					// // score range -67200 - 16800
					// if (total_score < 0) {
					// 	tot_score_slide.pos[0] = ((0 - (-0.5)) / (0 - (total_trials * (-200)))) * (total_score)
					// }
					// else {
					// 	tot_score_slide.pos[0] = ((0.5 - (0)) / ((total_trials * 50))) * (total_score)
					// }
					// if (tot_score_slide.pos[0] < -0.5)
					// {
					// 	tot_score_slide.pos[0] = -0.5
					// }

					// // score range 0 - 336
					if (total_score <= 0)
					{
						total_score = 0
					}
					else if (total_score >= 500)
					{
						// total_score = total_trials
						total_score = 500
					}

					//tot_score_slide.pos[0] = ((0.5 - (-0.5)) / ((total_trials * 50) / 50)) * (total_score) - 0.5
					tot_score_slide.pos[0] = ((0.5 - (-0.5)) / (500)) * (total_score) - 0.5
					
					if (tot_score_slide.pos[0] < -0.5)
					{
						tot_score_slide.pos[0] = -0.5
					}
					else if (tot_score_slide.pos[0] > 0.5)
					{
						tot_score_slide.pos[0] = 0.5
					}

					tot_score_slide.refresh()

					tot_score_bar.setAutoDraw(true)
					tot_score_bar_midline.setAutoDraw(true)
					tot_score_slide.setAutoDraw(true)
					tot_score_bar_left_text.setAutoDraw(true)
					tot_score_bar_midleft_text.setAutoDraw(true)
					tot_score_bar_mid_text.setAutoDraw(true)
					tot_score_bar_midright_text.setAutoDraw(true)
					tot_score_bar_right_text.setAutoDraw(true)
				}
				if (t >= 1.5)
				{
					if (response_for_result == LEFT_KEY && stim_type == 'angry') {
						rightangryStim.setAutoDraw(false)
						correct_score_text.setAutoDraw(false)
						correct_text.setAutoDraw(false)
					}
					else if (response_for_result == RIGHT_KEY && stim_type == 'angry') {
						wrongangryStim.setAutoDraw(false)
					}
					else if (response_for_result == LEFT_KEY && stim_type == 'sad') {
						wrongsadStim.setAutoDraw(false)
					}
					else if (response_for_result == RIGHT_KEY && stim_type == 'sad') {
						rightsadStim.setAutoDraw(false)
						correct_score_text.setAutoDraw(false)
						correct_text.setAutoDraw(false)
					}
					points_fixation_stim.setText('+')
					mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FIXATION_ONSET'],
						'NA', 'NA', 'NA')
					
					points_fixation_stim.setAutoDraw(true)
					tot_score_bar.setAutoDraw(false)
					tot_score_bar_midline.setAutoDraw(false)
					tot_score_slide.setAutoDraw(false)
					tot_score_bar_left_text.setAutoDraw(false)
					tot_score_bar_midleft_text.setAutoDraw(false)
					tot_score_bar_mid_text.setAutoDraw(false)
					tot_score_bar_midright_text.setAutoDraw(false)
					tot_score_bar_right_text.setAutoDraw(false)
				}
			}
			//rightangryStim.setAutoDraw(true)
			//points_fixation_stim.setAutoDraw(true)
			//console.log('End Fixation')
		}
		else
		{
			if (too_slow && set_fixation_flag) {
				if (t < 1.5)
				{
					points_fixation_stim.setAutoDraw(false)
					points_fixation_stim.setText('+')
					if (stim_type == 'angry') {
						slowangryStim.setAutoDraw(true)
						if (mark_feedback == true) {
							total_score -= 200
							mark_feedback = false
							mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FEEDBACK'],
								'NA', -200, 'too slow angry')
						}
					}
					else if (stim_type == 'sad') {
						slowsadStim.setAutoDraw(true)
						if (mark_feedback == true) {
							total_score -= 200
							mark_feedback = false
							mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FEEDBACK'],
								'NA', -200, 'too slow sad')
						}
					}

					// // score range 0 - 16800
					// if (total_score <= 0)
					// {
					// 	total_score = 0
					// }
					// tot_score_slide.pos[0] = ((0.5 - (-0.5)) / ((total_trials * 50))) * (total_score) - 0.5
					// if (tot_score_slide.pos[0] < -0.5)
					// {
					// 	tot_score_slide.pos[0] = -0.5
					// }
					// else if (tot_score_slide.pos[0] > 0.5)
					// {
					// 	tot_score_slide.pos[0] = 0.5
					// }


					// // score range -67200 - 16800
					// if (total_score < 0) {
					// 	tot_score_slide.pos[0] = ((0 - (-0.5)) / (0 - (total_trials * (-200)))) * (total_score)
					// }
					// else {
					// 	tot_score_slide.pos[0] = ((0.5 - (0)) / ((total_trials * 50))) * (total_score)
					// }
					// if (tot_score_slide.pos[0] < -0.5)
					// {
					// 	tot_score_slide.pos[0] = -0.5
					// }

					// // score range 0 - 336
					if (total_score <= 0)
					{
						total_score = 0
					}
					else if (total_score >= 500)
					{
						// total_score = total_trials
						total_score = 500
					}

					//tot_score_slide.pos[0] = ((0.5 - (-0.5)) / ((total_trials * 50) / 50)) * (total_score) - 0.5
					tot_score_slide.pos[0] = ((0.5 - (-0.5)) / (500)) * (total_score) - 0.5

					if (tot_score_slide.pos[0] < -0.5)
					{
						tot_score_slide.pos[0] = -0.5
					}
					else if (tot_score_slide.pos[0] > 0.5)
					{
						tot_score_slide.pos[0] = 0.5
					}

					tot_score_slide.refresh()

					tot_score_bar.setAutoDraw(true)
					tot_score_bar_midline.setAutoDraw(true)
					tot_score_slide.setAutoDraw(true)
					tot_score_bar_left_text.setAutoDraw(true)
					tot_score_bar_midleft_text.setAutoDraw(true)
					tot_score_bar_mid_text.setAutoDraw(true)
					tot_score_bar_midright_text.setAutoDraw(true)
					tot_score_bar_right_text.setAutoDraw(true)
				}
				if (t >= 1.5)
				{
					if (stim_type == 'angry') {
						slowangryStim.setAutoDraw(false)
					}
					else if (stim_type == 'sad') {
						slowsadStim.setAutoDraw(false)
					}
					points_fixation_stim.setAutoDraw(true)
					points_fixation_stim.setText('+')
					set_fixation_flag = false
					mark_event(trials_data, globalClock, 'NA', trial_type, event_types['FIXATION_ONSET'],
						'NA', 'NA', 'NA')
					
					tot_score_bar.setAutoDraw(false)
					tot_score_bar_midline.setAutoDraw(false)
					tot_score_slide.setAutoDraw(false)
					tot_score_bar_left_text.setAutoDraw(false)
					tot_score_bar_midleft_text.setAutoDraw(false)
					tot_score_bar_mid_text.setAutoDraw(false)
					tot_score_bar_midright_text.setAutoDraw(false)
					tot_score_bar_right_text.setAutoDraw(false)
				}
			}
		}
		
		if (too_slow)
		{
			// hold the fixation for 2 second + jitter
			if (t <= ITI + 1.5) {
				return Scheduler.Event.FLIP_REPEAT;
			}
			else if (t < ITI + 1.5 + 1.5) {
				// if (trial_number + 1 == 56) {
				// 	points_fixation_stim.setText('~ 25 minutes remaining')
				// }
				// else if (trial_number + 1 == 112) {
				// 	points_fixation_stim.setText('~ 20 minutes remaining')
				// }
				// else if (trial_number + 1 == 168) {
				// 	points_fixation_stim.setText('~ 15 minutes remaining')
				// }
				// else if (trial_number + 1 == 224) {
				// 	points_fixation_stim.setText('~ 10 minutes remaining')
				// }
				// else if (trial_number + 1 == 280) {
				// 	points_fixation_stim.setText('~ 5 minutes remaining')
				// }
				return Scheduler.Event.FLIP_REPEAT;
			} else {
				resp.stop()
				resp.status = PsychoJS.Status.NOT_STARTED
				//sendData()

				// Clear Fixation
				points_fixation_stim.setAutoDraw(false)
				points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
				mark_feedback = true;

				return Scheduler.Event.NEXT;
			}
		}
		else
		{
			// hold the fixation for jitter time
			if (t <= ITI + 1.5) {
				return Scheduler.Event.FLIP_REPEAT;
			}
			else if (t < ITI + 1.5 + 1.5) {
				// if (trial_number + 1 == 56) {
				// 	points_fixation_stim.setText('~ 25 minutes remaining')
				// }
				// else if (trial_number + 1 == 112) {
				// 	points_fixation_stim.setText('~ 20 minutes remaining')
				// }
				// else if (trial_number + 1 == 168) {
				// 	points_fixation_stim.setText('~ 15 minutes remaining')
				// }
				// else if (trial_number + 1 == 224) {
				// 	points_fixation_stim.setText('~ 10 minutes remaining')
				// }
				// else if (trial_number + 1 == 280) {
				// 	points_fixation_stim.setText('~ 5 minutes remaining')
				// }
				return Scheduler.Event.FLIP_REPEAT;
			} else {
				resp.stop()
				resp.status = PsychoJS.Status.NOT_STARTED
				//sendData()

				// Clear Fixation
				points_fixation_stim.setAutoDraw(false)
				points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
				mark_feedback = true

				return Scheduler.Event.NEXT;
			}
		}
	};
}

var readyComponents;
var thanksComponents;
function thanksRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'thanks'-------
		// Clear Trial Components
		t = 0;
		thanksClock.reset(); // clock
		frameN = -1;
		routineTimer.add(20.000000);

		// Show Final Points and money earned
		// 100 points = 10 cents
		thanksText.setText(`This is the end of the task run.\n\n\n Total Dates Earned: ${totalDates}`)
		// update component parameters for each repeat
		// keep track of which components have finished
		thanksComponents = [];
		// thanksComponents.push(thanksText);

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
		}

		frameRemains = 0.0 + 2.0 - psychoJS.window.monitorFramePeriod * 0.75;  // most of one frame period left
		if (thanksText.status === PsychoJS.Status.STARTED && t >= frameRemains) {
			thanksText.setAutoDraw(false);
		}
		// check for quit (typically the Esc key)
		if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// check if the Routine should terminate
		if (!continueRoutine) {  // a component has requested a forced-end of Routine
			return Scheduler.Event.NEXT;
		}

		continueRoutine = false;  // reverts to True if at least one component still running
		for (const thisComponent of thanksComponents)
			if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
				continueRoutine = true;
				break;
			}
		
		// reverts to true if we are still waiting for http requests to finish
		if (total_requests > 0)
		{
			continueRoutine = true
		}

		// refresh the screen if continuing
		if (continueRoutine && routineTimer.getTime() > 0) {
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
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
		if (typeof loop !== 'undefined')
		{
			// ------Check if user ended loop early------
			if (loop.finished){
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
		if (main_loop_count % 10 == 0) {
			console.log("sending data")
			sendData()
		}
		else if (main_loop_count == last_trial_num)
		{
			console.log("sending data")
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
