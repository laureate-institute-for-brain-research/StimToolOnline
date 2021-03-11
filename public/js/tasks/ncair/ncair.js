/**
 * NCAIR Task
 * @author James Touthang <jtouthang@laureateinstitute.org>
 */


// import { PsychoJS } from '/lib/core-2020.1.js';
// import * as core from '/lib/core-2020.1.js';
// import { TrialHandler } from '/lib/data-2020.1.js';
// import { Scheduler } from '/lib/util-2020.1.js';
// import * as util from '/lib/util-2020.1.js';
// import * as visual from '/lib/visual-2020.1.js';
// import { Sound } from '/lib/sound-2020.1.js';


// Using New Version of PsychoJS - 2021.1.2
import { PsychoJS } from '/lib/core-2021.1.2.js';
import * as core from '/lib/core-2021.1.2.js';
import { TrialHandler } from '/lib/data-2021.1.2.js';
import { Scheduler } from '/lib/util-2021.1.2.js';
import * as visual from '/lib/visual-2021.1.2.js';
import * as sound from '/lib/sound-2021.1.2.js';
import * as util from '/lib/util-2021.1.2.js';


var practice = false;
var LEFT_KEY = 'comma'
var RIGHT_KEY = 'period'


// init psychoJS:
const psychoJS = new PsychoJS({
	debug: false, 
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
			console.log(values)
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
					url: '/js/tasks/ncair/' + getQueryVariable('run'),
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
			resources.push({ name: 'run_schedule.csv', path: values['schedule'] })
			resources.push({ name: 'instruct_schedule.csv', path: values['instruct_schedule'] })

			// Add file paths to expInfo
			if (values['schedule']) expInfo.task_schedule = values['schedule']
			if (values['instruct_schedule']) expInfo.instruct_schedule = values['instruct_schedule']
			
			// Add instrcution Images
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
							for (var j = 0; j < headerRows.length; j++){

								
								obj[headerRows[j]] = currentLine[j];
								
							}
							// out.push(obj);
							console.log(obj)
							resources.push({ name: obj['instruct_slide'], path: obj['instruct_slide'] })
							
							// If there's audio add to resources
							if (obj['audio_path']) {
								resources.push({ name: obj['audio_path'], path: obj['audio_path'] })
							}
							
						}

						resolve(values)
					}
				})
				
			})
		})

		// Add media to resources
		.then((values) => {			
			// Add instrcution Images
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: values['schedule'],
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
							if (obj['stim_paths'] != 'None' && obj['stim_paths'] != undefined) {
								resources.push({ name: obj['stim_paths'] , path: obj['stim_paths']  })
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
let expName = 'NCAIR Task';  // from the Builder filename that created this script
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
if (!getQueryVariable('skip_instructions')) {
	const instruct_pagesLoopScheduler = new Scheduler(psychoJS);
	flowScheduler.add(instruct_pagesLoopBegin, instruct_pagesLoopScheduler);
	flowScheduler.add(instruct_pagesLoopScheduler);
	flowScheduler.add(instruct_pagesLoopEnd);
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

]

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

	if (getQueryVariable('study') == 'vanderbelt') {

		// Take Them to completion no 2nd run
		psychoJS.setRedirectUrls(
			`/completed`, // get next order.
			'/' // cancellation url
		)
	}

	return Scheduler.Event.NEXT;
}

var slideStim;
var goodLuckStim;
var slides;
var instructClock;
var instrBelow;
var ready;
var trialClock;

var fixation;
var audio_stim;
var stim_text;
var video_stim;
var image_stim;
var related_no;
var related_yes;

var slider;
var next_text;

var example_trials;
var currentTrialNumber;
var gameNumtracker;
var totalPoints = 0;
var totalPointsTracker;

var readyClock;
var readyText;

var track;

var resp;
var mouse;
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


	ready = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	// Initialize components for Routine "trial"
	trialClock = new util.Clock();


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

	fixation = new visual.TextStim({
		win: psychoJS.window,
		name: 'fixation',
		text: '+',
		font: 'Arial',
		units: 'norm',
		pos: [0, -.8], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	stim_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'fixation',
		text: 'Press SpaceBar to play audio.',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0], height: .1, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	
	image_stim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'image_stim', units : 'height', 
		image : undefined, mask : undefined,
		ori : 0, pos : [0, 0],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});



	related_yes = new visual.TextStim({
		win: psychoJS.window,
		name: 'related_yes',
		text: 'Yes',
		font: 'Arial',
		units: 'norm',
		pos: [-.1, 0], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	})

	related_no = new visual.TextStim({
		win: psychoJS.window,
		name: 'related_no',
		text: 'No',
		font: 'Arial',
		units: 'norm',
		pos: [.1, 0], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	})

	next_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'related_no',
		text: 'Next',
		font: 'Arial',
		units: 'norm',
		pos: [.8, -.8], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	})

	image_stim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'image_stim', units : 'height', 
		image : undefined, mask : undefined,
		ori : 0, pos : [0, 0],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	slider = new visual.Slider({
		win: psychoJS.window,
		name: 'slider', size: [.8, .05],
		ticks: [...Array(5).keys()],
		labels: [0,25,50,75,100],
		pos: [0, 0], wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});


	resp = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	mouse = new core.Mouse({win: psychoJS.window})

	// Initiali comnponenents for Routine 'read'y
	readyClock = new util.Clock();
	// Initialize components for Routine "thanks"
	thanksClock = new util.Clock();
	thanksText = new visual.TextStim({
		win: psychoJS.window,
		name: 'thanksText',
		text: 'This is the end of the task run.\n\nYouThanks!',
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

				if (track) {
					track.stop();
				}
				
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
	total_games = 80
	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule.csv',
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
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}

	return Scheduler.Event.NEXT;
}

function instruct_pagesLoopEnd() {
	psychoJS.experiment.removeLoop(slides);
	return Scheduler.Event.NEXT;
}


function trialsLoopEnd() {
	currentTrialNumber.setAutoDraw(false)
	gameNumtracker.setAutoDraw(false)
	totalPointsTracker.setAutoDraw(false)
	slideStim.setAutoDraw(false)

	psychoJS.experiment.removeLoop(trials);

	return Scheduler.Event.NEXT;
}

var trialComponents;
var media_type;
var media_code;
var trial_type;
var medi_dict = {
	'0': 'audio',
	'1': 'video',
	'2': 'image',
	'3': 'rating_identity',
	'4': 'rating_valence',
	'5': 'rating_arousal',
	'6': 'rating_relatedness',
	'7': 'rating_typicality'
}

var rating_dict = {
	'2': 'clip',
	'3': 'image',
	'4': 'video'
}
var lastTrial;
var lastTrialPoints = 0;
var relatedness_form;
function trialRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		trialComponents = [];
		t = 0;
		trialClock.reset(); // clock
		frameN = -1;

		console.log(stim_paths)
		console.log(trial_type)
		
		// Medial Type
		trial_type = medi_dict[TrialTypes.substring(2, 3)]
		// Set Media_type
		if (trial_type == 'audio' || trial_type == 'video' || trial_type == 'image') {
			media_type == trial_type
		} else {
			// Get from the first character '0_1'  -> '0'
			media_type = rating_dict[TrialTypes.substring(0, 1)]
		}
		

		if (trial_type == 'audio') {
			audio_stim = new Sound({
				win: psychoJS.window,
				value: stim_paths
			  });
			// console.log(audio_path)
			audio_stim.setVolume(1.0);

			trialComponents.push(audio_stim);
		}

		if (trial_type == 'video') {
			// video_stim.setMovie(stim_paths)
			video_stim = new visual.MovieStim({
				win : psychoJS.window,
				name : 'video_stim', units : 'height', 
				movie : stim_paths, 
				ori : 0, pos : [0, 0],
				color: new util.Color('white'), opacity: 1,
				loop: false,  noAudio: false,
			});

			trialComponents.push(video_stim);
		}

		if (trial_type == 'rating_relatedness') {
			trialComponents.push(related_no);
			trialComponents.push(related_yes);
		}

		if (trial_type == 'rating_idetntity') {
			trialComponents.push(slider);
			trialComponents.push(next_text)
		}

		resp.keys = undefined;
		resp.rt = undefined;

		

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
var theseKeys;
var audio_stim_length;


/**
 * For Audio Trials
 */
function do_audio() {
	if (audio_stim.status == PsychoJS.Status.NOT_STARTED) {
		stim_text.setText('Press the Space Bar to play audio') 
		stim_text.height = .1
		// console.log(ready.getKeys({ keyList: ['space'] }))
		if (ready.getKeys({ keyList: ['space'] }).length > 0) {  // at least one key was pressed
			// a response ends the routine
			audio_stim_length = trialClock.getTime() + audio_stim.getDuration() // time it will end
			audio_stim.play()
			console.log('Audio playing')

			stim_text.height = .3
			stim_text.setText('+') // Change to Plus when audio is playing
			stim_text.color = new util.Color('yellow')
		}
	}

	if (t >= audio_stim_length) {
		audio_stim.stop()
		stim_text.color = new util.Color('white')
		continueRoutine = false
		return
	}

	stim_text.setAutoDraw(true)
}

/**
 * For Video Trials
 */
function do_video() {
	
	if (video_stim.status == PsychoJS.Status.NOT_STARTED) {
		stim_text.setText('Press the Space Bar to play video') 
		stim_text.height = .1
		// console.log(ready.getKeys({ keyList: ['space'] }))
		stim_text.setAutoDraw(true)
		
		if (ready.getKeys({ keyList: ['space'] }).length > 0) {  // at least one key was pressed
			// a response ends the routine
			stim_text.setAutoDraw(false)
			video_stim.setAutoDraw(true);
			// audio_stim_length = trialClock.getTime() + audio_stim.getDuration() // time it will end
			// video_stim.play()
			console.log('Video playing')
				
		}
	}

	if (video_stim.status == PsychoJS.Status.FINISHED) {
		video_stim.setAutoDraw(false);
		continueRoutine = false
		return
	}

	// if (t >= audio_stim_length) {
	// 	audio_stim.stop()
	// 	stim_text.color = new util.Color('white')
	// 	continueRoutine = false 
	// }
	
	
}

/**
 * Rating Identity Trials
 */
function do_rating_identity() {
	stim_text.setText(`Identity:\nHow much did this ${media_type} relate to your identity as a native person? `)
	stim_text.height = .1
	stim_text.pos = [0,.5]
	stim_text.setAutoDraw(true)

	slider.setAutoDraw(true)

	if (slider.getRating()) {
		next_text.setAutoDraw(true)
	}
	if (mouse.isPressedIn(next_text)) {
		var next_progress = t + .5 // Allow Delay second after mouse press
		next_text.color = new util.Color('red')
	}

	if (t >= next_progress) {
		continueRoutine = false
	}
}

function do_rating_valence() {
	stim_text.setText(`Rate your mood in response to this ${media_type}.`)
	stim_text.height = .1
	stim_text.pos = [0,.5]
	stim_text.setAutoDraw(true)
}

function do_rating_arousal() {
	stim_text.setText(`Rate your arousal in response to this ${media_type}.`)
	stim_text.height = .1
	stim_text.pos = [0,.5]
	stim_text.setAutoDraw(true)	
}

var next_progress;
function do_rating_relatedness() {
	stim_text.setText(`Relatedness:\nIs this ${media_type} related to your identity as a native person?`)
	stim_text.height = .1
	stim_text.pos = [0,.5]
	stim_text.setAutoDraw(true)

	related_no.setAutoDraw(true)
	related_yes.setAutoDraw(true)

	if (mouse.isPressedIn(related_yes)) {
		next_progress = t + .5 // Allow Delay second after mouse press
		related_yes.color = new util.Color('red')
	}
	if (mouse.isPressedIn(related_no)) {
		next_progress = t + .5 // Allow Delay second after mouse press
		related_no.color = new util.Color('red')
	}

	if (t >= next_progress) {
		continueRoutine = false
	}
}
function do_rating_typicality() {
	stim_text.setText(`How likely is it for a native person to see/experience scenes like this?`)
	stim_text.height = .1
	stim_text.pos = [0,.5]
	stim_text.setAutoDraw(true)
}

function trialRoutineEachFrame(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		continueRoutine = true; // until we're told otherwise
	
		// get current time
		t = trialClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)
		resp.clearEvents()
		if (trial_type == 'audio') do_audio()
		if (trial_type == 'video') do_video()
		if (trial_type == 'image') do_image()
		if (trial_type == 'rating_identity') do_rating_identity()
		if (trial_type == 'rating_valence') do_rating_valence()
		if (trial_type == 'rating_arousal') do_rating_arousal()
		if (trial_type == 'rating_relatedness') do_rating_relatedness()
		if (trial_type == 'rating_typicality') do_rating_typicality()

		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}
		// Suer Skipped Trial Trial
		if (psychoJS.eventManager.getKeys({keyList:['z']}).length > 0) {
			return Scheduler.Event.NEXT;
		}

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

		// store data for thisExp (ExperimentHandler)
		// psychoJS.experiment.addData('resp.keys', key_map[resp.keys]);
		// psychoJS.experiment.addData('points', totalPoints);
		// psychoJS.experiment.addData('resp.corr', resp.corr);

		resp.stop();
		// the Routine "trial" was not non-slip safe, so reset the non-slip timer
		routineTimer.reset();

		for (const thisComponent of trialComponents) {
			try {
				thisComponent.stop()
			} catch (error) {
				// console.log(error);
			  }
			thisComponent.setAutoDraw(false)
		}
			

		return Scheduler.Event.NEXT;
	};
}

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
		routineTimer.add(25.000000);
		// update component parameters for each repeat
		// keep track of which components have finished

		// Show Final Points and money earned
		
		if (getQueryVariable('study') == 'vanderbelt') {
			// 1000 points = 10 cents
			thanksText.setText(`This is the end of the task run.\n\n\n Total Points Earned: ${totalPoints} \n\n Total Cents Earned: ${totalPoints / 100 } =  $${ (totalPoints / 10000).toFixed(2)}`)
		} else {
			// 100 points = 10 cents
			thanksText.setText(`This is the end of the task run.\n\n\n Total Points Earned: ${totalPoints} \n\n Total Cents Earned: ${totalPoints / 10 } =  $${ (totalPoints / 1000).toFixed(2)}`)
		}
		

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

		// frameRemains = 0.0 + 2.0 - psychoJS.window.monitorFramePeriod * 0.75;  // most of one frame period left
		// if (thanksText.status === PsychoJS.Status.STARTED && t >= frameRemains) {
		// 	thanksText.setAutoDraw(false);
		// }
		// check for quit (typically the Esc key)
		if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// check if the Routine should terminate
		if (!continueRoutine) {  // a component has requested a forced-end of Routine
			return Scheduler.Event.NEXT;
		}

		// Exit after XX seconds
		if (t >= 15) {
			continueRoutine = false
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



function thanksRoutineEnd(trials) {
	return function () {
		// Last Save
		// Send Data

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
			
			
		// console.log(psychoJS.experiment._trialsData)
			// ------Check if user ended loop early------
			if (loop.finished)
			{
				// Check for and save orphaned data
				if (psychoJS.experiment.isEntryEmpty())
				{
					psychoJS.experiment.nextEntry(loop);
				}
				thisScheduler.stop();

				// Send Data at last loop 
				sendData(psychoJS.experiment._trialsData)
			} else
			{
				// Send Data for Every Trial
				sendData(psychoJS.experiment._trialsData)
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
