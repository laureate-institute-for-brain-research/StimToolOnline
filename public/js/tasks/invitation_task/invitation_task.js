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
var g = {}					// global variables

////////////////////////////////////////////////////////////////////////////////
/////////////////////////////  CONFIGURATION    ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
g.FIXATION_DURATION = 1; 	/// fixation duration. in seconds
g.RESPONSE_DURATION = 1;	// duration for when the invitation response should show
g.OUTCOME_DURATION = 1.5; 	// outcome duration.
g.PLANNING_DURATION = 6;	// the planning phase duration.
g.SELCTION_DURATION = 1.5;	// the selection phase duration. (Time to enter moves)
g.ANIMATION_DURATION = 1.5;	// the duration of an animation 'slide'
g.MODULE_2A_OUTCOME_DUATION = 0.5; // the duration of the ooutcome for module 2a
g.LEFT_KEY = 'comma';			// the key to select the left door
g.RIGHT_KEY = 'period';			// the key to select the right door
g.LEFT_KEY_TEXT = '<';			// the text to show under the left door
g.RIGHT_KEY_TEXT = '>'; 		// the text to show under the right door.

// CONSTANCT for Trial Status
g.TRIAL_BEGIN = 0;			// for when trial beginning
g.WAITING_SELECTION = 1; 	// for waiting selection choice
g.WAITING_INVITE_KEY = 2;	// for waiting invitation key
g.RESPONSE_ANIMATION = 3;	// for response animation
g.PLANNING_PHASE = 4;		// for when subject needs to plan 
g.WAITING_KEY = 5;			// for when waiting for a key press

// the image path where key is the current position and the value is the path to the 
// room image.
// position 1 is when user is outisde selecting the building
g.path = {
	1: {
		'accepted': {
			'office': 0,
			'library': 0
		},
		'rejected': {
			'office': 0,
			'library': 0
		},
		'left': 2,
		'right': 3
	},
	2: {
		'accepted': {
			'office': 10,
			'library': 0
		},
		'rejected': {
			'office': 5,
			'library': 99
		},
		'left': 4,
		'right': 5
	},
	3: {
		'accepted': {
			'office': 5,
			'library': 5
		},
		'rejected': {
			'office': 0,
			'library': 5
		},
		'left': 6,
		'right': 7,
	},
	4: {
		'accepted': {
			'office': 5,
			'library': 5
		},
		'rejected': {
			'office': 5,
			'library': 0
		},
		'left': 8,
		'right': 9
	},
	5: {
		'accepted': {
			'office': 0,
			'library': 20
		},
		'rejected': {
			'office': 20,
			'library': 0
		},
		'left': 10,
		'right': 11
	},
	6: {
		'accepted': {
			'office': 5,
			'library': 10
		},
		'rejected': {
			'office': 0,
			'library': 0
		},
		'left': 12,
		'right': 13
	},
	7: {
		'accepted': {
			'office': 5,
			'library': 5
		},
		'rejected': {
			'office': 2,
			'library': 10
		},
		'left': 14,
		'right': 15
	},
	8: {
		'accepted': {
			'office': 0,
			'library': 5
		},
		'rejected': {
			'office': 10,
			'library': 0
		},
		'left': 0,
		'right': 0
	},
	9: {
		'accepted': {
			'office': 0,
			'library': 10
		},
		'rejected': {
			'office': 5,
			'library': 10
		},
		'left': 0,
		'right': 0
	},
	10: {
		'accepted': {
			'office': 10,
			'library': 0
		},
		'rejected': {
			'office': 0,
			'library': 2
		},
		'left': 0,
		'right': 0
	},
	11: {
		'accepted': {
			'office': 5,
			'library': 0
		},
		'rejected': {
			'office': 2,
			'library': 5
		},
		'left': 0,
		'right': 0
	},
	12: {
		'accepted': {
			'office': 5,
			'library': 5
		},
		'rejected': {
			'office': 0,
			'library': 0
		},
		'left': 0,
		'right': 0
	},
	13: {
		'accepted': {
			'office': 0,
			'library': 10
		},
		'rejected': {
			'office': 10,
			'library': 0
		},
		'left': 0,
		'right': 0
	},
	14: {
		'accepted': {
			'office': 0,
			'library': 20
		},
		'rejected': {
			'office': 5,
			'library': 0
		},
		'left': 0,
		'right': 0
	},
	15: {
		'accepted': {
			'office': 10,
			'library': 0
		},
		'rejected': {
			'office': 10,
			'library': 0
		},
		'left': 0,
		'right': 0
	}
}

// The trial schedule for module 2a
// using a variable instead of the schedule file since there's a potential for
// repeats.
// Each schedule is coded as:
// - current room
// - building
// - the correct door that should have been pressed.
g.module_2b_schedule = [
	[ 7,'library', g.path[g.path[7]['left']]['accepted']['library'], 'left' ],
	[ 7,'library', g.path[g.path[7]['right']]['accepted']['library'], 'right' ],
	[ 6,'library', g.path[g.path[6]['left']]['accepted']['library'], 'left' ],
	[ 6,'library', g.path[g.path[6]['right']]['accepted']['library'], 'right' ],
	[ 5,'library', g.path[g.path[5]['left']]['accepted']['library'], 'left' ],
	[ 5,'library', g.path[g.path[5]['right']]['accepted']['library'], 'right' ],
	[ 4,'library', g.path[g.path[4]['left']]['accepted']['library'], 'left' ],
	[ 4,'library', g.path[g.path[4]['right']]['accepted']['library'], 'right' ],
	[ 3,'library', g.path[g.path[3]['left']]['accepted']['library'], 'left' ],
	[ 3,'library', g.path[g.path[3]['right']]['accepted']['library'], 'right' ],
	[ 2,'library', g.path[g.path[2]['left']]['accepted']['library'], 'left' ],
	[ 2,'library', g.path[g.path[2]['right']]['accepted']['library'], 'right' ],
	[ 1,'library', g.path[g.path[1]['left']]['accepted']['library'], 'left' ],
	[ 1,'library', g.path[g.path[1]['right']]['accepted']['library'], 'right' ],
	[ 7,'office', g.path[g.path[7]['left']]['accepted']['office'], 'left' ],
	[ 7,'office', g.path[g.path[7]['right']]['accepted']['office'], 'right' ],
	[ 6,'office', g.path[g.path[6]['left']]['accepted']['office'], 'left' ],
	[ 6,'office', g.path[g.path[6]['right']]['accepted']['office'], 'right' ],
	[ 5,'office', g.path[g.path[5]['left']]['accepted']['office'], 'left' ],
	[ 5,'office', g.path[g.path[5]['right']]['accepted']['office'], 'right' ],
	[ 4,'office', g.path[g.path[4]['left']]['accepted']['library'], 'left' ],
	[ 4,'office', g.path[g.path[4]['right']]['accepted']['library'], 'right' ],
	[ 3,'office', g.path[g.path[3]['left']]['accepted']['office'], 'left' ],
	[ 3,'office', g.path[g.path[3]['right']]['accepted']['office'], 'right' ],
	[ 2,'office', g.path[g.path[2]['left']]['accepted']['office'], 'left' ],
	[ 2,'office', g.path[g.path[2]['right']]['accepted']['office'], 'right' ],
	[ 1,'office', g.path[g.path[1]['left']]['accepted']['office'], 'left' ],
	[ 1,'office', g.path[g.path[1]['right']]['accepted']['office'] , 'right']
]
g.module_2b_index = 0; // keep track of index

// mapping for the button options
g.option_map = {
	'a': 0,
	'b': 5,
	'c': 10,
	'd': 20
}

// Variable to hold the actual reponse
g.outcome_text_response = '';

// Text to show at the bottom of the screen during each trial
g.game_type_text = {
	'pleasant': `You will be shown the meaningless image unless the person you choose decides to help you.`,
	'unpleasant': `You will be shown the unpleasant image unless the person you choose decides to help you.`
}


 import { core, data, sound, util, visual } from '/psychojs/psychojs-2021.2.3.js';
 const { PsychoJS } = core;
 const { TrialHandler } = data;
 const { Scheduler } = util;
 //some handy aliases as in the psychopy scripts;
const { round } = util;
 
import { Sound } from '/lib/sound-2020.1.js';


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

			// shuffle module_2b schedule
			// g.module_2b_schedule.sort((a, b) => 0.5 - Math.random());
			
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
let expName = 'Invitation Task';  // from the Builder filename that created this script
var expInfo = { 'participant': '', 'session': '', 'run_id': '', 'date': formatDate(), 'study': '', };

// Add Slides to resources
var resources = [
	{ name: 'practice_schedule.csv', path: '/js/tasks/invitation_task/practice_schedule.csv' },
	{ name: 'PRACTICE_ready', path: '/js/tasks/invitation_task/media/instructions/Slide4.jpeg' },
	{ name: 'PRACTICE_ready_audio.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/Slide15.mp3'},
	{ name: 'MAIN_ready', path: '/js/tasks/invitation_task/media/instructions/Slide4.jpeg' },
	{ name: 'MAIN_ready_audio.mp3', path: '/js/tasks/cooperation_task/media/instructions_audio/Slide16.mp3'},
	{ name: 'BEGIN_slide', path: '/js/tasks/invitation_task/media/instructions/Slide4.jpeg' },
	{ name: 'library_1', path: '/js/tasks/invitation_task/media/game_slides/lib_1.jpeg' },
	{ name: 'library_2', path: '/js/tasks/invitation_task/media/game_slides/lib_2.jpeg' },
	{ name: 'library_3', path: '/js/tasks/invitation_task/media/game_slides/lib_3.jpeg' },
	{ name: 'library_4', path: '/js/tasks/invitation_task/media/game_slides/lib_4.jpeg' },
	{ name: 'library_5', path: '/js/tasks/invitation_task/media/game_slides/lib_5.jpeg' },
	{ name: 'library_6', path: '/js/tasks/invitation_task/media/game_slides/lib_6.jpeg' },
	{ name: 'library_7', path: '/js/tasks/invitation_task/media/game_slides/lib_7.jpeg' },
	{ name: 'library_8', path: '/js/tasks/invitation_task/media/game_slides/lib_8.jpeg' },
	{ name: 'library_9', path: '/js/tasks/invitation_task/media/game_slides/lib_9.jpeg' },
	{ name: 'library_10', path: '/js/tasks/invitation_task/media/game_slides/lib_10.jpeg' },
	{ name: 'library_11', path: '/js/tasks/invitation_task/media/game_slides/lib_11.jpeg' },
	{ name: 'library_12', path: '/js/tasks/invitation_task/media/game_slides/lib_12.jpeg' },
	{ name: 'library_13', path: '/js/tasks/invitation_task/media/game_slides/lib_13.jpeg' },
	{ name: 'library_14', path: '/js/tasks/invitation_task/media/game_slides/lib_14.jpeg' },
	{ name: 'library_15', path: '/js/tasks/invitation_task/media/game_slides/lib_15.jpeg' },
	{ name: 'library_invite_2', path: '/js/tasks/invitation_task/media/game_slides/lib_2_invite.jpeg' },
	{ name: 'library_invite_3', path: '/js/tasks/invitation_task/media/game_slides/lib_3_invite.jpeg' },
	{ name: 'library_invite_4', path: '/js/tasks/invitation_task/media/game_slides/lib_4_invite.jpeg' },
	{ name: 'library_invite_5', path: '/js/tasks/invitation_task/media/game_slides/lib_5_invite.jpeg' },
	{ name: 'library_invite_6', path: '/js/tasks/invitation_task/media/game_slides/lib_6_invite.jpeg' },
	{ name: 'library_invite_7', path: '/js/tasks/invitation_task/media/game_slides/lib_7_invite.jpeg' },
	{ name: 'library_invite_8', path: '/js/tasks/invitation_task/media/game_slides/lib_8_invite.jpeg' },
	{ name: 'library_invite_9', path: '/js/tasks/invitation_task/media/game_slides/lib_9_invite.jpeg' },
	{ name: 'library_invite_10', path: '/js/tasks/invitation_task/media/game_slides/lib_10_invite.jpeg' },
	{ name: 'library_invite_11', path: '/js/tasks/invitation_task/media/game_slides/lib_11_invite.jpeg' },
	{ name: 'library_invite_12', path: '/js/tasks/invitation_task/media/game_slides/lib_12_invite.jpeg' },
	{ name: 'library_invite_13', path: '/js/tasks/invitation_task/media/game_slides/lib_13_invite.jpeg' },
	{ name: 'library_invite_14', path: '/js/tasks/invitation_task/media/game_slides/lib_14_invite.jpeg' },
	{ name: 'library_invite_15', path: '/js/tasks/invitation_task/media/game_slides/lib_15_invite.jpeg' },
	{ name: 'office_1', path: '/js/tasks/invitation_task/media/game_slides/office_1.jpeg' },
	{ name: 'office_2', path: '/js/tasks/invitation_task/media/game_slides/office_2.jpeg' },
	{ name: 'office_3', path: '/js/tasks/invitation_task/media/game_slides/office_3.jpeg' },
	{ name: 'office_4', path: '/js/tasks/invitation_task/media/game_slides/office_4.jpeg' },
	{ name: 'office_5', path: '/js/tasks/invitation_task/media/game_slides/office_5.jpeg' },
	{ name: 'office_6', path: '/js/tasks/invitation_task/media/game_slides/office_6.jpeg' },
	{ name: 'office_7', path: '/js/tasks/invitation_task/media/game_slides/office_7.jpeg' },
	{ name: 'office_8', path: '/js/tasks/invitation_task/media/game_slides/office_8.jpeg' },
	{ name: 'office_9', path: '/js/tasks/invitation_task/media/game_slides/office_9.jpeg' },
	{ name: 'office_10', path: '/js/tasks/invitation_task/media/game_slides/office_10.jpeg' },
	{ name: 'office_11', path: '/js/tasks/invitation_task/media/game_slides/office_11.jpeg' },
	{ name: 'office_12', path: '/js/tasks/invitation_task/media/game_slides/office_12.jpeg' },
	{ name: 'office_13', path: '/js/tasks/invitation_task/media/game_slides/office_13.jpeg' },
	{ name: 'office_14', path: '/js/tasks/invitation_task/media/game_slides/office_14.jpeg' },
	{ name: 'office_15', path: '/js/tasks/invitation_task/media/game_slides/office_15.jpeg' },
	{ name: 'office_invite_2', path: '/js/tasks/invitation_task/media/game_slides/office_2_invite.jpeg' },
	{ name: 'office_invite_3', path: '/js/tasks/invitation_task/media/game_slides/office_3_invite.jpeg' },
	{ name: 'office_invite_4', path: '/js/tasks/invitation_task/media/game_slides/office_4_invite.jpeg' },
	{ name: 'office_invite_5', path: '/js/tasks/invitation_task/media/game_slides/office_5_invite.jpeg' },
	{ name: 'office_invite_6', path: '/js/tasks/invitation_task/media/game_slides/office_6_invite.jpeg' },
	{ name: 'office_invite_7', path: '/js/tasks/invitation_task/media/game_slides/office_7_invite.jpeg' },
	{ name: 'office_invite_8', path: '/js/tasks/invitation_task/media/game_slides/office_8_invite.jpeg' },
	{ name: 'office_invite_9', path: '/js/tasks/invitation_task/media/game_slides/office_9_invite.jpeg' },
	{ name: 'office_invite_10', path: '/js/tasks/invitation_task/media/game_slides/office_10_invite.jpeg' },
	{ name: 'office_invite_11', path: '/js/tasks/invitation_task/media/game_slides/office_11_invite.jpeg' },
	{ name: 'office_invite_12', path: '/js/tasks/invitation_task/media/game_slides/office_12_invite.jpeg' },
	{ name: 'office_invite_13', path: '/js/tasks/invitation_task/media/game_slides/office_13_invite.jpeg' },
	{ name: 'office_invite_14', path: '/js/tasks/invitation_task/media/game_slides/office_14_invite.jpeg' },
	{ name: 'office_invite_15', path: '/js/tasks/invitation_task/media/game_slides/office_15_invite.jpeg' },
	{ name: 'orange_door', path: '/js/tasks/invitation_task/media/images/orange_door.png' },
	{ name: 'blue_door', path: '/js/tasks/invitation_task/media/images/blue_door.png' },
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
// Pratice trials skipped over if it's a a PR run.
if (!getQueryVariable('skip_practice') && !getQueryVariable('run').includes('PR')  ) {
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


	g.left_choice_rectangle = new visual.Rect({
		win: psychoJS.window,
		name: 'left_choice_rectangle',
		width: 0.3, height:0.2,
		units: 'height',
		pos: [-0.33, 0 ], ori: 0,
		fillColor: new util.Color('black'),
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0
	})

	g.right_choice_rectangle = new visual.Rect({
		win: psychoJS.window,
		name: 'right_choice_rectangle',
		width: 0.3, height:0.2,
		units: 'height',
		pos: [0, 0 ], ori: 0,
		fillColor: new util.Color('black'),
		lineColor: new util.Color('white'), opacity: 1,
		depth: 0
	})

	// constants for room attributes
	g.ROOM_POS = [0, -0.05];
	g.ROOM_SIZE = [1.2, 0.7];


	g.room_image = new visual.ImageStim({
		win : psychoJS.window,
		name : 'room_image', units : 'height', 
		image : 'office_1', mask : undefined,
		ori : 0, pos : g.ROOM_POS, size: g.ROOM_SIZE,
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	g.room_image_invite = new visual.ImageStim({
		win : psychoJS.window,
		name : 'room_image_invite', units : 'height', 
		image : 'office_invite_2', mask : undefined,
		ori : 0, pos : g.ROOM_POS, size: g.ROOM_SIZE,
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	g.placement_pos = {
		'door': {
			'left': [ -0.55, 0],
			'right': [ 0.55, 0]
		},
		'door_text': {
			'left': [ -0.55, -0.15],
			'right': [ 0.55, -0.15]
		}
	}

	g.left_door = new visual.ImageStim({
		win : psychoJS.window,
		name : 'left_door', units : 'height', 
		image : 'orange_door', mask : undefined,
		ori : 0, pos : g.placement_pos['door']['left'], size: 0.15,
		color : new util.Color([1, 1, 1]), opacity : 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	g.right_door = new visual.ImageStim({
		win : psychoJS.window,
		name : 'right_door', units : 'height', 
		image : 'blue_door', mask : undefined,
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
		pos: [0.55, 0.88], height: 0.04, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_trial_number  = new visual.TextStim({
		win: psychoJS.window,
		name: 'trial_number',
		text: '1',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.85, 0.88], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.choice_number = 0;
	g.text_depth  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_depth',
		text: 'Depth:',alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [0.55, 0.80], height: 0.04, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_depth_number = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_val_depth_number',
		text: '0',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.85, 0.80], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.total_invites = 0; // variable for overal total invites
	g.trial_invites = 0; // variable for trial total invites
	g.text_invites  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_invites',
		text: 'Total Invites Accepted:',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.76, 0.82], height: 0.07, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_invites = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_val_invites',
		text: '0',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.85, 0.82], height: 0.07, wrapWidth: undefined, ori: 0,
		color: new util.Color('#90EE90'), opacity: 1,
		depth: 0.0
	});

	g.text_module  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_module',
		text: 'Module:',alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [0.55, 0.70], height: 0.04, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_module = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_val_module',
		text: '0',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.85, 0.70], height: 0.04, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_path  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_path',
		text: 'Path Position:',alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [0.55, 0.65], height: 0.04, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_path = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_val_path',
		text: '0',alignHoriz: 'right',
		font: 'Arial',
		units: 'norm',
		pos: [0.85, 0.65], height: 0.04, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_building  = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_building',
		text: 'Building:',alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [0.55, 0.60], height: 0.04, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.text_val_building = new visual.TextStim({
		win: psychoJS.window,
		name: 'text_val_building',
		text: '0',alignHoriz: 'center',
		font: 'Arial',
		units: 'norm',
		pos: [0, -0.85], height: 0.08, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.rooms_left_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'rooms_left',
		text: 'You have X moves.',alignHoriz: 'center',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0.70], height: 0.09, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.time_left_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'rooms_left',
		text: 'Xs',alignHoriz: 'center',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0.82], height: 0.1, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.prompt_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'prompt_text',
		text: 'Which room do you want to go next?',alignHoriz: 'center',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0.62], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.result_outcome = new visual.TextStim({
		win: psychoJS.window,
		name: 'module_2b_outcome',
		text: 'Correct',alignHoriz: 'center',
		font: 'Arial',
		units: 'norm',
		pos: [0, 0.78], height: 0.09, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.options_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'options_text',
		text: 'a = 0          b = 5          c = 10          d = 20',
		alignHoriz: 'center',font: 'Arial',units: 'norm',
		pos: [0, 0.67], height: 0.09, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.invites_text = new visual.TextStim({
		win: psychoJS.window,
		name: 'invites_text',
		text: "Total Accepted: XX\nTotal Rejected: XX",alignHoriz: 'left',
		font: 'Arial',
		units: 'norm',
		pos: [-0.13, 0.55], height: 0.06, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.choice_1 = new visual.TextStim({
		win: psychoJS.window,
		name: 'choice_1',
		text: g.LEFT_KEY_TEXT,alignHoriz: 'center',
		font: 'Arial',
		units: 'height',
		pos: [-0.55, -0.14], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.choice_2 = new visual.TextStim({
		win: psychoJS.window,
		name: 'choice_2',
		text: g.RIGHT_KEY_TEXT,alignHoriz: 'center',
		font: 'Arial',
		units: 'height',
		pos: [0.55, -0.14], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	g.points_fixation_stim = new visual.TextStim({
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
		pos: [0, 0], height: 0.12, wrapWidth: undefined, ori: 0,
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
	globalClock = new util.Clock();					// to track the time since experiment started
	routineTimer = new util.CountdownTimer();		// to track time remaining of each (non-slip) routine
	g.responseTimer = new util.CountdownTimer();	// to track time remaing for invite response duration
	g.outcomeTimer = new util.CountdownTimer();		// timer for when to go to next trial
	g.fixationTimer = new util.CountdownTimer();	// timer for fixation
	g.planningTimer = new util.CountdownTimer();	// timer for planning duration
	g.selectionTimer = new util.CountdownTimer();	// timer for entering moves phase
	g.animationTimer = new util.CountdownTimer();	// timer for animation.

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
		let theseKeys = resp.getKeys({ keyList: ['right'], waitRelease: false });
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
 * Generate the Module 2b schedule from schedule file
 * @param {*} trials 
 */
function generateModule2bSchedule(trials) {
	// g.module_2b_schedule = [
	// [ 7,'library', g.path[g.path[7]['left']]['accepted']['library'], 'left' ],
	// g.module_2b_schedule = []
	// iterate over trial list
	trials._trialList.forEach(trial => {
		// console.log(trial)
		let start = trial.start;
		let building_type = trial.building_type;
		let forced_choice = trial.forced_choice;
		// g.module_2b_schedule.push([
		// 	start, building_type, 
		// 	g.path[g.path[start][forced_choice]]['accepted'][building_type],
		// 	forced_choice
		// ])
	})
}

var trials;
var trial_type;
function practiceTrialsLoopBegin(thisScheduler) {
	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'practice_schedule.csv',
		seed: undefined, name: 'trials'
	});
	g.global_trial_number = 0;
	g.game_number = 1;

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	endClock.reset()
	resp.stop()
	resp.clearEvents()
	resp.status = PsychoJS.Status.NOT_STARTED
	// Schedule all the trials in the trialList:
	for (const thisBlock of trials) {
		const snapshot = trials.getSnapshot();
		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot)); 	// setup block
		thisScheduler.add(fixation(snapshot));				// fixation
		thisScheduler.add(runModule(snapshot));				// run MOdule
		thisScheduler.add(trialOutcome(snapshot));			// trial outcome
		thisScheduler.add(blockRoutineEnd(snapshot));		// end block
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	trial_type = 'PRACTICE'
	mark_event(trials_data, globalClock, 'NA', trial_type,
		event_types['BLOCK_ONSET'], 'NA', 'NA' , 'NA')
	return Scheduler.Event.NEXT;
}

/**
 * Trial routine begin
 * @param {*} thisScheduler 
 * @returns 
 */
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

	// make module 2b schedule
	generateModule2bSchedule(trials)

	g.global_trial_number = 0;
	g.game_number = 1;

	psychoJS.experiment.addLoop(trials); // add the loop to the experiment

	// Schedule all the trials in the trialList:
	for (const thisBlock of trials) {
		const snapshot = trials.getSnapshot();
		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(initialFixation(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot)); 	// setup block
		thisScheduler.add(fixation(snapshot));				// fixation
		thisScheduler.add(runModule(snapshot));				// run MOdule
		thisScheduler.add(trialOutcome(snapshot));			// trial outcome
		thisScheduler.add(blockRoutineEnd(snapshot));		// end block
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
	g.slideStim.setAutoDraw(false)
	psychoJS.experiment.removeLoop(trials);
	return Scheduler.Event.NEXT;
}

// StimImage Dictrionary for faces
g.faces_choice = {
	1: '',
	2: '',
	3: ''
}

/**
 * Function call to unset and clear the stims
 */
function clearStims() {
	g.left_choice_rectangle.setAutoDraw(false);
	g.left_choice_rectangle.status = PsychoJS.Status.NOT_STARTED;

	g.right_choice_rectangle.setAutoDraw(false);
	g.right_choice_rectangle.status = PsychoJS.Status.NOT_STARTED;

	g.room_image.setAutoDraw(false);
	g.room_image.status = PsychoJS.Status.NOT_STARTED;

	g.room_image_invite.setAutoDraw(false);
	g.room_image_invite.status = PsychoJS.Status.NOT_STARTED;

	g.prompt_text.setAutoDraw(false);
	g.prompt_text.status = PsychoJS.Status.NOT_STARTED;

	g.rooms_left_text.setAutoDraw(false);
	g.rooms_left_text.status = PsychoJS.Status.NOT_STARTED;

	g.time_left_text.setAutoDraw(false);
	g.time_left_text.status = PsychoJS.Status.NOT_STARTED;

	g.choice_1.setAutoDraw(false);
	g.choice_1.status = PsychoJS.Status.NOT_STARTED;

	g.choice_2.setAutoDraw(false);
	g.choice_2.status = PsychoJS.Status.NOT_STARTED;

	g.left_door.setAutoDraw(false);
	g.left_door.status = PsychoJS.Status.NOT_STARTED;

	g.right_door.setAutoDraw(false);
	g.right_door.status = PsychoJS.Status.NOT_STARTED;

	g.outcome_text.setAutoDraw(false);
	g.outcome_text.status = PsychoJS.Status.NOT_STARTED;

	g.points_fixation_stim.setAutoDraw(false);
	g.points_fixation_stim.status = PsychoJS.Status.NOT_STARTED;

	g.invites_text.setAutoDraw(false);
	g.invites_text.status = PsychoJS.Status.NOT_STARTED;

	g.result_outcome.setAutoDraw(false);
	g.result_outcome.status = PsychoJS.Status.NOT_STARTED;

	clearStatuStims();
}

/**
 * Function to clear the stims for the Trial Status
 * 
 */
function clearStatuStims() {
	g.text_trial_number.setAutoDraw(false);
	g.text_trial_number.status = PsychoJS.Status.NOT_STARTED;

	g.text_val_trial_number.setAutoDraw(false);
	g.text_val_trial_number.status = PsychoJS.Status.NOT_STARTED;

	g.text_depth.setAutoDraw(false);
	g.text_depth.status = PsychoJS.Status.NOT_STARTED;

	g.text_val_depth_number.setAutoDraw(false);
	g.text_val_depth_number.status = PsychoJS.Status.NOT_STARTED;

	g.text_module.setAutoDraw(false);
	g.text_module.status = PsychoJS.Status.NOT_STARTED;

	g.text_val_module.setAutoDraw(false);
	g.text_val_module.status = PsychoJS.Status.NOT_STARTED;

	g.text_invites.setAutoDraw(false);
	g.text_invites.status = PsychoJS.Status.NOT_STARTED;

	g.text_val_invites.setAutoDraw(false);
	g.text_val_invites.status = PsychoJS.Status.NOT_STARTED;

	g.text_path.setAutoDraw(false);
	g.text_path.status = PsychoJS.Status.NOT_STARTED;

	g.text_val_path.setAutoDraw(false);
	g.text_val_path.status = PsychoJS.Status.NOT_STARTED;

	g.text_building.setAutoDraw(false);
	g.text_building.status = PsychoJS.Status.NOT_STARTED;

	g.text_val_building.setAutoDraw(false);
	g.text_val_building.status = PsychoJS.Status.NOT_STARTED;
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

		g.trial_number = ( trial.trial_number + 1 );
		g.depth = trial.depth;
		g.current_path = trial.start;
		// console.log('TRIAL INFO: ',trial)
		
		// Status Stims
		// g.text_trial_number.setAutoDraw(true);
		g.text_val_trial_number.setText(
			'Trial ' + g.trial_number +
			' of ' + trial.nTotal);

		// g.text_depth.setAutoDraw(true);
		// g.text_val_depth_number.setText(trial.depth);
		// g.text_val_depth_number.setAutoDraw(true);

		g.text_val_invites.setText(g.total_invites);
		
	
		// g.text_module.setAutoDraw(true);
		// g.text_val_module.setText(trial.module);
		// g.text_val_module.setAutoDraw(true);

		// g.text_path.setAutoDraw(true);
		// g.text_val_path.setText(g.current_path);
		// g.text_val_path.setAutoDraw(true);

		// g.text_building.setAutoDraw(true);
		g.text_val_building.setText(trial.building_type);
		
		
		g.trial_invites = 0; // always start trial invites to 0

		g.current_move = 0; // reset move at 0

		g.prompt_text.setText('Where do you want to go next?');
		g.rooms_left_text.setText(`You have ${g.depth} moves`)
		
		g.outcome_text.color = 'white';
		
		g.room_image.setImage(trial.building_type + '_' + g.current_path)

		g.keyList = ['1', '2'];
		g.response = undefined;

		blockClock.reset(); // clock

		// set trial status
		g.trial_phase = g.TRIAL_BEGIN;

		mark_event(trials_data, globalClock, g.trial_number, trial_type, event_types['BLOCK_ONSET'],
				'NA', 'NA' , 'NA')
		return Scheduler.Event.NEXT;
	};
}

/**
 * Routine for Module 1
 * Rune the Module
 * - subject chooses door
 * - on next door, they are presented with a an 'option' to invite
 * @param {*} trial 
 * @returns 
 */
function module_1(trial) {
	return function () {
		// Make Selection
		// Show Doors if path = 1
		if (g.room_image.status == PsychoJS.Status.NOT_STARTED && g.trial_phase == g.TRIAL_BEGIN) {
			console.log(
				"Module: 1, Depth: ", g.depth,
				"Current Path: ", g.current_path,
				"Trial Invites: ", g.total_invites
			)
			if (g.current_move == 0) {
				g.room_image.setImage(trial.building_type + '_' + g.current_path);
				g.room_image.setAutoDraw(true);
			} else {
				g.room_image_invite.setImage(trial.building_type + '_invite_' + g.current_path)
				g.room_image_invite.setAutoDraw(true);
			}
			
			if (g.current_move == trial.depth) {
				// last room: Change Prompt and take them to the wait space key
				g.prompt_text.setText('Press SPACE key to exit the building.');
				g.trial_phase = g.WAITING_KEY;
			} else {
				g.rooms_left_text.setText(`You have ${g.depth} moves`)
				g.rooms_left_text.setAutoDraw(true);
				g.left_door.setAutoDraw(true);
				g.right_door.setAutoDraw(true);
				g.prompt_text.setText('Where do you want to go next?');
				
				// status stims
				g.text_val_trial_number.setAutoDraw(true);
				g.text_val_building.setAutoDraw(true);
				g.text_invites.setAutoDraw(true);
				g.text_val_invites.setAutoDraw(true);

				g.choice_1.setAutoDraw(true);
				g.choice_2.setAutoDraw(true);
		
				g.trial_phase = g.WAITING_SELECTION;
			}
			g.prompt_text.setAutoDraw(true);
			ready.clearEvents();
		}

		// Click Invite Button
		if (g.room_image_invite.status == PsychoJS.Status.NOT_STARTED && g.trial_phase == g.WAITING_INVITE_KEY) {
			// pressed invited button
			g.prompt_text.setText('Press to space key to invite.');
			g.prompt_text.setAutoDraw(true);
		}

		// Wait for Invite Key
		if (g.trial_phase == g.WAITING_INVITE_KEY && g.current_path > 1){
			let theseKeys = ready.getKeys({ keyList: ['space'], waitRelease: false });
			if (theseKeys.length > 0 ){
				if (theseKeys[0].name == 'space') {
					// prepare for next phase
					// clearStims();
					g.trial_phase = g.RESPONSE_ANIMATION;
				}
			}
		}

		// Waiting to to next trial
		if (g.trial_phase == g.WAITING_KEY) {
			let theseKeys = ready.getKeys({ keyList: ['space'], waitRelease: false });
			if (theseKeys.length >0 ){
				if (theseKeys[0].name == 'space') {
					// total invites
					g.total_invites = g.total_invites + g.trial_invites;
					// prepare for next phase
					g.outcome_text.setText(`Trial Total Invites: ${g.trial_invites}`)
					clearStims();
					return Scheduler.Event.NEXT;
				}
			}
		}

		// Show the Invitation Response
		if (g.room_image_invite.status == PsychoJS.Status.NOT_STARTED && g.trial_phase == g.RESPONSE_ANIMATION) {
			g.room_image_invite.setImage(trial.building_type + '_invite_' + g.current_path)
			g.room_image_invite.setAutoDraw(true);

			// set accpeted/rejected invites text
			g.accepted_invites = g.path[g.current_path]['accepted'][trial.building_type];
			g.rejected_invites = g.path[g.current_path]['rejected'][trial.building_type];
			// g.invites_text.setText(`Total Accepted: ${g.accepted_invites}\nTotal Rejected: ${g.rejected_invites}`);
			// g.invites_text.setAutoDraw(true);
			g.responseTimer.reset(g.RESPONSE_DURATION); // start timer

			g.text_val_invites.setText('Total Invites: ' + g.total_invites);
		}

		if (g.trial_phase == g.RESPONSE_ANIMATION && g.responseTimer.getTime() <= 0) {
			// clearStims();
			// go back to trial begin
			
			
			// next current path 
			g.depth--;
			g.room_image.setImage(trial.building_type + '_' + g.current_path);
			g.room_image.setAutoDraw(true);

			g.prompt_text.setText('Where do you want to go next?');
			g.prompt_text.setAutoDraw(true);
			g.left_door.setAutoDraw(true);
			g.right_door.setAutoDraw(true);

			g.choice_1.setAutoDraw(true);
			g.choice_2.setAutoDraw(true);
			g.trial_phase = g.WAITING_SELECTION;

			// if ( g.depth < 0 || g.current_path >= 8) {
			// 	// move to next routine if reached max depth
			// 	// or of the current path is 0 (when there is no more rooms)
			// 	// trial routine depth is no 0. Move to next trial
			// 	clearStims()
			// 	return Scheduler.Event.NEXT;
			// }
		}

		// WAITING SELECTION
		// as subject where they want to go next
		if (g.trial_phase == g.WAITING_SELECTION) {
			let theseKeys = ready.getKeys({ keyList: [g.LEFT_KEY, g.RIGHT_KEY], waitRelease: false });
			if (theseKeys.length > 0) {

				if (theseKeys[0].name == g.LEFT_KEY) { g.response = 'left'; }
				if (theseKeys[0].name == g.RIGHT_KEY) { g.response = 'right'; }

				
				clearStims();
				g.current_path = g.path[g.current_path][g.response];
				g.accepted_invites = g.path[g.current_path]['accepted'][trial.building_type];

				// increment trial invites
				// based ond current position and the building type
				g.trial_invites = g.trial_invites + g.accepted_invites;
				
				g.depth--; 		  // decremente depth
				g.current_move++; // increment move
				// prepare for next phase
				g.trial_phase = g.TRIAL_BEGIN;

				// if ( g.depth < 0 || g.current_path >= 8) {
				// 	// move to next routine if reached max depth
				// 	// or of the current path is 0 (when there is no more rooms)
				// 	// trial routine depth is no 0. Move to next trial
				// 	clearStims();
				// 	return Scheduler.Event.NEXT;
				// }
			}
		}

		return Scheduler.Event.FLIP_REPEAT
	}
}

/**
 * Module 2a:
 * - Forced Choice.
 * - Schedule in schedule file. Iterage over each room 2x
 * @param {*} trial 
 * @returns 
 */
function module_2a(trial) {
	return function () {
		if ( (g.trial_phase == g.TRIAL_BEGIN) && (g.depth <= 0 || g.current_path >= 8)) {
			// move to next routine if reached max depth
			// or of the current path is 0 (when there is no more rooms)
			// trial routine depth is no 0. Move to next trial
			clearStims();
			return Scheduler.Event.NEXT;
		}

		// Make Selection
		// Show Doors if path = 1
		if (g.room_image.status == PsychoJS.Status.NOT_STARTED && g.trial_phase == g.TRIAL_BEGIN) {
			// console.log('Module 2', g.current_path)
			g.room_image.setImage(trial.building_type + '_' + g.current_path);
			g.room_image.setAutoDraw(true);
			
			
			if (trial.forced_choice == 'L') {
				g.left_door.setAutoDraw(true);
				g.choice_1.setAutoDraw(true);
				g.prompt_text.setText('Please choose the LEFT room.');
			}

			if (trial.forced_choice == 'R') {
				g.right_door.setAutoDraw(true);
				g.choice_2.setAutoDraw(true);
				g.prompt_text.setText('Please choose the RIGHT room.');
			}

			g.prompt_text.setAutoDraw(true);
			g.text_val_building.setAutoDraw(true);
			ready.clearEvents();
			g.trial_phase = g.WAITING_SELECTION;
		}

		if (g.trial_phase == g.WAITING_SELECTION) {
			let theseKeys = ready.getKeys({ keyList: [g.LEFT_KEY, g.RIGHT_KEY], waitRelease: false });
			if (theseKeys.length > 0) {
				// increment trial invites
				// based ond current position and the building type
				g.accepted_invites = g.path[g.current_path]['accepted'][trial.building_type];
				g.rejected_invites = g.path[g.current_path]['rejected'][trial.building_type];
				g.trial_invites = g.trial_invites + g.accepted_invites;
				
				// total invites
				g.total_invites = g.total_invites + g.accepted_invites;

				if (theseKeys[0].name == g.LEFT_KEY) { g.response = 'left'; }
				if (theseKeys[0].name == g.RIGHT_KEY) { g.response = 'right';}
				g.depth--;
				clearStims();
				g.current_path = g.path[g.current_path][g.response];

				// prepare for next phase
				g.trial_phase = g.RESPONSE_ANIMATION

			}
		}

		// Click Invite Button
		// if (g.room_image_invite.status == PsychoJS.Status.NOT_STARTED && g.trial_phase == g.WAITING_INVITE_KEY) {
		// 	// pressed invited button
		// 	g.prompt_text.setText('Press to space key to invite.');
		// 	g.prompt_text.setAutoDraw(true);
		// 	g.room_image.setImage(trial.building_type + '_' + g.current_path);
		// 	g.room_image.setAutoDraw(true);
			
		// }

		// if (g.trial_phase == g.WAITING_INVITE_KEY && g.current_path > 1){
		// 	let theseKeys = ready.getKeys({ keyList: ['space'], waitRelease: false });
		// 	if (theseKeys.length >0 ){
		// 		if (theseKeys[0].name == 'space') {
		// 			// prepare for next phase
		// 			clearStims();
		// 			g.trial_phase = g.RESPONSE_ANIMATION;
		// 		}
		// 	}
		// }

		// Show the Invitation Response
		if (g.room_image_invite.status == PsychoJS.Status.NOT_STARTED && g.trial_phase == g.RESPONSE_ANIMATION) {
			g.room_image_invite.setImage(trial.building_type + '_invite_' + g.current_path)
			g.room_image_invite.setAutoDraw(true);
			g.prompt_text.setText('Press SPACE key to exit the building.');
			g.prompt_text.setAutoDraw(true);
			g.text_val_building.setAutoDraw(true);
			g.trial_phase = g.WAITING_KEY;
			// g.responseTimer.reset(g.RESPONSE_DURATION); // start timer
		}

		if (g.trial_phase == g.WAITING_KEY) {
			let theseKeys = ready.getKeys({ keyList: ['space'], waitRelease: false });
			if (theseKeys.length >0 ){
				if (theseKeys[0].name == 'space') {
					// prepare for next phase
					clearStims();
					return Scheduler.Event.NEXT;
				}
			}
		}

		// if (g.trial_phase == g.RESPONSE_ANIMATION && g.responseTimer.getTime() <= 0) {
		// 	clearStims();
		// 	// go back to trial begin
		// 	g.outcome_text.setText(`Trial Total Invites: ${g.trial_invites}`)
		// 	g.trial_phase = g.TRIAL_BEGIN;
		// 	// next current path 
			
		// 	// return Scheduler.Event.NEXT;
		// }
		return Scheduler.Event.FLIP_REPEAT
	}
}

/**
 * Module 2b:
 * - Each room shown 2x.
 * - Repeat room if they get it wrong.
 * - Need to have at least each room 2x in a row
 * @param {*} trial 
 * @returns 
 */
function module_2b(trial) {
	return function () {
		if ( (g.trial_phase == g.TRIAL_BEGIN) && (g.depth <= 0 || g.current_path >= 8)) {
			// move to next routine if reached max depth
			// or of the current path is 0 (when there is no more rooms)
			// trial routine depth is no 0. Move to next trial
			clearStims();
			return Scheduler.Event.NEXT;
		}

		// Make Selection
		// Show Doors if path = 1
		if (g.room_image.status == PsychoJS.Status.NOT_STARTED && g.trial_phase == g.TRIAL_BEGIN) {
			// console.log('Module 2', g.current_path)
			// current path is from the module 2a schedule
			g.current_path = g.module_2b_schedule[g.module_2b_index][0];
			g.building_type = g.module_2b_schedule[g.module_2b_index][1];
			g.forced_choice = g.module_2b_schedule[g.module_2b_index][3];
			// g.room_image.size = [1.2, 0.7];
			// g.room_image.pos = [0, -0.09];
			g.room_image.setImage(g.building_type + '_' + g.current_path);
			g.room_image.setAutoDraw(true);

			g.options_text.setAutoDraw(true);

			if (g.forced_choice == 'left') {
				g.left_door.setAutoDraw(true);
				g.choice_1.setAutoDraw(true);
			}
			if (g.forced_choice == 'right') {
				g.right_door.setAutoDraw(true);
				g.choice_2.setAutoDraw(true);
			}
			
			// g.rooms_left_text.setText(`You have ${g.depth} moves`)
			// g.rooms_left_text.setAutoDraw(true);
			g.prompt_text.pos = [0,0.88]
			g.prompt_text.setText('How many YES will you recieve in the next room?');
			g.prompt_text.setAutoDraw(true);

			g.text_val_building.setText(g.building_type);
			g.text_val_building.setAutoDraw(true);
			ready.clearEvents();
			g.trial_phase = g.WAITING_SELECTION;
		}

		if (g.trial_phase == g.WAITING_SELECTION) {
			let theseKeys = ready.getKeys({ keyList: [ 'a','b','c','d'], waitRelease: false });
			if (theseKeys.length > 0) {
				// increment trial invites
				// based ond current position and the building type
				g.accepted_invites = g.path[g.current_path]['accepted'][trial.building_type];
				g.rejected_invites = g.path[g.current_path]['rejected'][trial.building_type];
				g.trial_invites = g.trial_invites + g.accepted_invites;
				
				// total invites
				g.total_invites = g.total_invites + g.accepted_invites;
				g.response = theseKeys[0].name;
				g.correct_yes = g.option_map[g.response];
				g.prompt_text.setAutoDraw(false);

				// console.log(g.response, g.correct_yes, g.module_2b_schedule[g.module_2b_index][2])

				// append the current tral to the schedule if they choose the wrong door
				if (g.module_2b_schedule[g.module_2b_index][2] != g.correct_yes) {
					// incorrect choice
					g.module_2b_schedule.push(g.module_2b_schedule[g.module_2b_index]);
					g.result_outcome.setText('INCORRECT');
					g.result_outcome.color = 'red';
					g.result = 'incorrect';
				} else {
					// correct
					g.result_outcome.setText('CORRECT');
					g.result_outcome.color = 'green';
					g.module_2b_index++;
					g.result = 'correct';
				}
				
				g.result_outcome.setAutoDraw(true);
				g.invite_path = g.path[g.current_path][g.forced_choice];
				//clearStims();
				
				// prepare for next phase
				g.trial_phase = g.OUTCOME_PHASE
				// start timer
				g.outcomeTimer.reset(g.MODULE_2A_OUTCOME_DUATION); // reset the time with ITI 

			}
		}

		// result outcome
		// show this for 500ms
		if (g.trial_phase == g.OUTCOME_PHASE && g.outcomeTimer.getTime() < 0) {
			// go to next trial
			g.prompt_text.color = 'white';
			clearStims();
			g.result_outcome.setAutoDraw(true);
			g.trial_phase = g.RESPONSE_ANIMATION;
		}

		// Show the Invitation Response
		if (g.room_image_invite.status == PsychoJS.Status.NOT_STARTED && g.trial_phase == g.RESPONSE_ANIMATION) {
			
			g.room_image_invite.setImage(g.building_type + '_invite_' + g.invite_path)
			g.room_image_invite.setAutoDraw(true);
			if (g.module_2b_index == g.module_2b_schedule.length) {
				// last trial
				g.prompt_text.setText('Press SPACE key to exit the building.');
			} else {
				g.prompt_text.setText('Press SPACE key to go to next trial.');
			}
			g.prompt_text.setAutoDraw(true);
			g.text_val_building.setAutoDraw(true);
			g.trial_phase = g.WAITING_KEY;
			// g.responseTimer.reset(g.RESPONSE_DURATION); // start timer
		}

		if (g.trial_phase == g.WAITING_KEY) {
			let theseKeys = ready.getKeys({ keyList: ['space'], waitRelease: false });
			if (theseKeys.length >0 ){
				if (theseKeys[0].name == 'space') {
					// prepare for next phase
					clearStims();
					if (g.module_2b_index >= g.module_2b_schedule.length) {
						// last trial
						g.prompt_text.setText('Press SPACE key to exit the building.');
						return Scheduler.Event.NEXT;
					} else {
						g.prompt_text.setText('Press SPACE key to go to next trial.');
						g.trial_phase = g.TRIAL_BEGIN;
					}
				}
			}
		}

		return Scheduler.Event.FLIP_REPEAT
	}
}

/**
 * Module 3:
 * 	Like Module 1 but with time limit.
 * @param {*} trial 
 * @returns 
 */
function module_3(trial) {
	return function () {
		// Make Selection
		if (g.room_image.status == PsychoJS.Status.NOT_STARTED && g.trial_phase == g.TRIAL_BEGIN) {
			console.log('CURRENT DEPTH: ', g.depth)
			g.room_image.setImage(trial.building_type + '_' + g.current_path);
			g.room_image.setAutoDraw(true);

			g.prompt_text.pos = [0, 0.62];

			g.prompt_text.setAutoDraw(true);
			g.prompt_text.setText('Please plan your moves now.');

			g.rooms_left_text.setText(`You have ${g.depth} moves`)
			g.rooms_left_text.setAutoDraw(true);

			g.time_left_text.setText('9s');
			g.time_left_text.setAutoDraw(true);

			g.trial_phase = g.PLANNING_PHASE;
			g.planningTimer.reset(g.PLANNING_DURATION);
			g.moves_entered = [];
			g.current_path = trial.start;			// start iterative over entered moves
		}

		// Planning Phase
		if (g.trial_phase == g.PLANNING_PHASE) {
			// update the text each frame
			g.time_left_text.setText(`${Math.ceil(g.planningTimer.getTime())}s`)

			if (g.planningTimer.getTime() <= 0) {
				// go to next phase
				g.prompt_text.setText(`Enter moves now (${g.SELCTION_DURATION})s`);
				
				ready.clearEvents();
				g.trial_phase = g.WAITING_SELECTION;
				g.selectionTimer.reset(g.SELCTION_DURATION);

				g.left_door.setAutoDraw(true);
				g.right_door.setAutoDraw(true);

				g.choice_1.setAutoDraw(true);
				g.choice_2.setAutoDraw(true);
				
			} 
		}

		// Entering Moves Phase
		if (g.trial_phase == g.WAITING_SELECTION) {
			g.prompt_text.setText(`Enter your moves (${Math.ceil(g.selectionTimer.getTime())})s`);
			if (g.depth <= 0) {
				g.rooms_left_text.setText(`no moves left.`)
			} else {
				g.rooms_left_text.setText(`You have ${g.depth} moves`)
			}

			if (g.selectionTimer.getTime() <= 0) {
				// go to next phase.
				if (g.moves_entered.length == trial.depth) {
					// all moves entered
					// go to animation
					console.log('Moves Entered: ', g.moves_entered.length, ' Trial Depth:',trial.depth)
					g.trial_phase = g.RESPONSE_ANIMATION;
					g.responseTimer.reset(2);
					clearStims();
					
				} else {
					// subject did not enter enough moves
					clearStims();
					g.outcome_text.color = 'red';
					g.outcome_text.setText(`Times Up!`)
					g.trial_phase = g.INVALID_TRIAL;
				}
			}

			// allow moves to be entered for the trial depth value
			if (g.moves_entered.length < trial.depth) {
				// can still enter moves and within time limit
				let theseKeys = ready.getKeys({ keyList: [g.LEFT_KEY, g.RIGHT_KEY], waitRelease: false });
				if (theseKeys.length > 0) {
					

					if (theseKeys[0].name == g.LEFT_KEY) { g.response = 'left'; }
					if (theseKeys[0].name == g.RIGHT_KEY) { g.response = 'right'; }
					
					g.current_path = g.path[g.current_path][g.response];
					// increment trial invites
					g.accepted_invites = g.path[g.current_path]['accepted'][trial.building_type];
					
					// based ond current position and the building type
					g.trial_invites = g.trial_invites + g.accepted_invites;
					
					// total invites
					g.total_invites = g.total_invites + g.accepted_invites;
					
					g.depth--;
					g.moves_entered.push(g.response);
				}
			}
		}

		// Animation Phase
		if (g.trial_phase == g.RESPONSE_ANIMATION) {
			if (g.outcome_text.status == PsychoJS.Status.NOT_STARTED) {
				g.outcome_text.setText(`Animation Goes here`)
				g.outcome_text.setAutoDraw(true);
				g.animationTimer.reset(g.ANIMATION_DURATION);
				g.current_move = 0;			// start iterative over entered moves
				g.current_path = trial.start;
				g.current_path = g.path[g.current_path][g.moves_entered[g.current_move]];
				g.room_image_invite.setImage(trial.building_type + '_invite_' + g.current_path)
				g.room_image_invite.setAutoDraw(true);

				// display accepted/rejected amounts
				g.accepted_invites = g.path[g.current_path]['accepted'][trial.building_type];
				g.rejected_invites = g.path[g.current_path]['rejected'][trial.building_type];
				// g.invites_text.setText(`Total Accepted: ${g.accepted_invites}\nTotal Rejected: ${g.rejected_invites}`);
				// g.invites_text.setAutoDraw(true);
			}

			// Single Invite Room Instance
			if (g.animationTimer.getTime() <= 0) {

				// check if there moves left
				if (g.current_move == (g.moves_entered.length - 1)) {
					// out of moves - go to next routine
					clearStims();
					return Scheduler.Event.NEXT
				}

				// reset the slides
				g.current_move++;
				g.current_path = g.path[g.current_path][g.moves_entered[g.current_move]];
				g.room_image_invite.setImage(trial.building_type + '_invite_' + g.current_path)
				// display accepted/rejected amounts
				g.accepted_invites = g.path[g.current_path]['accepted'][trial.building_type];
				g.rejected_invites = g.path[g.current_path]['rejected'][trial.building_type];
				g.invites_text.setText(`Total Accepted: ${g.accepted_invites}\nTotal Rejected: ${g.rejected_invites}`);

				g.animationTimer.reset(g.ANIMATION_DURATION); // reset timer
			}
		}

		// Inavlid Trial
		// just display 'Times UP'
		if (g.trial_phase == g.INVALID_TRIAL) {
			if (g.outcome_text.status == PsychoJS.Status.NOT_STARTED) {
				console.log('Invalid trial', g.ANIMATION_DURATION)
				g.outcome_text.setAutoDraw(true);
				g.animationTimer.reset(g.ANIMATION_DURATION)
				g.trial_invites = 0; // no points for the trial
			}

			if (g.animationTimer.getTime() <= 0) {
				// after it displays the Times Up for g.ANIMATION_DURATION seconds
				// go to next trial
				clearStims();
				return Scheduler.Event.NEXT
			}
		}
		return Scheduler.Event.FLIP_REPEAT
	}
}

/**
 * Fixation Routine.
 * Duration of the Fixation is dependent on the ITI schedule file.
 * @param {*} trial 
 * @returns 
 */
function fixation(trial) {
	return function () {
		if (g.points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
			g.points_fixation_stim.setAutoDraw(true);
			// start time
			g.fixationTimer.reset(trial.ITI);
		}

		if (g.fixationTimer.getTime() <= 0) {
			clearStims();
			return Scheduler.Event.NEXT
		}
		return Scheduler.Event.FLIP_REPEAT
	}
}

/**
 * Run the Routine based of module 
 * @param {*} trial 
 * @returns 
 */
function runModule(trial) {
	switch (trial.module) {
		case 1: return module_1(trial)
		case '2a': return module_2a(trial)
		case '2b': return module_2b(trial)
		case 3: return module_3(trial)
	}
}

/**
 * Outcome phase of the trial
 * - usually show the total invitations, etc..
 * duration of ITI set here.
 * @param {*} trial 
 * @returns 
 */
function trialOutcome(trial) {
	return function () {
		if (trial.module == 2 || trial.module == '2a') {
			// module 2 doesn't need to show the total invites
			return Scheduler.Event.NEXT;
		}
		if (g.outcome_text.status == PsychoJS.Status.NOT_STARTED) {
			g.outcome_text.color = 'white';
			g.outcome_text.setText(`Overall Invites Accepted: ${g.trial_invites}`)
			g.outcomeTimer.reset(g.OUTCOME_DURATION); // reset the time with ITI 
			g.outcome_text.setAutoDraw(true);

			g.prompt_text.setText('Press to space key to go to the next trial.');
			g.prompt_text.setAutoDraw(true);
		}

		// Wait for space key press to go to next trial
		let theseKeys = ready.getKeys({ keyList: ['space'], waitRelease: false });
			if (theseKeys.length > 0 ){
				if (theseKeys[0].name == 'space') {
					// prepare for next phase
					clearStims();
					return Scheduler.Event.NEXT;
				}
			}

		// if (g.outcomeTimer.getTime() <= 0) {
		// 	clearStims();
		// 	return Scheduler.Event.NEXT;
		// }
		return Scheduler.Event.FLIP_REPEAT;
	}
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
		
		if (g.points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
			g.points_fixation_stim.color = new util.Color('white')
			g.points_fixation_stim.setText('+')
			g.points_fixation_stim.setAutoDraw(true)

			mark_event(trials_data, globalClock, 'NA', trial_type, event_types['FIXATION_ONSET'],
				'NA', 'NA' , 'NA')
		}

		if (t_end >= 3) {
			continueRoutine = false
			g.points_fixation_stim.setAutoDraw(false)
			g.points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
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
			g.points_fixation_stim.setAutoDraw(false)
			g.points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
			
			endClock.reset();

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
			sendData();

			clearStims();

			// Clear Fixation
			g.points_fixation_stim.setAutoDraw(false)
			g.points_fixation_stim.status = PsychoJS.Status.NOT_STARTED

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
		thanksText.setText(`This is the end of the task run.\n\n\n Total Invites Accepted: ${g.total_invites}`)
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
