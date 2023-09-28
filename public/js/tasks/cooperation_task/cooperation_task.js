/**
 * Cooperation Task
 * A modifieid version of 3-Arm Bandit
 * See the README.md file for more information about this task
 * @author James Touthang <james@touthang.info>
 */


var event_types = {
	'INSTRUCT_ONSET': 1,
	'TASK_ONSET': 2,
	'BLOCK_ONSET': 3,
	'TRIAL_ONSET': 4,
	'SELECTION': 5,
	'FIXATION_ONSET': 6,
	'OUTCOME_IMAGE_ONSET': 7,
	'OUTCOME_SOUND_ONSET': 8,
	'AUDIO_ONSET': 9
}

/*jshint -W069 */
/*Disable Warning Justification:
	Using bracket notation because it's familiar coding convention with python
	Counterpart
*/

var play_sound = false;
var clear_keys = false;

var score_one = 0;
var score_two = 0;
var score_three = 0;
var score_one_pos = 0;
var score_two_pos = 0;
var score_three_pos = 0;
var score_one_neg = 0;
var score_two_neg = 0;
var score_three_neg = 0;

var trials_data = []
var main_loop_count = 0
var last_trial_num = 0
var total_requests = 0
var g = {}				// global variables
g.PLEASANT_COLOR = '#00ff00' //'green';
g.UNPLEASANT_COLOR = '#ff0000' //'red';
g.PLEASANT_COLOR_2 = '#66ff99' //'pale green';
g.UNPLEASANT_COLOR_2 = '#f70546' // pinkish red

g.FORCED_DELAY = 0.1; // forced delay duration (amount of time after outcome and wait for press)

g.outcome_media = {
	'negative': [], 	// holds negative image
	'positive': [],		// holds positive imaage
	'neutral': []
}

// Text response to dislpay after choosing a selection.
g.outcome_text_responses = {
	'accept': "Sure, I'll help!",
	'reject': "Too bad!" 
}

var speech_img = 'speech_good'

// Variable to hold the actual reponse
g.outcome_text_response = '';

// Text to show at the bottom of the screen during each trial
g.game_type_text = {
	'pleasant': `You will be shown the neutral image unless the person you choose decides to help you.`,
	'unpleasant': `You will be shown the unpleasant image unless the person you choose decides to help you.`
}

var LEFT_KEY = 'left'
var RIGHT_KEY = 'right'
var UP_KEY = 'up'

 import { core, data, sound, util, visual } from '/psychojs/psychojs-2021.2.3.js';
 const { PsychoJS } = core;
 const { TrialHandler } = data;
 const { Scheduler } = util;
 //some handy aliases as in the psychopy scripts;
 const { abs, sin, cos, PI: pi, sqrt } = Math;
const { round } = util;
 
import { Sound } from '/lib/sound-2020.1.js';

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

/**
 * Returns array of unique paths
 * @param {*} resources 
 */
function removeDuplicates(resources) {
	let new_resources = []
	let paths_added = []
	resources.forEach(element => {
		if (!paths_added.includes(element.path)) {
			paths_added.push(element.path)  // add path to paths addded.
			new_resources.push(element)		// then add to resources

		}
	})
	return new_resources
}
// init psychoJS:
const psychoJS = new PsychoJS({
	debug: false
});


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
					url: '/js/tasks/cooperation_task/' + getQueryVariable('run'),
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
							// console.log(obj)
							if (obj.audio_path && obj.audio_path != '\n'){
								resources.push({ name: obj.audio_path, path: obj.audio_path })
							}
						}
						resolve(data)
					}
				})
				
			})
		})
		// Add Faces Media to Resrouces
		.then((values) => {			
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: '/js/tasks/cooperation_task/media/faces_paths.csv',
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
							if (obj.stim_paths && obj.stim_paths != undefined) {
								resources.push({ name: obj.stim_paths , path: obj.stim_paths  })
							}
						}
						resolve(data)
					}
				})
			})
		})

		// Add Outcome Picture and Audio to resources
		// Add Faces Media to Resrouces
		.then((values) => {			
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: '/js/tasks/cooperation_task/outcome_media_schedule.csv',
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
							if (obj.image_path && obj.image_path != undefined) {
								resources.push({ name: obj.image_path , path: obj.image_path  })
							}

							// If there's media add to resources
							// if (obj.neutral_image_path && obj.neutral_image_path != undefined) {
							// 	resources.push({ name: obj.neutral_image_path , path: obj.neutral_image_path  })
							// }

							

							// Push to their designated outcome lists
							if (obj.outcome_type == 'negative') {
								g.outcome_media.negative.push([
									obj.image_path
								])
							} 
							if (obj.outcome_type == 'positive')  {
								g.outcome_media.positive.push([
									obj.image_path
								])
							}
							if (obj.outcome_type == 'neutral')  {
								g.outcome_media.neutral.push([
									obj.image_path
								])
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
						g.total_trials = 0
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

			// Sanitze the resources. Needs to be clean so that psychoJS doesn't complain
			resources = sanitizeResources(resources)
			// console.log(resources)
			let uniq_resources = removeDuplicates(resources)
			// console.log(resources)
			// console.log(g.outcome_media)
			// expInfo.study = study
			psychoJS.start({
				expName, 
				expInfo,
				resources: uniq_resources,
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
let expName = 'Cooperation Task';  // from the Builder filename that created this script
var expInfo = { 'participant': '', 'session': '', 'run_id': '', 'date': formatDate(), 'study': '', };

// Add Slides to resources
var resources = [
	{ name: 'practice_schedule.csv', path: '/js/tasks/cooperation_task/practice_schedule.csv' },
	{ name: 'faces_paths.csv', path: '/js/tasks/cooperation_task/faces_paths.csv' }, // faces lists
	{ name: 'PRACTICE_ready', path: '/js/tasks/cooperation_task/media/instructions/Slide20.jpeg' },
	{ name: 'PRACTICE_ready_audio.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/Slide20.mp3' },
	{ name: 'MAIN_ready', path: '/js/tasks/cooperation_task/media/instructions/Slide21.jpeg' },
	{ name: 'MAIN_ready_audio.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/Slide21.mp3' },
	{ name: 'INSTR_POS_slide', path: '/js/tasks/cooperation_task/media/instructions/Slide22.jpeg' },
	{ name: 'INSTR_NEG_slide', path: '/js/tasks/cooperation_task/media/instructions/Slide23.jpeg' },
	{ name: 'instr_pos_cb.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/CooperationTaskInstructionsSlide_BeforeStart_positive.mp3' },
	{ name: 'instr_neg_cb.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/CooperationTaskInstructionsSlide_BeforeStart_negative.mp3' },
	{ name: 'BEGIN_slide', path: '/js/tasks/cooperation_task/media/instructions/Slide24.jpeg' },
	{ name: 'BLOCK2_POS_slide', path: '/js/tasks/cooperation_task/media/instructions/Slide26.jpeg' },
	{ name: 'BLOCK2_NEG_slide', path: '/js/tasks/cooperation_task/media/instructions/Slide25.jpeg' },
	{ name: 'block2_pos_cb.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/CooperationTaskInstructionsSlide_BeforeBlock2_positive.mp3' },
	{ name: 'block2_neg_cb.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/CooperationTaskInstructionsSlide_BeforeBlock2_negative.mp3' },
	{ name: 'LAST_POS_slide', path: '/js/tasks/cooperation_task/media/instructions/Slide28.jpeg' },
	{ name: 'LAST_NEG_slide', path: '/js/tasks/cooperation_task/media/instructions/Slide27.jpeg' },
	{ name: 'last_pos_cb.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/CooperationTaskInstructionsSlide_BeforeLast_positive.mp3' },
	{ name: 'last_neg_cb.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/CooperationTaskInstructionsSlide_BeforeLast_negative.mp3' },
	{ name: 'positive_face', path: '/js/tasks/cooperation_task/media/smile.png' },
	{ name: 'negative_face', path: '/js/tasks/cooperation_task/media/frown.png' },
	{ name: 'neutral_face', path: '/js/tasks/cooperation_task/media/neutral_noface.png' },
	{ name: 'nothing', path: '/js/tasks/cooperation_task/media/nothing.png' },
	{ name: 'speech', path: '/js/tasks/cooperation_task/media/speech.png' },
	{ name: 'speech_good', path: '/js/tasks/cooperation_task/media/speech_good.png' },
	{ name: 'speech_bad', path: '/js/tasks/cooperation_task/media/speech_bad.png' },
	{ name: 'coop_neut_sound.mp3', path: '/js/tasks/cooperation_task/media/neut.mp3' },
	{ name: 'coop_pos_sound.mp3', path: '/js/tasks/cooperation_task/media/pos.mp3' },
	{ name: 'scream.wav', path: '/js/tasks/cooperation_task/media/neg.mp3' },
	{ name: 'pleasant_bottom_text', path: '/js/tasks/cooperation_task/media/pleasant_text_bottom.png' },
	{ name: 'unpleasant_bottom_text', path: '/js/tasks/cooperation_task/media/unpleasant_text_bottom.png'},
]

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

// PRACTICE BLOCK
// Pratice blocks skipped over if it's a R2
if (!getQueryVariable('skip_practice') && !getQueryVariable('run').includes('R2')  ) {
	// Single Slide
	flowScheduler.add(readyRoutineBegin('PRACTICE'));
	flowScheduler.add(readyRoutineEachFrame());
	flowScheduler.add(readyRoutineEnd());

	const practiceTrialsLoopScheduler = new Scheduler(psychoJS);
	flowScheduler.add(practiceTrialsLoopBegin, practiceTrialsLoopScheduler);
	flowScheduler.add(practiceTrialsLoopScheduler);
	flowScheduler.add(trialsLoopEnd);

	flowScheduler.add(readyRoutineBegin('SLIDE', 'MAIN_ready', 'MAIN_ready_audio.mp3'));
	flowScheduler.add(readyRoutineEachFrame());
	flowScheduler.add(readyRoutineEnd());
}

// MAIN BLOCK
// Ready Routine

flowScheduler.add(readyRoutineBegin('CB', 'INSTR_POS_slide', 'instr_pos_cb.mp3'));
flowScheduler.add(readyRoutineEachFrame());
flowScheduler.add(readyRoutineEnd());
	

flowScheduler.add(readyRoutineBegin('MAIN', 'BEGIN_slide', undefined));
flowScheduler.add(readyRoutineEachFrame());
flowScheduler.add(readyRoutineEnd());

const trialsLoopScheduler = new Scheduler(psychoJS);
flowScheduler.add(trialsLoopBegin, trialsLoopScheduler);
flowScheduler.add(trialsLoopScheduler);
flowScheduler.add(trialsLoopEnd);

flowScheduler.add(readyRoutineBegin('CB2', 'INSTR_POS_slide', 'instr_pos_cb.mp3'));
flowScheduler.add(readyRoutineEachFrame());
flowScheduler.add(readyRoutineEnd());

const trialsLoopScheduler2 = new Scheduler(psychoJS);
flowScheduler.add(trialsLoopBegin2, trialsLoopScheduler2);
flowScheduler.add(trialsLoopScheduler2);
flowScheduler.add(trialsLoopEnd);

flowScheduler.add(thanksRoutineBegin());
flowScheduler.add(thanksRoutineEachFrame());
flowScheduler.add(thanksRoutineEnd());
flowScheduler.add(quitPsychoJS, '', true);

// quit if user presses Cancel in dialog box:
dialogCancelScheduler.add(quitPsychoJS, '', false);

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

var slides;
var instructClock;
var ready;
var blockClock;
var points_fixation_stim;
var t_end;
var readyClock;
var endClock;
var track;
var resp;
var thanksClock;
var thanksText;
var globalClock;
var routineTimer;
var base_score_one;
var base_score_two;
var base_score_three;
var base_score_one_pos;
var base_score_two_pos;
var base_score_three_pos;
var base_score_one_neg;
var base_score_two_neg;
var base_score_three_neg;
function experimentInit() {
	// Check if there is an practice
	if (getQueryVariable('practice') == 'true') {
		practice = true;
		//console.log("PRACTICE SESSION!")
	}
	// Initialize components for Routine "instruct"
	instructClock = new util.Clock();
	instructClock.reset()

	g.slideStim = new visual.ImageStim({
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
	
	ready = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	// Initialize components for Routine "trial"
	blockClock = new util.Clock();

	g.game_number = 1
	g.text_game_number  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_game_number',
		text: 'Game Number:', alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [-0.95, 0.9], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_game_number  = new visual.TextStim({
		win: psychoJS.window,
		name: 'game_number',
		text: '1', alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [-0.3, 0.9], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.trial_number = 1;
	g.text_trial_number  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_trial_number',
		text: 'Choice Number:',alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [-0.95, 0.8], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_trial_number  = new visual.TextStim({
		win: psychoJS.window,
		name: 'trial_number',
		text: '1',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [-0.3, 0.8], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});


	g.text_game_type  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_game_type',
		text: 'Game Type:',alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [0.2, 0.9], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_game_type = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_val_game_type',
		text: '0',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.85, 0.9], height: 0.1, wrapWidth: undefined, ori: 0, bold: true,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.game_room_score = new visual.TextStim({
		win: psychoJS.window,
		name: 'game_room_score',
		text: '0',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.85, 0.75], height: 0.08, wrapWidth: undefined, ori: 0, bold: true,
		color: new util.Color('white'), opacity: 1,
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

	// Black Rectangle. Used as the background for the outcome text
	g.black_rectangle = new visual.Rect({
		win: psychoJS.window,
		name: 'black_rect',
		width: 2,
		height: 2,
		units: 'norm',
		pos: [0, 0 ], ori: 0,
		fillColor: new util.Color('black'),
		lineColor: new util.Color('black'), opacity: 1,
		depth: 0
	})

	// Outcome TextStim
	g.outcome_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'outcome_text',
		text: 'Place Outcome text here.',
		font: 'Arial',
		units: 'norm',
		pos: [0, -0.33], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('black'), opacity: 1,
		depth: 1.0
	});

	// Outcome TextStim
	g.outcome_text_bubble = new visual.ImageStim({
		win: psychoJS.window,
		image: 'speech',
		units: 'norm',
		pos: [0, -0.33], height: 0.05, wrapWidth: undefined, ori: 0,
		depth: 0.0
	});

	// Game Type  Explanation
	g.game_type_text_image_stim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'bottom_text_image', units : 'height', 
		image : 'pleasant_bottom_text', mask : undefined,
		ori : 0, pos: [0, -0.2], opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	endClock = new util.Clock();

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

	// Create some handy timers
	globalClock = new util.Clock();  // to track the time since experiment started
	routineTimer = new util.CountdownTimer();  // to track time remaining of each (non-slip) routine
	g.outcomeTimer = new util.CountdownTimer(); // timer for when to go to next trial

	globalClock.reset() // start Global Clock

	mark_event(trials_data, globalClock, 'NA', 'NA', event_types['TASK_ONSET'],
				'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
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
	
	psychoJS.experiment.addLoop(slides); // add the loop to the experiment

	const snapshot = slides.getSnapshot();
	thisScheduler.add(importConditions(snapshot));
	thisScheduler.add(instructRoutineBegin(snapshot));
	thisScheduler.add(instructSlideRoutineEachFrame(snapshot, slides));
	thisScheduler.add(instructRoutineEnd(snapshot));
	thisScheduler.add(endLoopIteration(thisScheduler, snapshot));

	// console.log(thisScheduler)
	block_type = 'INSTRUCTIONS'
	mark_event(trials_data, globalClock, 'NA', block_type, event_types['BLOCK_ONSET'],
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
		g.slideStim.setImage(instruct_slide)
		// update component parameters for each repeat
		ready.keys = undefined;
		ready.rt = undefined;
		// keep track of which components have finished
		instructComponents = [ g.slideStim];
	
		instructComponents.push(ready);

		//console.log("InstructionSlides Index: ", trials.thisIndex)
		instruct_prev_pressed = false
		
		if (audio_path) {
			track = new Sound({
				win: psychoJS.window,
				value: audio_path
			  });
			//console.log(audio_path)
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
		//ready.getKeys() // clear the buffer
		//------Loop for each frame of Routine 'instruct'-------
		let continueRoutine = true; // until we're told otherwise
		// get current time
		t = instructClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
		// update/draw components on each frame

		// *instrText1* updates
		if (t >= 0 && g.slideStim.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			g.slideStim.tStart = t;  // (not accounting for frame time here)
			g.slideStim.frameNStart = frameN;  // exact frame index
			g.slideStim.setAutoDraw(true);
			// instrText1.setAutoDraw(true);
		}

		// New Slide Call, set it after pressing key
		// console.log(track.status)
		if (newSlide) {
			//console.log('setting new image', instruct_slide, 'index:',trials.thisIndex, 'Audio: ',audio_path)
			g.slideStim.setImage(instruct_slide)
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
					//console.log('setting new audio')
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

		if (track) {
			track.stop()
		}

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
function readyRoutineBegin(block_type, image_stim, audio_stim) {
	return function () {
		//------Prepare to start Routine 'ready'-------
		t = 0;
		psychoJS.eventManager.clearEvents()
		readyClock.reset(); // clock
		frameN = -1;

		// Set readyStim based on block_type
		//console.log('block_type: ',block_type)
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
					image : image_stim, mask : undefined,
					ori : 0, pos : [0, 0],
					color : new util.Color([1, 1, 1]), opacity : 1,
					flipHoriz : false, flipVert : false,
					texRes : 128, interpolate : true, depth : 0
				});

				// track = new Sound({
				// 	win: psychoJS.window,
				// 	value: 'MAIN_ready_audio.mp3'
				// });
				// track.setVolume(1.0);
				if (audio_stim) {
					track = new Sound({
						win: psychoJS.window,
						value: audio_stim
					});
					track.setVolume(1.0);
				} else {
					track = undefined;
				}
				break
			case 'CB':
				if (expInfo.run == "Pilot_R1.json")
				{
					readyStim = new visual.ImageStim({
						win : psychoJS.window,
						name : 'INSTR_POS_slide', units : 'height', 
						image : 'INSTR_POS_slide', mask : undefined,
						ori : 0, pos : [0, 0],
						color : new util.Color([1, 1, 1]), opacity : 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});
	
					// track = new Sound({
					// 	win: psychoJS.window,
					// 	value: 'MAIN_ready_audio.mp3'
					// });
					// track.setVolume(1.0);
					if ('instr_pos_cb.mp3') {
						track = new Sound({
							win: psychoJS.window,
							value: 'instr_pos_cb.mp3'
						});
						track.setVolume(1.0);
					} else {
						track = undefined;
					}
				}
				if (expInfo.run == "Pilot_R2.json")
				{
					readyStim = new visual.ImageStim({
						win : psychoJS.window,
						name : 'LAST_POS_slide', units : 'height', 
						image : 'LAST_POS_slide', mask : undefined,
						ori : 0, pos : [0, 0],
						color : new util.Color([1, 1, 1]), opacity : 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});
	
					// track = new Sound({
					// 	win: psychoJS.window,
					// 	value: 'MAIN_ready_audio.mp3'
					// });
					// track.setVolume(1.0);
					if ('last_pos_cb.mp3') {
						track = new Sound({
							win: psychoJS.window,
							value: 'last_pos_cb.mp3'
						});
						track.setVolume(1.0);
					} else {
						track = undefined;
					}
				}
				if (expInfo.run == "Pilot_R1_CB.json")
				{
					readyStim = new visual.ImageStim({
						win : psychoJS.window,
						name : 'INSTR_NEG_slide', units : 'height', 
						image : 'INSTR_NEG_slide', mask : undefined,
						ori : 0, pos : [0, 0],
						color : new util.Color([1, 1, 1]), opacity : 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});
	
					// track = new Sound({
					// 	win: psychoJS.window,
					// 	value: 'MAIN_ready_audio.mp3'
					// });
					// track.setVolume(1.0);
					if ('instr_neg_cb.mp3') {
						track = new Sound({
							win: psychoJS.window,
							value: 'instr_neg_cb.mp3'
						});
						track.setVolume(1.0);
					} else {
						track = undefined;
					}
				}
				if (expInfo.run == "Pilot_R2_CB.json")
				{
					readyStim = new visual.ImageStim({
						win : psychoJS.window,
						name : 'LAST_NEG_slide', units : 'height', 
						image : 'LAST_NEG_slide', mask : undefined,
						ori : 0, pos : [0, 0],
						color : new util.Color([1, 1, 1]), opacity : 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});
	
					// track = new Sound({
					// 	win: psychoJS.window,
					// 	value: 'MAIN_ready_audio.mp3'
					// });
					// track.setVolume(1.0);
					if ('last_pos_cb.mp3') {
						track = new Sound({
							win: psychoJS.window,
							value: 'last_neg_cb.mp3'
						});
						track.setVolume(1.0);
					} else {
						track = undefined;
					}
				}
				break
			case 'CB2':
				if (expInfo.run == "Pilot_R1.json")
				{
					readyStim = new visual.ImageStim({
						win : psychoJS.window,
						name : 'BLOCK2_NEG_slide', units : 'height', 
						image : 'BLOCK2_NEG_slide', mask : undefined,
						ori : 0, pos : [0, 0],
						color : new util.Color([1, 1, 1]), opacity : 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});
	
					// track = new Sound({
					// 	win: psychoJS.window,
					// 	value: 'MAIN_ready_audio.mp3'
					// });
					// track.setVolume(1.0);
					if ('block2_neg_cb.mp3') {
						track = new Sound({
							win: psychoJS.window,
							value: 'block2_neg_cb.mp3'
						});
						track.setVolume(1.0);
					} else {
						track = undefined;
					}
				}
				if (expInfo.run == "Pilot_R2.json")
				{
					readyStim = new visual.ImageStim({
						win : psychoJS.window,
						name : 'LAST_NEG_slide', units : 'height', 
						image : 'LAST_NEG_slide', mask : undefined,
						ori : 0, pos : [0, 0],
						color : new util.Color([1, 1, 1]), opacity : 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});
	
					// track = new Sound({
					// 	win: psychoJS.window,
					// 	value: 'MAIN_ready_audio.mp3'
					// });
					// track.setVolume(1.0);
					if ('last_neg_cb.mp3') {
						track = new Sound({
							win: psychoJS.window,
							value: 'last_neg_cb.mp3'
						});
						track.setVolume(1.0);
					} else {
						track = undefined;
					}
				}
				if (expInfo.run == "Pilot_R1_CB.json")
				{
					readyStim = new visual.ImageStim({
						win : psychoJS.window,
						name : 'BLOCK2_POS_slide', units : 'height', 
						image : 'BLOCK2_POS_slide', mask : undefined,
						ori : 0, pos : [0, 0],
						color : new util.Color([1, 1, 1]), opacity : 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});
	
					// track = new Sound({
					// 	win: psychoJS.window,
					// 	value: 'MAIN_ready_audio.mp3'
					// });
					// track.setVolume(1.0);
					if ('block2_pos_cb.mp3') {
						track = new Sound({
							win: psychoJS.window,
							value: 'block2_pos_cb.mp3'
						});
						track.setVolume(1.0);
					} else {
						track = undefined;
					}
				}
				if (expInfo.run == "Pilot_R2_CB.json")
				{
					readyStim = new visual.ImageStim({
						win : psychoJS.window,
						name : 'LAST_POS_slide', units : 'height', 
						image : 'LAST_POS_slide', mask : undefined,
						ori : 0, pos : [0, 0],
						color : new util.Color([1, 1, 1]), opacity : 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});
	
					// track = new Sound({
					// 	win: psychoJS.window,
					// 	value: 'MAIN_ready_audio.mp3'
					// });
					// track.setVolume(1.0);
					if ('last_pos_cb.mp3') {
						track = new Sound({
							win: psychoJS.window,
							value: 'last_pos_cb.mp3'
						});
						track.setVolume(1.0);
					} else {
						track = undefined;
					}
				}
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
				//track = undefined;
				if (audio_stim) {
					track = new Sound({
						win: psychoJS.window,
						value: audio_stim
					});
					track.setVolume(1.0);
				} else {
					track = undefined;
				}
				// track.setVolume(1.0);
		}
		
		mark_event(trials_data, globalClock, 'NA', block_type, event_types['BLOCK_ONSET'],
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
				//console.log('ready track: ',track)
				track.play()
			}
		}
	
		// update/draw components on each frame
		let theseKeys = resp.getKeys({ keyList: [RIGHT_KEY], waitRelease: false });
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
			resp.stop();
			resp.status = PsychoJS.Status.NOT_STARTED;
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

/**
 * Shuffle arrays in place
 * e.g. arr = [1,2,3]
 *     shuffe(arr)
 * @param {Array} array 
 * @returns 
 */
function shuffle(array) {
	let currentIndex = array.length,  randomIndex;
  
	// While there remain elements to shuffle.
	while (currentIndex != 0) {
  
	  // Pick a remaining element.
	  randomIndex = Math.floor(Math.random() * currentIndex);
	  currentIndex--;
  
	  // And swap it with the current element.
	  [array[currentIndex], array[randomIndex]] = [
		array[randomIndex], array[currentIndex]];
	}
  
	return array;
  }

/**
 * Genearte Randomized array
 * @param {TrialHandler} trial_handler  trial_handler type
 */
 function randomizePair(trial_handler) {
	// Generate random images.
	// Should not be repeating same outcome twice in a row.

	// get the total_trials
	g.total_trials = 0
	trial_handler._trialList.forEach(block_row => {
		g.total_trials = g.total_trials + (block_row.trials_block)
	})
	 
	let positive_outcome_media = g.outcome_media.positive;
	let negative_outcome_media = g.outcome_media.negative;
	 
	shuffle( negative_outcome_media)
	shuffle( positive_outcome_media )
	 
	if ((g.outcome_media.negative.length <= g.total_trials) || (g.outcome_media.positive.length <= g.total_trials) ) {
		//console.log("add new trials. just shuffle")
		// If it got here, it means the number of trials is lower than the
		// number of the outcome media.
		// Multiple the array itself x number of times till it's greater than the total trials
		
		while (g.outcome_media.negative.length <= g.total_trials) {
			g.outcome_media.negative = g.outcome_media.negative.concat( negative_outcome_media )
		}

		while (g.outcome_media.positive.length <= g.total_trials) {
			g.outcome_media.positive = g.outcome_media.positive.concat( positive_outcome_media )
		}
	} else {
		// just returned a shuffle version of the outcome_media
		g.outcome_media.negative = negative_outcome_media
		g.outcome_media.positive = positive_outcome_media
	}
}

var blocks;
var trial_type;
function practiceTrialsLoopBegin(thisScheduler) {
	blocks = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'practice_schedule.csv',
		seed: undefined, name: 'blocks'
	});
	g.global_trial_number = 0;
	g.game_number = 1;
	//randomizePair(blocks) // randomize outcome
	reset_choice_counter() // resetCounter

	psychoJS.experiment.addLoop(blocks); // add the loop to the experiment
	endClock.reset()
	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED
	// Schedule all the trials in the trialList:
	for (const thisBlock of blocks) {
		const snapshot = blocks.getSnapshot();
		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(blockRoutineBegin(snapshot)); 	 // setup block
		thisScheduler.add(blockRoutineTrials(snapshot));	 // do trials
		thisScheduler.add(blockRoutineOutcome(snapshot)); 	 // show result
		thisScheduler.add(blockRoutineEnd(snapshot));		 // end block
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	trial_type = 'PRACTICE'
	mark_event(trials_data, globalClock, 'NA', trial_type,
		event_types['BLOCK_ONSET'], 'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

function trialsLoopBegin(thisScheduler) {
	endClock.reset()

	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED
	//reset_choice_counter() // resetCounter

	blocks = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule.xls',
		seed: undefined, name: 'trials'
	});

	main_loop_count = 0
	last_trial_num = blocks.nTotal

	g.global_trial_number = 0;
	g.game_number = 1;
	//randomizePair(blocks) // randomize outcome

	psychoJS.experiment.addLoop(blocks); // add the loop to the experiment

	// Schedule all the blocks in the trialList:
	for (const thisTrial of blocks) {
		const snapshot = blocks.getSnapshot();
		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(blockRoutineBegin(snapshot)); 	 // setup block
		thisScheduler.add(blockRoutineTrials(snapshot));	 // do trials
		thisScheduler.add(blockRoutineOutcome(snapshot)); 	 // show result
		thisScheduler.add(blockRoutineEnd(snapshot));		 // end block
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	let type_of_block = blocks.trialList[0].game_type
	trial_type = 'MAIN_START'
	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['BLOCK_ONSET'],
				'NA', 'NA' , type_of_block)
	return Scheduler.Event.NEXT;
}

function trialsLoopBegin2(thisScheduler) {
	endClock.reset()

	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED
	//reset_choice_counter() // resetCounter

	blocks = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule2.xls',
		seed: undefined, name: 'trials'
	});

	main_loop_count = 0
	last_trial_num = blocks.nTotal

	g.global_trial_number = 0;
	g.game_number = 1;
	//randomizePair(blocks) // randomize outcome

	psychoJS.experiment.addLoop(blocks); // add the loop to the experiment

	// Schedule all the blocks in the trialList:
	for (const thisTrial of blocks) {
		const snapshot = blocks.getSnapshot();
		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(blockRoutineBegin(snapshot)); 	 // setup block
		thisScheduler.add(blockRoutineTrials(snapshot));	 // do trials
		thisScheduler.add(blockRoutineOutcome(snapshot)); 	 // show result
		thisScheduler.add(blockRoutineEnd(snapshot));		 // end block
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	let type_of_block = blocks.trialList[0].game_type
	trial_type = 'MAIN_SWITCH'
	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['BLOCK_ONSET'],
				'NA', 'NA' , type_of_block)
	return Scheduler.Event.NEXT;
}

function instruct_pagesLoopEnd() {
	psychoJS.experiment.removeLoop(slides);
	return Scheduler.Event.NEXT;
}

// SHow the points in the trial 
function trialsLoopEnd() {
	g.text_game_number.setAutoDraw(false); // 'Game Number:'
	g.text_val_game_number.setAutoDraw(false); // the game vale '2/2'
	g.text_trial_number.setAutoDraw(false); // 'Choice Number:'
	g.text_val_trial_number.setAutoDraw(false); // the choice val '16/16'

	g.text_val_game_type.setAutoDraw(false); // Top right text

	g.game_type_text_image_stim.setAutoDraw(false) // bottom text

	g.slideStim.setAutoDraw(false)

	psychoJS.experiment.removeLoop(blocks);

	psychoJS.experiment.addData('globalClock', globalClock.getTime());

	clear_keys = true;

	return Scheduler.Event.NEXT;
}

// StimImage Dictrionary for faces
g.faces_choice = {
	1: '',
	2: '',
	3: ''
}

// TextStim Dictionary  for the text
g.faces_text = {
	1: new visual.TextStim({
		win: psychoJS.window,
		name: 'Face_1',
		text: '1',
		font: 'Arial',
		units: 'norm',
		pos: [-0.6, 0.3], height: 0.1, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	}),
	2: new visual.TextStim({
		win: psychoJS.window,
		name: '2',
		text: '2',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0.3], height: 0.1, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	}),
	3 : new visual.TextStim({
		win: psychoJS.window,
		name: '3',
		text: '3',
		font: 'Arial',
		units: 'norm',
		pos: [0.6, 0.3], height: 0.1, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	})
}

// RectStim for the boxes
g.rect = {
	1: new visual.Rect({
		win: psychoJS.window,
		name: 'rect_1',
		width: 0.35,
		height: 1,
		units: 'norm',
		pos: [-0.5, 0 ], ori: 0,
		// fillColor: new util.Color('black'),
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0.0
	}),
	2: new visual.Rect({
		win: psychoJS.window,
		name: 'rect_2',
		width: 0.35,
		height: 1,
		units: 'norm',
		pos: [0, 0 ], ori: 0,
		// fillColor: new util.Color('black'),
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0.0
	}),
	3 : new visual.Rect({
		win: psychoJS.window,
		name: 'rect_1',
		width: 0.35,
		height: 1,
		units: 'norm',
		pos: [0.5, 0 ], ori: 0,
		// fillColor: new util.Color('black'),
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0.0
	})
}

/**
 * Routine for the routine before block starts
 * Userse for intialize and setting the stims
 * @param {*} block 
 * @returns 
 */
function blockRoutineBegin(block) {
	return function () {
		
		g.outcome_scores_one = {}
		g.outcome_scores_two = {}
		g.outcome_scores_three = {}
		g.outcome_scores_one_neg = {}
		g.outcome_scores_two_neg = {}
		g.outcome_scores_three_neg = {}
		g.outcome_scores_one_pos = {}
		g.outcome_scores_two_pos = {}
		g.outcome_scores_three_pos = {}
		
		base_score_one = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.9, -0.37], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		g.outcome_scores_one[0] = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.9, -0.37], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		for (let i = 1; i <= 16; i++)
		{
			base_score_one.image = 'neutral_face'
			base_score_one.pos[0] += 0.035
			g.outcome_scores_one[i] = new visual.ImageStim({
				win: psychoJS.window,
				name: '3',
				image: base_score_one.image,
				units: 'norm',
				pos: [base_score_one.pos[0], -0.37], height: 0.075, wrapWidth: undefined, ori: 0,
				// color: new util.Color('black'), opacity: 1,
				opacity: 1,
				depth: 0.0
			})
		}
		
		base_score_two = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.3, -0.37], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		g.outcome_scores_two[0] = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.3, -0.37], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		for (let i = 1; i <= 16; i++)
		{
			base_score_two.image = 'neutral_face'
			base_score_two.pos[0] += 0.035
			g.outcome_scores_two[i] = new visual.ImageStim({
				win: psychoJS.window,
				name: '3',
				image: base_score_two.image,
				units: 'norm',
				pos: [base_score_two.pos[0], -0.37], height: 0.075, wrapWidth: undefined, ori: 0,
				// color: new util.Color('black'), opacity: 1,
				depth: 0.0
			})
		}
		
		base_score_three = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [0.3, -0.37], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		g.outcome_scores_three[0] = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [0.3, -0.37], height: 0.075, wrapWidth: undefined, ori: 0,
			//color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		for (let i = 1; i <= 16; i++)
		{
			base_score_three.image = 'neutral_face'
			base_score_three.pos[0] += 0.035
			g.outcome_scores_three[i] = new visual.ImageStim({
				win: psychoJS.window,
				name: '3',
				image: base_score_three.image,
				units: 'norm',
				pos: [base_score_three.pos[0], -0.37], height: 0.075, wrapWidth: undefined, ori: 0,
				// color: new util.Color('black'), opacity: 1,
				depth: 0.0
			})
		}

		base_score_one_pos = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.9, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		g.outcome_scores_one_pos[0] = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.9, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		for (let i = 1; i <= 16; i++)
		{
			base_score_one_pos.image = 'positive_face'
			base_score_one_pos.pos[0] += 0.035
			g.outcome_scores_one_pos[i] = new visual.ImageStim({
				win: psychoJS.window,
				name: '3',
				image: base_score_one_pos.image,
				units: 'norm',
				pos: [base_score_one_pos.pos[0], -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
				// color: new util.Color('black'), opacity: 1,
				opacity: 1,
				depth: 0.0
			})
		}
		
		base_score_two_pos = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.3, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		g.outcome_scores_two_pos[0] = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.3, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		for (let i = 1; i <= 16; i++)
		{
			base_score_two_pos.image = 'positive_face'
			base_score_two_pos.pos[0] += 0.035
			g.outcome_scores_two_pos[i] = new visual.ImageStim({
				win: psychoJS.window,
				name: '3',
				image: base_score_two_pos.image,
				units: 'norm',
				pos: [base_score_two_pos.pos[0], -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
				// color: new util.Color('black'), opacity: 1,
				depth: 0.0
			})
		}
		
		base_score_three_pos = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [0.3, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		g.outcome_scores_three_pos[0] = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [0.3, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			//color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		for (let i = 1; i <= 16; i++)
		{
			base_score_three_pos.image = 'positive_face'
			base_score_three_pos.pos[0] += 0.035
			g.outcome_scores_three_pos[i] = new visual.ImageStim({
				win: psychoJS.window,
				name: '3',
				image: base_score_three_pos.image,
				units: 'norm',
				pos: [base_score_three_pos.pos[0], -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
				// color: new util.Color('black'), opacity: 1,
				depth: 0.0
			})
		}

		base_score_one_neg = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.9, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		g.outcome_scores_one_neg[0] = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.9, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		for (let i = 1; i <= 16; i++)
		{
			base_score_one_neg.image = 'negative_face'
			base_score_one_neg.pos[0] += 0.035
			g.outcome_scores_one_neg[i] = new visual.ImageStim({
				win: psychoJS.window,
				name: '3',
				image: base_score_one_neg.image,
				units: 'norm',
				pos: [base_score_one_neg.pos[0], -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
				// color: new util.Color('black'), opacity: 1,
				opacity: 1,
				depth: 0.0
			})
		}
		
		base_score_two_neg = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.3, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		g.outcome_scores_two_neg[0] = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [-0.3, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		for (let i = 1; i <= 16; i++)
		{
			base_score_two_neg.image = 'negative_face'
			base_score_two_neg.pos[0] += 0.035
			g.outcome_scores_two_neg[i] = new visual.ImageStim({
				win: psychoJS.window,
				name: '3',
				image: base_score_two_neg.image,
				units: 'norm',
				pos: [base_score_two_neg.pos[0], -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
				// color: new util.Color('black'), opacity: 1,
				depth: 0.0
			})
		}
		
		base_score_three_neg = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [0.3, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			// color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		g.outcome_scores_three_neg[0] = new visual.ImageStim({
			win: psychoJS.window,
			name: '3',
			image: 'nothing',
			units: 'norm',
			pos: [0.3, -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
			//color: new util.Color('black'), opacity: 1,
			opacity: 1,
			depth: 0.0
		})
		
		for (let i = 1; i <= 16; i++)
		{
			base_score_three_neg.image = 'negative_face'
			base_score_three_neg.pos[0] += 0.035
			g.outcome_scores_three_neg[i] = new visual.ImageStim({
				win: psychoJS.window,
				name: '3',
				image: base_score_three_neg.image,
				units: 'norm',
				pos: [base_score_three_neg.pos[0], -0.3], height: 0.075, wrapWidth: undefined, ori: 0,
				// color: new util.Color('black'), opacity: 1,
				depth: 0.0
			})
		}


		//------Prepare to start Routine 'trial'-------
		t = 0;
		trial_type = trials_block + '_' + probability_1 + '_' + probability_2 + '_' + probability_3
		
		// set the face image
		g.faces_choice[1] = new visual.ImageStim({
			win: psychoJS.window,
			name: 'face_1', units: 'norm',
			size: [0.55, 0.5],
			image: face_1, mask: undefined,
			ori: 0, pos: [-0.6, 0],
			color: new util.Color([1, 1, 1]), opacity: 1,
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});

		g.faces_choice[2] = new visual.ImageStim({
			win: psychoJS.window,
			name: 'face_2', units: 'norm',
			size: [0.55, 0.5],
			image: face_2, mask: undefined,
			ori: 0, pos: [0, 0],
			color: new util.Color([1, 1, 1]), opacity: 1,
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});

		g.faces_choice[3] = new visual.ImageStim({
			win: psychoJS.window,
			name: 'face_3', units: 'norm',
			size: [0.55, 0.5],
			image: face_3, mask: undefined,
			ori: 0, pos: [0.6, 0],
			color: new util.Color([1, 1, 1]), opacity: 1,
			flipHoriz: false, flipVert: false,
			texRes: 128, interpolate: true, depth: 0
		});

		blockClock.reset(); // clock

		// Draw the static stims
		// Top Information

		g.outcome_scores_one[0].setAutoDraw(true)
		g.outcome_scores_two[0].setAutoDraw(true)
		g.outcome_scores_three[0].setAutoDraw(true)
		g.outcome_scores_one_pos[0].setAutoDraw(true)
		g.outcome_scores_two_pos[0].setAutoDraw(true)
		g.outcome_scores_three_pos[0].setAutoDraw(true)
		g.outcome_scores_one_neg[0].setAutoDraw(true)
		g.outcome_scores_two_neg[0].setAutoDraw(true)
		g.outcome_scores_three_neg[0].setAutoDraw(true)

		g.text_game_number.setAutoDraw(true);
		g.text_val_game_number.setAutoDraw(true);
		g.text_val_game_number.setText(g.game_number + '/' + block.nTotal);

		g.text_trial_number.setAutoDraw(true);
		g.text_val_trial_number.setAutoDraw(true)
	
		g.trial_number = 1 // reset the trial_number after each block
		g.text_val_trial_number.setText(g.trial_number + '/' +  trials_block);
		g.last_trial_number = undefined; // store laste trial number

		// g.text_game_type.setAutoDraw(true)
		if (game_type == 'pleasant') {
			g.text_val_game_type.color = g.PLEASANT_COLOR;
			g.game_room_score.color = g.PLEASANT_COLOR_2;
			g.text_val_game_type.setText('Positive Outcome Games')
			g.game_room_score.setText(`Number of Positive Outcomes: 0/${trials_block}`)
			g.game_type_text_image_stim = new visual.ImageStim({
				win : psychoJS.window,
				name : 'bottom_text_image', units : 'height', 
				image : 'pleasant_bottom_text', mask : undefined,
				ori : 0, pos: [0, -0.35], opacity : 1, size: [1,0.13],
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});
		} else {
			g.text_val_game_type.color = g.UNPLEASANT_COLOR;
			g.game_room_score.color = g.UNPLEASANT_COLOR_2;
			g.text_val_game_type.setText('Negative Outcome Games')
			g.game_room_score.setText(`Number of Negative Outcomes: 0/${trials_block}`)

			g.game_type_text_image_stim = new visual.ImageStim({
				win : psychoJS.window,
				name : 'bottom_text_image', units : 'height', 
				image : 'unpleasant_bottom_text', mask : undefined,
				ori : 0, pos: [0, -0.35], opacity : 1, size: [1,0.13],
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});
		}
		g.text_val_game_type.setAutoDraw(true)
		g.game_room_score.setAutoDraw(true)

		
		g.game_type_text_image_stim.setAutoDraw(true);

		// g.rect[1].setAutoDraw(true)
		// g.rect[2].setAutoDraw(true)
		// g.rect[3].setAutoDraw(true)

		// Draw the faces
		g.faces_choice[1].setAutoDraw(true)
		g.faces_choice[2].setAutoDraw(true)
		g.faces_choice[3].setAutoDraw(true)

		g.faces_text[1].setAutoDraw(true)
		g.faces_text[2].setAutoDraw(true)
		g.faces_text[3].setAutoDraw(true)

		g.new_trial_marked = false;

		g.forced_dealy_abs = 0; // 

		mark_event(trials_data, globalClock, 'BLOCK=' + block.thisIndex, trial_type, event_types['BLOCK_ONSET'],
				'NA', 'NA' , face_1 + ' | ' + face_2 + ' | ' + face_3)
		return Scheduler.Event.NEXT;
	};
}

// X / Y normal positiions for each of the outcome faces for each choice.
g.choice_outcome_pos = {
	1: {
		'unscramble': [],
		'scramble': []
	},
	2: {
		'unscramble': [],
		'scramble': []
	},
	3: {
		'unscramble': [],
		'scramble': []
	}
}
var face_pos_multiplier = 0.07
// Add the positions iteratively
for (let i = 0; i < 14; i++) {
	// choice 1, negative
	g.choice_outcome_pos[1]['scramble'].push([-0.55, -0.45 + (i * face_pos_multiplier)])
	g.choice_outcome_pos[1]['unscramble'].push([-0.45, -0.45 + (i * face_pos_multiplier)])
	
	g.choice_outcome_pos[2]['scramble'].push([-0.05, -0.45 + (i * face_pos_multiplier)])
	g.choice_outcome_pos[2]['unscramble'].push([ 0.05, -0.45 + (i * face_pos_multiplier)])

	g.choice_outcome_pos[3]['scramble'].push([ 0.55, -0.45 + (i * face_pos_multiplier)])
	g.choice_outcome_pos[3]['unscramble'].push([ 0.45, -0.45 + (i * face_pos_multiplier)])
}

// Used for holding the intialized face image stim.
// Can be used to access ImageStim 
g.outcome = {
	1: {
		'negative': [],
		'positive': [],
		'neutral': []
	},
	2: {
		'negative': [],
		'positive': [],
		'neutral': []
	},
	3: {
		'negative': [],
		'positive': [],
		'neutral': []
	}
}

// Used for counting the positive/negative levels for each choice selection
g.choice_counter = {
	'negative': 0,
	'positive': 0,
	'neutral':0,
}


/**
 * Increment the outcome counter after it's been used.
 * @param {*} outcome_type either a positve or negative outcome type
 */
function incrementCounters(outcome_type) {
	//console.log('increment (pre): ',outcome_type,g.choice_counter['positive'], g.choice_counter['negative']  )
	switch (outcome_type) {
		case 'positive':
			g.choice_counter['positive']++
			// reset back to 0 after reached max length
			if (g.choice_counter['positive'] == 68) {
				g.choice_counter['positive'] = 0
			}
			break;
		case 'negative':
			g.choice_counter['negative']++
			// reset back to 0 after reached max length
			if (g.choice_counter['negative'] == 71) {
				g.choice_counter['negative'] = 0
			}
			break;
		case 'neutral':
			g.choice_counter['neutral']++
			// reset back to 0 after reached max length
			if (g.choice_counter['neutral'] == 70) {
				g.choice_counter['neutral'] = 0
			}
			break;
	}
	//console.log('increment (post): ',outcome_type,g.choice_counter['positive'], g.choice_counter['negative'], g.choice_counter['neutral'])
}

/**
 * Returns either positive or negative given random probability
 * @param {*} probability probabilty 
 */
// TODO - Fix so that it works right for the negative games.
function getRandomOutcome(probability, game_type) {
	//console.log('get random: ', game_type, probability )
	if (game_type == 'pleasant') {
		if (Math.random() < probability) {
			// returns the game_type. Either 'plesant' or 'unpleasant'
			return (game_type == 'pleasant' ? 'positive' : 'negative');
		} else {
			return 'neutral'
		}
	}
	else {
		if (Math.random() >= probability) {
			// returns the game_type. Either 'plesant' or 'unpleasant'
			return (game_type == 'pleasant' ? 'positive' : 'negative');
		} else {
			return 'neutral'
		}
	}
}


/**
 * Returns an image/audio outcome pair based on given income
 * @param {*} outcome string of either 'negative' or 'positive' or 'neutral'
 */
function getOutcomePair(outcome, game_type, choice) {
	
	switch (outcome) {
		case 'neutral':
			// if (game_type == 'pleasant') {
			// 	g.outcome_triple = g.outcome_media.positive[g.choice_counter['positive']];
			// 	incrementCounters('positive')
			// } else {
			// 	g.outcome_triple = g.outcome_media.negative[g.choice_counter['negative']];
			// 	incrementCounters('negative')
			// }
			g.outcome_image = new visual.ImageStim({
				win : psychoJS.window,
				name : 'outcome_image', units : 'norm', 
				image : g.outcome_media.neutral[g.choice_counter['neutral']][0], mask : undefined,
				ori: 0,pos: [0,0], opacity : 1,size: [2,2],
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 2
			})
			incrementCounters('neutral')
			g.outcome_triple = g.outcome_media.neutral[g.choice_counter['neutral']][0]
			
			// Outcome Sound Stim
			g.outcome_sound = new Sound({
				win: psychoJS.window,
				value: 'coop_neut_sound.mp3'
			});

			break;
		case 'positive':
			// g.outcome_triple = g.outcome_media.positive[g.choice_counter['positive']];
			// incrementCounters('positive')

			// g.outcome_image = new visual.ImageStim({
			// 	win : psychoJS.window,
			// 	name : 'outcome_image', units : 'norm',
			// 	image : g.outcome_triple[0], mask : undefined,
			// 	ori: 0,pos: [0,0], opacity : 1,size: [2,2],
			// 	flipHoriz : false, flipVert : false,
			// 	texRes : 128, interpolate : true, depth : 2
			// })
			
			g.outcome_image = new visual.ImageStim({
				win : psychoJS.window,
				name : 'outcome_image', units : 'norm', 
				image : g.outcome_media.positive[g.choice_counter['positive']][0], mask : undefined,
				ori: 0,pos: [0,0], opacity : 1,size: [2,2],
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 2
			})
			incrementCounters('positive')
			g.outcome_triple = g.outcome_media.positive[g.choice_counter['positive']][0]
	
			// Outcome Sound Stim
			g.outcome_sound = new Sound({
				win: psychoJS.window,
				value: 'coop_pos_sound.mp3'
			});

			break;
		case 'negative':
			// g.outcome_triple = g.outcome_media.negative[g.choice_counter['negative']];
			// incrementCounters('negative')

			// g.outcome_image = new visual.ImageStim({
			// 	win : psychoJS.window,
			// 	name : 'outcome_image', units : 'norm',
			// 	image : g.outcome_triple[0], mask : undefined,
			// 	ori: 0,pos: [0,0], opacity : 1,size: [2,2],
			// 	flipHoriz : false, flipVert : false,
			// 	texRes : 128, interpolate : true, depth : 2
			// })
			
			g.outcome_image = new visual.ImageStim({
				win : psychoJS.window,
				name : 'outcome_image', units : 'norm', 
				image : g.outcome_media.negative[g.choice_counter['negative']][0], mask : undefined,
				ori: 0,pos: [0,0], opacity : 1,size: [2,2],
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 2
			})
			incrementCounters('negative')
			g.outcome_triple = g.outcome_media.negative[g.choice_counter['negative']][0]
	
			// Outcome Sound Stim
			g.outcome_sound = new Sound({
				win: psychoJS.window,
				value: 'scream.wav'
			});

			break;
	}
	//console.log('outcome: ', outcome, g.outcome_triple)
	g.outcome_sound.setVolume(1.0);
}

/**
 * Sets the outcome reponse based on outcome and game type
 * reference to #56 https://github.com/laureate-institute-for-brain-research/StimToolOnline/issues/56
 * @param {*} outcome the random outcome. i.e. 'pleasant', 'unpleasant', 'neutral'
 * @param {*} game_type the game type from the schedule. ie. 'unpleasant' or 'pleasant'
 * @param {*} choice the choice number the subjet selected, ie. 1, 2,3
 */
function setOutcomeResponse(outcome, game_type, choice) {
	if (game_type == 'pleasant') {
		if (outcome == 'positive') {
			// pleasant outcomes with positive images
			speech_img = 'speech_good'
		} else {
			// pleasant outcomes with scrambled images
			speech_img = 'speech_bad'
		}
	} else {
		if (outcome == 'negative') {
			// unpleasant outcomes with negative images
			speech_img = 'speech_bad'
		} else {
			// unpleasant outcomes with scrambled iamges
			speech_img = 'speech_good'
		}
	}

	// Set the text x-position based of the choice
	switch (choice) {
		case 1:
			g.outcome_text_bubble = new visual.ImageStim({
				win: psychoJS.window,
				image: speech_img,
				units: 'norm',
				pos: [g.faces_choice[1].pos[0] + 0.2, 0.15],
				height: 0.05, wrapWidth: undefined, ori: 0,
				depth: -1.0
			});
			break;
		case 2:
			g.outcome_text_bubble = new visual.ImageStim({
				win: psychoJS.window,
				image: speech_img,
				units: 'norm',
				pos: [g.faces_choice[2].pos[0] + 0.2, 0.15],
				height: 0.05, wrapWidth: undefined, ori: 0,
				depth: -1.0
			});
			break;
		case 3:
			g.outcome_text_bubble = new visual.ImageStim({
				win: psychoJS.window,
				image: speech_img,
				units: 'norm',
				pos: [g.faces_choice[3].pos[0] + 0.2, 0.15],
				height: 0.05, wrapWidth: undefined, ori: 0,
				depth: -1.0
			});
			break;
	}
}

var outcome;
var outcome_response;
function blockRoutineTrials(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise
		//ready.clearEvents();
		if (clear_keys == true)
		{
			ready.clearEvents();
			clear_keys = false;
		}

		if (t >= 0 && ready.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			ready.tStart = t;  // (not accounting for frame time here)
			ready.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			psychoJS.window.callOnFlip(function () { ready.clock.reset(); });  // t=0 on next screen flip
			psychoJS.window.callOnFlip(function () { ready.start(); }); // start on screen flip
			psychoJS.window.callOnFlip(function () { ready.clearEvents(); });
			//ready.clearEvents();
		}

		if (!g.new_trial_marked) {
			// mark trial onset
			mark_event(trials_data, globalClock, g.trial_number, trial_type, event_types['TRIAL_ONSET'],
				'NA', 'NA', 'NA')
			
			//sendData()
			g.new_trial_marked = true;
		}

		if (g.outcome_sound && g.outcomeTimer.getTime() <= (g.outcome_sound.getDuration() + 0.5/* + 0.3*/) && g.outcome_image && g.outcome_image.status == PsychoJS.Status.NOT_STARTED) {
			let play_sound_delay = 0.5
			play_sound = true;
			//console.log('show outcome image')

			g.outcome_text_bubble.setAutoDraw(false)
			g.black_rectangle.setAutoDraw(false)
			// Start the outcome image and the sound
			// Outcome image onset
			g.outcome_image.setAutoDraw(true)
			mark_event(trials_data, globalClock, g.trial_number, trial_type, event_types['OUTCOME_IMAGE_ONSET'],
				'NA', 'NA', g.outcome_triple[0])
			
			// Outcome sound osnet
			mark_event(trials_data, globalClock, g.trial_number, trial_type, event_types['OUTCOME_SOUND_ONSET'],
				g.outcome_sound.getDuration(), 'NA', g.outcome_triple[1])
			
			g.trial_number++ // incremente trial number
			g.global_trial_number++ // incremeante global trial number
			
			// if (g.outcomeTimer.getTime() <= (g.outcome_sound.getDuration())) {
			// 	console.log('play sound')
			// 	g.outcome_sound.play()
			// }
		}
		if (g.outcome_sound && (g.outcomeTimer.getTime() <= (g.outcome_sound.getDuration() + 0.5)) && play_sound == true) {
			//console.log('play sound')
			g.outcome_sound.play()
			play_sound = false;
		}
		//console.log(g.outcomeTimer.getTime())


		// Clear out the outcome image after timer is up,
		// Also sets the new_trial_marked flag to false so that marker event corresponds to the corrent trial_onset
		if (g.outcomeTimer.getTime() <= 0 && g.outcome_image && g.outcome_image.status == PsychoJS.Status.STARTED) {
			g.outcome_image.setAutoDraw(false)
			g.outcome_image.status = PsychoJS.Status.NOT_STARTED
			// for some reason, we need to setText after we draw out the image or else
			//  the trial number is a layer above the outcome image
			g.text_val_trial_number.setText(g.trial_number + '/' +  trials_block);
			g.new_trial_marked = false;

			// Next Routine after trial nuber reached
			if (g.trial_number > trials_block) {
				continueRoutine = false;
			}


			// set the time to add force delay after outcome
			g.forced_dealy_abs = globalClock.getTime() + g.FORCED_DELAY

			g.outcome_sound = undefined;
		}

		if (ready.status === PsychoJS.Status.STARTED) {

			let theseKeys = ready.getKeys({ keyList: ['left', 'up', 'right'], waitRelease: false });
			
			if (theseKeys.length > 0 && g.outcomeTimer.getTime() <= 0 && globalClock.getTime() >= g.forced_dealy_abs) {
				// Chose 1
				if (theseKeys[0].name == 'left') {
					let choice = 1
					outcome = getRandomOutcome(probability_1, game_type)
					getOutcomePair(outcome, game_type, choice) // Generate a random image/sound pair based on outcome
					//setOutcome(outcome, choice)
					setOutcomeResponse(outcome, game_type, choice)
					if (game_type == 'pleasant')
					{
						if (outcome == 'positive')
						{
							score_one_pos += 1
							g.game_room_score.setText(`Number of Positive Outcomes: ${score_one_pos + score_two_pos + score_three_pos}/${trials_block}`)
							//g.outcome_scores_one[score_one - 1].setAutoDraw(false)
							
							g.outcome_scores_one_pos[score_one_pos].setAutoDraw(true)
						}
						else
						{
							score_one += 1
							g.outcome_scores_one[score_one].setAutoDraw(true)
						}
					}
					if (game_type == 'unpleasant')
					{
						if (outcome == 'negative')
						{
							score_one_neg += 1
							g.game_room_score.setText(`Number of Negative Outcomes: ${score_one_neg + score_two_neg + score_three_neg}/${trials_block}`)
							//g.outcome_scores_one[score_one - 1].setAutoDraw(false)
							g.outcome_scores_one_neg[score_one_neg].setAutoDraw(true)
						}
						else
						{
							score_one += 1
							g.outcome_scores_one[score_one].setAutoDraw(true)
						}
					}
				}
				
				// Chose 2
				if (theseKeys[0].name == 'up') {
					let choice = 2
					outcome = getRandomOutcome(probability_2, game_type)
					getOutcomePair(outcome, game_type, choice) // Generate a random image/sound pair based on outcome
					//setOutcome(outcome, choice)
					setOutcomeResponse(outcome, game_type, choice)
					if (game_type == 'pleasant')
					{
						if (outcome == 'positive')
						{
							score_two_pos += 1
							g.game_room_score.setText(`Number of Positive Outcomes: ${score_one_pos + score_two_pos + score_three_pos}/${trials_block}`)
							//g.outcome_scores_two[score_two - 1].setAutoDraw(false)
							g.outcome_scores_two_pos[score_two_pos].setAutoDraw(true)
						}
						else
						{
							score_two += 1
							g.outcome_scores_two[score_two].setAutoDraw(true)
						}
					}
					if (game_type == 'unpleasant')
					{
						if (outcome == 'negative')
						{
							score_two_neg += 1
							g.game_room_score.setText(`Number of Negative Outcomes: ${score_one_neg + score_two_neg + score_three_neg}/${trials_block}`)
							//g.outcome_scores_two[score_two - 1].setAutoDraw(false)
							g.outcome_scores_two_neg[score_two_neg].setAutoDraw(true)
						}
						else
						{
							score_two += 1
							g.outcome_scores_two[score_two].setAutoDraw(true)
						}
					}
				}
				
				// Chose 3
				if (theseKeys[0].name == 'right') {
					let choice = 3
					outcome = getRandomOutcome(probability_3, game_type)
					getOutcomePair(outcome, game_type, choice) // Generate a random image/sound pair based on outcome
					//setOutcome(outcome, choice)
					setOutcomeResponse(outcome, game_type, choice)
					if (game_type == 'pleasant')
					{
						if (outcome == 'positive')
						{
							score_three_pos += 1
							g.game_room_score.setText(`Number of Positive Outcomes: ${score_one_pos + score_two_pos + score_three_pos}/${trials_block}`)
							//g.outcome_scores_three[score_three - 1].setAutoDraw(false)
							g.outcome_scores_three_pos[score_three_pos].setAutoDraw(true)
						}
						else
						{
							score_three += 1
							g.outcome_scores_three[score_three].setAutoDraw(true)
						}
					}
					if (game_type == 'unpleasant')
					{
						if (outcome == 'negative')
						{
							score_three_neg += 1
							g.game_room_score.setText(`Number of Negative Outcomes: ${score_one_neg + score_two_neg + score_three_neg}/${trials_block}`)
							//g.outcome_scores_three[score_three - 1].setAutoDraw(false)
							g.outcome_scores_three_neg[score_three_neg].setAutoDraw(true)
						}
						else
						{
							score_three += 1
							g.outcome_scores_three[score_three].setAutoDraw(true)
						}
					}
				}

				// Mark keypress
				mark_event(trials_data, globalClock, g.trial_number, trial_type, event_types['SELECTION'],
				theseKeys[0].rt, theseKeys[0].name , outcome)

				// presed key
				// g.trial_number++ // incremente trial number
				// g.global_trial_number++ // incremeante global trial number

				// Start Timer
				g.OUTCOME_TEXT_DURATION = 0.5; // the time duration for the text to display after selecting the person
				g.OUTCOME_SOUND_DURATION = 1; // the duration of the outcome sounds. both neutral and positive.
				g.outcomeTimer.reset(g.OUTCOME_SOUND_DURATION + g.OUTCOME_TEXT_DURATION);
				
				// g.black_rectangle.setAutoDraw(true)
				g.outcome_text_bubble.setAutoDraw(true)

				ready.clock.reset(); // reset keyboard clock
			}
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
			return Scheduler.Event.NEXT;
		}
	};
}

/**
 * Show Stim Eithe the Sad or Angry Faces
 * @param {*} trials trial snapshot
 */
const STIM_DURATION = 0.150 // duration of the image
function blockRoutineOutcome(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = false; // until we're told otherwise

		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// check if the Routine should terminate
		if (continueRoutine) { 
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
			g.outcome_image.setAutoDraw(false)
			g.outcome_image.status = PsychoJS.Status.NOT_STARTED
			endClock.reset()

			g.game_room_score.setAutoDraw(false)
			score_one = 0;
			score_two = 0;
			score_three = 0;
			score_one_pos = 0;
			score_two_pos = 0;
			score_three_pos = 0;
			score_one_neg = 0;
			score_two_neg = 0;
			score_three_neg = 0;

			for (let i = 0; i <= 16; i++)
			{
				g.outcome_scores_one[i].setAutoDraw(false)
				g.outcome_scores_two[i].setAutoDraw(false)
				g.outcome_scores_three[i].setAutoDraw(false)
				g.outcome_scores_one_pos[i].setAutoDraw(false)
				g.outcome_scores_two_pos[i].setAutoDraw(false)
				g.outcome_scores_three_pos[i].setAutoDraw(false)
				g.outcome_scores_one_neg[i].setAutoDraw(false)
				g.outcome_scores_two_neg[i].setAutoDraw(false)
				g.outcome_scores_three_neg[i].setAutoDraw(false)
			}

			return Scheduler.Event.NEXT;
		}
	};
}

var trial_number;
// Initial Fixation
// Show a 2 second fixation cross at the start of the first trial
function initialFixation(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise	
		//if (trial_number != 1) continueRoutine = false // if not the firt trial, skip this routine

		g.text_val_game_type.setAutoDraw(false) // Positive/Negative Outcome Games
		g.text_game_number.setAutoDraw(false); // 'Game Number:'
		g.text_val_game_number.setAutoDraw(false); // the game vale '2/2'
		g.text_trial_number.setAutoDraw(false); // 'Choice Number:'
		g.text_val_trial_number.setAutoDraw(false); // the choice val '16/16'
	
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

		//Need to swap the two cases below for it to work right since the latter one is later.
		if (t_end >= (ITI + 0.75))
		{
			points_fixation_stim.setAutoDraw(false)
		 	points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
		 	continueRoutine = false
		}
		else if (t_end >= ITI) {
			//continueRoutine = false
			if (game_type == 'pleasant')
			{
				points_fixation_stim.color = new util.Color('#00ff00')
				points_fixation_stim.setText('Positive Outcome Game')
			}
			else
			{
				points_fixation_stim.color = new util.Color('#ff0000')
				points_fixation_stim.setText('Negative Outcome Game')
			}
			//points_fixation_stim.setAutoDraw(false)
			//points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
		}
		// else if (t_end >= (ITI + 0.5))
		// {
		// 	points_fixation_stim.setAutoDraw(false)
		// 	points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
		// 	continueRoutine = false
		// }
		
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
			
			endClock.reset()
			ready.clearEvents();
			return Scheduler.Event.NEXT;
		}
	};
}

/**
 * Send Data over to the backend to save output data
 */
function sendData() {
	//console.log(trials_data)
	//console.log(expInfo)
	total_requests += 1
	$.ajax({
        type: "POST",
        url: '/savecoop',
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
 * Reset the choice counters
 * (Usuually done after each block)
 */
function reset_choice_counter(){
	g.choice_counter['negative'] = 0;
	g.choice_counter['positive'] = 0;
}

/**
 * Cleat the outcome faces
 */
function clear_outcome_faces() {
	if (g.outcome[1]['negative'].length > 0) {
		g.outcome[1]['negative'].forEach((item) => {
			item.setAutoDraw(false)
			item.status = PsychoJS.Status.NOT_STARTED
		});
		
	}
	if (g.outcome[1]['positive'].length > 0) {
		g.outcome[1]['positive'].forEach((item) => {
			item.setAutoDraw(false)
			item.status = PsychoJS.Status.NOT_STARTED
		});
	}
	if (g.outcome[1]['neutral'].length > 0) {
		g.outcome[1]['neutral'].forEach((item) => {
			item.setAutoDraw(false)
			item.status = PsychoJS.Status.NOT_STARTED
		});
	}

	if (g.outcome[2]['negative'].length > 0) {
		g.outcome[2]['negative'].forEach((item) => {
			item.setAutoDraw(false)
			item.status = PsychoJS.Status.NOT_STARTED
		});
	}
	if (g.outcome[2]['positive'].length > 0) {
		g.outcome[2]['positive'].forEach((item) => {
			item.setAutoDraw(false)
			item.status = PsychoJS.Status.NOT_STARTED
		});
	}
	if (g.outcome[2]['neutral'].length > 0) {
		g.outcome[2]['neutral'].forEach((item) => {
			item.setAutoDraw(false)
			item.status = PsychoJS.Status.NOT_STARTED
		});
	}

	if (g.outcome[3]['negative'].length > 0) {
		g.outcome[3]['negative'].forEach((item) => {
			item.setAutoDraw(false)
			item.status = PsychoJS.Status.NOT_STARTED
		});
	}
	if (g.outcome[3]['positive'].length > 0) {
		g.outcome[3]['positive'].forEach((item) => {
			item.setAutoDraw(false)
			item.status = PsychoJS.Status.NOT_STARTED
		});
	}
	if (g.outcome[3]['neutral'].length > 0) {
		g.outcome[3]['neutral'].forEach((item) => {
			item.setAutoDraw(false)
			item.status = PsychoJS.Status.NOT_STARTED
		});
	}
}

/**
 * Trial Routine End
 * @param {*} trials 
 * @returns 
 */
function blockRoutineEnd(trials) {
	return function () {
		//------Ending Routine 'trial'-------
		t = endClock.getTime()

		g.game_number++
		g.trial_number = 1

		// Send Data
		// if (t <= 2) {
		// 	return Scheduler.Event.FLIP_REPEAT;
		// } else {
			resp.stop()
			resp.status = PsychoJS.Status.NOT_STARTED
			sendData()

			clear_outcome_faces() // undraw the faces

			g.faces_choice[1].setAutoDraw(false) // face options
			g.faces_choice[2].setAutoDraw(false)
			g.faces_choice[3].setAutoDraw(false)

			g.faces_text[1].setAutoDraw(false)
			g.faces_text[2].setAutoDraw(false)
			g.faces_text[3].setAutoDraw(false)

			g.game_type_text_image_stim.setAutoDraw(false) // bottom text

			// Clear Fixation
			points_fixation_stim.setAutoDraw(false)
			points_fixation_stim.status = PsychoJS.Status.NOT_STARTED

			return Scheduler.Event.NEXT;
		//}
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
		thanksText.setText(`This is the end of the task run`)
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
		if (main_loop_count % 1 == 0) {
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

/**
 * Function for importing the schedule information
 * @param {*} block 
 * @returns 
 */
function importConditions(block) {
	return function () {
		psychoJS.importAttributes(block.getCurrentTrial());

		return Scheduler.Event.NEXT;
	};
}

/**
 * Quit Routine
 * @param {*} message 
 * @param {*} isCompleted 
 * @returns 
 */
function quitPsychoJS(message, isCompleted) {
	// Check for and save orphaned data
	if (psychoJS.experiment.isEntryEmpty()) {
		psychoJS.experiment.nextEntry();
	}

	psychoJS.window.close();
	psychoJS.quit({ message: message, isCompleted: isCompleted });

	return Scheduler.Event.QUIT;
}
