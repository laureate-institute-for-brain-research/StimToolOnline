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
// Example used 
// https://gitlab.pavlovia.org/tpronk/demo_embed_html

if (!getQueryVariable('skip_questions')) {
	flowScheduler.add(questionRoutineBegin());
	flowScheduler.add(questionRoutineEachFrame());
	flowScheduler.add(questionRoutineEnd());
}

// PRACTICE BLOCK
const practiceTrialsLoopScheduler = new Scheduler(psychoJS);
flowScheduler.add(practiceTrialsLoopBegin, practiceTrialsLoopScheduler);
flowScheduler.add(practiceTrialsLoopScheduler);
flowScheduler.add(trialsLoopEnd);


// MAIN BLOCK
// Ready Routine
flowScheduler.add(readyRoutineBegin());
flowScheduler.add(readyRoutineEachFrame());
flowScheduler.add(readyRoutineEnd());

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
	{ name: 'practice_schedule.xls', path: '/js/tasks/blind_dating/practice_schedule.xls'},
	{ name: 'user.png', path: '/js/tasks/blind_dating/media/user.png' },
	{ name: 'user_filled.png', path: '/js/tasks/blind_dating/media/user_filled.png'},
	{ name: 'ready.jpeg', path: '/js/tasks/blind_dating/media/instructions/Slide22.jpeg'},
	{ name: 'male.png', path: '/js/tasks/blind_dating/media/male.png' },
	{ name: 'female.png', path: '/js/tasks/blind_dating/media/female.png'}
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

var question_data;
var desiredGender = 'male'; // default gender is male


var slideStim;
var slides;
var instructClock;
var instrBelow;
var ready;
var trialClock;
var timePointClock;
var offer_stim_text;
var offer_rect;
var profile_outline;

var current_point;


var short_boxes_x_pos = [-0.33, -0.11, 0.11, 0.33]
var long_boxes_x_pos = [
	-0.77, -0.55,
	short_boxes_x_pos[0], short_boxes_x_pos[1],
	short_boxes_x_pos[2], short_boxes_x_pos[3],
	0.55, 0.77
]

var person_texts = []

var boxes_rect = {
	4 : {},
	8 : {}
}

// Male Profiles
var male_profile_icon = {
	4: {},
	8: {}
}
// Female Profiles
var female_profile_icon = {
	4: {},
	8: {}
}
var accept_text_stim;
var accept_rect_stim;

var reject_text_stim;
var reject_rect_stim;


var currentTrialNumber;

var totalDates = 0;
var totalPointsTracker;

var points_fixation_stim;

var t_end;
var t_isi;

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

	readyStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'ready_stim', units : 'height', 
		image : 'ready.jpeg', mask : undefined,
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
		color: new util.Color('white'), opacity: 1,
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

	profile_outline = new visual.Rect({
		win: psychoJS.window,
		name: `profile_outline`,
		width: 0.2,
		height: 0.3,
		lineWidth: 3.5,
		units: 'norm',
		pos: [0, 0.12], ori: 0,
		lineColor: new util.Color('yellow'),
		fillColor: undefined,
		opacity: 1,
		depth: 0.0
	});


	// Make Short Boxes
	for (var i = 0; i <= 3; i++){
		// Profile Pic
		male_profile_icon[4][i] = new visual.ImageStim({
			win : psychoJS.window,
			name : `male_profile_icon_${i}_outline`, units : 'norm', 
			image : 'male.png', mask : undefined,
			ori: 0,
			pos: [short_boxes_x_pos[i], 0.5 ], 
			size: [0.2,0.3],
			color: undefined, opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});

		female_profile_icon[4][i] = new visual.ImageStim({
			win : psychoJS.window,
			name : `male_profile_icon_${i}_outline`, units : 'norm', 
			image : 'female.png', mask : undefined,
			ori: 0,
			pos: [short_boxes_x_pos[i], 0.5 ], 
			size: [0.2,0.3],
			color: undefined, opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});

		// male_profile_icon_filled[4][i] = new visual.ImageStim({
		// 	win : psychoJS.window,
		// 	name : `male_profile_icon_${i}_outline`, units : 'norm', 
		// 	image : 'user_filled.png', mask : undefined,
		// 	ori: 0,
		// 	pos: [short_boxes_x_pos[i], 0.5 ], 
		// 	size: [0.2,0.3],
		// 	color: undefined, opacity: 1,
		// 	flipHoriz : false, flipVert : false,
		// 	texRes : 128, interpolate : true, depth : 0
		// });
	}

	// Make Long Boxes
	for (var j = 0; j <= 7; j++){
		// Profile Pic
		male_profile_icon[8][j] = new visual.ImageStim({
			win : psychoJS.window,
			name : `male_profile_icon_${j}_outline`, units : 'norm', 
			image : 'male.png', mask : undefined,
			ori: 0,
			pos: [long_boxes_x_pos[j], 0.5 ], 
			size: [0.2,0.3],
			color: undefined, opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});

		female_profile_icon[8][j] = new visual.ImageStim({
			win : psychoJS.window,
			name : `female_profile_icon_${j}_outline`, units : 'norm', 
			image : 'female.png', mask : undefined,
			ori: 0,
			pos: [long_boxes_x_pos[j], 0.5 ], 
			size: [0.2,0.3],
			color: undefined, opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});

		person_texts.push(new visual.TextStim({
			win: psychoJS.window,
			name: `person_text_#${i + 1}`,
			text: `${j + 1}`,
			font: 'Arial',
			units: 'norm',
			pos: [long_boxes_x_pos[j], 0.72 ], height: 0.1, wrapWidth: undefined, ori: 0,
			color: new util.Color('white'), opacity: 1,
			depth: 0.0
		}))
	}

	accept_text_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'accept_text',
		text: 'Accept',
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

	reject_text_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'reject_stim',
		text: 'Wait',
		font: 'Arial',
		units: 'norm',
		pos: [ 0.3, - 0.3], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	reject_rect_stim = new visual.Rect({
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
		pos: [0, 0], height: 0.12, wrapWidth: undefined, ori: 0,
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

	// --------------------- CODE FOR iFRAME / FORMIO --------------------------
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
		question_data = window.question_data 	// Add to the question_data variable
		desiredGender = question_data.isYourDesiredPartnerMaleOrFemale // specificall need this data
		$('#iframe').remove();
		window.finishedHTML = true;
	};
	// -------------------------------------------------------------------------
	

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
			text: 'loading page....',
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

		// add respond data

		//psychoJS.experiment.addData(`resp_${time_point + 1}`, key_map[resp.keys]);
		

		for (const thisComponent of questionComponents) {
			if (typeof thisComponent.setAutoDraw === 'function') {
				thisComponent.setAutoDraw(false);
			}
		}

		// Send Data
		sendData(psychoJS.experiment._trialsData)

		return Scheduler.Event.NEXT;
	};
}

var readyComponents;
var readyStim;
function readyRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'ready'-------
		t = 0;
		psychoJS.eventManager.clearEvents()
		readyClock.reset(); // clock
		frameN = -1;
	
		routineTimer.add(2.000000);
		// update component parameters for each repeat
		// keep track of which components have finished
		readyComponents = [readyStim];
		readyStim.setAutoDraw(true)
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

		if (psychoJS.eventManager.getKeys({ keyList: ['right'] }).length > 0) {
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
function practiceTrialsLoopBegin(thisScheduler) {
	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'practice_schedule.xls',
		seed: undefined, name: 'trials'
	});

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop

	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot));
		thisScheduler.add(trialRoutineEachFrame(snapshot));
		// thisScheduler.add(trialResult(snapshot)); // show the result 
		thisScheduler.add(trialIsi(snapshot));
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	return Scheduler.Event.NEXT;
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
		// boxes_rect[4][key_4].setAutoDraw(false)
		profile_icon[4][key_4].setAutoDraw(false)
		profile_icon_filled[4][key_4].setAutoDraw(false)

		person_texts[key_4].setAutoDraw(false)
	}

	for (var key_8 of Object.keys(boxes_rect[8])) {
		// boxes_rect[8][key_8].setAutoDraw(false)
		profile_icon[8][key_8].setAutoDraw(false)
		profile_icon_filled[8][key_8].setAutoDraw(false)

		person_texts[key_8].setAutoDraw(false)
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
var starting_index = 0
function trialRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		t = 0;
		tp = 0;
		trialClock.reset(); // clock
		timePointClock.reset()
		frameN = -1;
		time_point = 0;

		if (trial_length == 4){
			starting_index = 2
		} else {
			starting_index = 0
		}
		
		// console.log(trials)

		// Reset Trial Variables
		pressed = false;
		accepted = false;
		waited = false;
		missed = false;
		showed_missed = false;
		offer_withdrew = false;
		feedback_break = false;

		missed_timepoint = [];

		psychoJS.eventManager.clearEvents()

		currentTrialNumber.setAutoDraw(true)
		totalPointsTracker.setAutoDraw(true)

		console.log(question_data)

		// Draw the profile stims
		draw_profile_icons()
		draw_profile_outline()

		// Draw the Accept and Wait Rect Stims
		reset_rectangle_stims()
		accept_rect_stim.setAutoDraw(true)
		accept_text_stim.setAutoDraw(true)

		reject_rect_stim.setAutoDraw(true)
		reject_text_stim.setAutoDraw(true)

		// Setup The Offer Stim
		offer_stim_text.setText(initial_offer + '% Match') // Set the Current Offer	
		offer_stim_text.setAutoDraw(true)

		currentTrialNumber.setText(`Event: ${trial_number} / ${trials.nStim}`)
		totalPointsTracker.setText(`Total Dates: ${totalDates}`)

		console.log('Trial Number: ', globalTrialNumber, 'Total Points: ', totalDates)
		// console.log("Sexual Orientation: ",question_data.whichBestDescribesYourSexualIdentity )
		
		// console.log(psychoJS.experiment._trialsData[1].whichBestDescribesYourSexualIdentity)
	
		resp.keys = undefined;
		resp.rt = undefined;
	
		return Scheduler.Event.NEXT;
	};
}

function clear_stims() {
	for (var j = 0; j < trial_length; j++){
		male_profile_icon[trial_length][j].setAutoDraw(false)
		male_profile_icon[trial_length][j].status = PsychoJS.Status.NOT_STARTED

		female_profile_icon[trial_length][j].setAutoDraw(false)
		female_profile_icon[trial_length][j].status = PsychoJS.Status.NOT_STARTED

		if (trial_length == 4) {
			person_texts[j + 2].setAutoDraw(false)
			person_texts[j + 2].status = PsychoJS.Status.NOT_STARTED
		} else {
			person_texts[j].setAutoDraw(false)
			person_texts[j].status = PsychoJS.Status.NOT_STARTED
		}
	}
	currentTrialNumber.setAutoDraw(false)
	currentTrialNumber.status = PsychoJS.Status.NOT_STARTED

	totalPointsTracker.setAutoDraw(false)
	totalPointsTracker.status = PsychoJS.Status.NOT_STARTED

	offer_stim_text.setAutoDraw(false)
	offer_stim_text.status = PsychoJS.Status.NOT_STARTED

	offer_rect.setAutoDraw(false)
	offer_rect.status = PsychoJS.Status.NOT_STARTED

	accept_rect_stim.setAutoDraw(false)
	accept_rect_stim.status = PsychoJS.Status.NOT_STARTED

	accept_text_stim.setAutoDraw(false)
	accept_text_stim.status = PsychoJS.Status.NOT_STARTED
	
	reject_rect_stim.setAutoDraw(false)
	reject_rect_stim.status = PsychoJS.Status.NOT_STARTED

	reject_text_stim.setAutoDraw(false)
	reject_text_stim.status = PsychoJS.Status.NOT_STARTED

	profile_outline.setAutoDraw(false)
	profile_outline.status = PsychoJS.Status.NOT_STARTED

	points_fixation_stim.setAutoDraw(false)
	points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
}

// Draws the Profile Phots Dependent on Desired Gender
function draw_profile_icons() {
	// Draw the Profile Icond
	for (var i = 0; i < trial_length; i++){

		// Text Number on the Top
		if (trial_length == 4) {
			person_texts[i+ 2].setText( i+ 1)
			person_texts[i+ 2].setAutoDraw(true)
		} else {
			person_texts[i].setText( i+ 1)
			person_texts[i].setAutoDraw(true)
		}
		
		// Profile Icon & Dependent on Female or Male
		if (desiredGender == 'male') {
			male_profile_icon[trial_length][i].setAutoDraw(true)
		} else {
			female_profile_icon[trial_length][i].setAutoDraw(true)
		}
		
	}
}

// Draws the current outline based on timepoint
function draw_profile_outline() {
	profile_outline.pos = male_profile_icon[trial_length][time_point].pos
	profile_outline.setAutoDraw(true)
}

// Reset the rectangle stims to their original structure
function reset_rectangle_stims() {
	accept_rect_stim.lineColor = new util.Color('white')
	accept_rect_stim.fillColor = new util.Color('black')
	accept_text_stim.color = new util.Color('white')
	accept_rect_stim.width = 0.14
	accept_rect_stim.height = 0.09

	reject_rect_stim.lineColor = new util.Color('white')
	reject_rect_stim.fillColor = new util.Color('black')
	reject_text_stim.color = new util.Color('white')
	reject_rect_stim.width = 0.14
	reject_rect_stim.height = 0.09
 }


var time_point;
var missed_timepoint;
var feedback_break;
var feedback_break_time_end;
var fixation_time_end;

function trialRoutineEachFrame(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise

		// get current time
		t = trialClock.getTime();
		tp = timePointClock.getTime();

		// Get User Input
		if (t >= 0.5 && resp.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			resp.tStart = t;  // (not accounting for frame time here)
			resp.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			psychoJS.window.callOnFlip(function () { resp.clock.reset(); });  // t=0 on next screen flip
			psychoJS.window.callOnFlip(function () { resp.start(); }); // start on screen flip
			psychoJS.window.callOnFlip(function () { resp.clearEvents(); });
		}

		let theseKeys = resp.getKeys({ keyList: keyList, waitRelease: false });
		if (!feedback_break && theseKeys.length > 0) {
			resp.keys = theseKeys[0].name;  // just the last key pressed
			resp.rt = theseKeys[0].rt;

			pressed = true

			if (resp.keys == LEFT_KEY) {
				console.log('Pressed Left')
				accepted = true
				accept_rect_stim.fillColor = new util.Color(selectColor)
				accept_rect_stim.lineColor = new util.Color(selectColor)
				accept_rect_stim.height += 0.02
				accept_rect_stim.width += 0.02

				accept_text_stim.color = new util.Color('white')
				continueRoutine = true
				
			} else if (resp.keys == RIGHT_KEY) {
				console.log('Pressed Right')
				waited = true
				reject_rect_stim.fillColor = new util.Color(selectColor)
				reject_rect_stim.lineColor = new util.Color(selectColor)
				reject_rect_stim.height += 0.02
				reject_rect_stim.width += 0.02

				reject_text_stim.color = new util.Color('white')

				if ( (time_point + 1) == ts_high) {
					offer_stim_text.setText(highOfferVal + '% Match')
				}

				if ((time_point + 1) == ts_withdrawal) {
					offer_withdrew = true;
					offer_stim_text.setText(0 + '% Match')
					// offer_stim_text.setText('Offer revoked')
				}

				if (time_point == trial_length) {
					feedback_break = false
				}
			}
			time_point++;
			if (time_point != trial_length) {
				draw_profile_icons()
				draw_profile_outline()
			}
			// small break
			feedback_break = true
			feedback_break_time_end = t + .5
			console.log('Timepoint: ',time_point, 'Trial Lenght:', trial_length)
		}

		if (feedback_break) {
			if (t <= feedback_break_time_end) {
			// meants the time within the 500ms fb
			} else {
				feedback_break = false
				reset_rectangle_stims()
			}
		}


		// Accepted
		// Go to the next trial routine
		if (accepted) {
			if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
				clear_stims()
				points_fixation_stim.color = new util.Color('green')
				points_fixation_stim.setText(`You Have A date!`)
				points_fixation_stim.setAutoDraw(true)
				fixation_time_end = t + 1 // show for 1 second

				console.log('accepted', fixation_time_end)
			}

			if (t >= fixation_time_end) {
				continueRoutine = false
			}
		}

		if (offer_withdrew) {
			if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
				clear_stims()
				points_fixation_stim.color = new util.Color('red')
				points_fixation_stim.setText(`End up Alone.`)
				points_fixation_stim.setAutoDraw(true)
				fixation_time_end = t + 1 // show for 1 second

				console.log('no more dates', fixation_time_end)
			}

			if (t >= fixation_time_end) {
				continueRoutine = false
			}
		}

		// // Went through all timepoints. Go to next Routine since Trial is done
		if (time_point == trial_length) {
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
			clear_stims()
			endClock.reset()
			return Scheduler.Event.NEXT;
		}
	};
}

/**
 * Show Trial Result Routine
 * @param {*} trials trial snapshot
 */
function trialResult(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise

		if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
			points_fixation_stim.setAutoDraw(true)
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

var fb_duration = 1.5;
function trialIsi(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise	
	
		// get current time
		t_end = endClock.getTime();
		
		if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
			points_fixation_stim.color = new util.Color('white')
			points_fixation_stim.setText('+')
			points_fixation_stim.setAutoDraw(true)
			console.log('trial ISI', trial_isi)

		}

		if (t_end >= ((trial_isi / 1000))) {
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
				// totalDates++
				// totalPoints = totalPoints + parseInt(offer_stim_text.getText().replace(' points', ''))
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

		sendData(psychoJS.experiment._trialsData)

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
