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
	collectIP: true
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

			psychoJS._collectIP = false // don't collect IP

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
	fullscr: true, //(window.location.hostname != 'localhost'), // not full screen at localhost,
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
	{ name: 'next_button.png', path: 'js/tasks/ncair/media/next_button.png' },
	{ name: 'yes_button.png', path: 'js/tasks/ncair/media/yes_button.png' },
	{ name: 'no_button.png', path: 'js/tasks/ncair/media/no_button.png' },
	{ name: 'no_button_clicked.png', path: 'js/tasks/ncair/media/no_button_clicked.png' },
	{ name: 'yes_button_clicked.png', path: 'js/tasks/ncair/media/yes_button_clicked.png' },
	{ name: 'next_button_clicked.png', path: 'js/tasks/ncair/media/next_button_clicked.png' },
	{ name: 'calm_scale.png', path: 'js/tasks/ncair/media/sam_faces/calm_scale_with_dots.png' },
	{ name: 'happy_scale.png', path : 'js/tasks/ncair/media/sam_faces/happy_scale_with_dots.png'}
]

var frameDur;
function updateInfo() {
	expInfo['date'] = util.MonotonicClock.getDateStr();  // add a simple timestamp
	expInfo['expName'] = expName;
	expInfo['psychoJSVersion'] = '2021.1.2';
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
var slides;
var instructClock;
var instrBelow;
var ready;
var trialClock;

var globalClock;

var fixation;
var audio_stim;
var stim_text;
var video_stim;
var image_stim;
var related_no;
var related_yes;
var feedback_stim;
var footer_stim;

var calm_scale;
var happy_scale;

var slider;
var next_text;


var track;

var resp;
var mouse;
var thanksClock;
var thanksText;

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
		font: 'Arial',alignVert: 'center',alignHoriz: 'center',
		units: 'norm',
		pos: [0, 0], height: .1, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	
	image_stim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'image_stim', units : 'norm', 
		image : undefined, mask : undefined,
		ori : 0, pos : [0, 0], size: [2,2],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	related_yes = new visual.ImageStim({
		win: psychoJS.window,
		name: 'related_yes',
		image: 'yes_button.png',
		units: 'norm',
		pos: [-.1, 0], height: 0.08,ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
		
	})

	related_no = new visual.ImageStim({
		win: psychoJS.window,
		name: 'related_no',
		image: 'no_button.png',
		units: 'norm',
		pos: [.1, 0], height: 0.08,ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	})

	next_text = new visual.ImageStim({
		win: psychoJS.window,
		name: 'next_text',
		image: 'next_button.png',
		units: 'norm',
		pos: [.8, -.8], height: 0.08,ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	})

	image_stim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'image_stim', units : 'height', 
		image : undefined, mask : undefined,
		ori: 0, pos: [0, 0],
		size: [.2,.15],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	calm_scale = new visual.ImageStim({
		win : psychoJS.window,
		name : 'calm_scale', units : 'norm', 
		image: 'calm_scale.png', mask : undefined,
		ori: 0, pos: [0, .15],
		size: [1.18,.5],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	happy_scale = new visual.ImageStim({
		win : psychoJS.window,
		name : 'happy_scale', units : 'norm', 
		image: 'happy_scale.png', mask : undefined,
		ori: 0, pos: [0, 0],
		size: [1.18,.5],
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	feedback_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'feedback_stim',
		text: 'Start Typing',
		alignVert: 'center',alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0], height: .1, wrapWidth : true, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	footer_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'footer_stim',
		text: 'Click on the line to make your selection.',
		alignVert: 'center',alignHoriz: 'center',
		font: 'Arial',
		units: 'norm',
		pos: [0, -.8], height: .06, wrapWidth : true, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	// slider = new visual.Slider({
	// 	win: psychoJS.window,
	// 	name: 'slider',
	// 	size: [.8, .03],
	// 	ticks: [...Array(5).keys()],
	// 	granularity: 0,
	// 	labels: [0,25,50,75,100],
	// 	pos: [0, 0], wrapWidth: undefined, ori: 0,
	// 	color: new util.Color('white'), opacity: 1,
	// 	depth: 0.0
	// });

	resp = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true });

	mouse = new core.Mouse({win: psychoJS.window})


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
			track = new sound.Sound({
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


/**
 * Randomize the Order for each subject
 * - For Audio, always alternate between comparator(1_0) and cultural(0_0)
 * - For Video, always alternate between comparator and cultural
 * - For Images,always alternate between comparator and cultural (blocks)
 * @param {*} trial_list 
 * @returns 
 */
function random_order(trial_list) {
	var sorted_trial_list = []
	var m_type;
	var cultural_indexes = []
	var comparator_indexes = []

	// Break Apart by conditions
	for (const idx in trial_list) {
		if (trial_list[idx].TrialTypes.includes('0_0')) {
			cultural_indexes.push(trial_list[idx])
			m_type = 'audio'
		}
		if (trial_list[idx].TrialTypes.includes('0_1')) {
			cultural_indexes.push(trial_list[idx])
			m_type = 'video'
		}
		if (trial_list[idx].TrialTypes.includes('0_2')) {
			cultural_indexes.push(trial_list[idx])
			m_type = 'picture'
		}
		if (trial_list[idx].TrialTypes.includes('1_0')) {
			comparator_indexes.push(trial_list[idx])
		}
		if (trial_list[idx].TrialTypes.includes('1_1')) {
			comparator_indexes.push(trial_list[idx])

		}
		if (trial_list[idx].TrialTypes.includes('1_2')) {
			comparator_indexes.push(trial_list[idx])

		}
	}

	// Shuffle each conditions
	var random_cultural = cultural_indexes.sort(() => Math.random() - 0.5)
	var random_comparator = comparator_indexes.sort(() => Math.random() - 0.5)


	// Create new Schedule
	console.log('Cultral Media: ' + random_cultural.length)
	console.log('Comparator Media: ' + random_comparator.length)
	var total_stims = random_cultural.length + random_comparator.length
	var cultural_idx = 0
	var comparator_idx = 0
	console.log(m_type)
	console.log(expInfo.run_id)
	if (m_type == 'audio') {
		// Alternate Addin
		for (var i = 0; i < total_stims; i++){
			if ((i % 2) == 0) {
				sorted_trial_list.push(random_cultural[cultural_idx])
				cultural_idx++;
			} else {
				sorted_trial_list.push(random_comparator[comparator_idx])
				comparator_idx++;
			}

			// If arousal only study, then only add the arousal question
			if (expInfo.run_id.includes('Arousal')) {
				sorted_trial_list.push({ TrialTypes: "2_5", Durations: 0, stim_paths: "None"})
			} else {
				sorted_trial_list.push({ TrialTypes: "2_6", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "2_3", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "2_7", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "2_4", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "2_5", Durations: 0, stim_paths: "None"})
			}
			
		}
	}

	if (m_type == 'video') {
		// Alternate Addin
		for (var i = 0; i < total_stims; i++){
			if ((i % 2) == 0) {
				sorted_trial_list.push(random_cultural[cultural_idx])
				cultural_idx++;
			} else {
				sorted_trial_list.push(random_comparator[comparator_idx])
				comparator_idx++;
			}
			if (expInfo.run_id.includes('Arousal')) {
				sorted_trial_list.push({ TrialTypes: "4_5", Durations: 0, stim_paths: "None"})
			} else {
				sorted_trial_list.push({ TrialTypes: "4_6", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "4_3", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "4_7", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "4_4", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "4_5", Durations: 0, stim_paths: "None"})
			}
		}
	}

	if (m_type == 'picture') {
		// Alternate Addin
		for (var i = 0; i < total_stims; i++){
			if ((i % 2) == 0) {
				sorted_trial_list.push(random_cultural[cultural_idx])
				cultural_idx++;
			} else {
				sorted_trial_list.push(random_comparator[comparator_idx])
				comparator_idx++;
			}

			if (expInfo.run_id.includes('Arousal')) {
				sorted_trial_list.push({ TrialTypes: "3_5", Durations: 0, stim_paths: "None"})
			} else {
				sorted_trial_list.push({ TrialTypes: "3_6", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "3_3", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "3_7", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "3_4", Durations: 0, stim_paths: "None" })
				sorted_trial_list.push({ TrialTypes: "3_5", Durations: 0, stim_paths: "None"})
			}
		}
		// Add the feedback Trial
		sorted_trial_list.push({ TrialTypes: "3_8", Durations: 0, stim_paths: "None"})
	}

	// return (trial_list.sort(() => Math.random() - 0.5))
	return (sorted_trial_list)
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

	//setting Up Schedule
	// ToDO lop by alternating
	console.log('Sorint Trial List - Before')
	console.log(trials._trialList)
	trials._trialList = random_order(trials._trialList)
	console.log('Sorint Trial List - After')
	console.log(trials._trialList)

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
	psychoJS.experiment.removeLoop(trials);

	return Scheduler.Event.NEXT;
}

var trialComponents;
var media_type;
var trial_type;
var medi_dict = {
	'0': 'audio',
	'1': 'video',
	'2': 'picture',
	'3': 'rating_identity',
	'4': 'rating_valence',
	'5': 'rating_arousal',
	'6': 'rating_relatedness',
	'7': 'rating_typicality',
	'8': 'general_feedback'
}

var rating_dict = {
	'2': 'clip',
	'3': 'picture',
	'4': 'video'
}
var lastTrial;

/**
 * This Function Routine is everything needed to prep the trials
 * Use this to set text, iamges,video,slider and other necessary variables
 * @param {*} trials 
 * @returns 
 */
function trialRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		trialComponents = [];
		t = 0;
		trialClock.reset(); // clock
		frameN = -1;


		// Medial Type
		trial_type = medi_dict[TrialTypes.substring(2, 3)]
		// Set Media_type
		if (trial_type == 'audio' || trial_type == 'video' || trial_type == 'picture') {
			media_type = trial_type
			lastTrial = {
				trial_type: trial_type, stim_paths: stim_paths
			}

		} else {
			// Get from the first character '0_1'  -> '0'
			media_type = rating_dict[TrialTypes.substring(0, 1)]
		}

		console.log(stim_paths)
		console.log(trial_type)

		if (trial_type == 'audio') {
			
			stim_text.setText('Press the Space Bar to play audio.') 
			stim_text.height = .1
			stim_text.pos = [0, 0]
			stim_text.alignHoriz = 'center'
			audio_stim = new sound.Sound({
				win: psychoJS.window,
				value: stim_paths,
				audio_stim : 1.0
			  });
			console.log(audio_path)

			trialComponents.push(audio_stim);
			trialComponents.push(stim_text);
		}

		if (trial_type == 'video') {
			stim_text.setText('Press the Space Bar to play video.')
			
			stim_text.height = .1
			stim_text.pos = [0, 0]
			stim_text.alignHoriz = 'center'
			video_stim = new visual.MovieStim({
				win : psychoJS.window,
				name : 'video_stim', units : 'norm', 
				movie : stim_paths, 
				ori : 0, pos : [0, 0],size:[2,2],
				color: new util.Color('white'), opacity: 1,
				loop: false,  noAudio: false,
			});

			trialComponents.push(video_stim);
			trialComponents.push(stim_text);
		}

		if (trial_type == 'picture') {
			
			stim_text.pos = [-.5, 0]
			stim_text.alignHoriz = 'center'
			image_stim.size = [1,1]
			image_stim.image = stim_paths
			next_text.image = 'next_button.png'
			trialComponents.push(next_text)
			trialComponents.push(image_stim);
			trialComponents.push(stim_text);
		}

		if (trial_type == 'rating_relatedness') {
			stim_text.setText(`Relatedness:\nIs this ${media_type} related to your identity as a native person?`)
			
			stim_text.height = .1
			stim_text.pos = [0, .5]
			stim_text.color = new util.Color('white')
			related_no.image = 'no_button.png'
			related_yes.image = 'yes_button.png'
			trialComponents.push(related_no);
			trialComponents.push(related_yes);
			trialComponents.push(stim_text);
		}

		if (trial_type == 'rating_identity') {
			slider = new visual.Slider({
				win: psychoJS.window,
				name: 'slider',
				size: [.8, .03],
				ticks: [...Array(5).keys()],
				granularity: 0,
				labels: [0,25,50,75,100],
				pos: [0, 0], wrapWidth: undefined, ori: 0,
				color: new util.Color('white'), opacity: 1,
				depth: 0.0
			});
			// slider.ticks = [...Array(5).keys()]
			// slider.labels = [0,25,50,75,100]
			// slider.granularity = 0
			// slider.pos = [0,0]
			slider.reset()
			next_text.image = 'next_button.png'
			stim_text.setText(`Identity:\nHow much did this ${media_type} relate to your identity as a native person? `)
			
			stim_text.height = .1
			stim_text.pos = [0,.5]
			stim_text.color = new util.Color('white')
			trialComponents.push(slider);
			trialComponents.push(next_text)
			trialComponents.push(stim_text);
			trialComponents.push(footer_stim);
		}

		if (trial_type == 'rating_typicality') {
			slider = new visual.Slider({
				win: psychoJS.window,
				name: 'slider',
				size: [.8, .03],
				ticks: [...Array(5).keys()],
				granularity: .1,
				labels: [0,25,50,75,100],
				pos: [0, 0], wrapWidth: undefined, ori: 0,
				color: new util.Color('white'), opacity: 1,
				depth: 0.0
			});
			// slider.ticks = [...Array(5).keys()]
			// slider.labels = [0, 25, 50, 75, 100]
			// slider.granularity = .1
			// slider.pos = [0,0]
			slider.reset()
			next_text.image = 'next_button.png'
			if (lastTrial.trial_type == 'picture' ||lastTrial.trial_type== 'video' ){
				stim_text.setText(`Typicality:\nHow likely is it for a native person to see/experience scenes like these?`)
			}
			if (lastTrial.trial_type== 'audio' ){
				stim_text.setText(`Typicality:\nHow likely is it for a native person to hear/experience sounds like these?`)
			}
			
			stim_text.height = .1
			stim_text.pos = [0, .5]
			stim_text.color = new util.Color('white')
			trialComponents.push(slider);
			trialComponents.push(next_text)
			trialComponents.push(stim_text);
			trialComponents.push(footer_stim);
		}

		if (trial_type == 'rating_valence') {
			//ticks: [...Array(5).keys()],
			//labels: [0,25,50,75,100],
			slider = new visual.Slider({
				win: psychoJS.window,
				name: 'slider',
				size: [.8, .03],
				ticks: [...Array(9).keys()],
				granularity: 1,
				labels: ['negative', 'neutral', 'positive'],
				pos: [0, -.15], wrapWidth: undefined, ori: 0,
				color: new util.Color('white'), opacity: 1,
				depth: 0.0
			});
			// slider.ticks = [...Array(9).keys()]
			// slider.labels = ['negative', 'neutral', 'positive']
			// slider.granularity = 1
			// slider.pos = [0, -.15]
			happy_scale.pos = [0,0]
			slider.reset()
			stim_text.setText(`Valence:\nRate your mood in response to this ${media_type}.`)
			
			stim_text.height = .1
			stim_text.pos = [0, .5]
			stim_text.color = new util.Color('white')
			next_text.image = 'next_button.png'
			trialComponents.push(slider);
			trialComponents.push(next_text)
			trialComponents.push(stim_text);
			trialComponents.push(footer_stim);
			trialComponents.push(happy_scale);
		}

		if (trial_type == 'rating_arousal') {
			//ticks: [...Array(5).keys()],
			//labels: [0,25,50,75,100],
			slider = new visual.Slider({
				win: psychoJS.window,
				name: 'slider',
				size: [.8, .03],
				ticks: [...Array(9).keys()],
				granularity: 1,
				labels: ['calm', 'middle', 'excited'],
				pos: [0, -.15], wrapWidth: undefined, ori: 0,
				color: new util.Color('white'), opacity: 1,
				depth: 0.0
			});
			// slider.ticks = [...Array(9).keys()]
			// slider.labels = ['calm', 'middle', 'excited']
			// slider.pos = [0,-.15]
			// slider.granularity = 1
			slider.reset()
			stim_text.setText(`Arousal:\nRate your arousal in response to this ${media_type}.`)
			
			stim_text.height = .1
			calm_scale.pos = [0,0]
			stim_text.pos = [0, .5]
			stim_text.color = new util.Color('white')
			next_text.image = 'next_button.png'
			trialComponents.push(slider);
			trialComponents.push(next_text)
			trialComponents.push(stim_text);
			trialComponents.push(footer_stim);
			trialComponents.push(calm_scale);
		}

		if (trial_type == 'general_feedback') {
			stim_text.setText(`General Feedback:\nThank you for participating in our study. Please take a moment to provide any comments or feedback regarding the study and the cultural pictures, music, and videos.`)
			stim_text.alignHoriz = 'left'
			stim_text.pos = [-.9, .5]
			feedback_stim.alignHoriz = 'left'
			feedback_stim.pos = [-.9, -.3]
			feedback_stim.size = [-.9, .9]
			feedback_stim.height = .05
			trialComponents.push(stim_text);
			trialComponents.push(next_text)
			trialComponents.push(feedback_stim)
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
 * For Audio Trials
 */
function do_audio() {
	if (audio_stim.status == PsychoJS.Status.NOT_STARTED) {
		if (ready.getKeys({ keyList: ['space'] }).length > 0) {  // at least one key was pressed
			// a response ends the routine
			next_progress = t + audio_stim.getDuration() // time it will end
			audio_stim.play()
			console.log('Audio playing')

			stim_text.height = .3
			stim_text.setText('+') // Change to Plus when audio is playing
			stim_text.color = new util.Color('yellow')
		}
	}

	if (t >= next_progress) {
		audio_stim.stop()
		stim_text.color = new util.Color('white')
		continueRoutine = false
	}

	stim_text.setAutoDraw(true)
}

/**
 * For Video Trials
 */
function do_video() {
	
	if (video_stim.status == PsychoJS.Status.NOT_STARTED) {
		stim_text.setAutoDraw(true)
		
		if (ready.getKeys({ keyList: ['space'] }).length > 0) {  // at least one key was pressed
			// a response ends the routine
			stim_text.setAutoDraw(false)
			video_stim.setAutoDraw(true);
			console.log('Video playing')
				
		}
	}

	if (video_stim.status == PsychoJS.Status.FINISHED) {
		video_stim.setAutoDraw(false);
		continueRoutine = false
	}	
}

var time_to_show_next;

/**
 * For Image Trials
 * Show image at least 2 seconds, than allow user to progress (show next button)
 */
function do_image() {
	
	if (image_stim.status == PsychoJS.Status.NOT_STARTED) {
		time_to_show_next = t + 2
	}

	if (t >= time_to_show_next) {
		next_text.depth = 1
		next_text.setAutoDraw(true)
	}

	if (mouse.isPressedIn(next_text)) {
		next_progress = t + .5 // Allow Delay second after mouse presss. to show a that they've cliked
		next_text.image = 'next_button_clicked.png'
	}

	if (t >= next_progress) {
		continueRoutine = false
	}

	image_stim.setAutoDraw(true)


}

/**
 * Rating Identity Trials
 */
function do_rating_identity() {
	stim_text.setAutoDraw(true)
	footer_stim.setAutoDraw(true)

	slider.setAutoDraw(true)
	if (slider.getRating()) {
		next_text.setAutoDraw(true)
	}
	if (mouse.isPressedIn(next_text)) {
		next_progress = t + .5 // Allow Delay second after mouse presss. to show a that they've cliked
		next_text.image = 'next_button_clicked.png'
		// next_text.color = new util.Color('red')
	}

	if (t >= next_progress) {
		continueRoutine = false
	}
}

function do_rating_valence() {
	stim_text.setAutoDraw(true)
	footer_stim.setAutoDraw(true)

	happy_scale.setAutoDraw(true)

	slider.setAutoDraw(true)
	if (slider.getRating() >= 0) {
		next_text.setAutoDraw(true)
	}
	if (mouse.isPressedIn(next_text)) {
		next_progress = t + .5 // Allow Delay second after mouse presss. to show a that they've cliked
		next_text.image = 'next_button_clicked.png'
		// next_text.color = new util.Color('red')
	}


	if (t >= next_progress) {
		continueRoutine = false
	}
}

function do_rating_arousal() {
	stim_text.setAutoDraw(true)
	calm_scale.setAutoDraw(true)
	footer_stim.setAutoDraw(true)

	slider.setAutoDraw(true)
	if (slider.getRating() >= 0) {
		next_text.setAutoDraw(true)
	}
	if (mouse.isPressedIn(next_text)) {
		next_progress = t + .5 // Allow Delay second after mouse presss. to show a that they've cliked
		next_text.image = 'next_button_clicked.png'
		// next_text.color = new util.Color('red')
	}

	if (t >= next_progress) {
		continueRoutine = false
	}
}

var next_progress;
var related_response;
function do_rating_relatedness() {
	
	stim_text.setAutoDraw(true)

	related_no.setAutoDraw(true)
	related_yes.setAutoDraw(true)

	if (mouse.isPressedIn(related_yes)) {
		next_progress = t + .5 // Allow Delay second after mouse press
		related_yes.image = 'yes_button_clicked.png'
		related_yes.color = new util.Color('red')
		related_response = 'yes'
	}
	if (mouse.isPressedIn(related_no)) {
		next_progress = t + .5 // Allow Delay second after mouse press
		related_no.image = 'no_button_clicked.png'
		related_no.color = new util.Color('red')
		related_response = 'no'
	}

	if (t >= next_progress) {
		continueRoutine = false
	}
}
function do_rating_typicality() {
	stim_text.setAutoDraw(true)
	footer_stim.setAutoDraw(true)

	slider.setAutoDraw(true)
	if (slider.getRating() >= 0) {
		next_text.setAutoDraw(true)
	}
	if (mouse.isPressedIn(next_text)) {
		next_progress = t + .5 // Allow Delay second after mouse presss. to show a that they've cliked
		next_text.image = 'next_button_clicked.png'
		// next_text.color = new util.Color('red')
	}

	if (t >= next_progress) {
		continueRoutine = false
	}
}

var feedback_text = ''
var keys;

var keys_dict = {
	'space': ' ',
	'comma': ',',
	'minus': '-',
	'plus': '+',
	'lshift': '',
	'rshift': '',
	'lcommand': '',
	'rcommand': '',
	'tab': '',
	'undefined': '',
	'semicolon': ';',
	'return': '\n',
	'capslock': '',
	'period': '.',
	'apostrophe': '\'',
	'slash': '/',
	'bracketleft': '[',
	'bracketright': ']',
	'right': '',
	'left': '',
	'up': '',
	'down': '',
	'backslash': '\\',
	'lcontrol': '',
	'rcontrol': '',
	'escape': ''

}
function do_general_feedback() {

	if (stim_text.status == PsychoJS.Status.NOT_STARTED) {
		psychoJS.eventManager.clearEvents()
	}
	
	let keys = psychoJS.eventManager.getKeys({})
	if (keys.length > 0) {  // at least one key was pressed
		// a response ends the routine
		// console.log(feedback_text)
		if (keys == 'backspace') {
			feedback_text = feedback_text.slice(0, -1) 
		} else if (keys in keys_dict) {
			feedback_text = feedback_text + keys_dict[keys]
		} else {
			feedback_text = feedback_text + keys
		}
		
		feedback_stim.setText(feedback_text)
	}
	if (feedback_text.length > 0) {
		next_text.setAutoDraw(true)
	}

	if (mouse.isPressedIn(next_text)) {
		next_progress = t + .5 // Allow Delay second after mouse presss. to show a that they've cliked
		next_text.image = 'next_button_clicked.png'
		// next_text.color = new util.Color('red')
	}

	if (t >= next_progress) {
		continueRoutine = false
	}

	stim_text.setAutoDraw(true)
	feedback_stim.setAutoDraw(true)
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
		if (trial_type == 'picture') do_image()
		if (trial_type == 'rating_identity') do_rating_identity()
		if (trial_type == 'rating_valence') do_rating_valence()
		if (trial_type == 'rating_arousal') do_rating_arousal()
		if (trial_type == 'rating_relatedness') do_rating_relatedness()
		if (trial_type == 'rating_typicality') do_rating_typicality()
		if (trial_type == 'general_feedback') do_general_feedback()

		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}
		// Allo skip trial only for developlment
		if ((window.location.hostname == 'localhost')) {
			if ( psychoJS.eventManager.getKeys({keyList:['z']}).length > 0) {
				return Scheduler.Event.NEXT;
			}
		}
		

		if (continueRoutine) {
			return Scheduler.Event.FLIP_REPEAT;
		}
		else {
			return Scheduler.Event.NEXT;
		}
	};
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

		// Slider Response Based on Rating Type
		var slider_result;

		if (trial_type == 'rating_valence' || trial_type == 'rating_identity' || trial_type == 'rating_typicality' || trial_type == 'rating_arousal') {
			slider_result = slider.getRating()
		if (trial_type == 'rating_identity' || trial_type == 'rating_typicality') {
			slider_result = Math.round(slider_result * 25)
		} else {
			slider_result = slider_result + 1
		}
		}
		

		psychoJS.experiment.addData('related_response', related_response);
		psychoJS.experiment.addData('silder.rating', slider_result);
		psychoJS.experiment.addData('trial_type', lastTrial.trial_type);
		psychoJS.experiment.addData('stim_path', lastTrial.stim_paths);
		psychoJS.experiment.addData('general_feedback', feedback_text);
		
		// psychoJS.experiment.addData('resp.corr', resp.corr);

		resp.stop();
		// the Routine "trial" was not non-slip safe, so reset the non-slip timer
		routineTimer.reset();
		next_progress = undefined // resets the next progress
		related_response = undefined // clear variable

		for (const thisComponent of trialComponents) {
			try {
				thisComponent.stop()
				
			} catch (error) {
				// console.log(error);
			}
			try {
				thisComponent.setAutoDraw(false)
			} catch (error) {
				
			}
			
		}
		
		return Scheduler.Event.NEXT;
	};
}

var thanksComponents;
function thanksRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'thanks'-------
		// Clear Trial Components
		t = 0;
		thanksClock.reset(); // clock
		frameN = -1;
		// update component parameters for each repeat
		// keep track of which components have finished

		thanksText.setText(`This is the end of the task run`)

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
		if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// check if the Routine should terminate
		if (!continueRoutine) {  // a component has requested a forced-end of Routine
			return Scheduler.Event.NEXT;
		}

		// Exit after XX seconds
		if (t >= 2) {
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
	// Send Last Data
	sendData(psychoJS.experiment._trialsData)

	psychoJS.window.close();
	psychoJS.quit({ message: message, isCompleted: isCompleted });

	return Scheduler.Event.QUIT;
}
