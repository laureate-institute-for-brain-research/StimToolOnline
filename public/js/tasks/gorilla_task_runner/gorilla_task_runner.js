﻿/**
 * Active Trust
 * @author Aardron Robinson
 */

/*jshint -W069 */
/*Disable Warning Justification:
	Using bracket notation because it's familiar coding convention with python
	Counterpart
*/

/**
 * Active Trust
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
// var keyList = [LEFT_KEY, RIGHT_KEY, UP_KEY, DOWN_KEY]
var keyList = [LEFT_KEY, RIGHT_KEY, UP_KEY]

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
					url: '/js/tasks/gorilla_task_runner/' + getQueryVariable('run'),
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
							if (obj.face_stim_path != 'None' && obj.face_stim_path != undefined) {
								resources.push({ name: obj.face_stim_path , path: obj.face_stim_path  })
							}
							if (obj.none_stim_path != 'None' && obj.none_stim_path != undefined) {
								resources.push({ name: obj.none_stim_path , path: obj.none_stim_path  })
							}
							if (obj.rightpos_stim_path != 'None' && obj.rightpos_stim_path != undefined) {
								resources.push({ name: obj.rightpos_stim_path , path: obj.rightpos_stim_path  })
							}
							if (obj.leftpos_stim_path != 'None' && obj.leftpos_stim_path != undefined) {
								resources.push({ name: obj.leftpos_stim_path , path: obj.leftpos_stim_path  })
							}
							if (obj.rightneg_stim_path != 'None' && obj.rightneg_stim_path != undefined) {
								resources.push({ name: obj.rightneg_stim_path , path: obj.rightneg_stim_path  })
							}
							if (obj.leftneg_stim_path != 'None' && obj.leftneg_stim_path != undefined) {
								resources.push({ name: obj.leftneg_stim_path , path: obj.leftneg_stim_path  })
							}
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
							if (obj.face_stim_path != 'None' && obj.face_stim_path != undefined) {
								resources.push({ name: obj.face_stim_path , path: obj.face_stim_path  })
							}
							if (obj.none_stim_path != 'None' && obj.none_stim_path != undefined) {
								resources.push({ name: obj.none_stim_path , path: obj.none_stim_path  })
							}
							if (obj.rightpos_stim_path != 'None' && obj.rightpos_stim_path != undefined) {
								resources.push({ name: obj.rightpos_stim_path , path: obj.rightpos_stim_path  })
							}
							if (obj.leftpos_stim_path != 'None' && obj.leftpos_stim_path != undefined) {
								resources.push({ name: obj.leftpos_stim_path , path: obj.leftpos_stim_path  })
							}
							if (obj.rightneg_stim_path != 'None' && obj.rightneg_stim_path != undefined) {
								resources.push({ name: obj.rightneg_stim_path , path: obj.rightneg_stim_path  })
							}
							if (obj.leftneg_stim_path != 'None' && obj.leftneg_stim_path != undefined) {
								resources.push({ name: obj.leftneg_stim_path , path: obj.leftneg_stim_path  })
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
let expName = 'Active Trust';  // from the Builder filename that created this script
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

// MAIN BLOCK
// Ready Routine
flowScheduler.add(readyRoutineBegin('MAIN'));
flowScheduler.add(readyRoutineEachFrame());
flowScheduler.add(readyRoutineEnd());

const trialsLoopScheduler = new Scheduler(psychoJS);
flowScheduler.add(trialsLoopBegin, trialsLoopScheduler);
flowScheduler.add(trialsLoopScheduler);
flowScheduler.add(trialsLoopEnd);

flowScheduler.add(quitPsychoJS, '', true);

// quit if user presses Cancel in dialog box:
dialogCancelScheduler.add(quitPsychoJS, '', false);


// Add Slides to resources
var resources = [
	{ name: 'MAIN_ready', path: '/js/tasks/gorilla_task_runner/media/instructions/Slide2.PNG' }
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
var readyClock;
var kb;
var routineTimer;
var resp;
var trials;

var theButton;

function experimentInit() {
	// Check if there is an practice
	if (getQueryVariable('practice') == 'true') {
		practice = true;
	}

	window_ratio = psychoJS.window.size[0] / psychoJS.window.size[1]
	
	// Initialize components for Routine "instruct"
	instructClock = new util.Clock();
	readyClock = new util.Clock();
	routineTimer = new util.CountdownTimer();
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
		image : 'MAIN_ready', mask : undefined,
		ori : 0, pos : [0, 0],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	kb = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });
	resp = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });
	
	theButton = new visual.ButtonStim({
		win: psychoJS.window,
		name: 'theButton',
		text: 'Click HERE to Start Next Game',
		font: 'Arial', units: 'height',
		pos: [0, 0], wrapWidth: undefined, ori: 0,
		letterHeight: 0.03, size: [0.5, 0.15],
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	return Scheduler.Event.NEXT;
}

var currentLoop;
var globalClock;
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

	return Scheduler.Event.NEXT;
}



var block_type;
var t;
var frameN;
var instructComponents;
var time_audio_end;
var track;
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
		}
	
		// update/draw components on each frame
		let theseKeys = resp.getKeys({ keyList: [RIGHT_KEY, 'right'], waitRelease: false });
		if (theseKeys.length > 0) {
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

function trialsLoopBegin(thisScheduler) {

	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule.xls',
		seed: undefined, name: 'trials'
	});

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment

	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot));
		thisScheduler.add(trialRoutineRespond(snapshot));
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}

	return Scheduler.Event.NEXT;
}

function instruct_pagesLoopEnd() {
	psychoJS.experiment.removeLoop(slides);
	return Scheduler.Event.NEXT;
}

// SHow the points in the trial 
function trialsLoopEnd() {

	psychoJS.experiment.removeLoop(trials);

	return Scheduler.Event.NEXT;
}

function trialRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		
		theButton.setAutoDraw(true)

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

		if (theButton.isClicked) {
			window.location.replace('https://research.sc/participant/login/dynamic/63C5B242-A784-4FB1-A6A6-C0996AA6DD27')
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
 * Trial Routine End
 * @param {*} trials 
 * @returns 
 */
function trialRoutineEnd(trials) { 
	return function () {
		//------Ending Routine 'trial'-------
		if (t <= ITI) {
			return Scheduler.Event.FLIP_REPEAT;
		} else {
			return Scheduler.Event.NEXT;
		}
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
