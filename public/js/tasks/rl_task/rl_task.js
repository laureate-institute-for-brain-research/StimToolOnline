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
	'CHOICE_ONSET': 5,
	'ADVICE_ONSET': 6,
	'ADVICE_TYPE': 7,
	'CHOICE': 8,
	'FEEDBACK_ONSET': 9,
	'FIXATION_ONSET': 10,
	'AUDIO_ONSET': 11
}

var DEBUG_FLAG = false

var trials_data = []
var config_values = {}
var real_trial_order = []

var main_loop_count = 0
var last_trial_num = 0
var total_requests = 0
var total_block_count = 0;
var completed_blocks = 1;

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
var DOWN_KEY = 'down'
var keyList = [LEFT_KEY, RIGHT_KEY, UP_KEY, DOWN_KEY]

var window_ratio = 4 / 3; // used for general stimuli sizing
var image_ratio = 4 / 3; // used for setting image sizes (this gets set to different image specific values throughout the code)

// global flags
var set_fixation_flag = true
var init_fixation_flag = true

var total_score = 0

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
			resources.push({ name: 'instruct_schedule.csv', path: values.instruct_schedule })
			resources.push({ name: 'practice_schedule.csv', path: values.practice_schedule })
			resources.push({ name: 'config.csv', path: values.config})

			// Add file paths to expInfo
			if (values.schedule) expInfo.task_schedule = values.schedule
			if (values.instruct_schedule) expInfo.instruct_schedule = values.instruct_schedule
			if (values.practice_schedule) expInfo.practice_schedule = values.practice_schedule
			if (values.config) expInfo.task_config = values.config
			
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
								// 	console.log('empty string')
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
						console.log(obj)

						if (obj.L1_img != 'None' && obj.L1_img != undefined) {
							console.log("HEYYYOOO")
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

						config_values = obj
						console.log(resources)

						resolve(data)
					}
				})
				
			})
		})
		// .then((values) => {			
		// 	// Add practice Images
		// 	return new Promise((resolve, reject) => {
		// 		$.ajax({
		// 			type: 'GET',
		// 			url: expInfo.practice_schedule,
		// 			dataType: 'text',
		// 			async: false,
		// 			success: (data) => {
		// 				var out = [];
		// 				var allRows = data.split('\n'); // split rows at new line
						
		// 				var headerRows = allRows[0].split(',');
						
		// 				for (var i=1; i<allRows.length; i++) {
		// 					var obj = {};
		// 					var currentLine = allRows[i].split(',');
		// 					for (var j = 0; j < headerRows.length; j++){
		// 						obj[headerRows[j]] = currentLine[j];	
		// 					}
		// 					// If there's media add to resources
		// 					if (obj.face_stim_path != 'None' && obj.face_stim_path != undefined) {
		// 						resources.push({ name: obj.face_stim_path , path: obj.face_stim_path  })
		// 					}
		// 					if (obj.none_stim_path != 'None' && obj.none_stim_path != undefined) {
		// 						resources.push({ name: obj.none_stim_path , path: obj.none_stim_path  })
		// 					}
		// 					if (obj.rightpos_stim_path != 'None' && obj.rightpos_stim_path != undefined) {
		// 						resources.push({ name: obj.rightpos_stim_path , path: obj.rightpos_stim_path  })
		// 					}
		// 					if (obj.leftpos_stim_path != 'None' && obj.leftpos_stim_path != undefined) {
		// 						resources.push({ name: obj.leftpos_stim_path , path: obj.leftpos_stim_path  })
		// 					}
		// 					if (obj.rightneg_stim_path != 'None' && obj.rightneg_stim_path != undefined) {
		// 						resources.push({ name: obj.rightneg_stim_path , path: obj.rightneg_stim_path  })
		// 					}
		// 					if (obj.leftneg_stim_path != 'None' && obj.leftneg_stim_path != undefined) {
		// 						resources.push({ name: obj.leftneg_stim_path , path: obj.leftneg_stim_path  })
		// 					}
		// 				}

		// 				resolve(data)
		// 			}
		// 		})
				
		// 	})
		// })
	
		
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
	flowScheduler.add(instruct_pagesLoopEnd);
}

// PRACTICE BLOCK
if (!getQueryVariable('skip_practice')) {
	// Single Slide
	// flowScheduler.add(readyRoutineBegin('PRACTICE'));
	// flowScheduler.add(readyRoutineEachFrame());
	// flowScheduler.add(readyRoutineEnd());

	// const practiceTrialsLoopScheduler = new Scheduler(psychoJS);
	// flowScheduler.add(practiceTrialsLoopBegin, practiceTrialsLoopScheduler);
	// flowScheduler.add(practiceTrialsLoopScheduler);
	// flowScheduler.add(trialsLoopEnd);
}

// Learning BLOCK
// Ready Routine
flowScheduler.add(readyRoutineBegin('LEARN'));
flowScheduler.add(readyRoutineEachFrame());
flowScheduler.add(readyRoutineEnd());

const trialsLoopScheduler_learning = new Scheduler(psychoJS);
flowScheduler.add(trialsLoopBegin, trialsLoopScheduler_learning);
flowScheduler.add(trialsLoopScheduler_learning);
flowScheduler.add(trialsLoopEnd);

flowScheduler.add(thanksRoutineBegin());
flowScheduler.add(thanksRoutineEachFrame());
flowScheduler.add(thanksRoutineEnd());
flowScheduler.add(quitPsychoJS, '', true);

// // Testing BLOCK
// // Ready Routine
// flowScheduler.add(readyRoutineBegin('TEST'));
// flowScheduler.add(readyRoutineEachFrame());
// flowScheduler.add(readyRoutineEnd());

// const trialsLoopScheduler_testing = new Scheduler(psychoJS);
// flowScheduler.add(trialsLoopBegin, trialsLoopScheduler_testing);
// flowScheduler.add(trialsLoopScheduler_testing);
// flowScheduler.add(trialsLoopEnd);

// flowScheduler.add(thanksRoutineBegin());
// flowScheduler.add(thanksRoutineEachFrame());
// flowScheduler.add(thanksRoutineEnd());
// flowScheduler.add(quitPsychoJS, '', true);

// // Explicit BLOCK
// // Ready Routine
// flowScheduler.add(readyRoutineBegin('EXPL'));
// flowScheduler.add(readyRoutineEachFrame());
// flowScheduler.add(readyRoutineEnd());

// const trialsLoopScheduler_explicit = new Scheduler(psychoJS);
// flowScheduler.add(trialsLoopBegin, trialsLoopScheduler_explicit);
// flowScheduler.add(trialsLoopScheduler_explicit);
// flowScheduler.add(trialsLoopEnd);

flowScheduler.add(thanksRoutineBegin());
flowScheduler.add(thanksRoutineEachFrame());
flowScheduler.add(thanksRoutineEnd());
flowScheduler.add(quitPsychoJS, '', true);

// quit if user presses Cancel in dialog box:
dialogCancelScheduler.add(quitPsychoJS, '', false);


// Add Slides to resources
var resources = [
	{ name: 'practice_schedule.csv', path: '/js/tasks/rl_task/practice_schedule.csv' },
	{ name: 'PRACTICE_ready', path: '/js/tasks/rl_task/media/instructions/Slide10.JPG'},
	{ name: 'MAIN_ready', path: '/js/tasks/rl_task/media/instructions/Slide11.JPG' },
	{ name: 'PRACTICE_ready_audio.mp3', path: '/js/tasks/rl_task/media/instructions_audio/Slide10.mp3' },
	{ name: 'MAIN_ready_audio.mp3', path: '/js/tasks/rl_task/media/instructions_audio/Slide11.mp3' }
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
var stimClock;
var adviceClock;
var feedbackClock;
var respondClock;
var blockClock;

// Stim from schedule
var low1
var mid1
var high1
var low2
var mid2
var high2

var faceStim;
var noneStim;
var leftposStim;
var rightposStim;
var leftnegStim;
var rightnegStim;

// feedback stim
var try_left;
var try_right

// middle scores
var zero_score;
var twenty_score;
var fourty_score;
var nfourty_score;
var sixty_score;
var eighty_score;
var hundred_score;

// static stim
//// controls
var press_left;
var press_right;
var press_up;
var press_down;
//// UI Trackers
var currentTrialNumber;
var currentTrialText;
var currentGameNumber;
var currentGameText;
var currentScoreNumber;
var currentScoreText;
var dinnerSizeTopText;
var dinnerSizeBottomText;
var dinnerSizeUnderline;
var possibleWinText;
var possibleWinNumber;
var possibleLossText;
var possibleLossNumber;

//// Fixation
var points_fixation_stim;

// timers
var t_end;
var readyClock;
var endClock;
var track;

// block screen
var block_screen
var block_dinner_size

var resp;
var thanksClock;
var thanksText;
var globalClock;
var routineTimer;

var debugClock;


function experimentInit() {
	// Check if there is an practice
	if (getQueryVariable('practice') == 'true') {
		practice = true;
	}

	window_ratio = psychoJS.window.size[0]/psychoJS.window.size[1]
	
	// Initialize components for Routine "instruct"
	instructClock = new util.Clock();
	instructClock.reset()

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
	stimClock = new util.Clock();
	adviceClock = new util.Clock();
	feedbackClock = new util.Clock();
	respondClock = new util.Clock();
	blockClock = new util.Clock();
	debugClock = new util.Clock();

	// // Press Arrows Text
	// press_right = new visual.ImageStim({
	// 	win : psychoJS.window,
	// 	name : 'stimPath', units : 'height', 
	// 	image : 'press_r.png', mask : undefined,
	// 	ori: 0, pos: [window_ratio * 0.25, -0.25], opacity: 1,
	// 	size: [window_ratio*.1, 0.1],
	// 	flipHoriz : false, flipVert : false,
	// 	texRes : 128, interpolate : true, depth : 0
	// });

	// Trial/Choice counter
	currentTrialText = new visual.TextStim({
		win: psychoJS.window,
		name: 'trialTracker',
		text: 'Choice Number: ',
		font: 'Arial', units: 'height',
		pos: [-window_ratio * 0.46, 0.47], height: 0.027, wrapWidth: undefined, ori: 0,
		alignHoriz: 'left',
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	// Score/Points Counter
	dinnerSizeUnderline = new visual.Rect({
		win: psychoJS.window,
		name: 'underline',
		width: window_ratio*0.1,
		height: 0.001,
		units: 'height',
		pos: [window_ratio * 0.38, 0.45], ori: 0,
		fillColor: new util.Color('white'),
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0
	})

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
		trialList: 'instruct_schedule.csv',
		seed: undefined, name: 'slides'
	});
	
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
		kb.keys = undefined;
		kb.rt = undefined;
		// keep track of which components have finished
		instructComponents = [ slideStim];
	
		instructComponents.push(kb);

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
				track = new Sound({
					win: psychoJS.window,
					value: 'PRACTICE_ready_audio.mp3'
				});
				track.setVolume(1.0);
				break
			case 'LEARN':
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


var trials;
var currentLoop;
var trial_type;
var current_block_size;
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
	total_block_count = trials.nTotal / parseInt(config_values.practice_block_size)

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop
	total_score = 0
	completed_blocks = 1
	currentScoreNumber.setText(`0`)
	currentScoreNumber.setColor(new util.Color('#66ff99'))
	
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
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	trial_type = 'PRACTICE'
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

	/*mean = defaultTo(mean, 0.0);
	standardDeviation = defaultTo(standardDeviation, 1.0);*/

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

function generate_trial_order(trials) {
	for (const t of trials) {
		// console.log(t)
		let trial_temp = []
		trial_temp.append(shuffle(['L', 'M', 'H']))
		// ...
		
	}
}

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
	total_block_count = trials.nTotal / parseInt(config_values.block_size)

	// generate_trial_order(trials)

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop
	total_score = 0
	completed_blocks = 1

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
				'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

function instruct_pagesLoopEnd() {
	psychoJS.experiment.removeLoop(slides);
	return Scheduler.Event.NEXT;
}

// SHow the points in the trial 
function trialsLoopEnd() {
	// currentTrialNumber.setAutoDraw(false)
	slideStim.setAutoDraw(false)

	psychoJS.experiment.removeLoop(trials);

	psychoJS.experiment.addData('globalClock', globalClock.getTime());

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

// var theseKeys;
// var image_ratio;
var pressed;
var asked_for_advice;
var got_advice;
var post_advice_choice_allowed;
var correct_side; // true for left, false for right
var advice_outcome; // true for left, false for right
var picked_side; // true for left, false for right
var feedback_active;
var no_choice;
var reward_stim;
var penalty_stim;
var last_trial_num = 0;
var advice_requests = 0;
var last_prob;
var show_block_screen = false;
var start_block_screen = false;

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

		let mean_dict = { "L1": L_mean, "M1": M_mean, "H1": H_mean, "L2": L_mean, "M2": M_mean, "H2": H_mean }
		let variance_dict = { "L1": L_variance, "M1": M_variance, "H1": H_variance, "L2": L_variance, "M2": M_variance, "H2": H_variance }

		let options_array = options.split("_")
		if (options_array.length == 3) {
			var pos_score_array = shuffle([[options_array[0], randomGaussian(mean_dict[options_array[0]], variance_dict[options_array[0]])], [options_array[1], randomGaussian(mean_dict[options_array[1]], variance_dict[options_array[1]])], [options_array[2], randomGaussian(mean_dict[options_array[2]], variance_dict[options_array[2]])]])
		} else {
			var pos_score_array = shuffle([[options_array[0], randomGaussian(mean_dict[options_array[0]], variance_dict[options_array[0]])], [options_array[1], randomGaussian(mean_dict[options_array[1]], variance_dict[options_array[1]])], ""])
		}

		if (pos_score_array[0] != "") {
			if (pos_score_array[0][0].includes("L")) {
				console.log("1")
				low_pos = [window_ratio * -0.25, 0]
			} else if (pos_score_array[0][0].includes("M")) {
				console.log("2")
				mid_pos = [window_ratio * -0.25, 0]
			} else {
				console.log("3")
				hi_pos = [window_ratio * -0.25, 0]
			}
		}

		if (pos_score_array[1] != "") {
			if (pos_score_array[1][0].includes("L")) {
				console.log("4")
				low_pos = [window_ratio * 0, 0]
			} else if (pos_score_array[1][0].includes("M")) {
				console.log("5")
				mid_pos = [window_ratio * 0, 0]
			} else {
				console.log("6")
				hi_pos = [window_ratio * 0, 0]
			}
		}

		if (pos_score_array[2] != "") {
			// if (options_array.length == 3) {
			if (pos_score_array[2][0].includes("L")) {
				console.log("7")
				low_pos = [window_ratio * 0.25, 0]
			} else if (pos_score_array[2][0].includes("M")) {
				console.log("8")
				mid_pos = [window_ratio * 0.25, 0]
			} else {
				console.log("9")
				hi_pos = [window_ratio * 0.25, 0]
			}
			// }
		}

		console.log(pos_score_array)
		console.log(options.includes("1"))
		
		// Stimuli
		if (options.includes('1')) {
			console.log(options)
			console.log("OPTIONS INCLUDES 1")
			if (options.includes("L")) {
				low1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L1_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [window_ratio * .2, 0.2],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low1.setAutoDraw(true)
				console.log("a")
			}
			if (options.includes("M")) {
				mid1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M1_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [window_ratio * .2, 0.2],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid1.setAutoDraw(true)
				console.log("b")
			}
			if (options.includes("H")) {
				high1 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H1_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [window_ratio * .2, 0.2],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high1.setAutoDraw(true)
				console.log("c")
			}
		}
		else {
			console.log(options)
			if (options.includes("L")) {
				low2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'L2_img', mask: undefined,
					ori: 0, pos: low_pos, opacity: 1,
					size: [window_ratio * .2, 0.2],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				low2.setAutoDraw(true)
			}
			if (options.includes("M")) {
				mid2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'M2_img', mask: undefined,
					ori: 0, pos: mid_pos, opacity: 1,
					size: [window_ratio * .2, 0.2],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				mid2.setAutoDraw(true)
			}
			if (options.includes("H")) {
				high2 = new visual.ImageStim({
					win: psychoJS.window,
					name: 'stimPath', units: 'height',
					image: 'H2_img', mask: undefined,
					ori: 0, pos: hi_pos, opacity: 1,
					size: [window_ratio * .2, 0.2],
					flipHoriz: false, flipVert: false,
					texRes: 128, interpolate: true, depth: 0
				});
				high2.setAutoDraw(true)
			}
		}
		// resize_image(leftposStim, image_ratio, 0.4)
		
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
		if (theseKeys.length > 0) {
			console.log("key press")
			resp.keys = theseKeys[0].name;  // just the last key pressed
			resp.rt = theseKeys[0].rt;

			// Advice-less Choice
			if (resp.keys == LEFT_KEY) {
				console.log("???")
				mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['CHOICE'],
					'NA', 'left', 'NA')
				feedbackClock.reset()
				continueRoutine = false
			}
		}

		// check if the Routine should terminate
		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
			if (options.includes('1')) {
				low1.setAutoDraw(false)
				mid1.setAutoDraw(false)
				high1.setAutoDraw(false)
			}
			else {
				low2.setAutoDraw(false)
				mid2.setAutoDraw(false)
				high2.setAutoDraw(false)
			}

			// set_fixation_flag = true
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
		
		// if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
		// 	points_fixation_stim.color = new util.Color('white')
		// 	points_fixation_stim.setText('+')
		// 	points_fixation_stim.setAutoDraw(true)
		// 	//console.log('Initial Fixation')

		// 	mark_event(trials_data, globalClock, 'NA', trial_type, event_types['FIXATION_ONSET'],
		// 		'NA', 'NA' , 'NA')

		// }

		if (t_end >= 3) {
			continueRoutine = false
			// points_fixation_stim.setAutoDraw(false)
			// points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
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
			// points_fixation_stim.setAutoDraw(false)
			// points_fixation_stim.status = PsychoJS.Status.NOT_STARTED

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
function trialRoutineEnd(trials) { 
	return function () {
		//------Ending Routine 'trial'-------
		t = endClock.getTime()

		// if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
		// 			points_fixation_stim.setText('+')
		// 			mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types['FIXATION_ONSET'],
		// 				'NA', 'NA', 'NA')
					
		// 			points_fixation_stim.setAutoDraw(true)
		// }
		
			// hold the fixation for jitter time
		if (t <= 0.1) {
			return Scheduler.Event.FLIP_REPEAT;
		} else {
			resp.stop()
			resp.status = PsychoJS.Status.NOT_STARTED
			//sendData()
			// Clear Fixation
			// points_fixation_stim.setAutoDraw(false)
			// points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
			return Scheduler.Event.NEXT;
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
		thanksText.setText(`This is the end of the task run.`)
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
		if (total_requests > 0) {
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
