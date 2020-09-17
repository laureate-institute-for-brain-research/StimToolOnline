/**
 * Horizon Task
 * @author James Touthang <jtouthang@laureateinstitute.org>
 */


import { PsychoJS } from '/lib/core-2020.1.js';
import * as core from '/lib/core-2020.1.js';
import { TrialHandler } from '/lib/data-2020.1.js';
import { Scheduler } from '/lib/util-2020.1.js';
import * as util from '/lib/util-2020.1.js';
import * as visual from '/lib/visual-2020.1.js';
import { Sound } from '/lib/sound-2020.1.js';

var practice = false;
var LEFT_KEY = 'comma'
var RIGHT_KEY = 'period'


// init psychoJS:
const psychoJS = new PsychoJS({
	debug: false,
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


window.onload = function () {
	var id = getQueryVariable('id')
	
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
			console.log(values)
			if (values.subject && values.session && values.study) {
				expInfo.participant = values.subject
				expInfo.study = values.study
				expInfo.session = values.session
				expInfo.run_id = getQueryVariable('run')

				// set next link
				psychoJS.setRedirectUrls(
					'/link?id=' + values.link + '&index=' + parseInt(getQueryVariable('index')) + 1, // get next order.
					'/' // cancellation url
				)

			}
		
			// Return AJAX Promise to get Confit Params
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: '/js/tasks/horizon/' + getQueryVariable('run'),
					dataType: 'json',
					success: (data) => {
						resolve(data)
					}
				})
			})
		
		})
		
		// Read RUN Config
		.then((values) => {
			// console.log(values['instruct_schedule'])
			resources.push({ name: 'run_schedule.xls', path: values['schedule'] })
			resources.push({ name: 'instruct_schedule.csv', path: values['instruct_schedule'] })
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: values['instruct_schedule'],
					dataType: 'text',
					async: false,
					success: (data) => {
						var out = [];
						var allRows = data.split('\n'); // split rows at new line
						
						var headerRows = allRows[0].split(',');
						
						for (var i=1; i<allRows.length; i++) {
							var obj = {};
							var currentLine = allRows[i].split(',');
							for(var j=0;j<headerRows.length;j++){
								obj[headerRows[j]] = currentLine[j];
							}
							out.push(obj);
							resources.push({ name: obj['instruct_slide'], path: obj['instruct_slide'] })
							resources.push({ name: obj['audio_path'], path: obj['audio_path'] })
						}
						// console.log(resources)
						resolve(data)
					}
				})
				
			})
		})
	
		.then((values) => {
		
			
			psychoJS.start({
				expName, 
				expInfo,
				resources: resources,
			  })
			psychoJS._config.experiment.saveFormat = undefined // don't save to client side
			
			// console.log(psychoJS)
		})
	
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


// open window:
psychoJS.openWindow({
	fullscr: (window.location.hostname != 'localhost'), // not full screen at localhost,
	color: new util.Color('black'),
	units: 'height',
	waitBlanking: true
})
	
// store info about the experiment session:
let expName = 'Horizon Task';  // from the Builder filename that created this script
var expInfo = { 'participant': '' ,'session': '',  'run_id': '', 'date' : formatDate(), 'study': '', };

psychoJS.schedule(psychoJS._gui.DlgFromDict({
	dictionary: expInfo,
	title: expName
}))



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
if (getQueryVariable('run').includes('R1') ){
	const example_playScheduler = new Scheduler(psychoJS);
	flowScheduler.add(trials_exampleLoopBegin, example_playScheduler);
	flowScheduler.add(example_playScheduler);
	flowScheduler.add(exampleLoopEnd);

	// Ready Routine
	flowScheduler.add(readyRoutineBegin());
	flowScheduler.add(readyRoutineEachFrame());
	flowScheduler.add(readyRoutineEnd());

}



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
	// { name: 'game_type.xls', path: '/js/tasks/horizon/game_type.xls' },
	{ name: 'game_type_practice.xls', path: '/js/tasks/horizon/game_type_practice.xls' },
	// { name: 'instruct_schedule.xls', path: '/js/tasks/horizon/media/instruct_schedule.xls' },
	{ name: 'example_play.xls', path: '/js/tasks/horizon/media/example_play.xls' },
	{ name: 'instruct_slide_r2.xls', path: '/js/tasks/horizon/media/instruct_slide_r2.xls' },
	{ name: `/js/tasks/horizon/media/horizonInstructions/Slide22.jpeg`, path: `/js/tasks/horizon/media/horizonInstructions/Slide22.jpeg` },
	{ name: `/js/tasks/horizon/media/instruction_audio/slide22.m4a`, path: `/js/tasks/horizon/media/instruction_audio/slide22.m4a` }
	// { name: '/js/tasks/horizon/media/instruction_audio/slide1_23m4a.m4a', path: '/js/tasks/horizon/media/instruction_audio/slide1_23m4a.m4a'}
]

// for (var i = 1; i <= 22; i++){
// 	var imagePath = { name: `/js/tasks/horizon/media/horizonInstructions/Slide${i}.jpeg`, path: `/js/tasks/horizon/media/horizonInstructions/Slide${i}.jpeg` }
// 	// console.log(i)
// 	resources.push(imagePath)
// }

// for (var i = 1; i <= 2; i++){
// 	var imagePath = { name: `/js/tasks/horizon/media/instructions_r2/${i}.jpg`, path: `/js/tasks/horizon/media/instructions_r2/${i}.jpg` }
// 	// console.log(i)
// 	resources.push(imagePath)
// }




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
var leftColor = '#56B4E9'
var rightColor = '#E69F00'
var rect_fillColor = '#009E73'
var forced_fillColor = '#FF0000'


var slideStim;
var goodLuckStim;
var slides;
var instructClock;
var instrBelow;
var ready;
var trialClock;
var word;

// Bandit Texts
var bandits = {
	'left': {},
	'right': {}
}
var y_pos = [.6,.5,.4,.3,.2,.1,0,-.1,-.2, -.3, -.4]
var bandits_rect = {
	'left': {},
	'right': {}
}

var horizon_map = {
	'h1': 5,
	'h6': 10
}

var bandit_left_up_handle;
var bandit_left_down_handle;
var bandit_right_up_handle;
var bandit_right_down_handle;

var example_trials;
var currentTrialNumber;
var gameNumtracker;
var totalPoints = 0;
var totalPointsTracker;

var readyClock;
var readyText;

var track;

var resp;
var thanksClock;
var thanksText;
var globalClock;
var routineTimer;
function experimentInit() {
	
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
	
	goodLuckStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'goood_slide_stim', units : 'height', 
		image : '/js/tasks/horizon/media/horizonInstructions/Slide22.jpeg', mask : undefined,
		ori : 0, pos : [0, 0],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	  });
	

	ready = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	// Initialize components for Routine "trial"
	trialClock = new util.Clock();

	// Initial the Text Position of the Band
	word = new visual.TextStim({
		win: psychoJS.window,
		name: 'word',
		text: 'default text',
		font: 'Arial',
		units: 'height',
		pos: [0, 0], height: 0.15, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	bandit_left_up_handle = new visual.ShapeStim({
		win: psychoJS.window,
		name: 'left_bandit_handle',
		opacity: 1,
		units: 'norm',
		lineColor: new util.Color(leftColor),
		fillColor: new util.Color(leftColor),
		vertices: [
			[-0.15, .48],
			[-0.15, .52],
			[-0.27, .70],
			[-0.27, .73],
			[-0.32, .73],
			[-0.32, .73],
			[-0.32, .64],
			[-0.27, .64],
			[-0.27, .66],
		],
		pos: [0,0],
		closeShape: true,
		ori: 0,
		depth: 0
	})

	bandit_left_down_handle = new visual.ShapeStim({
		win: psychoJS.window,
		name: 'left_bandit_handle',
		opacity: 1,
		units: 'norm',
		lineColor: new util.Color(leftColor),
		fillColor: new util.Color(leftColor),
		vertices: [
			[-0.15, .48],
			[-0.15, .52],
			[-0.27, .40],
			[-0.27, .43],
			[-0.32, .43],
			[-0.32, .43],
			[-0.32, .34],
			[-0.27, .34],
			[-0.27, .36],
		],
		pos: [0,0],
		closeShape: true,
		ori: 0,
		depth: 0
	})

	bandit_right_up_handle = new visual.ShapeStim({
		win: psychoJS.window,
		name: 'right_bandit_handle',
		opacity: 1,
		units: 'norm',
		lineColor: new util.Color(rightColor),
		fillColor: new util.Color(rightColor),
		vertices: [
			[0.15, .48],
			[0.15, .52],
			[0.27, .70],
			[0.27, .73],
			[0.32, .73],
			[0.32, .73],
			[0.32, .64],
			[0.27, .64],
			[0.27, .66],
		],
		pos: [0,0],
		closeShape: true,
		ori: 0,
		depth: 0
	})

	bandit_right_down_handle = new visual.ShapeStim({
		win: psychoJS.window,
		name: 'right_bandit_handle',
		opacity: 1,
		units: 'norm',
		lineColor: new util.Color(rightColor),
		fillColor: new util.Color(rightColor),
		vertices: [
			[0.15, .48],
			[0.15, .52],
			[0.27, .40],
			[0.27, .43],
			[0.32, .43],
			[0.32, .43],
			[0.32, .34],
			[0.27, .34],
			[0.27, .36],
		],
		pos: [0,0],
		closeShape: true,
		ori: 0,
		depth: 0
	})


	for (var i = 0; i <= 9; i++){
		// Init Left textStims
		bandits['left'][i] = new visual.TextStim({
			win: psychoJS.window,
			name: `left_bandit_${i}`,
			text: 'XX',
			fontFamily: 'Arial',
			units: 'norm',
			pos: [-0.1, y_pos[i] - .1], height: 0.09, wrapWidth: undefined, ori: 0,
			color: new util.Color('white'), opacity: 1,
			depth: 0.0
		});
		// Init  Right TexStims
		bandits['right'][i] = new visual.TextStim({
			win: psychoJS.window,
			name: `right_bandit_${i}`,
			text: 'XX',
			fontFamily: 'Arial',
			units: 'norm',
			pos: [0.1, y_pos[i] -.1], height: 0.09, wrapWidth: undefined, ori: 0,
			color: new util.Color('white'), opacity: 1,
			depth: 0.0
		});

		// Rectangle LEFT BANDIT
		bandits_rect['left'][i] = new visual.Rect({
			win: psychoJS.window,
			name: `left_bandit_rect_${i}`,
			width: 0.09,
			height: 0.09,
			lineWidth: 3.5,
			units: 'norm',
			pos: [-0.1, y_pos[i] -.1 ], ori: 0,
			lineColor: new util.Color(leftColor), opacity: 1,
			depth: 0.0
		});

		bandits_rect['right'][i] = new visual.Rect({
			win: psychoJS.window,
			name: `right_bandit_rect_${i}`,
			width: 0.09,
			height: 0.09,
			lineWidth: 3.5,
			units: 'norm',
			pos: [0.1, y_pos[i] -.1], ori: 0,
			lineColor: new util.Color(rightColor), opacity: 1,
			depth: 0.0
		});

	}

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
		text: 'Total Points: 0',
		font: 'Arial',
		units: 'norm',
		pos: [0, -.9], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('green'), opacity: 1,
		depth: 0.0
	});


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
		track = new Sound({
			win: psychoJS.window,
			value: audio_path
		  });
		// console.log(audio_path)
		track.setVolume(1.0);
		track.play();

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

		// Play Audio If Exists
		


		if (ready.status === PsychoJS.Status.STARTED) {
			let theseKeys = ready.getKeys({ keyList: ['right'], waitRelease: false });

			if (theseKeys.length > 0) {  // at least one key was pressed
				// a response ends the routine
				track.stop();
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


function clearBandits() {
	for (var i = 0; i <= 9; i++) {
		// Init Left textStims
		bandits['left'][i].setAutoDraw(false)
		bandits['right'][i].setAutoDraw(false)
		bandits_rect['left'][i].setAutoDraw(false)
		bandits_rect['right'][i].setAutoDraw(false)
	}
}

function clearLevers() {
	bandit_left_up_handle.setAutoDraw(false)
	bandit_left_down_handle.setAutoDraw(false)

	bandit_right_up_handle.setAutoDraw(false)
	bandit_right_down_handle.setAutoDraw(false)
	
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
	total_games = 80
	if (getQueryVariable('practice') == 'true') {
		total_games = 5
		practice == true;
		console.log('Practice Session')
		trials = new TrialHandler({
			psychoJS: psychoJS,
			nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
			extraInfo: expInfo, originPath: undefined,
			trialList: 'game_type_practice.xls',
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

function trialsLoopEnd() {
	totalPoints = 0
	clearBandits()
	clearLevers()
	currentTrialNumber.setAutoDraw(false)
	gameNumtracker.setAutoDraw(false)
	totalPointsTracker.setAutoDraw(false)
	slideStim.setAutoDraw(false)

	psychoJS.experiment.removeLoop(trials);

	return Scheduler.Event.NEXT;
}

var trialComponents;
var lastGameNumber;
var lastTrial;
var lastTrialPoints = 0;
function trialRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		t = 0;
		trialClock.reset(); // clock
		frameN = -1;
		// update component parameters for each repeat
		// word.setColor(new util.Color(letterColor));


		// If it's a new game, clear other texts
		// console.log(lastGameNumber)
		if (game_number != lastGameNumber) {
			lastTrialKeyPressed = false;
			bandits_rect['right'][trial_num].fillColor = false
			bandits_rect['left'][trial_num].fillColor = false
			clearBandits()
		}

		// Set components from last trial
		

		if (lastTrialKeyPressed) {
			bandits_rect['right'][trial_num].fillColor = false
			bandits_rect['left'][trial_num].fillColor = false
		}
		
		currentTrialNumber.setText(`Trial Number: ${trial_num}`)
		gameNumtracker.setText(`Game Number: ${game_number + 1}/${total_games}`)
		totalPointsTracker.setText(`Total Points: ${totalPoints}`)
	
		resp.keys = undefined;
		resp.rt = undefined;
		// keep track of which components have finished
		trialComponents = [];
		// trialComponents.push(bandits['left'][trial_num]);
		// trialComponents.push(left_bandit_0);
		trialComponents.push(resp);

		for (const thisComponent of trialComponents)
			if ('status' in thisComponent)
				thisComponent.status = PsychoJS.Status.NOT_STARTED;

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
function trialRoutineEachFrame(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise
	
		// get current time
		t = trialClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)


		// update/draw components on each frame
		if (t >= 0.3) {
			// keep track of start time/frame for later
			// word.tStart = t;  // (not accounting for frame time here)
			// word.frameNStart = frameN;  // exact frame index
			// word.setAutoDraw(true);

		
			
			
			for (var i = 0; i < horizon_map[game_type]; i++){
				bandits_rect['left'][i].setAutoDraw(true)
				bandits_rect['right'][i].setAutoDraw(true)
			}

			// Show only last Trials
			for (var i = 0; i < trial_num; i++){
				bandits['left'][i].setAutoDraw(true)
				// Init  Right TexStims
				bandits['right'][i].setAutoDraw(true)
			}
		
			if (showLastTrial) {
				if (trialClock.getTime() >= time_continue) {
					showLastTrial = false
					return Scheduler.Event.NEXT;
				}
		
			}

			// make sure the hanlds are down at the start of the trial
			bandit_left_down_handle.setAutoDraw(false) 
			bandit_right_down_handle.setAutoDraw(false)
			
			if (!showLastTrial) {
				switch (force_pos) {
					case 'R':
						bandits_rect['right'][trial_num].fillColor = new util.Color(forced_fillColor)
						break;
					case 'L':
						bandits_rect['left'][trial_num].fillColor = new util.Color(forced_fillColor)
						break;
					case 'X':
						// Show both
						bandits_rect['right'][trial_num].fillColor = new util.Color(rect_fillColor)
						bandits_rect['left'][trial_num].fillColor = new util.Color(rect_fillColor)
					default:
					
				}
			}
			
			
			bandit_left_up_handle.setAutoDraw(true)
			bandit_right_up_handle.setAutoDraw(true)

			currentTrialNumber.setAutoDraw(true)
			// Draw the Tracker and Points Counter
			gameNumtracker.setAutoDraw(true)
			totalPointsTracker.setAutoDraw(true)
		}

		if (showLastTrial) {
			bandits['left'][trial_num].setAutoDraw(true)
			bandits['right'][trial_num].setAutoDraw(true)
			if (trialClock.getTime() >= time_continue) {
				showLastTrial = false
				return Scheduler.Event.NEXT;
			}
	
		}

		

		// *resp* updates
		if (t >= 0.5 && resp.status === PsychoJS.Status.NOT_STARTED) {
			// keep track of start time/frame for later
			resp.tStart = t;  // (not accounting for frame time here)
			resp.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			psychoJS.window.callOnFlip(function () { resp.clock.reset(); });  // t=0 on next screen flip
			psychoJS.window.callOnFlip(function () { resp.start(); }); // start on screen flip
			psychoJS.window.callOnFlip(function () { resp.clearEvents(); });
		}

		if (resp.status === PsychoJS.Status.STARTED) {
			var keyList = []
			switch (force_pos) {
				case 'R':
					keyList = [RIGHT_KEY]
					break;
				case 'L':
					keyList = [LEFT_KEY]
					break;
				case 'X':
					keyList = [LEFT_KEY, RIGHT_KEY]
				default:
					keyList = [LEFT_KEY, RIGHT_KEY]
			}
			
			
			
			let theseKeys = resp.getKeys({ keyList: keyList, waitRelease: false });

			// After key is pressed, go to next routine
			if (theseKeys.length > 0) {  // at least one key was pressed
				resp.keys = theseKeys[0].name;  // just the last key pressed
				resp.rt = theseKeys[0].rt;

				// console.log(theseKeys)
				lastTrialKeyPressed = resp.keys; // store the value globally
				
				if (resp.keys == LEFT_KEY) {
					bandits['left'][trial_num].setText(left_reward) 
					// Set the other bandit as XX
					bandits['right'][trial_num].setText('XX')
					totalPoints = totalPoints + left_reward

					// Animation for left Lever
					bandit_left_up_handle.setAutoDraw(false)
					bandit_left_down_handle.setAutoDraw(true)
				}
				if (resp.keys == RIGHT_KEY) {
					bandits['right'][trial_num].setText(right_reward) 
					bandits['left'][trial_num].setText('XX')
					totalPoints = totalPoints + right_reward

					// Animatino for right lever
					bandit_right_up_handle.setAutoDraw(false)
					bandit_right_down_handle.setAutoDraw(true)
				}
				// console.log(left_reward)
				
				// If it's the last trial, hang here for a second to show points
				if (isLastTrial(game_type, trial_num)){
					// wait a second
					showLastTrial = true;
					bandits_rect['right'][trial_num].fillColor = false
					bandits_rect['left'][trial_num].fillColor = false

					
					now = trialClock.getTime();
					time_continue = now + 1 // 1 second to show points then continue
					
				} else {
					continueRoutine = false;
					time_continue = 999999
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

		for (const thisComponent of trialComponents)
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

		if (resp.keys == LEFT_KEY) {
			lastTrialPoints = left_reward
		}
		if (resp.keys == RIGHT_KEY) {
			lastTrialPoints = right_reward
		}

		lastGameNumber = game_number

		// was no response the correct answer?!
		// if (resp.keys === undefined) {
		// 	if (['None', 'none', undefined].includes(corrAns)) {
		// 		resp.corr = 1;  // correct non-response
		// 	} else {
		// 		resp.corr = 0;  // failed to respond (incorrectly)
		// 	}
		// }
		// store data for thisExp (ExperimentHandler)
		psychoJS.experiment.addData('resp.keys', key_map[resp.keys]);
		psychoJS.experiment.addData('points', totalPoints);
		// psychoJS.experiment.addData('resp.corr', resp.corr);
		if (typeof resp.keys !== 'undefined') {  // we had a response
			psychoJS.experiment.addData('resp.rt', resp.rt);
			routineTimer.reset();
		}
		bandits_rect['right'][trial_num].fillColor = false
		bandits_rect['left'][trial_num].fillColor = false

		resp.stop();
		// the Routine "trial" was not non-slip safe, so reset the non-slip timer
		routineTimer.reset();

		// Send Data
		sendData(psychoJS.experiment._trialsData)
		console.log(psychoJS.experiment._trialsData)

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
		track = new Sound({
			win: psychoJS.window,
			value: '/js/tasks/horizon/media/instruction_audio/slide22.m4a'
		  });
		// console.log(audio_path)
		track.setVolume(1.0);
		track.play();
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

		if (psychoJS.eventManager.getKeys({ keyList: ['right'] }).length > 0) {
			track.stop();
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
		clearBandits()
		clearLevers()
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
