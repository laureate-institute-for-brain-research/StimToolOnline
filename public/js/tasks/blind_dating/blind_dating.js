/**
 * Speed Dating Task
 * A modifieid Limited Offer Task
 * @author James Touthang <james@touthang.info>
 */

 import { core, data, sound, util, visual } from '/psychojs/psychojs-2021.2.3.js';
 const { PsychoJS } = core;
 const { TrialHandler } = data;
 const { Scheduler } = util;
 //some handy aliases as in the psychopy scripts;
 const { abs, sin, cos, PI: pi, sqrt } = Math;
 const { round } = util;

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
					url: '/js/tasks/blind_dating/' + getQueryVariable('run'),
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

						// console.log(headerRows)
						
						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for (var j = 0; j < headerRows.length; j++){

								// if (headerRows[j] == " ") {
								// 	console.log('empyt string')
								// }
								obj[headerRows[j]] = currentLine[j];
							}
							out.push(obj);

							if (obj.instruct_slide != "" || obj.instruct_slide != undefined ) resources.push({ name: obj.instruct_slide, path: obj.instruct_slide })
							if (obj.audio_path != "" || obj.audio_path != undefined ) resources.push({ name: obj.audio_path, path: obj.audio_path })
						}
						// console.log(out)
						// console.log(resources)
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
let expName = 'Blind Dating Game';  // from the Builder filename that created this script
var expInfo = { 'participant': '' ,'session': '',  'run_id': '', 'date' : formatDate(), 'study': '', };

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


// INSTRUCTION BLOCK
if (!getQueryVariable('skip_instructions')) {
	const instruct_pagesLoopScheduler = new Scheduler(psychoJS);
	flowScheduler.add(instruct_pagesLoopBegin, instruct_pagesLoopScheduler);
	flowScheduler.add(instruct_pagesLoopScheduler);
	flowScheduler.add(instruct_pagesLoopEnd);
}


// QUESTION BLOCK
flowScheduler.add(questionRoutineBegin());
flowScheduler.add(questionRoutineEachFrame());
flowScheduler.add(questionRoutineEnd());


// // Ready Routine
// flowScheduler.add(readyRoutineBegin());
// flowScheduler.add(readyRoutineEachFrame());
// flowScheduler.add(readyRoutineEnd());

// MAIN BLOCK
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
	{name: 'r_test.xls', path: '/js/tasks/limited_offer/r_test.xls'}
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
var selectColor = '#0074B7'


var slideStim;
var slides;
var instructClock;
var instrBelow;
var ready;
var trialClock;
var timePointClock;
var offer_stim_text;
var offer_rect;

var current_point;


var short_boxes_x_pos = [-0.18, -0.06, 0.06, 0.18]
var long_boxes_x_pos = [
	-0.42, -0.30,
	short_boxes_x_pos[0], short_boxes_x_pos[1],
	short_boxes_x_pos[2], short_boxes_x_pos[3],
	0.30, 0.42
]


var boxes_rect = {
	4 : {},
	8 : {}
}

var accept_text_stim;
var accept_rect_stim;

var wait_text_stim;
var wait_rect_stim;


var currentTrialNumber;

var totalPoints = 0;
var totalPointsTracker;

var points_fixation_stim;

var t_end;
var t_isi;

var readyClock;
var isiClock;
var endClock;
var gameNumtracker;


var resp;
var thanksClock;
var thanksText;
var globalClock;
var routineTimer;
function experimentInit() {
	// Check if there is an practice
	if (getQueryVariable('practice') == 'true') {
		practice = true;
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
	
	

	ready = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	// Initialize components for Routine "trial"
	trialClock = new util.Clock();
	timePointClock = new util.Clock();

	// Initial the Text Position of the Band
	offer_stim_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'offer',
		text: 'X',
		font: 'Arial',
		units: 'height',
		pos: [0, 0.06], height: 0.07, wrapWidth: undefined, ori: 0,
		color: new util.Color('black'), opacity: 1,
		depth: 0.0
	});

	offer_rect= new visual.Rect({
		win: psychoJS.window,
		name: `offer_rect`,
		width: 0.28,
		height: 0.2,
		lineWidth: 3.5,
		units: 'norm',
		pos: [0, 0.12], ori: 0,
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
			pos: [short_boxes_x_pos[i], 0.5 ], ori: 0,
			lineColor: new util.Color(boxColor), opacity: 1,
			depth: 0.0
		});
	}

	// Make Long Boxes
	for (var j = 0; j <= 7; j++){
		// Rectangle LEFT BANDIT
		boxes_rect[8][j] = new visual.Rect({
			win: psychoJS.window,
			name: `long_box${j}`,
			width: 0.09,
			height: 0.09,
			lineWidth: 3.5,
			units: 'norm',
			pos: [long_boxes_x_pos[j], 0.5 ], ori: 0,
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
		pos: [-0.3, -0.3], height: 0.05, wrapWidth: undefined, ori: 0,
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
		pos: [-0.3, -0.3 ], ori: 0,
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	wait_text_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'wait_text',
		text: 'wait',
		font: 'Arial',
		units: 'norm',
		pos: [ 0.3, - 0.3], height: 0.05, wrapWidth: undefined, ori: 0,
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
		pos: [ 0.3, -0.3 ], ori: 0,
		lineColor: new util.Color('white'), opacity: 1,
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
		text: 'This is the end of the task run.\n\nThanks!',
		font: 'Arial',
		units: 'height',
		pos: [0, 0], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	 // Exposes PsychoJS's addData for use in HTML pages
	 window.addData = function(key, value) {
		psychoJS.experiment.addData(key, value);
	}
  

	// Adds an iframe on top of the PsychoJS canvas. Use src to specify an HTML page
	window.startHTML = (src) => {
		$('body').append('<iframe id="iframe" src="' + src +'" style="width: 100%; height: 100%; position:absolute;z-index:1;top:0;left:0;border:0;"></iframe>');    
		window.finishedHTML = false;
	};
	
	// Removes the iframe again
	window.finishHTML = () => {
		$('#iframe').remove();
		window.finishedHTML = true;
	};
	

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

		console.log("InstructionSlides Index: ",trials.thisIndex)

		if (audio_path) {
			track = new Sound({
				win: psychoJS.window,
				value: audio_path
			  });
			// console.log(audio_path)
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
		if (newSlide) {
			console.log('setting new image', instruct_slide, 'index:',trials.thisIndex)
			slideStim.setImage(instruct_slide)
			newSlide = false
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
			let theseKeys = ready.getKeys({ keyList: ['right', 'left'], waitRelease: false });
			
			if (theseKeys.length > 0 && theseKeys[0].name == 'right') {  // at least one key was pressed
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

var questionComponents;
var loading_formio_text;
function questionRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'question'-------
		frameN = 0;

		console.log('Questions Routine')
		
		loading_formio_text = new visual.TextStim({
			win: psychoJS.window,
			name: 'loading_formio_text',
			text: 'Embedding formio...',
			font: 'Arial',
			units: 'height',
			pos: [0, 0], height: 0.05, wrapWidth: undefined, ori: 0,
			color: new util.Color('white'), opacity: 1,
			depth: 0.0
		});

		window.startHTML('/js/tasks/blind_dating/question_form/index.html');

		// update component parameters for each repeat
		// keep track of which components have finished
		questionComponents = [];
		questionComponents.push(loading_formio_text);

		for (const thisComponent of questionComponents)
			if ('status' in thisComponent)
				thisComponent.status = PsychoJS.Status.NOT_STARTED;

		return Scheduler.Event.NEXT;
	};
}

var frameRemains;
function questionRoutineEachFrame(trials) {
	return function () {
		//------Loop for each frame of Routine 'question'-------
		let continueRoutine = !window.finishedHTML;
		// get current time
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
		// update/draw components on each frame
		if (loading_formio_text.status === PsychoJS.Status.NOT_STARTED) {
			loading_formio_text.setAutoDraw(true);
		}

		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
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

function questionRoutineEnd(trials) {
	return function () {
		//------Ending Routine 'question'-------
		for (const thisComponent of questionComponents) {
			if (typeof thisComponent.setAutoDraw === 'function') {
				thisComponent.setAutoDraw(false);
			}
		}

		return Scheduler.Event.NEXT;
	};
}

var trials;
var currentLoop;
function trialsLoopBegin(thisScheduler) {

	if (getQueryVariable('practice') == 'true') {
		practice = true;
		console.log('Practice Session')
		trials = new TrialHandler({
			psychoJS: psychoJS,
			nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
			extraInfo: expInfo, originPath: undefined,
			trialList: 'r_test.xls',
			seed: undefined, name: 'trials'
		});
	} else {
		trials = new TrialHandler({
			psychoJS: psychoJS,
			nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
			extraInfo: expInfo, originPath: undefined,
			trialList: 'run_schedule.xls',
			seed: undefined, name: 'trials'
		});
	}

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

	return Scheduler.Event.NEXT;
}

/**
 * Turn off all drawing componense
 */
function clearTrialComponenets() {
	currentTrialNumber.setAutoDraw(false)
	totalPointsTracker.setAutoDraw(false)

	// Boxes
	for (var key_4 of Object.keys(boxes_rect[4])) {
		boxes_rect[4][key_4].setAutoDraw(false)
	}

	for (var key_8 of Object.keys(boxes_rect[8])) {
		boxes_rect[8][key_8].setAutoDraw(false)
	}

	offer_stim_text.setAutoDraw(false)

}


var accepted;
var waited;
// var theseKeys;
var missed;
var pressed;
var showed_missed;
var offer_withdrew;
var saved;
var globalTrialNumber = 0;
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
		showed_missed = false;
		offer_withdrew = false;

		missed_timepoint = [];

		psychoJS.eventManager.clearEvents()


		// update component parameters for each repeat
		// word.setColor(new util.Color(letterColor));
		
		offer_stim_text.setText(initial_offer + ' points') // Set the Current Offer

		globalTrialNumber = globalTrialNumber + 1
		
		
		currentTrialNumber.setText(`Trial Number: ${globalTrialNumber} / 108`)
		totalPointsTracker.setText(`Total points: ${totalPoints}`)
	
		resp.keys = undefined;
		resp.rt = undefined;
	
		return Scheduler.Event.NEXT;
	};
}

var time_point;
var missed_timepoint;

function trialRoutineEachFrame(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise


		// Allow to skip trials for testing and tech errors
		let theseKeys = resp.getKeys({ keyList: ['z'], waitRelease: false });
		if (theseKeys.length > 0) {
			resp.keys = theseKeys[0].name;  // just the last key pressed
			if (resp.keys == 'z') {
				continueRoutine = false;
				current_point = 0
				offer_stim_text.setText(0 + ' points')
			}
		}
	
		// get current time
		t = trialClock.getTime();
		tp = timePointClock.getTime();

		currentTrialNumber.setAutoDraw(true)
		// gameNumtracker.setAutoDraw(true)
		totalPointsTracker.setAutoDraw(true)
	
		for (var i = 0; i < trial_length; i++){
			boxes_rect[trial_length][i].setAutoDraw(true)
			
			// if (missed_timepoint.includes(i)) {
			// 	boxes_rect[trial_length][time_point].fillColor = new util.Color('red') // Fill missed timepoints
			// } else 
			if (i == time_point) {
				boxes_rect[trial_length][time_point].fillColor = new util.Color(boxColor) // Fill Current Time Step
			} else {
				boxes_rect[trial_length][i].fillColor = new util.Color('black')
			}
		}

		// Withdraw or High offer depedning on schedule
		if (waited) {
			if ( (time_point + 1) == ts_high) {
				offer_stim_text.setText(highOfferVal + ' points')
			}
			if ((time_point + 1) == ts_withdrawal) {
				offer_withdrew = true;
				offer_stim_text.setText(0 + ' points')
				// offer_stim_text.setText('Offer revoked')
			}
		}
		
		// Draw the Boxes

		// Orientation Screen ( 1000ms)
		var orientation_screen_duration = 1
		if (tp > 0  && tp <= 1) {
			// console.log('Orientation Screen')
			psychoJS.eventManager.clearEvents()
			saved = false
			
			// psychoJS.eventManager.clearEvents()
			// 
			offer_rect.fillColor = new util.Color('white')
			offer_rect.opacity = 1
			offer_stim_text.color = new util.Color('white')

			wait_rect_stim.height = 0.09
			wait_rect_stim.width = 0.12

			offer_stim_text.height = 0.07
			if (time_point == 0 || waited){
				// offer_rect.setAutoDraw(true)
			}
	
			if (missed) {
				offer_stim_text.setText('X')
				// offer_rect.setAutoDraw(false)
			}

			offer_stim_text.setAutoDraw(true)
			
		}
		// Make Decision (1500ms)
		var decision_making_duration = 1.5
		if (tp > 1  && tp <= 2.5){
			// console.log('Make Decision Screen')
			// console.log(trial_length)
			// console.log(time_point)

			if (!missed) {
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

		}

		// Button Press ( 1000ms)
		var button_press_duration = 1
		if (tp > 2.5  && tp <= 3.5){

			// console.log('Button Press Screen')
			
			if (!pressed) {
				accept_rect_stim.fillColor = new util.Color('white')
				accept_rect_stim.lineColor = new util.Color('white')
				accept_text_stim.color = new util.Color('black')
				
				wait_rect_stim.fillColor = new util.Color('white')
				wait_rect_stim.lineColor = new util.Color('white')
				wait_text_stim.color = new util.Color('black')
			}
			
			// resp.clearEvents()
			if (!pressed && !missed) {
				let theseKeys = resp.getKeys({ keyList: keyList, waitRelease: false });
				if (theseKeys.length > 0) {
					resp.keys = theseKeys[0].name;  // just the last key pressed
					resp.rt = theseKeys[0].rt;

					pressed = true

					if (resp.keys == LEFT_KEY) {
						accepted = true
						accept_rect_stim.fillColor = new util.Color(selectColor)
						offer_rect.fillColor = new util.Color(selectColor)
						offer_rect.opacity = 0.5

						offer_stim_text.height += 0.02
						offer_stim_text.width += 0.02
						offer_stim_text.setAutoDraw(true)
						accept_rect_stim.setAutoDraw(true)
						offer_stim_text.color = new util.Color('white')
						
					}
					if (resp.keys == RIGHT_KEY) {
						waited = true
						wait_rect_stim.lineColor = new util.Color(selectColor)


						wait_rect_stim.fillColor = new util.Color(selectColor)
						wait_rect_stim.height += 0.02
						wait_rect_stim.width += 0.02

						wait_text_stim.color = new util.Color('white')
						// totalPoints = totalPoints + offer_rect.text.replace(' ', 'points')
					}
					
				} 
			}
			
			
		}

		// Break ( 1000ms)
		var break_duration = 1
		if (tp > 3.5  && tp <= 4.5){
			// console.log('Break Screen')
			// console.log(resp.keys)

			accept_rect_stim.setAutoDraw(false)
			accept_text_stim.setAutoDraw(false)
			
			wait_rect_stim.setAutoDraw(false)
			wait_text_stim.setAutoDraw(false)

			if (waited) {
				offer_stim_text.setAutoDraw(false)
			} else {
				offer_stim_text.setAutoDraw(true)
			}

			if (!pressed) {
				missed = true
				
				offer_stim_text.setText('0')
				// Show the text only once in that timepoint only
				// if (!showed_missed) {
				// 	// missed_timepoint.push(time_point)

				// 	offer_stim_text.setText('Miss - Press Earlier \nOffer Lost')
				// 	offer_stim_text.color = new util.Color('white')
				// 	offer_stim_text.setAutoDraw(true)
				// 	showed_missed = true
				// }
			}

			// Save Data for each timepoint during the break phase
			if ( (typeof resp.keys !== 'undefined') && !saved ) {  // we had a response
				// psychoJS.experiment.addData('resp.rt', resp.rt);
				psychoJS.experiment.addData(`resp_${time_point + 1}`, key_map[resp.keys]);
				
				psychoJS.experiment.addData(`rt_${time_point + 1}`, resp.rt);
				resp.keys = undefined;
				resp.rt = undefined;
				saved = true
				resp.stop();
			}

		}
		//  time point end
		// timepoint time should never go aboive 4.5 seconds
		if (tp > 4.5)  { 
			
			// console.log(`Finished timepoint ${time_point}`)
			
			// psychoJS.experiment.addData('timepoint_', time_point);
			pressed = false

			timePointClock.reset();
			psychoJS.eventManager.clearEvents()
			resp.clearEvents();
			time_point++;
			
		}
		

		// When to Flip Screen
		if (t >= 0.1 ) {
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
		if ((time_point == trial_length) || accepted || missed || offer_withdrew) {
			continueRoutine = false

			// Show Points Reset so next routine can show points won and ISI
			endClock.reset()
			t_end = 0
			t_isi = 0

			// remove the cents symbolc of the text
			current_point = offer_stim_text.getText().split(' ')[0]
			if (current_point == 'X') {
				current_point = 0
			}
			//  to be displayed at trial end
			
			if (missed) {
				points_fixation_stim.setText(`Missed - Offer Lost \n\nYou have won ${current_point} points in this trial`)
			}
			else if (offer_withdrew) {
				points_fixation_stim.setText(`Offer Revoked \n\nYou have won ${current_point} points in this trial`)
			}
			else {
				points_fixation_stim.setText(`You have won ${current_point} points in this trial`)
			}
			
			psychoJS.experiment.addData(`points_won`, current_point);

			for (var j = 0; j < trial_length; j++){
				boxes_rect[trial_length][j].setAutoDraw(false)
			}

			currentTrialNumber.setAutoDraw(false)
			totalPointsTracker.setAutoDraw(false)
			offer_stim_text.setAutoDraw(false)
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
			points_fixation_stim.setText('+')
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
		if (offer_stim_text.getText() != 'X') {
			if (!Number.isNaN(offer_stim_text.getText())) {
				console.log(offer_stim_text.getText())
				totalPoints = totalPoints + parseInt(offer_stim_text.getText().replace(' points', ''))
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
		thanksText.setText(`This is the end of the task run.\n\n\n Total Points Earned: ${totalPoints} \n\n Total Cents Earned: ${totalPoints / 10 } =  $${ (totalPoints / 1000).toFixed(2)}`)
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
