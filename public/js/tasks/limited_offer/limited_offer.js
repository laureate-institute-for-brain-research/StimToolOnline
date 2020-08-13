/*************** 
 * Limited Offer Task *
 ***************/

import { PsychoJS } from '/lib/core-2020.1.js';
import * as core from '/lib/core-2020.1.js';
import { TrialHandler } from '/lib/data-2020.1.js';
import { Scheduler } from '/lib/util-2020.1.js';
import * as util from '/lib/util-2020.1.js';
import * as visual from '/lib/visual-2020.1.js';
import { Sound } from '/lib/sound-2020.1.js';


// TASAK PARAMS
var practice = false;
var LEFT_KEY = 'left'
var RIGHT_KEY = 'right'
var keyList = [LEFT_KEY, RIGHT_KEY]

var highOfferVal = 80


// init psychoJS:
const psychoJS = new PsychoJS({
	debug: false
});

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

function formatDate() {
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('_');
}


window.onload = function () {
	var id = getQueryVariable('id')
	if (!id){
		return
	}
	$.ajax({
        type: "POST",
        url: '/getInfo',
		data: { 'id': id},
		dataType: 'JSON',
		success: (values) => {
			// console.log(values)
			// set values if valid id
			if (values.subject && values.session) {
				expInfo.participant = values.subject
				expInfo.session  = values.session
			}
			
			

		}
	})
	 	.done(
			  function () {
				// psychoJS.start({expName, expInfo});
				psychoJS.start({
					expName, 
					expInfo,
					resources: resources
				});
			}
	)

	// Check if there is an practice
	psychoJS.setRedirectUrls(
		'/link?id=' + getQueryVariable('id') + '&index=' + parseInt(getQueryVariable('index')) + 1, // get next order.
		'/' // cancellation url
	)
	
}

// open window:
psychoJS.openWindow({
	fullscr: (window.location.hostname != 'localhost'), // not full screen at localhost
	color: new util.Color('black'),
	units: 'height',
	waitBlanking: true
});

// store info about the experiment session:
let expName = 'Limited Offer';  // from the Builder filename that created this script
var expInfo = { 'session': '', 'participant': '' , 'date' : formatDate(), 'study': ''};

// schedule the experiment:
psychoJS.schedule(psychoJS.gui.DlgFromDict({
	dictionary: expInfo,
	title: expName
}));

const flowScheduler = new Scheduler(psychoJS);
const dialogCancelScheduler = new Scheduler(psychoJS);
psychoJS.scheduleCondition(function () { return (psychoJS.gui.dialogComponent.button === 'OK'); }, flowScheduler, dialogCancelScheduler);

// flowScheduler gets run if the participants presses OK
flowScheduler.add(updateInfo); // add timeStamp
flowScheduler.add(experimentInit);

// instruction slide
const instruct_pagesLoopScheduler = new Scheduler(psychoJS);
flowScheduler.add(instruct_pagesLoopBegin, instruct_pagesLoopScheduler);
flowScheduler.add(instruct_pagesLoopScheduler);
flowScheduler.add(instruct_pagesLoopEnd);

// // // Example Play
// const example_playScheduler = new Scheduler(psychoJS);
// flowScheduler.add(trials_exampleLoopBegin, example_playScheduler);
// flowScheduler.add(example_playScheduler);
// flowScheduler.add(exampleLoopEnd);

// // Ready Routine
// flowScheduler.add(readyRoutineBegin());
// flowScheduler.add(readyRoutineEachFrame());
// flowScheduler.add(readyRoutineEnd());

// flowScheduler.add(thanksRoutineBegin());
// flowScheduler.add(thanksRoutineEachFrame());
// flowScheduler.add(thanksRoutineEnd());

const trialsLoopScheduler = new Scheduler(psychoJS);
flowScheduler.add(trialsLoopBegin, trialsLoopScheduler);
flowScheduler.add(trialsLoopScheduler);
flowScheduler.add(trialsLoopEnd);


flowScheduler.add(thanksRoutineBegin());
flowScheduler.add(thanksRoutineEachFrame());
flowScheduler.add(thanksRoutineEnd());
flowScheduler.add(quitPsychoJS, '', true);

// quit if user presses Cancel in dialog box:
dialogCancelScheduler.add(quitPsychoJS, '', false);


// Add Slides to resources
var resources = [
	{ name: 'r1.xls', path: '/js/tasks/limited_offer/r1.xls' },
	{ name: 'instruct_slide.xls', path: '/js/tasks/limited_offer/media/instruct_slide.xls' },
]

for (var i = 1; i <= 13; i++){
	var imagePath = { name: `/js/tasks/limited_offer/media/limited_offer_instructions/Slide${i}.jpeg`, path: `/js/tasks/limited_offer/media/limited_offer_instructions/Slide${i}.jpeg` }
	// console.log(i)
	resources.push(imagePath)
}

// // psychoJS.start({expName, expInfo});
// psychoJS.start({
// 	expName, 
// 	expInfo,
// 	resources: resources
// });


var frameDur;
function updateInfo() {
	expInfo['date'] = util.MonotonicClock.getDateStr();  // add a simple timestamp
	expInfo['expName'] = expName;
	expInfo['psychopyVersion'] = '3.2.5';
	expInfo['OS'] = window.navigator.platform;

	// store frame rate of monitor if we can measure it successfully
	expInfo['frameRate'] = psychoJS.window.getActualFrameRate();
	if (typeof expInfo['frameRate'] !== 'undefined')
		frameDur = 1.0 / Math.round(expInfo['frameRate']);
	else
		frameDur = 1.0 / 60.0; // couldn't get a reliable measure so guess

	// add info from the URL:
	util.addInfoFromUrl(expInfo);

	return Scheduler.Event.NEXT;
}
var boxColor = '#0074B7'
var selectColor = '#0074B7'
var forced_fillColor = '#FF0000'


var slideStim;
var goodLuckStim;
var slides;
var instructClock;
var instrText1;
var instrBelow;
var ready;
var trialClock;
var timePointClock;
var offer_stim;
var offer_rect;


var short_boxes_x_pos = [-.18, -.06, .06, .18]
var long_boxes_x_pos = [
	-.42, -.30,
	short_boxes_x_pos[0], short_boxes_x_pos[1],
	short_boxes_x_pos[2], short_boxes_x_pos[3],
	.30, .42
]


var boxes_rect = {
	4 : {},
	8 : {}
}

var accept_text_stim;
var accept_rect_stim;

var wait_text_stim;
var wait_rect_stim;



var bandit_left_up_handle;
var bandit_left_down_handle;
var bandit_right_up_handle;
var bandit_right_down_handle;

var example_trials;
var currentTrialNumber;
var gameNumtracker;
var totalPoints = 0;
var totalPointsTracker;

var points_fixation_stim;
var t_isi;
var t_end;

var isiClock;
var endClock;

var readyClock;
var readyText;

var resp;
var thanksClock;
var thanksText;
var globalClock;
var routineTimer;
function experimentInit() {
	// Check if there is an practice
	if (getQueryVariable('practice') == 'true') {
		practice == true;
		console.log("PRACTICE SESSION!")
	}
	// Initialize components for Routine "instruct"
	instructClock = new util.Clock();

	instrBelow = new visual.TextStim({
		win: psychoJS.window,
		name: 'instrBelow',
		text: 'Press any key to Continue',
		font: 'Arial',
		units: 'height',
		pos: [0, -.8], height: 0.05, wrapWidth: undefined, ori: 0,
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
	
	

	ready = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	// Initialize components for Routine "trial"
	trialClock = new util.Clock();
	timePointClock = new util.Clock();

	// Initial the Text Position of the Band
	offer_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'offer',
		text: 'X',
		font: 'Arial',
		units: 'height',
		pos: [0, .06], height: 0.07, wrapWidth: undefined, ori: 0,
		color: new util.Color('black'), opacity: 1,
		depth: 0.0
	});

	offer_rect= new visual.Rect({
		win: psychoJS.window,
		name: `offer_rect`,
		width: 0.25,
		height: 0.2,
		lineWidth: 3.5,
		units: 'norm',
		pos: [0, .12], ori: 0,
		lineColor: new util.Color('black'),
		fillColor: new util.Color('white'),
		opacity: 1,
		depth: 0.0
	});


	// Make Short Boxes
	for (var i = 0; i <= 3; i++){
		// Rectangle LEFT BANDIT
		boxes_rect[4][i] = new visual.Rect({
			win: psychoJS.window,
			name: `short_box${i}`,
			width: 0.09,
			height: 0.09,
			lineWidth: 3.5,
			units: 'norm',
			pos: [short_boxes_x_pos[i], .5 ], ori: 0,
			lineColor: new util.Color(boxColor), opacity: 1,
			depth: 0.0
		});
	}

	// Make Long Boxes
	for (var i = 0; i <= 7; i++){
		// Rectangle LEFT BANDIT
		boxes_rect[8][i] = new visual.Rect({
			win: psychoJS.window,
			name: `long_box${i}`,
			width: 0.09,
			height: 0.09,
			lineWidth: 3.5,
			units: 'norm',
			pos: [long_boxes_x_pos[i], .5 ], ori: 0,
			lineColor: new util.Color(boxColor), opacity: 1,
			depth: 0.0
		});
	}

	accept_text_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'accept_text',
		text: 'accept',
		font: 'Arial',
		units: 'norm',
		pos: [-.3, -.3], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	accept_rect_stim = new visual.Rect({
		win: psychoJS.window,
		name: 'accept_rect',
		width: 0.14,
		height: 0.09,
		lineWidth: 3.5,
		units: 'norm',
		pos: [-.3, -.3 ], ori: 0,
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	wait_text_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'wait_text',
		text: 'wait',
		font: 'Arial',
		units: 'norm',
		pos: [.3, -.3], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	wait_rect_stim = new visual.Rect({
		win: psychoJS.window,
		name: 'wait_rect',
		width: 0.12,
		height: 0.09,
		lineWidth: 3.5,
		units: 'norm',
		pos: [.3, -.3 ], ori: 0,
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	currentTrialNumber  = new visual.TextStim({
		win: psychoJS.window,
		name: 'trialTracker',
		text: 'Trial Number: ',
		font: 'Arial',
		units: 'norm',
		pos: [0, -.7], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	gameNumtracker = new visual.TextStim({
		win: psychoJS.window,
		name: 'gameTracker',
		text: '1/80',
		font: 'Arial',
		units: 'norm',
		pos: [0, -.8], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	totalPointsTracker = new visual.TextStim({
		win: psychoJS.window,
		name: 'pointsTracker',
		text: 'Total ¢: 0',
		font: 'Arial',
		units: 'norm',
		pos: [0, -.9], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('green'), opacity: 1,
		depth: 0.0
	});

	points_fixation_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'pointsTracker',
		text: 'X',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
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
		text: 'This is the end of the experiment.\n\nThanks!',
		font: 'Arial',
		units: 'height',
		pos: [0, 0], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	// Create some handy timers
	globalClock = new util.Clock();  // to track the time since experiment started
	routineTimer = new util.CountdownTimer();  // to track time remaining of each (non-slip) routine

	return Scheduler.Event.NEXT;
}

function instruct_pagesLoopBegin(thisScheduler) {
	// set up handler to look up the conditions

	slides = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'instruct_slide.xls',
		seed: undefined, name: 'slides'
	});

	// console.log(slides)
	
	psychoJS.experiment.addLoop(slides); // add the loop to the experiment
	currentLoop = slides;  // we're now the current loop

	// Schedule all the slides in the trialList:
	for (const thisTrial of slides) {
		const snapshot = slides.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(instructRoutineBegin(snapshot));
		thisScheduler.add(instructSlideRoutineEachFrame(snapshot));
		thisScheduler.add(instructRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}

	// console.log(thisScheduler)

	return Scheduler.Event.NEXT;
}

var t;
var tp;
var frameN;
var instructComponents;
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

		for (const thisComponent of instructComponents)
			if ('status' in thisComponent)
				thisComponent.status = PsychoJS.Status.NOT_STARTED;

		return Scheduler.Event.NEXT;
	};
}

var continueRoutine;
function instructSlideRoutineEachFrame(trials) {
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
			let theseKeys = ready.getKeys({ keyList: ['right'], waitRelease: false });

			if (theseKeys.length > 0) {  // at least one key was pressed
				// a response ends the routine
				continueRoutine = false;
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

var trials;
var currentLoop;
var lastTrialKeyPressed;
var total_games;
function trialsLoopBegin(thisScheduler) {
	// set up handler to look up the conditions
	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'r1.xls',
		seed: undefined, name: 'trials'
	});
	

	// console.log(trials)
	
	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop

	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot));
		thisScheduler.add(trialRoutineEachFrame(snapshot));
		thisScheduler.add(trialIsi(snapshot));
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}

	return Scheduler.Event.NEXT;
}

function trials_exampleLoopBegin(thisScheduler) {
	total_games = 4
	clearBandits()
	example_trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'example_play.xls',
		seed: undefined, name: 'example_trials'
	});
	psychoJS.experiment.addLoop(example_trials); // add the loop to the experiment
	currentLoop = example_trials;  // we're now the current loop

	// Schedule all the example_trials in the trialList:
	for (const thisTrial of example_trials) {
		const snapshot = example_trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot));
		thisScheduler.add(trialRoutineEachFrame(snapshot));
		thisScheduler.add(trialIsi(snapshot));
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}

	

	return Scheduler.Event.NEXT;
}
function instruct_pagesLoopEnd() {
	psychoJS.experiment.removeLoop(slides);
	return Scheduler.Event.NEXT;
}

function exampleLoopEnd() {
	totalPoints = 0
	clearBandits()
	clearLevers()
	currentTrialNumber.setAutoDraw(false)
	gameNumtracker.setAutoDraw(false)
	totalPointsTracker.setAutoDraw(false)
	slideStim.setAutoDraw(false)
	psychoJS.experiment.removeLoop(example_trials);

	return Scheduler.Event.NEXT;
}

// SHow the points in the trial 
function trialsLoopEnd() {
	totalPoints = 0

	currentTrialNumber.setAutoDraw(false)
	totalPointsTracker.setAutoDraw(false)
	slideStim.setAutoDraw(false)

	psychoJS.experiment.removeLoop(trials);

	return Scheduler.Event.NEXT;
}

/**
 * Turn off all drawing componense
 */
function clearTrialComponenets() {
	currentTrialNumber.setAutoDraw(false)
	totalPointsTracker.setAutoDraw(false)

	// Boxes
	for (var key of Object.keys(boxes_rect[4])) {
		// console.log(key + " -> " + p[key])
		boxes_rect[4][key].setAutoDraw(false)
	}

	for (var key of Object.keys(boxes_rect[8])) {
		// console.log(key + " -> " + p[key])
		boxes_rect[8][key].setAutoDraw(false)
	}

	offer_stim.setAutoDraw(false)


	
}


var trialComponents;
var lastGameNumber;
var lastTrial;
var lastTrialPoints = 0;

var accepted;
var waited;
// var theseKeys;
var missed;
var pressed;
var showed_missed;
var saved;
function trialRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		t = 0;
		tp = 0;
		trialClock.reset(); // clock
		timePointClock.reset()
		frameN = -1;
		time_point = 0;


		// Reset Trial Variables
		pressed = false;
		accepted = false;
		waited = false;
		missed = false;
		showed_missed = 0;

		psychoJS.eventManager.clearEvents()

		


		// update component parameters for each repeat
		// word.setColor(new util.Color(letterColor));
		
		offer_stim.setText(initial_offer + ' ¢') // Set the Current Offer
		
		
		currentTrialNumber.setText(`Trial Number: ${trial_number} / 108`)
		totalPointsTracker.setText(`Total ¢: ${totalPoints}`)
	
		resp.keys = undefined;
		resp.rt = undefined;
	
		return Scheduler.Event.NEXT;
	};
}

/**
 * Returns true if this is the last trial
 * @param {*} game_type 
 * @param {*} trial_num 
 */
function isLastTrial(game_type, trial_num) {
	if (game_type == 'h1' && trial_num == 4) return true
	if (game_type == 'h6' && trial_num == 9) return true
	return false
}

var showLastTrial;
var time_continue;
var now;
var time_point;

function trialRoutineEachFrame(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise
		
	
		// get current time
		t = trialClock.getTime();
		tp = timePointClock.getTime();

		currentTrialNumber.setAutoDraw(true)
		// gameNumtracker.setAutoDraw(true)
		totalPointsTracker.setAutoDraw(true)
	
		for (var i = 0; i < trial_length; i++){
			boxes_rect[trial_length][i].setAutoDraw(true)
			if (i == time_point) {
				boxes_rect[trial_length][time_point].fillColor = new util.Color(boxColor) // Fill Current Time Step
			} else {
				boxes_rect[trial_length][i].fillColor = new util.Color('black')
			}
		}

		// Withdraw or High offer depedning on schedule
		if (waited) {
			if ( (time_point + 1) == ts_high) {
				offer_stim.setText(highOfferVal + ' ¢')
			}
			if ( (time_point + 1) == ts_withdrawal) {
				offer_stim.setText(0 + ' ¢')
			}
		}
		


		// Draw the Boxes

		// Orientation Screen ( 1000ms)
		var orientation_screen_duration = 1
		if (tp <= orientation_screen_duration) {
			saved = false
			psychoJS.eventManager.clearEvents()
			offer_rect.fillColor = new util.Color('white')
			offer_rect.opacity = 1
			offer_stim.color = new util.Color('black')

			wait_rect_stim.height = 
			wait_rect_stim.width = 
			if (time_point == 0 || waited){
				offer_rect.setAutoDraw(true)
				offer_stim.setAutoDraw(true)
			}

			// if (waited) {
			// 	offer_rect.lineColor = new util.Color(boxColor)
			// }
	
			if (!pressed && time_point > 0) {
				offer_stim.setText('X')
				offer_rect.setAutoDraw(false)
				offer_stim.setAutoDraw(true)
			}
	
			if (accepted) {
				offer_rect.setAutoDraw(true)
				offer_stim.setAutoDraw(true)
				
			}
			
		}
		// Make Decision (1500ms)
		var decision_making_duration = 1.5
		if (tp >= orientation_screen_duration) {
			// console.log(trial_length)
			// console.log(time_point)
			
			if (waited || time_point == 0) {
				accept_rect_stim.setAutoDraw(true)
				accept_rect_stim.fillColor = new util.Color('black')
				accept_rect_stim.lineColor = new util.Color('#A9A9A9')
				accept_text_stim.setAutoDraw(true)
				accept_text_stim.color = new util.Color('#A9A9A9')
				
				wait_rect_stim.setAutoDraw(true)
				wait_rect_stim.fillColor = new util.Color('black')
				wait_rect_stim.lineColor = new util.Color('#A9A9A9')
				wait_text_stim.setAutoDraw(true)
				wait_text_stim.color = new util.Color('#A9A9A9')
			}

			if (accepted) {
				accept_rect_stim.setAutoDraw(false)
				accept_text_stim.setAutoDraw(false)
				wait_rect_stim.setAutoDraw(false)
				wait_text_stim.setAutoDraw(false)
			}
		}

		// Button Press ( 1000ms)
		var button_press_duration = 1
		if (tp >= orientation_screen_duration + decision_making_duration) {

			accept_rect_stim.fillColor = new util.Color('white')
			accept_rect_stim.lineColor = new util.Color('white')
			accept_text_stim.color = new util.Color('black')
			
			wait_rect_stim.fillColor = new util.Color('white')
			wait_rect_stim.lineColor = new util.Color('white')
			wait_text_stim.color = new util.Color('black')
			
		
			
			// resp.clearEvents()
			let theseKeys = resp.getKeys({ keyList: keyList, waitRelease: false });
			if (theseKeys.length > 0) {
				resp.keys = theseKeys[0].name;  // just the last key pressed
				resp.rt = theseKeys[0].rt;

				pressed = true

				if (resp.keys == LEFT_KEY) {
					accepted = true
					accept_rect_stim.fillColor = new util.Color(selectColor)
					offer_rect.fillColor = new util.Color(selectColor)
					offer_rect.opacity = .5
					offer_stim.setAutoDraw(true)
					accept_rect_stim.setAutoDraw(true)
					offer_stim.color = new util.Color('white')
					
				}
				if (resp.keys == RIGHT_KEY) {
					waited = true
					wait_rect_stim.lineColor = new util.Color(selectColor)


					wait_rect_stim.color = new util.Color(selectColor)
					wait_rect_stim.height += .1
					wait_rect_stim.width += .1 

					wait_text_stim.color = new util.Color(selectColor)
					// totalPoints = totalPoints + offer_rect.text.replace(' ', '¢')
				}
				
			} 
			
		}

		// Break ( 1000ms)
		var break_duration = 1
		if (tp >= orientation_screen_duration + decision_making_duration + button_press_duration)  {
			if (!pressed) {
				// console.log("Not pressed")
				missed = true
				if (showed_missed <= 0) {
					// Only show this text 1 time. 
					// Rest of the trial will be mared as ex
					offer_stim.setText('Miss - Press Earlier \nOffer Lost')
					showed_missed = 1
				}
				offer_stim.setAutoDraw(true)
				offer_stim.color = new util.Color('white')

				accept_rect_stim.setAutoDraw(false)
				accept_text_stim.setAutoDraw(false)
				
				wait_rect_stim.setAutoDraw(false)
				wait_text_stim.setAutoDraw(false)

				offer_rect.setAutoDraw(false)

			}
			
			if (waited) {
				offer_rect.setAutoDraw(false)
				offer_stim.setAutoDraw(false)

				accept_rect_stim.setAutoDraw(false)
				accept_text_stim.setAutoDraw(false)
				
				
				wait_rect_stim.setAutoDraw(false)
				wait_text_stim.setAutoDraw(false)
			}

			if (accepted) {
				offer_rect.setAutoDraw(true)
				offer_stim.setAutoDraw(true)

				accept_rect_stim.setAutoDraw(false)
				accept_text_stim.setAutoDraw(false)
				
				wait_rect_stim.setAutoDraw(false)
				wait_text_stim.setAutoDraw(false)
			}

		}

		// Save Data
		if ( (typeof resp.keys !== 'undefined') && !saved ) {  // we had a response
			// psychoJS.experiment.addData('resp.rt', resp.rt);
			psychoJS.experiment.addData(`resp_${time_point + 1}`, key_map[resp.keys]);
			
			psychoJS.experiment.addData(`rt_${time_point + 1}`, resp.rt);
			resp.keys = undefined;
			resp.rt = undefined;
			saved = true
			resp.stop();
		}


		//  time point end
		if (tp >= orientation_screen_duration + decision_making_duration + button_press_duration + break_duration)  { 
			
			// console.log(`Finished timepoint ${time_point}`)
			
			// psychoJS.experiment.addData('timepoint_', time_point);
			

			timePointClock.reset();
			psychoJS.eventManager.clearEvents()
			time_point++;
			

			
			
		}
		

		// When to Flip Screen
		if (t >= .1 ) {
			// keep track of start time/frame for later
			resp.tStart = t;  // (not accounting for frame time here)
			resp.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			psychoJS.window.callOnFlip(function () { resp.clock.reset(); });  // t=0 on next screen flip
			psychoJS.window.callOnFlip(function () { resp.start(); }); // start on screen flip
			psychoJS.window.callOnFlip(function () { resp.clearEvents(); });
		}

		// Went through all timepoints. Go to next Trial Routine
		// / If accepted, go to the next trial
		if ((time_point == trial_length) || accepted) {
			continueRoutine = false

			// Show Points Reset so next routine can show points won and ISI
			endClock.reset()
			t_end = 0
			t_isi = 0

			var current_point = offer_stim.getText().replace(' ¢','')
			if (current_point == 'X') {
				current_point = 0
			}
			points_fixation_stim.setText(`You have won ${current_point} ¢ in this trial`)
			psychoJS.experiment.addData(`points_won`, current_point);

			for (var i = 0; i < trial_length; i++){
				boxes_rect[trial_length][i].setAutoDraw(false)
			}

			currentTrialNumber.setAutoDraw(false)
			totalPointsTracker.setAutoDraw(false)
			offer_stim.setAutoDraw(false)
			offer_rect.setAutoDraw(false)

			accept_rect_stim.setAutoDraw(false)
			accept_text_stim.setAutoDraw(false)
			
			wait_rect_stim.setAutoDraw(false)
			wait_text_stim.setAutoDraw(false)
			
		}

		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// check if the Routine should terminate
		if (!continueRoutine) {  // a component has requested a forced-end of Routine
			return Scheduler.Event.NEXT;
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

var fb_duration = 1.5;
function trialIsi(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise
		
		clearTrialComponenets()
	
		// get current time
		t_end = endClock.getTime();

		points_fixation_stim.setAutoDraw(true)

		//  time point end
		if (t_end >= fb_duration) { 
			points_fixation_stim.setText('X')
		}

		if (t_end >= (fb_duration + (trial_isi / 1000))) {
			continueRoutine = false

			points_fixation_stim.setAutoDraw(false)
		}
		
		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// check if the Routine should terminate
		if (!continueRoutine) {  // a component has requested a forced-end of Routine
			return Scheduler.Event.NEXT;
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

function sendData(trial_data) {
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
}


function trialRoutineEnd(trials) {
	return function () {
		//------Ending Routine 'trial'-------

		// Add Points at End
		if (offer_stim.getText() != 'X') {
			if (!Number.isNaN(offer_stim.getText())) {
				console.log(offer_stim.getText())
				totalPoints = totalPoints + parseInt(offer_stim.getText().replace(' ¢', ''))
			}
		}
		

		if (typeof resp.keys !== 'undefined') {  // we had a response
			// psychoJS.experiment.addData('resp.rt', resp.rt);
			routineTimer.reset();
		}


		
		// the Routine "trial" was not non-slip safe, so reset the non-slip timer
		routineTimer.reset();

		// Send Data
		sendData(psychoJS.experiment._trialsData)

		return Scheduler.Event.NEXT;
	};
}

var readyComponents;
function readyRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'ready'-------
		// Clear Trial Components
		clearBandits()
		clearLevers()
		t = 0;
		psychoJS.eventManager.clearEvents()
		readyClock.reset(); // clock
		frameN = -1;
		routineTimer.add(2.000000);
		// update component parameters for each repeat
		// keep track of which components have finished
		readyComponents = [];
		readyComponents.push(goodLuckStim);

		return Scheduler.Event.NEXT;
	};
}


function readyRoutineEachFrame(trials) {
	return function () {
		//------Loop for each frame of Routine 'ready'-------
		let continueRoutine = true; // until we're told otherwise
		// get current time
		t = readyClock.getTime();
		// frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
		// update/draw components on each frame

		// console.log('in ready routine')
		goodLuckStim.setAutoDraw(true)

		if (psychoJS.eventManager.getKeys({keyList:['right']}).length > 0) {
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

// 

var thanksComponents;
function thanksRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'thanks'-------
		// Clear Trial Components
		t = 0;
		thanksClock.reset(); // clock
		frameN = -1;
		routineTimer.add(2.000000);
		// update component parameters for each repeat
		// keep track of which components have finished
		thanksComponents = [];
		thanksComponents.push(thanksText);

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
			if (loop.finished)
			{
				// Check for and save orphaned data
				if (psychoJS.experiment.isEntryEmpty())
				{
					psychoJS.experiment.nextEntry(loop);
				}
				thisScheduler.stop();
			} else
			{
				const thisTrial = loop.getCurrentTrial();
				if (typeof thisTrial === 'undefined' || !('isTrials' in thisTrial) || thisTrial.isTrials)
				{
					psychoJS.experiment.nextEntry(loop);
				}
			}
		}

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
