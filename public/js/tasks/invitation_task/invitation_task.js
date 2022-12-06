/**
 * Invitation Task
 * A modifieid version of Planning Task
 * See the README.md file for more information about this task
 * @author James Touthang <james@touthang.info>
 */


var event_types = {
	'INSTRUCT_ONSET': 1,
	'TASK_ONSET': 2,
	'BLOCK_ONSET': 3,
	'TRIAL_ONSET': 4,
	'SELECTION': 5,
	'BLOCK_RESULT_ONSET': 6,
	'BLOCK_RESULT_OFFSET': 7,
	'FINAL_RESULT_ONSET': 8,
	'FINAL_RESULT_OFFSET': 9,
	'FIXATION_ONSET': 10,
	'OUTCOME_IMAGE_ONSET': 11,
	'OUTCOME_SOUND_ONSET': 12,
}

/*jshint -W069 */
/*Disable Warning Justification:
	Using bracket notation because it's familiar coding convention with python
	Counterpart
*/

var trials_data = []
var g = {}				// global variables
g.PLEASANT_COLOR = 'green';
g.UNPLEASANT_COLOR = 'red';

g.outcome_media = {
	'negative': [], 	// holds negateive image-audio pair
	'positive': []		// holds positive image-audio pair
}

// Text response to dislpay after choosing a selection.
g.outcome_text_responses = {
	'accept': "Sure, I'll help!",
	'reject': "Too bad!" 
}

// Variable to hold the actual reponse
g.outcome_text_response = '';

// Text to show at the bottom of the screen during each trial
g.game_type_text = {
	'pleasant': `You will be shown the meaningless image unless the person you choose decides to help you.`,
	'unpleasant': `You will be shown the unpleasant image unless the person you choose decides to help you.`
}

var LEFT_KEY = 'left'
var RIGHT_KEY = 'right'

 import { core, data, sound, util, visual } from '/psychojs/psychojs-2021.2.3.js';
 const { PsychoJS } = core;
 const { TrialHandler } = data;
 const { Scheduler } = util;
 //some handy aliases as in the psychopy scripts;
 const { abs, sin, cos, PI: pi, sqrt } = Math;
const { round } = util;
 
import { Sound } from '/lib/sound-2020.1.js';

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
					url: '/js/tasks/invitation_task/' + getQueryVariable('run'),
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
let expName = 'Invitation Task';  // from the Builder filename that created this script
var expInfo = { 'participant': '', 'session': '', 'run_id': '', 'date': formatDate(), 'study': '', };

// Add Slides to resources
var resources = [
	{ name: 'practice_schedule.csv', path: '/js/tasks/cooperation_task/practice_schedule.csv' },
	{ name: 'PRACTICE_ready', path: '/js/tasks/cooperation_task/media/instructions/Slide15.jpeg' },
	{ name: 'PRACTICE_ready_audio.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/Slide15.mp3'},
	{ name: 'MAIN_ready', path: '/js/tasks/cooperation_task/media/instructions/Slide16.jpeg' },
	{ name: 'MAIN_ready_audio.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/Slide16.mp3'},
	{ name: 'BEGIN_slide', path: '/js/tasks/cooperation_task/media/instructions/Slide17.jpeg' },
	{ name: 'step_1_backg', path: '/js/tasks/invitation_task/media/images/building_street.jpeg' },
	{ name: 'b-a_r-1', path: '/js/tasks/invitation_task/media/images/b-a_r-1.png' },
	{ name: 'b-a_r-2', path: '/js/tasks/invitation_task/media/images/b-a_r-2.png' },
	{ name: 'b-a_r-3', path: '/js/tasks/invitation_task/media/images/b-a_r-3.png' },
	{ name: 'b-a_r-4', path: '/js/tasks/invitation_task/media/images/b-a_r-4.png' },
	{ name: 'b-a_r-5', path: '/js/tasks/invitation_task/media/images/b-a_r-5.png' },
	{ name: 'b-a_r-6', path: '/js/tasks/invitation_task/media/images/b-a_r-6.png' },
	{ name: 'b-a_r-7', path: '/js/tasks/invitation_task/media/images/b-a_r-7.png' },
	{ name: 'b-b_r-1', path: '/js/tasks/invitation_task/media/images/b-b_r-1.png' },
	{ name: 'b-b_r-2', path: '/js/tasks/invitation_task/media/images/b-b_r-2.png' },
	{ name: 'b-b_r-3', path: '/js/tasks/invitation_task/media/images/b-b_r-3.png' },
	{ name: 'b-b_r-4', path: '/js/tasks/invitation_task/media/images/b-b_r-4.png' },
	{ name: 'b-b_r-5', path: '/js/tasks/invitation_task/media/images/b-b_r-5.png' },
	{ name: 'b-b_r-6', path: '/js/tasks/invitation_task/media/images/b-b_r-6.png' },
	{ name: 'b-b_r-7', path: '/js/tasks/invitation_task/media/images/b-b_r-7.png' },
	{ name: 'red_door', path: '/js/tasks/invitation_task/media/images/red_door.png' },
	{ name: 'orange_door', path: '/js/tasks/invitation_task/media/images/orange_door.png' },
	{ name: 'yellow_door', path: '/js/tasks/invitation_task/media/images/yellow_door.png' },
	{ name: 'green_door', path: '/js/tasks/invitation_task/media/images/green_door.png' },
	{ name: 'blue_door', path: '/js/tasks/invitation_task/media/images/blue_door.png' },
	{ name: 'pink_door', path: '/js/tasks/invitation_task/media/images/pink_door.png' },
]

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
flowScheduler.add(readyRoutineBegin('MAIN', 'BEGIN_slide', undefined));
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
function experimentInit() {
	// Check if there is an practice
	if (getQueryVariable('practice') == 'true') {
		practice = true;
		console.log("PRACTICE SESSION!")
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

	g.step_1_background = new visual.ImageStim({
		win : psychoJS.window,
		name : 'step_1_backg', units : 'height', 
		image : 'step_1_backg', mask : undefined,
		ori : 0, pos : [0, 0], size: 1,
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	g.step_2_background = new visual.ImageStim({
		win : psychoJS.window,
		name : 'step_2_background', units : 'height', 
		image : 'b-a_r-1', mask : undefined,
		ori : 0, pos : [0, 0], size: 0.8,
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	g.placement_pos = {
		'door': {
			'left': [ -0.6, 0],
			'right': [ 0.6, 0]
		},
		'door_text': {
			'left': [ -0.85, -0.3],
			'right': [ 0.85, -0.3]
		}
	}

	g.left_door = new visual.ImageStim({
		win : psychoJS.window,
		name : 'left_door', units : 'height', 
		image : 'blue_door', mask : undefined,
		ori : 0, pos : g.placement_pos['door']['left'], size: 0.15,
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	g.right_door = new visual.ImageStim({
		win : psychoJS.window,
		name : 'right_door', units : 'height', 
		image : 'green_door', mask : undefined,
		ori : 0, pos : g.placement_pos['door']['right'], size: 0.15,
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

	g.trial_number = 1;
	g.text_trial_number  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_trial_number',
		text: 'Trial:',alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [0.7, 0.9], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_trial_number  = new visual.TextStim({
		win: psychoJS.window,
		name: 'trial_number',
		text: '1',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.9, 0.9], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.choice_number = 0;
	g.text_choice_number  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_choice_number',
		text: 'Choice:',alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [0.7, 0.8], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_choice_number = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_val_choice_number',
		text: '0',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.9, 0.8], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.total_invites = 0;
	g.text_invites  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_invites',
		text: 'Invites:',alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [0.7, 0.7], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_invites = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_val_invites',
		text: '0',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.9, 0.7], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.prompt_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'prompt_text',
		text: 'Which building do you choose?',alignHoriz: 'center',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0.85], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('black'), opacity: 1,
		depth: 0.0
	});

	g.choice_1 = new visual.TextStim({
		win: psychoJS.window,
		name: 'choice_1',
		text: '1',alignHoriz: 'center',
		font: 'Arial',
		units: 'norm',
		pos: [-0.4, 0.6], height: 0.15, wrapWidth: undefined, ori: 0,
		color: new util.Color('black'), opacity: 1,
		depth: 0.0
	});

	g.choice_2 = new visual.TextStim({
		win: psychoJS.window,
		name: 'choice_2',
		text: '2',alignHoriz: 'center',
		font: 'Arial',
		units: 'norm',
		pos: [0.25, 0.4], height: 0.15, wrapWidth: undefined, ori: 0,
		color: new util.Color('black'), opacity: 1,
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
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	// Game Type  Explanation
	g.game_type_text_stim = new visual.TextStim({
		win: psychoJS.window,
		name: 'game_type explanation',
		text: g.game_type_text['pleasant'],
		font: 'Arial',
		units: 'norm',
		pos: [0, -0.8], height: 0.05, wrapWidth: 1.4, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
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
		g.slideStim.setImage(instruct_slide)
		// update component parameters for each repeat
		ready.keys = undefined;
		ready.rt = undefined;
		// keep track of which components have finished
		instructComponents = [ g.slideStim];
	
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
			console.log('setting new image', instruct_slide, 'index:',trials.thisIndex, 'Audio: ',audio_path)
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
					console.log('setting new audio')
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
					image : image_stim, mask : undefined,
					ori : 0, pos : [0, 0],
					color : new util.Color([1, 1, 1]), opacity : 1,
					flipHoriz : false, flipVert : false,
					texRes : 128, interpolate : true, depth : 0
				});

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
		thisScheduler.add(trialRoutineBegin(snapshot)); 	 // setup block
		thisScheduler.add(trialStep1(snapshot));			 // step 1
		thisScheduler.add(trialStep2(snapshot));			 // step 2
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

	blocks = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule.xls',
		seed: undefined, name: 'trials'
	});

	g.global_trial_number = 0;
	g.game_number = 1;

	psychoJS.experiment.addLoop(blocks); // add the loop to the experiment

	// Schedule all the blocks in the trialList:
	for (const thisTrial of blocks) {
		const snapshot = blocks.getSnapshot();
		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot)); 	 // setup block
		thisScheduler.add(blockRoutineTrials(snapshot));	 // do trials
		thisScheduler.add(blockRoutineOutcome(snapshot)); 	 // show result
		thisScheduler.add(blockRoutineEnd(snapshot));		 // end block
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
	g.text_game_number.setAutoDraw(false); // 'Game Number:'
	g.text_val_game_number.setAutoDraw(false); // the game vale '2/2'
	g.text_trial_number.setAutoDraw(false); // 'Choice Number:'
	g.text_val_trial_number.setAutoDraw(false); // the choice val '16/16'

	g.text_choice_number.setAutoDraw(false);
	g.text_val_choice_number.setAutoDraw(false); 

	g.text_invites.setAutoDraw(false);
	g.text_val_invites.setAutoDraw(false);
	
	g.game_type_text_stim.setAutoDraw(false); // bottom text

	g.slideStim.setAutoDraw(false)

	psychoJS.experiment.removeLoop(blocks);

	psychoJS.experiment.addData('globalClock', globalClock.getTime());

	return Scheduler.Event.NEXT;
}

// StimImage Dictrionary for faces
g.faces_choice = {
	1: '',
	2: '',
	3: ''
}

function clearStims() {
	g.step_1_background.setAutoDraw(false);
	g.step_1_background.status = PsychoJS.Status.NOT_STARTED;

	g.prompt_text.setAutoDraw(false);
	g.prompt_text.status = PsychoJS.Status.NOT_STARTED;

	g.choice_1.setAutoDraw(false);
	g.choice_1.status = PsychoJS.Status.NOT_STARTED;

	g.choice_2.setAutoDraw(false);
	g.choice_2.status = PsychoJS.Status.NOT_STARTED;

}

/**
 * Routine for the routine before block starts
 * Userse for intialize and setting the stims
 * @param {*} trial 
 * @returns 
 */
function trialRoutineBegin(trial) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		t = 0;
		trial_type = '';
		
		g.text_trial_number.setAutoDraw(true);
		g.text_val_trial_number.setText(g.trial_number);
		g.text_val_trial_number.setAutoDraw(true);

		g.text_choice_number.setAutoDraw(true);
		g.text_val_choice_number.setText(g.choice_number);
		g.text_val_choice_number.setAutoDraw(true);

		g.text_invites.setAutoDraw(true);
		g.text_val_invites.setText(g.total_invites);
		g.text_val_invites.setAutoDraw(true);

		blockClock.reset(); // clock

		mark_event(trials_data, globalClock, g.trial_number, trial_type, event_types['BLOCK_ONSET'],
				'NA', 'NA' , face_1 + ' | ' + face_2 + ' | ' + face_3)
		return Scheduler.Event.NEXT;
	};
}

/**
 * Step 1: 
 * Subjec is outside. Give option to turn on 'light'
 * Allow them to select left/right building
 * @param {*} trial 
 * @returns 
 */
function trialStep1(trial) {
	return function () {
		if (g.step_1_background.status == PsychoJS.Status.NOT_STARTED) {
			g.step_1_background.setAutoDraw(true);
			g.prompt_text.setAutoDraw(true);

			g.choice_1.setAutoDraw(true);
			g.choice_2.setAutoDraw(true);
		}

		if (ready.status === PsychoJS.Status.STARTED) {
			let theseKeys = ready.getKeys({ keyList: ['1', '2', '3'], waitRelease: false });
			if (theseKeys.length > 0) {
				// Force Progression
				if (theseKeys[0].name == '1') {  // at least one key was pressed
				}

				if (theseKeys[0].name == '2') {  // at least one key was pressed
					
				}
				if (theseKeys[0].name == '3') {
				
				}

				// prepare for next step
				clearStims();
				g.prompt_text.setText('Where do you want to go next?');
				g.choice_1.pos = g.placement_pos['door_text']['left'];
				g.choice_1.color = 'white';
				g.choice_2.pos = g.placement_pos['door_text']['right'];
				g.choice_2.color = 'white';
				return Scheduler.Event.NEXT;
			}

			
		}

		return Scheduler.Event.FLIP_REPEAT;
	}
}

/**
 * Step 2
 * Inside Building, Give option to go left or right
 * @param {*} trial 
 * @returns 
 */
function trialStep2(trial) {
	return function () {
		if (g.step_2_background.status == PsychoJS.Status.NOT_STARTED) {
			g.step_2_background.setAutoDraw(true);
			g.prompt_text.setAutoDraw(true);

			g.left_door.setAutoDraw(true);
			g.right_door.setAutoDraw(true);

			g.choice_1.setAutoDraw(true);
			g.choice_2.setAutoDraw(true);
		}
		return Scheduler.Event.FLIP_REPEAT
	}
}


/**
 * Returns either positive or negative given random probability
 * @param {*} probability probabilty 
 */
function getRandomOutcome(probability, game_type) {
	if (Math.random() < probability) {
		// returns the game_type. Either 'plesant' or 'unpleasant'
		return (game_type == 'pleasant' ? 'positive': 'negative');
	} else {
		return 'meaningless'
	}
}

/**
 * Returns an image/audio outcome pair based on given income
 * @param {*} outcome string of either 'negative' or 'positive' or 'meaningless'
 */
function getOutcomePair(outcome, game_type, choice) {
	switch (outcome) {
		case 'meaningless':
			// returns outcome_triple based on game_type
			if (game_type == 'pleasant') {
				g.outcome_triple = g.outcome_media.positive[ g.global_trial_number ];
			} else {
				g.outcome_triple = g.outcome_media.negative[ g.global_trial_number ];
			}
			break;
		case 'positive':
			g.outcome_triple = g.outcome_media.positive[ g.global_trial_number];
			break;
		case 'negative':
			g.outcome_triple = g.outcome_media.negative[ g.global_trial_number ];
			break;
	}

	console.log('Outcome: ', outcome, game_type, g.outcome_triple)

	// use neutral sound if the outcome is meaningless
	if (outcome == 'meaningless') {
		// Outcome_image Stim
		g.outcome_image = new visual.ImageStim({
			win : psychoJS.window,
			name : 'outcome_image', units : 'norm', 
			image : g.outcome_triple[2], mask : undefined,
			ori: 0,pos: [0,0], opacity : 1,size: [2,2],
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 2
		})
		
		// Outcome Sound Stim
		g.outcome_sound = new Sound({
			win: psychoJS.window,
			value: 'neutral_sound.mp3'
		});
	} else {
		// Outcome_image Stim
		g.outcome_image = new visual.ImageStim({
			win : psychoJS.window,
			name : 'outcome_image', units : 'norm', 
			image : g.outcome_triple[0], mask : undefined,
			ori: 0,pos: [0,0], opacity : 1,size: [2,2],
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 2
		})

		// Outcome Sound Stim
		g.outcome_sound = new Sound({
			win: psychoJS.window,
			value: g.outcome_triple[1]
		});
	}
	g.outcome_sound.setVolume(1.0);
}

/**
 * Function call for when a choice is made
 * @param {string} outcome outcome returned from getRandomOutcome()
 * @param {string} choice choice given. either '1', '2', or '3'
 */
function setOutcome(outcome, choice) {
	switch (outcome) {
		case 'positive':
			g.outcome[choice]['positive'].push(
				new visual.ImageStim({
				win : psychoJS.window,
				name : 'outcome_choice_' + choice, units : 'norm',
				image : 'positive_face', mask : undefined,
				ori: 0,
					pos: g.choice_outcome_pos[choice]['unscramble'][
						g.choice_counter[choice]['positive']
				],
				color : new util.Color([1, 1, 1]), opacity : 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
				})
			)
			// g.outcome[choice]['positive'][g.choice_counter[choice]['positive']].setAutoDraw(true)
			g.choice_counter[choice]['positive']++
			break;
		case 'negative':
			g.outcome[choice]['negative'].push(
				new visual.ImageStim({
				win : psychoJS.window,
				name : 'outcome_negative_choice_' + choice, units : 'norm', 
				image : 'negative_face', mask : undefined,
				ori: 0,
					pos: g.choice_outcome_pos[choice]['unscramble'][
						g.choice_counter[choice]['negative']
				],
				color : new util.Color([1, 1, 1]), opacity : 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
				})
			)
			// g.outcome[choice]['negative'][g.choice_counter[choice]['negative']].setAutoDraw(true)
			g.choice_counter[choice]['negative']++
			break;
		case 'meaningless':
			g.outcome[choice]['meaningless'].push(
				new visual.ImageStim({
				win : psychoJS.window,
				name : 'outcome_negative_choice_' + choice, units : 'norm', 
				image : 'neutral_face', mask : undefined,
				ori: 0,
					pos: g.choice_outcome_pos[choice]['scramble'][
						g.choice_counter[choice]['meaningless']
				],
				color : new util.Color([1, 1, 1]), opacity : 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
				})
			)
			// g.outcome[choice]['meaningless'][g.choice_counter[choice]['meaningless']].setAutoDraw(true)
			g.choice_counter[choice]['meaningless']++
			break;
	}
}

/**
 * Sets the outcome reponse based on outcome and game type
 * reference to #56 https://github.com/laureate-institute-for-brain-research/StimToolOnline/issues/56
 * @param {*} outcome the random outcome. i.e. 'pleasant', 'unpleasant', 'meaningless'
 * @param {*} game_type the game type from the schedule. ie. 'unpleasant' or 'pleasant'
 * @param {*} choice the choice number the subjet selected, ie. 1, 2,3
 */
function setOutcomeResponse(outcome, game_type, choice) {
	if (game_type == 'pleasant') {
		if (outcome == 'positive') {
			// pleasant outcomes with positive images
			g.outcome_text_response = g.outcome_text_responses['accept']
		} else {
			// pleasant outcomes with scrambled images
			g.outcome_text_response = g.outcome_text_responses['reject']
		}
	} else {
		if (outcome == 'negative') {
			// unpleasant outcomes with negative images
			g.outcome_text_response = g.outcome_text_responses['reject']
		} else {
			// unpleasant outcomes with scrambled iamges
			g.outcome_text_response = g.outcome_text_responses['accept']
		}
	}

	// Set the text x-position based of the choice
	switch (choice) {
		case 1:
			g.outcome_text = new visual.TextStim({
				win: psychoJS.window,
				name: 'outcome_text',
				text: g.outcome_text_response,
				font: 'Arial',
				units: 'norm',
				pos: [
					g.faces_choice[1].pos[0],
					-0.33], height: 0.05, wrapWidth: undefined, ori: 0,
				color: new util.Color('white'), opacity: 1,
				depth: 0.0
			});
			break;
		case 2:
			g.outcome_text = new visual.TextStim({
				win: psychoJS.window,
				name: 'outcome_text',
				text: g.outcome_text_response,
				font: 'Arial',
				units: 'norm',
				pos: [
					g.faces_choice[2].pos[0],
					-0.33], height: 0.05, wrapWidth: undefined, ori: 0,
				color: new util.Color('white'), opacity: 1,
				depth: 0.0
			});
			break;
		case 3:
			g.outcome_text = new visual.TextStim({
				win: psychoJS.window,
				name: 'outcome_text',
				text: g.outcome_text_response,
				font: 'Arial',
				units: 'norm',
				pos: [
					g.faces_choice[3].pos[0],
					-0.33], height: 0.05, wrapWidth: undefined, ori: 0,
				color: new util.Color('white'), opacity: 1,
				depth: 0.0
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

			let theseKeys = ready.getKeys({ keyList: ['1', '2', '3'], waitRelease: false });
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
		if (trial_number != 1) continueRoutine = false // if not the firt trial, skip this routine
	
		// get current time
		t_end = endClock.getTime();
		
		if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
			points_fixation_stim.color = new util.Color('white')
			points_fixation_stim.setText('+')
			points_fixation_stim.setAutoDraw(true)
			console.log('Initial Fixation')

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
			
			endClock.reset()
			return Scheduler.Event.NEXT;
		}
	};
}

/**
 * Send Data over to the backend to save output data
 */
function sendData() {
	$.ajax({
        type: "POST",
        url: '/save',
		data: {
			"trials_data": trials_data,
			"expInfo": expInfo
		},
		dataType: 'JSON',
		success:function(data) {
			console.log(data)
		  }
    })
}

/**
 * Reset the choice counters
 * (Usuually done after each block)
 */
function reset_choice_counter(){
	g.choice_counter[1]['negative'] = 0;
	g.choice_counter[1]['positive'] = 0;
	g.choice_counter[1]['meaningless'] = 0;

	g.choice_counter[2]['negative'] = 0;
	g.choice_counter[2]['positive'] = 0;
	g.choice_counter[2]['meaningless'] = 0;

	g.choice_counter[3]['negative'] = 0;
	g.choice_counter[3]['positive'] = 0;
	g.choice_counter[3]['meaningless'] = 0;
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
		if (t <= 2) {
			return Scheduler.Event.FLIP_REPEAT;
		} else {
			resp.stop()
			resp.status = PsychoJS.Status.NOT_STARTED
			sendData()

			reset_choice_counter() // resetCounter

			// Clear Fixation
			points_fixation_stim.setAutoDraw(false)
			points_fixation_stim.status = PsychoJS.Status.NOT_STARTED

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
		sendData()

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
