/**
 * Social Media Task
 * A modified Horizon Task
 * @author James Touthang <james@touthang.info>
 */

 var event_types = {
	'INSTRUCT_ONSET': 1,
	'TASK_ONSET': 2,
	'AUDIO_ONSET': 3,
	'FIXATION_ONSET': 4,
	'CHATROOM_ONSET': 5,
	'POST_ONSET': 6,
	'RESPONSE': 7,
	'CHOICE_ONSET': 8,
	'BLOCK_ONSET': 9,
	'ANIMATION_ONSET': 10,
	'SCORE': 11
}

var trials_data = []

import { core, data, sound, util, visual } from '/psychojs/psychojs-2021.2.3.js';
const { PsychoJS } = core;
const { TrialHandler } = data;
const { Scheduler } = util;
//some handy aliases as in the psychopy scripts;
const { abs, sin, cos, PI: pi, sqrt } = Math;
const { round } = util;


// import { PsychoJS } from '/lib/core-2020.1.js';
// import * as core from '/lib/core-2020.1.js';
// import { TrialHandler } from '/lib/data-2020.1.js';
// import { Scheduler } from '/lib/util-2020.1.js';
// import * as util from '/lib/util-2020.1.js';
// import * as visual from '/lib/visual-2020.1.js';
import { Sound } from '/lib/sound-2020.1.js';

var practice = false;
var LEFT_KEY = 'comma'
var RIGHT_KEY = 'period'


// init psychoJS:
const psychoJS = new PsychoJS({
	debug: false,
});


var tweets;

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
					url: '/js/tasks/social_media/' + getQueryVariable('run'),
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
			resources.push({ name: 'run_schedule.xls', path: values.schedule })
			resources.push({ name: 'instruct_schedule.csv', path: values.instruct_schedule })

			resources.push({ name: 'roleReversal_instruct_schedule.csv', path: "role_reversal_instruct_schedule.csv" })

			// Add file paths to expInfo
			if (values.schedule) expInfo.task_schedule = values.schedule
			if (values.instruct_schedule) expInfo.instruct_schedule = values.instruct_schedule
			
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
								obj[headerRows[j]] = currentLine[j];
							}
							out.push(obj);
							resources.push({ name: obj.instruct_slide, path: obj.instruct_slide })

							if (obj.audio_path){
								resources.push({ name: obj.audio_path, path: obj.audio_path })
							}
						}
						console.log(resources)
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

			
			return new Promise((resolve, reject) => {
				$.ajax({
					type: 'GET',
					url: '/js/tasks/social_media/media/role_reversal_instruct_schedule.csv',
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
							out.push(obj);
							resources.push({ name: obj.instruct_slide, path: obj.instruct_slide })

							if (obj.audio_path){
								resources.push({ name: obj.audio_path, path: obj.audio_path })
							}
							
						}
						console.log(resources)

						resolve(data)
					}
				})
				
			})
		})

		// Get the Tweets from the json file
		.then(() => {
			return new Promise((resolve, reject) => {
				console.log('getting tweets..')
				$.getJSON('/js/tasks/social_media/tweets/tweets.json', function (data) {
					// console.log(data)
					tweets = data
					resolve(data)
				})
				
			})
		})
	
		.then(()=>{
			psychoJS.start({
				expName, 
				expInfo,
				resources: resources,
			  })
			psychoJS._config.experiment.saveFormat = undefined // don't save to client side
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
	fullscr: false, // (window.location.hostname != 'localhost'), // not full screen at localhost,
	color: new util.Color('black'),
	units: 'height',
	waitBlanking: true
})
	
// store info about the experiment session:
let expName = 'Social Media Task';  // from the Builder filename that created this script
var expInfo = { 'participant': '' ,'session': '',  'run_id': '', 'date' : formatDate(), 'study': '', };

psychoJS.schedule(psychoJS._gui.DlgFromDict({
	dictionary: expInfo,
	title: expName
}))



const flowScheduler = new Scheduler(psychoJS);
const dialogCancelScheduler = new Scheduler(psychoJS);
psychoJS.scheduleCondition(function () { return (psychoJS.gui.dialogComponent.button === 'OK'); }, flowScheduler, dialogCancelScheduler);

// BEGIN BLOCK
// flowScheduler gets run if the participants presses OK
flowScheduler.add(updateInfo); // add timeStamp
flowScheduler.add(experimentInit);

// instruction slide

// INSTRUCTION BLOCK
if (!getQueryVariable('skip_instructions')) {
	const instruct_pagesLoopScheduler = new Scheduler(psychoJS);
	flowScheduler.add(instruct_pagesLoopBegin, instruct_pagesLoopScheduler);
	flowScheduler.add(instruct_pagesLoopScheduler);
	flowScheduler.add(instruct_pagesLoopEnd);
}


// EXAMPLE PLAY BLOCK
if (getQueryVariable('run').includes('R1') && !getQueryVariable('skip_exampleplay')  ){
	const example_playScheduler = new Scheduler(psychoJS);
	flowScheduler.add(trials_exampleLoopBegin, example_playScheduler);
	flowScheduler.add(example_playScheduler);
	flowScheduler.add(trialsLoopEnd);
}

// ROLE REVERSAL BLOCK

if (!getQueryVariable('skip_roleReversal')) {
	// Instruction for the Role Traversal Slide(s)
	const instruct_pagesLoopScheduler = new Scheduler(psychoJS);
	flowScheduler.add(instruct_pages_roleReversal_LoopBegin, instruct_pagesLoopScheduler);
	flowScheduler.add(instruct_pagesLoopScheduler);
	flowScheduler.add(instruct_pagesLoopEnd);

	// ROLE REVERSAL TRIAL BLOCK
	const roleReversalScheduler = new Scheduler(psychoJS);
	flowScheduler.add(trials_role_reversalBegin, roleReversalScheduler);
	flowScheduler.add(roleReversalScheduler);
	flowScheduler.add(trialsLoopEnd);
}

if (!getQueryVariable('skip_main')) {
	// MAIN BLOCK - Instrcutions
	flowScheduler.add(readyRoutineBegin());
	flowScheduler.add(readyRoutineEachFrame());
	flowScheduler.add(readyRoutineEnd());

	// MAIN BLOCK
	const trialsLoopScheduler = new Scheduler(psychoJS);
	flowScheduler.add(trialsLoopBegin, trialsLoopScheduler);
	flowScheduler.add(trialsLoopScheduler);
	flowScheduler.add(trialsLoopEnd);
	}


// END BLOCK
flowScheduler.add(thanksRoutineBegin());
flowScheduler.add(thanksRoutineEachFrame());
flowScheduler.add(thanksRoutineEnd());
flowScheduler.add(quitPsychoJS, '', true);

// quit if user presses Cancel in dialog box:
dialogCancelScheduler.add(quitPsychoJS, '', false);


// Add Slides to resources
var resources = [
	{ name: 'example_play.xls', path: '/js/tasks/social_media/example_play.xls' },
	{ name: 'role_reversal_shedule.xls', path:'/js/tasks/social_media/role_reversal_shedule.xls' },
	{ name: 'ready.jpeg', path: '/js/tasks/social_media/media/instructions/Slide35.jpeg' },
	{ name: 'ready.mp3', path: '/js/tasks/social_media/media/instructions_audio/Slide35.mp3'},
	{ name: 'role_reversal_instruct_schedule.csv', path: '/js/tasks/social_media/media/role_reversal_instruct_schedule.csv'},
	{ name: 'logo.png', path: '/js/tasks/social_media/media/body-organ.png' },
	{ name: 'home.png', path: '/js/tasks/social_media/media/home.png' },
	{ name: 'hashtag.png', path: '/js/tasks/social_media/media/hashtag.png' },
	{ name: 'notification.png', path: '/js/tasks/social_media/media/bell.png' },
	{ name: 'message.png', path: '/js/tasks/social_media/media/email.png' },
	{ name: 'bookmark.png', path: '/js/tasks/social_media/media/bookmark.png' },
	{ name: 'list.png', path: '/js/tasks/social_media/media/list.png' },
	{ name: 'profile.png', path: '/js/tasks/social_media/media/user.png' },
	{ name: 'more.png', path: '/js/tasks/social_media/media/more.png' },
	{ name: 'search.png', path: '/js/tasks/social_media/media/search.png' },
	{ name: 'profile_pic.png', path: '/js/tasks/social_media/media/profile_photo.png' },
	{ name: 'profile_picRR.png', path: '/js/tasks/social_media/media/profile_picRR.png' },
	{ name: 'like.png', path: '/js/tasks/social_media/media/like.png' },
	{ name: 'dislike.png', path: '/js/tasks/social_media/media/dislike.png' },
	{ name: 'dislike_outline.png', path: '/js/tasks/social_media/media/dislike_outline.png'},
	{ name: 'heart.png', path: '/js/tasks/social_media/media/heart.png' },
	{ name: 'heart_outline.png', path: '/js/tasks/social_media/media/heart_outline.png' }
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

	if (getQueryVariable('study') == 'vanderbelt' || getQueryVariable('study') == 'johns_hopkins') {

		// Take Them to completion no 2nd run
		psychoJS.setRedirectUrls(
			`/completed`, // get next order.
			'/' // cancellation url
		)
	}

	return Scheduler.Event.NEXT;
}


// Stim Variables
var logoStim;
var dividerStim;
var headerRectStim;
var usernameStim;
var fullNameStim;
var onlineUsers;
var pageName;
var questionText;
var homeStim;
var hashtagStim;
var notificationStim;
var messageStim;
var bookmarkStim;
var listStim;
var profileStim;
var profilePicStim;
var profilePicPostStim;
var profilePicRRStim;
var profilePicRRPostStim;

var homeTextStim;
var exploreTextStim;
var notificationTextStim;
var messageTextStim;
var bookmarkTextStim;
var listTextStim;
var profileTextStim;
var moreTextStim;

// Object for posts realted things
var posts_height = 0.17
var postStims = {
	0: {},
	1: {},
	2: {},
	3: {},
	4: {},
	5: {},
	6: {},
	7: {},
	8: {},
	9: {},
} 

var post_stim_x_pos = {
	'left': {
		'post_text': 0.6,
		'like_icon': -0.373,
		'like_posts': -0.373,
		'profile_photo': 0.65
	},
	'right': {
		'post_text': -0.33,
		'like_icon': 0.65,
		'like_posts': 0.65,
		'profile_photo': -0.373
	}
}

// Create Y axis  points
for (let i = 0; i <= 9; i++){
	if (i == 0) {
		postStims[i].post_y = 0.62
		postStims[i].postphoto_y = 0.62
		postStims[i].postlike_y = 0.65
		postStims[i].postlikeIcon_y = 0.57
	} else {
		postStims[i].post_y = postStims[i - 1].post_y - posts_height
		postStims[i].postphoto_y = postStims[i - 1].postphoto_y - 0.17
		postStims[i].postlike_y = postStims[i - 1].postlike_y - 0.17
		postStims[i].postlikeIcon_y = postStims[i - 1].postlikeIcon_y - 0.17
	}
}

var choice1Button;
var choice2Button;

var topic_text;

var leftTopicCounter = 0
var leftTopic = [
	"One time I saw what's called a Super Flower Blood Moon.",
	"They mean it when they say not to look at a solar eclipse!",
	"I can always find the Big Dipper at night but hardly anything else.",
	"It's crazy that the stars are so far away!",
	"I was staring at a moving star for 20 mins before I realized it was a satelite",
	"Anyone have any good telescope recommendations?",
	"I have an app that tells me which constellations I'm looking at!",
	"I always stargaze when I had a rough day at work.",
	"My city has way too much light pollution",
	"Who else is excited for the meteor shower this weekend??"
]
var rightTopicCounter = 0
var rightTopic = [
	"We just planted our very first garden: cucumbers, tomatoes, ghost peppers, basil, rosemary, and onions.",
	"Who's going to the azalea festival this weekend?",
	"It's so satisfying to see that first seedling come up after weeks of watering.",
	"Save your coffee grounds! They're a good fertilizer for plants that like acidic soil.",
	"Lilies and Tulips and Begonias, oh my!",
	"Why do I kill every Alocasia I plant??",
	"I harvested the first tomato from my garden today!",
	"Anyone have any tips for keeping bugs off of my potato seedlings?",
	"I'm worried it might be too hot outside for some of the seeds I bought",
	"I hope I can keep my dogs away from my plants this year"
]


var beginButton;

var moreStim;

var fontColor = '#ffffff'
var fontFadeColor = '#545454'

var leftColor = '#56B4E9'
var leftFadeColor = '#142833'

var rightColor = '#db6e00'
var rightFadeColor = '#361b01'

var like_color = {
	'likes': '#00FFFF',
	'dislikes': 'red'
}

var slideStim;
var slides;
var instructClock;
var instrBelow;
var ready;
var trialClock;
var word;

var currentTrialNumber;
var currentTrialText;
var chatRoomNumber;
var chatRoomNumberText;
var roomType;
var roomTypeText;
var totalPoints = 0;
var totalPossible = null;
var socialApprovalScore = 0;
var totalLikesTracker;
var totalLikesText;

var readyStim;
var readyClock;
var readyText;


var track;

var resp;
var mouse;
var thanksClock;
var thanksText;
var globalClock;
var routineTimer;

var response;

var loadingCounter = 0;




var max_frame;
function normalize_elements(strings) {
	// This will take a list of element string
	// Group them so that they all have the same amount of elements
	let string_length = strings.length
	if (string_length == 0) {
		return ['Hello', 'World']
	}

	max_frame = 30 / animation_duration

	// console.log('string lenght:',string_length)
	if (string_length <= max_frame) {
		return strings // return as is since it's less than the max frame count
	} else {
		let mod_num = Math.ceil(string_length / max_frame)
		let new_strings = []
		var begin_index = 0
		for (var i = 0; i <= string_length; i++){
			if (i % mod_num == 0) {
				new_strings.push(strings.slice(begin_index, i + 1).join(' '))
				begin_index = i + 1
			}
		}

		return new_strings
	}
}

var topic_text_elements;
function loadingAnimationText() {
	// if (postStims[trial_num].post_text.text == topic_text ) {
	// 	postStims[trial_num].post_text.status = PsychoJS.STATUS.FINISHED
	// }
	// if (frameN > max_frame) return
	// topic_text_test = normalize_elements(topic_text.split(' '))
	postStims[trial_num].post_text.setText( topic_text_elements.slice(0, loadingCounter).join(' ') )
	if (frameN % 2 == 0) loadingCounter++

}

function experimentInit() {
	
	// Initialize components for Routine "instruct"
	instructClock = new util.Clock();

	instrBelow = new visual.TextStim({
		win: psychoJS.window,
		name: 'instrBelow',
		text: 'Press any key to Continue',
		font: 'lucida grande',
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

	logoStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'slide_stim', units : 'norm', 
		image : 'logo.png', mask : undefined,
		ori : 0, pos : [-0.90, 0.9],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	usernameStim = new visual.TextStim({
		win: psychoJS.window,
		name: 'username',
		text: '@' + expInfo.participant.toLowerCase(),
		font: 'lucida grande',
		units: 'norm',
		alignVert: 'left',
		alignHoriz: 'left',
		pos: [-0.8, -0.89], height: 0.04,
		wrapWidth: undefined, ori: 0,
		color: new util.Color('#666b70'), opacity: 1,
		depth: 0.0
	});

	fullNameStim = new visual.TextStim({
		win: psychoJS.window,
		name: 'fullname',
		text: 'Task Participant',
		font: 'lucida grande',
		units: 'norm',
		alignVert: 'left',
		alignHoriz: 'left',
		pos: [-0.8, -0.82], height: 0.04,
		wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	onlineUsers = new visual.TextStim({
		win: psychoJS.window,
		name: 'onlineUsers',
		text: '100 online',
		font: 'lucida grande',
		units: 'norm',
		pos: [ -0.32, 0.83], height: 0.06,
		wrapWidth: undefined, ori: 0,
		color: new util.Color('#66ff00'), opacity: 1,
		depth: 0.0
	});

	pageName = new visual.TextStim({
		win: psychoJS.window,
		name: 'pageName',
		text: 'Home',
		font: 'lucida grande',
		units: 'norm',
		pos: [-0.37, 0.94], height: 0.05,
		wrapWidth: undefined, ori: 0,
		bold:true,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	questionText = new visual.TextStim({
		win: psychoJS.window,
		name: 'questionText',
		text: 'Choose a topic:',
		font: 'lucida grande',
		alignHoriz: 'center',
		alignVert: 'center',
		units: 'norm',
		pos: [0.2, 0.93], height: 0.05,
		wrapWidth: undefined, ori: 0,
		bold:false,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	dividerStim = new visual.Rect({
		win: psychoJS.window,
		name: 'divider',
		width: 0.55,
		height: 2.1,
		units: 'norm',
		pos: [-0.74, 0 ], ori: 0,
		lineColor: new util.Color('#292d2f'),
		fillColor: new util.Color('black'),opacity: 1,
		depth: 0.0
	});

	headerRectStim = new visual.Rect({
		win: psychoJS.window,
		name: 'header',
		width: 1.45,
		height: 0.59,
		units: 'norm',
		pos: [0, 1 ], ori: 0,
		fillColor: new util.Color('black'),
		lineColor: new util.Color('#292d2f'), opacity: 1,
		depth: 0.0
	});
	
	homeStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'home', units : 'norm', 
		image : 'home.png', mask : undefined,
		ori : 0, pos : [-0.9, 0.73],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	homeTextStim = new visual.TextStim({
		win: psychoJS.window,
		name: 'homeText',
		text: 'Home',
		font: 'lucida grande',
		units: 'norm',
		pos : [-0.78, 0.73], height: 0.06,
		wrapWidth: undefined, ori: 0,
		bold: true,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	hashtagStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'hashtag', units : 'norm', 
		image : 'hashtag.png', mask : undefined,
		ori : 0, pos : [-0.9, 0.56],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	exploreTextStim = new visual.TextStim({
		win: psychoJS.window,
		name: 'exploreStim',
		text: 'Explore',
		font: 'lucida grande',
		units: 'norm',
		pos : [-0.77, 0.56], height: 0.06,
		wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	notificationStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'notification', units : 'norm', 
		image : 'notification.png', mask : undefined,
		ori : 0, pos : [-0.9, 0.39],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	notificationTextStim = new visual.TextStim({
		win: psychoJS.window,
		name: 'notificationText',
		text: 'Notifications',
		font: 'lucida grande',
		units: 'norm',
		pos : [-0.725, 0.39], height: 0.06,
		wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	messageStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'message', units : 'norm', 
		image : 'message.png', mask : undefined,
		ori : 0, pos : [-0.9, 0.22],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	messageTextStim = new visual.TextStim({
		win: psychoJS.window,
		name: 'messageTextStim',
		text: 'Messages',
		font: 'lucida grande',
		units: 'norm',
		pos : [-0.75, 0.22], height: 0.06,
		wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	bookmarkStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'bookmark', units : 'norm', 
		image : 'bookmark.png', mask : undefined,
		ori : 0, pos : [-0.9, 0.05],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	bookmarkTextStim = new visual.TextStim({
		win: psychoJS.window,
		name: 'bookmarkText',
		text: 'Bookmarks',
		font: 'lucida grande',
		units: 'norm',
		pos : [-0.74, 0.05], height: 0.06,
		wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	listStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'list', units : 'norm', 
		image : 'list.png', mask : undefined,
		ori : 0, pos : [-0.9, -0.12],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	listTextStim = new visual.TextStim({
		win: psychoJS.window,
		name: 'listText',
		text: 'Lists',
		font: 'lucida grande',
		units: 'norm',
		pos : [-0.797, -0.12], height: 0.06,
		wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	profileStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'profile', units : 'norm', 
		image : 'profile.png', mask : undefined,
		ori : 0, pos : [-0.9, -0.29],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	profileTextStim = new visual.TextStim({
		win: psychoJS.window,
		name: 'profileText',
		text: 'Profile',
		font: 'lucida grande',
		units: 'norm',
		pos : [-0.785, -0.29], height: 0.06,
		wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	moreStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'more', units : 'norm', 
		image : 'more.png', mask : undefined,
		ori : 0, pos : [-0.9, -0.46],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	moreTextStim = new visual.TextStim({
		win: psychoJS.window,
		name: 'moreText',
		text: 'More',
		font: 'lucida grande',
		units: 'norm',
		pos : [-0.795, -0.46], height: 0.06,
		wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	profilePicStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'profile_pic', units : 'norm', 
		image : 'profile_pic.png', mask : undefined,
		ori : 0, pos : [-0.87, -0.86],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	profilePicPostStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'profile_pic_post', units : 'norm', 
		image : 'profile_pic.png', mask : undefined,
		ori: 0,
		pos: [ -0.373, 0.82 ], 
		size: [0.09,0.11],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	profilePicRRStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'profile_picRR', units : 'norm', 
		image : 'profile_picRR.png', mask : undefined,
		ori : 0, pos : [-0.87, -0.86],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	profilePicRRPostStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'profile_picRR_post', units : 'norm', 
		image : 'profile_picRR.png', mask : undefined,
		ori: 0,
		pos: [ -0.373, 0.82 ], 
		size: [0.09,0.11],
		color: undefined, opacity: 1,
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


	choice1Button = new visual.ButtonStim({
		win : psychoJS.window,
		name : 'choice_1_button', units : 'norm', 
		text: 'Post Topic 1', 
		size: [0.55, 1],
		anchor: 'center',
		alignHoriz: 'center',
		fillColor: new util.Color(leftColor),
		// opacity: .5,
		letterHeight: 0.04,
		font: 'lucida grande',
		ori : 0, pos : [-.05, 0.8],
	});

	choice2Button = new visual.ButtonStim({
		win : psychoJS.window,
		name : 'choice_2_button', units : 'norm', 
		text: 'Post Topic 2', 
		size: [0.55, 1],
		alignVert: 'center',
		alignHoriz: 'center',
		fillColor: new util.Color(rightColor),
		// opacity: .5,
		letterHeight: 0.04,
		font: 'lucida grande',
		ori : 0, pos : [0.45, 0.8],
	});

	beginButton = new visual.ButtonStim({
		win : psychoJS.window,
		name: 'begin_button',
		units: 'norm', 
		text: 'Begin', 
		anchor: 'center',
		size: [0.17, 1],
		alignVert: 'center',
		alignHoriz: 'center',
		fillColor: new util.Color('green'),
		// opacity: .5,
		letterHeight: 0.04,
		font: 'lucida grande',
		ori : 0, pos : [0.19, 0.78],
	});
	beginButton.setAnchor('center')

	
	mouse = new core.Mouse({win: psychoJS.window})

	// Craete the post stims
	for (var i = 0; i <= 9; i++){

		// Rectangle Box
		postStims[i].rect = new visual.Rect({
			win: psychoJS.window,
			name: `post${i}`,
			width: 1.19,
			height: posts_height,
			units: 'norm',
			pos: [0.13, postStims[i].post_y ], ori: 0,
			lineColor: new util.Color('#292d2f'), opacity: 0.5,
			depth: 0.0
		});

		// Post Text
		postStims[i].post_text = new visual.TextStim({
			win: psychoJS.window,
			name: `post_text_${i}`,
			text: 'sample post goes here',
			fontFamily: 'lucida grande',
			multiline: true,
			height: 0.043,
			units: 'norm',
			alignVert: 'left',
			alignHoriz: 'left',
			pos: [-0.2, postStims[i].post_y],
			wrapWidth: 0.91, ori: 0,
			color: new util.Color('white'), opacity: 1,
			depth: 0.0
		});

		// Mini Profile Photo
		postStims[i].profile_photo = new visual.ImageStim({
			win : psychoJS.window,
			name : `profile_pic_post_${i}`, units : 'norm', 
			image : 'profile_pic.png', mask : undefined,
			ori: 0,
			pos: [ -0.373, postStims[i].postphoto_y ], 
			size: [0.07, 0.09],
			color: undefined, opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});

		// Mini Profile Photo for Reversa
		postStims[i].profileRR_photo = new visual.ImageStim({
			win : psychoJS.window,
			name : `profile_picRR_post_${i}`, units : 'norm', 
			image : 'profile_picRR.png', mask : undefined,
			ori: 0,
			pos: [ -0.373, postStims[i].postphoto_y ], 
			size: [0.07, 0.09],
			color: undefined, opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});

		// Like Icon
		postStims[i].like_icon = new visual.ImageStim({
			win : psychoJS.window,
			name : `like_post_${i}`, units : 'pix', 
			image : 'heart.png', mask : undefined,
			ori: 0,
			pos: [ 0.65, postStims[i].postlikeIcon_y ], 
			size: [0.04, 0.05],
			color: undefined, opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});

		// Like Icon Output
		postStims[i].like_icon_outline = new visual.ImageStim({
			win : psychoJS.window,
			name : `like_post_${i}_outline`, units : 'pix', 
			image : 'heart_outline.png', mask : undefined,
			ori: 0,
			pos: [ 0.65, postStims[i].postlikeIcon_y ], 
			size: [0.04, 0.05],
			color: undefined, opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});

		// DisLike Icon
		postStims[i].dislike_icon = new visual.ImageStim({
			win : psychoJS.window,
			name : `dislike_post_${i}`, units : 'pix', 
			image : 'dislike.png', mask : undefined,
			ori: 0,
			pos: [ 0.65, postStims[i].postlikeIcon_y ], 
			size: [0.04, 0.05],
			color: undefined, opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});

		postStims[i].dislike_icon_outline = new visual.ImageStim({
			win : psychoJS.window,
			name : `dislike_post_${i}_outline`, units : 'pix', 
			image : 'dislike_outline.png', mask : undefined,
			ori: 0,
			pos: [ 0.65, postStims[i].postlikeIcon_y ], 
			size: [0.04, 0.05],
			color: undefined, opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});

		// Number of Likes on each post
		postStims[i].like_posts = new visual.TextStim({
			win: psychoJS.window,
			name: `like_posts_${i}`,
			text: '0',
			bold: true,
			fontFamily: 'lucida grande',
			units: 'norm',
			pos: [0.65, postStims[i].postlike_y],
			height: 0.07, wrapWidth: undefined, ori: 0,
			color: new util.Color('white'), opacity: 1,
			depth: 0.0
		});

		// postStims[i].like_animation = new visual.ImageStim({
		// 	win : psychoJS.window,
		// 	name : `like_post_${i}`, units : 'pix', 
		// 	image : 'loading', mask : undefined,
		// 	ori: 0,
		// 	pos: [ 0.65, postStims[i].postlikeIcon_y ], 
		// 	size: [0.04, 0.05],
		// 	color: undefined, opacity: 1,
		// 	flipHoriz : false, flipVert : false,
		// 	texRes : 128, interpolate : true, depth : 0
		// });
	}

	totalLikesText = new visual.TextStim({
		win: psychoJS.window,
		name: 'pointsTracker',
		text: 'SOCIAL\nAPPROVAL:',
		font: 'lucida grande',
		units: 'norm',
		alignHoriz: 'center',
		alignVert: 'center',
		pos: [0.86, 0.93], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	totalLikesTracker = new visual.TextStim({
		win: psychoJS.window,
		name: 'pointsTracker',
		text: '0',
		font: 'lucida grande',
		alignHoriz: 'center',
		alignVert: 'center',
		units: 'norm',
		pos: [ 0.86, 0.82], height: 0.09, wrapWidth: undefined, ori: 0,
		color: new util.Color('#00FFFF'), opacity: 1,
		depth: 0.0
	});

	chatRoomNumberText = new visual.TextStim({
		win: psychoJS.window,
		name: 'gameTrackerText',
		text: 'CHATROOM:',
		font: 'lucida grande',
		units: 'norm',
		alignHoriz: 'center',
		alignVert: 'center',
		pos: [ 0.865, 0.65], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	chatRoomNumber = new visual.TextStim({
		win: psychoJS.window,
		name: 'gameTracker',
		text: '1/80',
		font: 'lucida grande',
		units: 'norm',
		alignHoriz: 'center',
		alignVert: 'center',
		pos: [ 0.86, 0.55], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('#00FF00'), opacity: 1,
		depth: 0.0
	});

	roomTypeText = new visual.TextStim({
		win: psychoJS.window,
		name: 'roomTypeText',
		text: 'ROOM TYPE:',
		font: 'lucida grande',
		units: 'norm',
		alignHoriz: 'center',
		alignVert: 'center',
		pos: [0.87, 0.38], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	roomType = new visual.TextStim({
		win: psychoJS.window,
		name: 'roomType',
		text: 'Likes',
		italic: true,
		font: 'lucida grande',
		alignHoriz: 'center',
		alignVert: 'center',
		units: 'norm',
		pos: [ 0.86, 0.31], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('#FF137E'), opacity: 1,
		depth: 0.0
	});

	currentTrialText  = new visual.TextStim({
		win: psychoJS.window,
		name: 'trialTrackerText',
		text: 'POST:',
		font: 'lucida grande',
		units: 'norm',
		alignHoriz: 'center',
		alignVert: 'center',
		pos: [ 0.86, 0.14], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('white'), opacity: 1,
		depth: 0.0
	});

	currentTrialNumber  = new visual.TextStim({
		win: psychoJS.window,
		name: 'trialTracker',
		text: '1',
		font: 'lucida grande',
		units: 'norm',
		alignHoriz: 'center',
		alignVert: 'center',
		pos: [0.86, 0.08], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('#FFFF00'), opacity: 1,
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
		text: 'This is the end of the task run.\n\nYouThanks!',
		font: 'lucida grande',
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

/**
 * Clears all the stimulus objects & set's there status back to NOT_STARTED
 */
function clear_All_stims() {
	headerRectStim.setAutoDraw(false)
	headerRectStim.status = PsychoJS.Status.NOT_STARTED

	dividerStim.setAutoDraw(false)
	dividerStim.status = PsychoJS.Status.NOT_STARTED

	homeStim.setAutoDraw(false)
	homeStim.status = PsychoJS.Status.NOT_STARTED

	homeTextStim.setAutoDraw(false)
	homeTextStim.status = PsychoJS.Status.NOT_STARTED

	hashtagStim.setAutoDraw(false)
	hashtagStim.status = PsychoJS.Status.NOT_STARTED

	exploreTextStim.setAutoDraw(false)
	exploreTextStim.status = PsychoJS.Status.NOT_STARTED

	notificationStim.setAutoDraw(false)
	notificationStim.status = PsychoJS.Status.NOT_STARTED

	notificationTextStim.setAutoDraw(false)
	notificationTextStim.status = PsychoJS.Status.NOT_STARTED

	messageStim.setAutoDraw(false)
	messageStim.status = PsychoJS.Status.NOT_STARTED

	messageTextStim.setAutoDraw(false)
	messageTextStim.status = PsychoJS.Status.NOT_STARTED

	bookmarkStim.setAutoDraw(false)
	bookmarkStim.status = PsychoJS.Status.NOT_STARTED

	bookmarkTextStim.setAutoDraw(false)
	bookmarkTextStim.status = PsychoJS.Status.NOT_STARTED

	listStim.setAutoDraw(false)
	listStim.status = PsychoJS.Status.NOT_STARTED

	listTextStim.setAutoDraw(false)
	listTextStim.status = PsychoJS.Status.NOT_STARTED

	profileStim.setAutoDraw(false)
	profileStim.status = PsychoJS.Status.NOT_STARTED

	profileTextStim.setAutoDraw(false)
	profileTextStim.status = PsychoJS.Status.NOT_STARTED

	profilePicStim.setAutoDraw(false)
	profilePicStim.status = PsychoJS.Status.NOT_STARTED

	moreStim.setAutoDraw(false)
	moreStim.status = PsychoJS.Status.NOT_STARTED

	moreTextStim.setAutoDraw(false)
	moreTextStim.status = PsychoJS.Status.NOT_STARTED

	currentTrialText.setAutoDraw(false)
	currentTrialText.status = PsychoJS.Status.NOT_STARTED

	currentTrialNumber.setAutoDraw(false)
	currentTrialNumber.status = PsychoJS.Status.NOT_STARTED

	chatRoomNumberText.setAutoDraw(false)
	chatRoomNumberText.status = PsychoJS.Status.NOT_STARTED

	chatRoomNumber.setAutoDraw(false)
	chatRoomNumber.status = PsychoJS.Status.NOT_STARTED

	totalLikesText.setAutoDraw(false)
	totalLikesText.status = PsychoJS.Status.NOT_STARTED

	totalLikesTracker.setAutoDraw(false)
	totalLikesTracker.status = PsychoJS.Status.NOT_STARTED

	roomTypeText.setAutoDraw(false)
	roomTypeText.status = PsychoJS.Status.NOT_STARTED

	roomType.setAutoDraw(false)
	roomType.status = PsychoJS.Status.NOT_STARTED

	choice1Button.setAutoDraw(false)
	choice1Button.status = PsychoJS.Status.NOT_STARTED

	choice2Button.setAutoDraw(false)
	choice2Button.status = PsychoJS.Status.NOT_STARTED

	logoStim.setAutoDraw(false)
	logoStim.status = PsychoJS.Status.NOT_STARTED

	usernameStim.setAutoDraw(false)
	usernameStim.status = PsychoJS.Status.NOT_STARTED

	fullNameStim.setAutoDraw(false)
	fullNameStim.status = PsychoJS.Status.NOT_STARTED

	pageName.setAutoDraw(false)
	pageName.status = PsychoJS.Status.NOT_STARTED

	questionText.setAutoDraw(false)
	questionText.status = PsychoJS.Status.NOT_STARTED

	profilePicPostStim.setAutoDraw(false)
	profilePicPostStim.status = PsychoJS.Status.NOT_STARTED

	profilePicRRStim.setAutoDraw(false)
	profilePicRRStim.status = PsychoJS.Status.NOT_STARTED

	reset_stims()
}
var block_type;
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

	var currentInstructIndex = 0
	var maxInstructions = slides.nTotal
	const snapshot = slides.getSnapshot();

	thisScheduler.add(importConditions(snapshot));
	thisScheduler.add(instructRoutineBegin(snapshot));
	thisScheduler.add(instructSlideRoutineEachFrame(snapshot, slides));
	thisScheduler.add(instructRoutineEnd(snapshot));
	thisScheduler.add(endLoopIteration(thisScheduler, snapshot));

	block_type = 'INSTRUCTIONS'
	mark_event(trials_data, globalClock, 0, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')
	
	return Scheduler.Event.NEXT;
}

function instruct_pages_roleReversal_LoopBegin(thisScheduler) {
	// set up handler to look up the conditions
	slides = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'role_reversal_instruct_schedule.csv',
		seed: undefined, name: 'slides'
	});

	// console.log(slides)
	
	psychoJS.experiment.addLoop(slides); // add the loop to the experiment
	currentLoop = slides;  // we're now the current loop

	// Schedule all the slides in the trialList:

	const snapshot = slides.getSnapshot();
	thisScheduler.add(importConditions(snapshot));
	thisScheduler.add(instructRoutineBegin(snapshot));
	thisScheduler.add(instructSlideRoutineEachFrame(snapshot, slides));
	thisScheduler.add(instructRoutineEnd(snapshot));
	thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	
	block_type = 'INSTRUCT_ROLEREVERSAL'
	mark_event(trials_data, globalClock, 0, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')
	return Scheduler.Event.NEXT;
}

var t;
var frameN;
var instructComponents;


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

			mark_event(trials_data, globalClock, trials.thisIndex, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')

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

				mark_event(trials_data, globalClock, trials.thisIndex, block_type, event_types['AUDIO_ONSET'],
				'NA', instruct_slide, audio_path)
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

function trials_exampleLoopBegin(thisScheduler) {
	resetSocialApprovalScore()
	total_games = 4
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
	// Schedule all the trials in the trialList:
	for (const thisTrial of example_trials) {
		const snapshot = example_trials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot)); // setup routine
		thisScheduler.add(trialRoutineEachFrameWaitforInput(snapshot)); // show topics
		thisScheduler.add(trialRoutineEachFrameShowPost(snapshot)); // show animation post
		// thisScheduler.add(trialRoutineEachFrameShowScore(snapshot)); // show score post
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	block_type = 'EXAMPLE_BLOCK'
	mark_event(trials_data, globalClock, 0, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')
	return Scheduler.Event.NEXT;
}


function trials_role_reversalBegin(thisScheduler) {
	// role_reversal_shedule
	total_games = 2
	
	roleReversalTrials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'role_reversal_shedule.xls',
		seed: undefined, name: 'roleReversalTrials'
	});
	psychoJS.experiment.addLoop(roleReversalTrials); // add the loop to the experiment
	currentLoop = roleReversalTrials;  // we're now the current loop

	// Schedule all the roleReversalTrials in the trialList:
	// Schedule all the trials in the trialList:
	for (const thisTrial of roleReversalTrials) {
		const snapshot = roleReversalTrials.getSnapshot();

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(trialRoleReversalRoutineBegin(snapshot));
		thisScheduler.add(trialRoleReversalRoutineEachFrameWaitforInput(snapshot));
		thisScheduler.add(trialRoleReversalRoutineEachFrameShowPost(snapshot));
		thisScheduler.add(trialRoleReversalRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}

	block_type = 'ROLE_REVERSAL'
	mark_event(trials_data, globalClock, 0, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')

	return Scheduler.Event.NEXT;
}

function instructRoutineEnd(trials) {
	return function () {
		//------Ending Routine 'instruct'-------
		if (audio_path && track) {
			// Change the track status if it was played
			track.stop()
			track.status = PsychoJS.Status.NOT_STARTED
		}
		track = false
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

function resetSocialApprovalScore() {
	totalPoints = null // reset total points
	totalPossible = null
	socialApprovalScore = 0
}

var example_trials;
var roleReversalTrials;
var trials;
var currentLoop;
var lastTrialKeyPressed;
var total_games;
var animation_duration = 1.35
function trialsLoopBegin(thisScheduler) {
	// set up handler to look up the conditions
	resetSocialApprovalScore()
	total_games = 80
	trials = new TrialHandler({
		psychoJS: psychoJS,
		nReps: 1, method: TrialHandler.Method.SEQUENTIAL,
		extraInfo: expInfo, originPath: undefined,
		trialList: 'run_schedule.xls',
		seed: undefined, name: 'trials'
	});

	// console.log(trials)
	
	psychoJS.experiment.addLoop(trials); // add the loop to the experiment
	currentLoop = trials;  // we're now the current loop

	// Check if the skip_game query exist. means
	var skip_game = getQueryVariable('skip_game') ? getQueryVariable('skip_game') : null

	// Schedule all the trials in the trialList:
	for (const thisTrial of trials) {
		const snapshot = trials.getSnapshot();

		// If there is a skip_game flag, thane skip those trials until we reach to game number
		if (skip_game && snapshot.game_number < skip_game) {
			continue
		}

		thisScheduler.add(importConditions(snapshot));
		thisScheduler.add(trialRoutineBegin(snapshot));
		thisScheduler.add(trialRoutineEachFrameWaitforInput(snapshot));
		thisScheduler.add(trialRoutineEachFrameShowPost(snapshot)); 
		// thisScheduler.add(trialRoutineEachFrameShowScore(snapshot));
		thisScheduler.add(trialRoutineEnd(snapshot));
		thisScheduler.add(endLoopIteration(thisScheduler, snapshot));
	}
	block_type = 'MAIN'
	mark_event(trials_data, globalClock, 0, block_type, event_types['BLOCK_ONSET'],
				'NA', 'NA', 'NA')
	return Scheduler.Event.NEXT;
}

function instruct_pagesLoopEnd() {
	psychoJS.experiment.removeLoop(slides);
	return Scheduler.Event.NEXT;
}

function trialsLoopEnd() {
	clear_All_stims()
	psychoJS.experiment.removeLoop(trials);
	return Scheduler.Event.NEXT;
}


/**
 * Call this function to prepate the Post Rectangles
 * @param {*} game_type 
 */
function setupPosts(game_type) {
	// Depending on the game_type, show the recangle Boxies
	if (game_type == 'h6') {
		var MAXPOST = 8
	} else {
		var MAXPOST = 4
	}

	let greyColor1 = '#434343'
	let greyColor2 = '#676767'

	// Show the Pre Filled Posts
	for (var i = trial_num; i <= MAXPOST; i++){

		// Over lapp grey and light gre
		if (i % 2 == 0) {
			postStims[i].rect.lineColor = new util.Color(greyColor1)
			postStims[i].rect.fillColor = new util.Color(greyColor1)
		} else {
			postStims[i].rect.lineColor = new util.Color(greyColor2)
			postStims[i].rect.fillColor = new util.Color(greyColor2)
		}
		
		postStims[i].rect.setAutoDraw(true) // draw rect
	}
}


// Social Approval Score is the percentage
// of how much total likes ther user has accumalted
//  / 
// the maximum number of likes they could have recieved through out the chatrooms
function getSocialApprovalScore() {
	// total possible is based on either h1 or h6
	if (game_type == 'h1') totalPossible = 100
	if (game_type == 'h6') totalPossible = 600

	socialApprovalScore = ( totalPoints / totalPossible )

	console.log('Left Reward: ',left_reward, ' Right Reward:',right_reward, 'TotalPoints: ',totalPoints, 'totalPossible: ', totalPossible, 'Score:',socialApprovalScore)
	// Put in percentage
	socialApprovalScore = `${Math.round(socialApprovalScore * 100)}%`
}

var trialComponents;
var lastGameNumber;
var lastTrial;
var lastTrialPoints = 0;
var trial_type;
function trialRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		t = 0;
		trialClock.reset(); // clock
		frameN = -1;
		// update component parameters for each repeat
		switch (force_pos) {
			case 'R':
				choice1Button.fillColor = new util.Color(leftFadeColor)
				choice1Button.color = new util.Color(fontFadeColor)

				choice2Button.color = new util.Color(fontColor)
				choice2Button.fillColor = new util.Color(rightColor)
				break;
			case 'L':
				choice1Button.fillColor = new util.Color(leftColor)
				choice1Button.color = new util.Color(fontColor)

				choice2Button.fillColor = new util.Color(rightFadeColor)
				choice2Button.color = new util.Color(fontFadeColor)

				break;
			case 'X':
				choice1Button.fillColor = new util.Color(leftColor)
				choice1Button.color = new util.Color(fontColor)

				choice2Button.fillColor = new util.Color(rightColor)
				choice2Button.color = new util.Color(fontColor)
				break
			default:
				choice1Button.fillColor = new util.Color(leftColor)
				choice1Button.color = new util.Color(fontColor)

				choice2Button.fillColor = new util.Color(rightColor)
				choice2Button.color = new util.Color(fontColor)
		}

		lastTrial = isLastTrial(game_type, trial_num)

		// Set the color of the ROOM Type
		if (dislike_room == 1) {
			roomType.setColor(like_color.dislikes)
			roomType.setText('Dislikes')
		} else {
			roomType.setText('Likes')
			roomType.setColor(like_color.likes)
			
		}

		if (track && (track.status != PsychoJS.Status.STARTED)) {
			track.stop()
			track.status = PsychoJS.Status.STARTED
		}


		// If it's a new game, clear other texts
		// console.log(lastGameNumber)
		if (game_number != lastGameNumber) {
			console.log('new chat room')
			resetSocialApprovalScore() // reset the score
			chatRoomNumber.setText(`${game_number + 1}/${total_games}`)

			
			if (dislike_room == 1) {
				// Set TotalPoints since for dislikes they start with 100% score
				if (game_type == 'h1') totalPoints = 100
				if (game_type == 'h6') totalPoints = 600

				totalPossible = totalPossible
			} else {
				// Like Room Start at 0
				totalPoints = 0

				totalPossible = 0
			}

			getSocialApprovalScore()
			
			
			// Set the tweets
			leftTopic = tweets[left_topic]
			rightTopic = tweets[right_topic]
			choice1Button.setText(left_topic)
			choice2Button.setText(right_topic) 
			leftTopicCounter = 0
			rightTopicCounter = 0
			lastTrialKeyPressed = false;
			// bandits_rect['right'][trial_num].fillColor = false
			// bandits_rect['left'][trial_num].fillColor = false
			reset_stims()
			// clearBandits()
		}

		// Set components from last trial
		console.log(`Game: ${game_number}, trial #${trial_num}, game type ${game_type} starting`)
		trial_type = game_type + '_' + roomType.text

		mark_event(trials_data, globalClock, trial_num, trial_type, event_types['CHATROOM_ONSET'],
				'NA', 'NA', left_topic + ' | ' + right_topic)
		
		setupPosts(game_type)

		currentTrialNumber.setText(`${trial_num + 1}`)
		

		totalLikesTracker.setText(socialApprovalScore)
		
		headerRectStim.setAutoDraw(true)
		dividerStim.setAutoDraw(true)

		// searchStim.setAutoDraw(true)
		homeStim.setAutoDraw(true)
		homeTextStim.setAutoDraw(true)
		hashtagStim.setAutoDraw(true)
		exploreTextStim.setAutoDraw(true)
		notificationStim.setAutoDraw(true)
		notificationTextStim.setAutoDraw(true)
		messageStim.setAutoDraw(true)
		messageTextStim.setAutoDraw(true)
		bookmarkStim.setAutoDraw(true)
		bookmarkTextStim.setAutoDraw(true)
		listStim.setAutoDraw(true)
		listTextStim.setAutoDraw(true)
		profileStim.setAutoDraw(true)
		profileTextStim.setAutoDraw(true)
		profilePicStim.setAutoDraw(true)
		moreStim.setAutoDraw(true)
		moreTextStim.setAutoDraw(true)

		currentTrialText.setAutoDraw(true)
		currentTrialNumber.setAutoDraw(true)
		// Draw the Tracker and Points Counter
		chatRoomNumberText.setAutoDraw(true)
		chatRoomNumber.setAutoDraw(true)
		totalLikesText.setAutoDraw(true)
		totalLikesTracker.setAutoDraw(true)
		roomType.setAutoDraw(true)
		roomTypeText.setAutoDraw(true)

		choice1Button.setAutoDraw(true)
		choice2Button.setAutoDraw(true)


		// newLoadingAnimation()

		
		logoStim.setAutoDraw(true)
		usernameStim.setAutoDraw(true)
		fullNameStim.setAutoDraw(true)

		pageName.setAutoDraw(true)
		questionText.setText('Choose a topic:')
		questionText.setAutoDraw(true)
		profilePicPostStim.setAutoDraw(true)

		lastTrialKeyPressed = false
	
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

function trialRoleReversalRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'trial'-------
		t = 0;
		trialClock.reset(); // clock
		frameN = -1;
		// Turn the rewards to negative if it's a dislike_chartroom
		if (dislike_room == 1) {
			left_reward = -left_reward
			right_reward = -right_reward

			roomType.setColor(like_color.dislikes)
			roomType.setText('Dislikes')
		} else {
			roomType.setText('Likes')
			roomType.setColor(like_color.likes)
			
		}

		// If it's a new game, clear other texts
		// console.log(lastGameNumber)
		if (game_number != lastGameNumber) {
			leftTopic = tweets[left_topic]
			rightTopic = tweets[right_topic]
			leftTopicCounter = 0
			rightTopicCounter = 0
			lastTrialKeyPressed = false;
			// bandits_rect['right'][trial_num].fillColor = false
			// bandits_rect['left'][trial_num].fillColor = false
			reset_stims()
			// clearBandits()
		}
		// console.log(tweets[left_topic], tweets[right_topic])
		// Set components from last trial
		console.log(`Role Reversal ChatRoom: ${game_number}, trial #${trial_num}, game type ${game_type} starting`)

		setupPosts(game_type)

		lastTrial = isLastTrial(game_type, trial_num)
		
		currentTrialNumber.setText(`${trial_num + 1}`)
		chatRoomNumber.setText(`${game_number + 1}/${total_games}`)
		totalLikesTracker.setText(`${totalPoints}`)

		headerRectStim.setAutoDraw(true)
		dividerStim.setAutoDraw(true)

		// searchStim.setAutoDraw(true)
		homeStim.setAutoDraw(true)
		homeTextStim.setAutoDraw(true)
		hashtagStim.setAutoDraw(true)
		exploreTextStim.setAutoDraw(true)
		notificationStim.setAutoDraw(true)
		notificationTextStim.setAutoDraw(true)
		messageStim.setAutoDraw(true)
		messageTextStim.setAutoDraw(true)
		bookmarkStim.setAutoDraw(true)
		bookmarkTextStim.setAutoDraw(true)
		listStim.setAutoDraw(true)
		listTextStim.setAutoDraw(true)
		profileStim.setAutoDraw(true)
		profileTextStim.setAutoDraw(true)
		profilePicStim.setAutoDraw(true)
		moreStim.setAutoDraw(true)
		moreTextStim.setAutoDraw(true)

		currentTrialText.setAutoDraw(true)
		currentTrialNumber.setAutoDraw(true)
		// Draw the Tracker and Points Counter
		chatRoomNumberText.setAutoDraw(true)
		chatRoomNumber.setAutoDraw(true)

		roomTypeText.setAutoDraw(true)
		roomType.setAutoDraw(true)

		// newLoadingAnimation()

		
		logoStim.setAutoDraw(true)
		usernameStim.setAutoDraw(true)
		fullNameStim.setAutoDraw(true)

		pageName.setAutoDraw(true)

		questionText.setText('')
		questionText.setAutoDraw(true)
		// beginButton.setAutoDraw(true)

		profilePicPostStim.setAutoDraw(true)

		// Prepare the posts
		// Random Side
		var choices = ['LEFT', 'RIGHT']
		var topic_side = choices[Math.floor(Math.random()*choices.length)];

		// Since we use a bigger Like on the Role Reversal
		// We increase the size of the hears and also need to position it a little higher
		// Than the normal post
		var like_icon_pos_y_offest = 0.04
		
		if (topic_side == 'LEFT') {
			postStims[trial_num].profileRR_photo = new visual.ImageStim({
				win : psychoJS.window,
				name : `profile_pic_post_${trial_num}`, units : 'norm', 
				image : 'profile_pic.png', mask : undefined,
				ori: 0,
				pos: [ post_stim_x_pos.left.profile_photo, postStims[trial_num].postphoto_y ], 
				size: [0.07,0.09],
				color: undefined, opacity: 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});
			postStims[trial_num].like_icon = new visual.ImageStim({
				win : psychoJS.window,
				name : `like_post_${trial_num}`, units : 'norm', 
				image : 'heart.png', mask : undefined,
				ori: 0,
				pos: [ post_stim_x_pos.left.like_icon, postStims[trial_num].postlikeIcon_y + like_icon_pos_y_offest ], 
				size: [0.07,0.08],
				color: undefined, opacity: 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});

			postStims[trial_num].like_icon_outline = new visual.ImageStim({
				win : psychoJS.window,
				name : `like_post_${trial_num}_outline`, units : 'norm', 
				image : 'heart_outline.png', mask : undefined,
				ori: 0,
				pos: [ post_stim_x_pos.left.like_icon, postStims[trial_num].postlikeIcon_y + like_icon_pos_y_offest ], 
				size: [0.07,0.08],
				color: undefined, opacity: 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});

			// Dislike Icons
			postStims[trial_num].dislike_icon = new visual.ImageStim({
				win : psychoJS.window,
				name : `like_post_${trial_num}`, units : 'norm', 
				image : 'dislike.png', mask : undefined,
				ori: 0,
				pos: [ post_stim_x_pos.left.like_icon, postStims[trial_num].postlikeIcon_y + like_icon_pos_y_offest ], 
				size: [0.07,0.08],
				color: undefined, opacity: 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});
			postStims[trial_num].dislike_icon_outline = new visual.ImageStim({
				win : psychoJS.window,
				name : `like_post_${trial_num}_outline`, units : 'norm', 
				image : 'dislike_outline.png', mask : undefined,
				ori: 0,
				pos: [ post_stim_x_pos.left.like_icon, postStims[trial_num].postlikeIcon_y + like_icon_pos_y_offest ], 
				size: [0.07,0.08],
				color: undefined, opacity: 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});

			topic_text = leftTopic[leftTopicCounter]
			topic_text_elements = normalize_elements(topic_text.split(' '))
			leftTopicCounter++
			postStims[trial_num].post_text.pos[0] = post_stim_x_pos.left.post_text
			postStims[trial_num].post_text.alignVert = 'right'
			postStims[trial_num].post_text.alignHoriz = 'right'
	
			postStims[trial_num].rect.fillColor = new util.Color(leftColor)
			postStims[trial_num].rect.lineColor = new util.Color(leftColor)
			
		} else {
			// Right Side
			postStims[trial_num].profileRR_photo = new visual.ImageStim({
				win : psychoJS.window,
				name : `profile_pic_post_${trial_num}`, units : 'norm', 
				image : 'profile_pic.png', mask : undefined,
				ori: 0,
				pos: [ post_stim_x_pos.right.profile_photo, postStims[trial_num].postphoto_y ], 
				size: [0.07,0.09],
				color: undefined, opacity: 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});
			postStims[trial_num].like_icon = new visual.ImageStim({
				win : psychoJS.window,
				name : `like_post_${trial_num}`, units : 'norm', 
				image : 'heart.png', mask : undefined,
				ori: 0,
				pos: [ post_stim_x_pos.right.like_icon, postStims[trial_num].postlikeIcon_y + like_icon_pos_y_offest ], 
				size: [0.07,0.08],
				color: undefined, opacity: 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});
			postStims[trial_num].like_icon_outline = new visual.ImageStim({
				win : psychoJS.window,
				name : `like_post_${trial_num}_outline`, units : 'norm', 
				image : 'heart_outline.png', mask : undefined,
				ori: 0,
				pos: [ post_stim_x_pos.right.like_icon, postStims[trial_num].postlikeIcon_y + like_icon_pos_y_offest ], 
				size: [0.07,0.08],
				color: undefined, opacity: 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});
			postStims[trial_num].dislike_icon = new visual.ImageStim({
				win : psychoJS.window,
				name : `like_post_${trial_num}`, units : 'norm', 
				image : 'dislike.png', mask : undefined,
				ori: 0,
				pos: [ post_stim_x_pos.right.like_icon, postStims[trial_num].postlikeIcon_y + like_icon_pos_y_offest ], 
				size: [0.07,0.08],
				color: undefined, opacity: 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});
			postStims[trial_num].dislike_icon_outline = new visual.ImageStim({
				win : psychoJS.window,
				name : `like_post_${trial_num}_outline`, units : 'norm', 
				image : 'dislike_outline.png', mask : undefined,
				ori: 0,
				pos: [ post_stim_x_pos.right.like_icon, postStims[trial_num].postlikeIcon_y + like_icon_pos_y_offest ], 
				size: [0.07,0.08],
				color: undefined, opacity: 1,
				flipHoriz : false, flipVert : false,
				texRes : 128, interpolate : true, depth : 0
			});


			topic_text = rightTopic[rightTopicCounter]
			topic_text_elements = normalize_elements(topic_text.split(' '))
			rightTopicCounter++
			postStims[trial_num].post_text.pos[0] = post_stim_x_pos.right.post_text
			postStims[trial_num].post_text.alignVert = 'left'
			postStims[trial_num].post_text.alignHoriz = 'left'
			
			// postStims[trial_num]['like_posts'].setText(right_reward)
			trial_reward = right_reward
			
			postStims[trial_num].rect.fillColor = new util.Color(rightColor)
		}

		postStims[trial_num].post_text.setText('')
		lastTrialKeyPressed = false
		
		loadingCounter = 0
		frameN = 0

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
	if (game_type == 'h6' && trial_num == 8) return true
	return false
}


function reset_stims() {

	console.log('reset stims called')
	choice1Button.setAutoDraw(false)
	choice2Button.setAutoDraw(false)
	beginButton.setAutoDraw(false)

	for (var i = 0; i <= 9; i++) {
		// Init Left textStims
		postStims[i].rect.status = PsychoJS.Status.NOT_STARTED
		postStims[i].rect.setAutoDraw(false) // draw rect

		postStims[i].post_text.status = PsychoJS.Status.NOT_STARTED
		postStims[i].post_text.setAutoDraw(false)

		postStims[i].like_icon.status = PsychoJS.Status.NOT_STARTED
		postStims[i].like_icon.setAutoDraw(false)

		postStims[i].dislike_icon.status = PsychoJS.Status.NOT_STARTED
		postStims[i].dislike_icon.setAutoDraw(false)

		postStims[i].dislike_icon_outline.status = PsychoJS.Status.NOT_STARTED
		postStims[i].dislike_icon_outline.setAutoDraw(false)

		postStims[i].like_icon_outline.status = PsychoJS.Status.NOT_STARTED
		postStims[i].like_icon_outline.setAutoDraw(false)

		postStims[i].like_posts.status = PsychoJS.Status.NOT_STARTED
		postStims[i].like_posts.setAutoDraw(false)

		postStims[i].profile_photo.status = PsychoJS.Status.NOT_STARTED
		postStims[i].profile_photo.setAutoDraw(false) // draw profile pic post

		postStims[i].profileRR_photo.status = PsychoJS.Status.NOT_STARTED
		postStims[i].profileRR_photo.setAutoDraw(false) // draw profile pic post

	}
}

var showLastTrial;
var time_continue;
var now;
var theseKeys;
var trial_reward;

// This variable is used to find the 3 random timepoints the post updates
var animationAttributes = {
	'duration': 2000, // total duration of the animation in ms
	'instance': 3 // instance the reward should update within the animation
};

function getAnimationAttributes(reward) {
	// console.log('Geting Animation Attribuates')
	
	// The Timing 
	animationAttributes.updateTimePoints = Array.from({ length: animationAttributes.instance }, () => (Math.floor(Math.random() * animationAttributes.duration) / 1000.0 ));
	animationAttributes.updateTimePoints.sort((a, b) => {
		if (a > b) return 1;
		if (a < b) return -1;
		return 0
	}) // sort form small to greatest

	animationAttributes.updateLikesTimePoint = Array.from({ length: animationAttributes.instance }, () => Math.floor(Math.random() * trial_reward));
	animationAttributes.updateLikesTimePoint.sort((a, b) => {
		if (a > b) return 1;
		if (a < b) return -1;
		return 0
	})

	// console.log(animationAttributes)
	return animationAttributes
}

// This is the Route for Whe we wait for Input
function trialRoutineEachFrameWaitforInput(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise
	
		// get current time
		t = trialClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)


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
					break
				default:
					keyList = [LEFT_KEY, RIGHT_KEY]
			}
			
			let theseKeys = resp.getKeys({ keyList: keyList, waitRelease: false });

			// After key is pressed, go to next routine
			if ( theseKeys && theseKeys.length == 1 ){  // one key was pressed
				resp.keys = theseKeys[0].name;  // just the last key pressed
				resp.rt = theseKeys[0].rt;
				
				
				lastTrialKeyPressed = resp.keys;
				// console.log(lastTrialKeyPressed)

				// Set the position of the stims so that the posts overlapp based on resopnse
				// For Left Topic, Put the Likes on the Left and the Profile logo on the right
				// For Right Topic, Put the Lines on the Right and the Profile logo on the left.
				
				if (resp.keys == LEFT_KEY) {
					
					postStims[trial_num].profile_photo = new visual.ImageStim({
						win : psychoJS.window,
						name : `profile_pic_post_${trial_num}`, units : 'norm', 
						image : 'profile_pic.png',
						ori: 0,
						pos: [ post_stim_x_pos.left.profile_photo, postStims[trial_num].postphoto_y ], 
						size: [0.07,0.09],
						color: undefined, opacity: 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});

					postStims[trial_num].like_icon = new visual.ImageStim({
						win : psychoJS.window,
						name : `like_post_${trial_num}`, units : 'norm', 
						image : 'heart.png', mask : undefined,
						ori: 0,
						pos: [ post_stim_x_pos.left.like_icon, postStims[trial_num].postlikeIcon_y ], 
						size: [0.04,0.05],
						color: undefined, opacity: 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});

					postStims[trial_num].dislike_icon = new visual.ImageStim({
						win : psychoJS.window,
						name : `dislike_post_${trial_num}`, units : 'norm', 
						image : 'dislike.png', mask : undefined,
						ori: 0,
						pos: [ post_stim_x_pos.left.like_icon, postStims[trial_num].postlikeIcon_y ], 
						size: [0.04,0.05],
						color: undefined, opacity: 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});

					postStims[trial_num].like_icon_outline = new visual.ImageStim({
						win : psychoJS.window,
						name : `like_post_${trial_num}_outline`, units : 'norm', 
						image : 'heart_outline.png', mask : undefined,
						ori: 0,
						pos: [ post_stim_x_pos.left.like_icon, postStims[trial_num].postlikeIcon_y ], 
						size: [0.04,0.05],
						color: undefined, opacity: 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});

					postStims[trial_num].like_posts = new visual.TextStim({
						win: psychoJS.window,
						name: `like_posts_${trial_num}`,
						text: left_reward,
						bold: true,
						fontFamily: 'lucida grande',
						units: 'norm',
						pos: [ post_stim_x_pos.left.like_posts, postStims[trial_num].postlike_y],
						height: 0.07, wrapWidth: undefined, ori: 0,
						color: new util.Color('white'), opacity: 1,
						depth: 0.0
					});


					// postStims[trial_num]['profile_photo'].pos[0] = post_stim_x_pos.left.profile_photo
					topic_text = leftTopic[leftTopicCounter]
					topic_text_elements = normalize_elements(topic_text.split(' '))
					postStims[trial_num].post_text.setText('')
					leftTopicCounter++
					
					postStims[trial_num].post_text.pos[0] = post_stim_x_pos.left.post_text
					postStims[trial_num].post_text.alignVert = 'right'
					postStims[trial_num].post_text.alignHoriz = 'right'
			
					// postStims[trial_num].like_posts.pos[0] = post_stim_x_pos.left.like_posts

					

					// postStims[trial_num]['like_posts'].setText(left_reward)
					trial_reward = left_reward
					
					postStims[trial_num].rect.fillColor = new util.Color(leftColor)
					postStims[trial_num].rect.lineColor = new util.Color(leftColor)
					
				} else {

					postStims[trial_num].profile_photo = new visual.ImageStim({
						win : psychoJS.window,
						name : `profile_pic_post_${trial_num}`, units : 'norm', 
						image : 'profile_pic.png',
						ori: 0,
						pos: [ post_stim_x_pos.right.profile_photo, postStims[trial_num].postphoto_y ], 
						size: [0.07,0.09],
						color: undefined, opacity: 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});

					postStims[trial_num].like_icon = new visual.ImageStim({
						win : psychoJS.window,
						name : `like_post_${trial_num}`, units : 'norm', 
						image : 'heart.png', mask : undefined,
						ori: 0,
						pos: [ post_stim_x_pos.right.like_icon, postStims[trial_num].postlikeIcon_y ], 
						size: [0.04,0.05],
						color: undefined, opacity: 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});

					postStims[trial_num].dislike_icon = new visual.ImageStim({
						win : psychoJS.window,
						name : `dislike_post_${trial_num}`, units : 'norm', 
						image : 'dislike.png', mask : undefined,
						ori: 0,
						pos: [ post_stim_x_pos.right.like_icon, postStims[trial_num].postlikeIcon_y ], 
						size: [0.04,0.05],
						color: undefined, opacity: 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});

					postStims[trial_num].like_icon_outline = new visual.ImageStim({
						win : psychoJS.window,
						name : `like_post_${trial_num}_outline`, units : 'norm', 
						image : 'heart_outline.png', mask : undefined,
						ori: 0,
						pos: [ post_stim_x_pos.right.like_icon, postStims[trial_num].postlikeIcon_y ], 
						size: [0.04,0.05],
						color: undefined, opacity: 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});

					postStims[trial_num].like_posts = new visual.TextStim({
						win: psychoJS.window,
						name: `like_posts_${trial_num}`,
						text: right_reward,
						bold: true,
						fontFamily: 'lucida grande',
						units: 'norm',
						pos: [ post_stim_x_pos.right.like_posts, postStims[trial_num].postlike_y],
						height: 0.07, wrapWidth: undefined, ori: 0,
						color: new util.Color('white'), opacity: 1,
						depth: 0.0
					});



					
					topic_text = rightTopic[rightTopicCounter]
					topic_text_elements = normalize_elements(topic_text.split(' '))
					postStims[trial_num].post_text.setText('')
					rightTopicCounter++
					postStims[trial_num].post_text.pos[0] = post_stim_x_pos.right.post_text
					postStims[trial_num].post_text.alignVert = 'left'
					postStims[trial_num].post_text.alignHoriz = 'left'

					// postStims[trial_num].like_posts.pos[0] = post_stim_x_pos.right.like_posts

					// postStims[trial_num]['like_posts'].setText(right_reward)
					trial_reward = right_reward
					postStims[trial_num].rect.fillColor = new util.Color(rightColor)
					// bandits['left'][trial_num].setText('XX')

				}
				
				// Calculate the score as soon as you press
				// But don't actually set the text/show the text until after animation
				if (force_pos == 'X') {
					if (dislike_room == 0) {
						// Like Room // sum points
						totalPoints = totalPoints + trial_reward
					} else {
						// Dislike Room
						totalPoints = totalPoints - trial_reward
					}
					
					getSocialApprovalScore() // calculates the approval score
				}

				mark_event(trials_data, globalClock, trial_num, trial_type,
					event_types['RESPONSE'], 'NA',
					resp.keys, trial_reward)

				// console.log(postStims[trial_num].like_posts)

				// Fade out the choices
				choice1Button.fillColor = new util.Color(leftFadeColor)
				choice1Button.color = new util.Color(fontFadeColor)
				choice2Button.fillColor = new util.Color(rightFadeColor)
				choice2Button.color = new util.Color(fontFadeColor)

				// Reset Trial Time
				trialClock.reset();

				// animationAttributes = getAnimationAttributes(trial_reward)
				frameN = 1
				loadingCounter = 0
				postStims[trial_num].like_posts.setText(trial_reward)
				postStims[trial_num].post_text.setAutoDraw(true)
				return Scheduler.Event.NEXT; // Go to Next Routine after subject makes a selection
			}
		}

		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		return Scheduler.Event.FLIP_REPEAT;
	};
}


// This Routine hanlds the animation
function trialRoutineEachFrameShowPost(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise
	
		// get current time
		t = trialClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)

		//postStims[trial_num].rect.opacity = 0.5

		if (t > 0.5 && postStims[trial_num].post_text.status != PsychoJS.Status.FINISHED) {
			loadingAnimationText()
		}
		if (t > 0.5 && postStims[trial_num].profile_photo.status == PsychoJS.Status.NOT_STARTED) {
			postStims[trial_num].profile_photo.setAutoDraw(true)
			mark_event(trials_data, globalClock, trial_num, trial_type, event_types['ANIMATION_ONSET'], 'NA', 'NA', topic_text)
		}
		 

		// if (postStims[trial_num].post_text.status != PsychoJS.Status.FINISHED ) {
		// 	loadingAnimationText()
		// }
		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// After 3 seconds go to the next Trial (post) or next chat room
		if (t > animation_duration) {
			postStims[trial_num].like_posts.setAutoDraw(true)
			totalLikesTracker.setText(socialApprovalScore)

			if (dislike_room) {
				postStims[trial_num].dislike_icon.setAutoDraw(true) // show filled in heart
			} else {
				postStims[trial_num].like_icon.setAutoDraw(true) // show filled in heart
			}
			if (!lastTrial) {
				// Go to the next routine if it's not the last trial
				trialClock.reset();
				return Scheduler.Event.NEXT;
			} else {
				// Show Instructions about clicking space to go to next chat room
				questionText.setText('\n\nPress SPACE key to go to\nthe next chatroom.')
				choice1Button.setAutoDraw(false)
				choice2Button.setAutoDraw(false)

				// postStims[trial_num].post_text.setAutoDraw(true) // for some reason, last poist doesnt' show

				// wait for space key
				let theseKeys = resp.getKeys({ keyList: ['space'], waitRelease: false });

				if (theseKeys.length > 0) {
					trialClock.reset();
					clear_All_stims() // clear all Stims
					return Scheduler.Event.NEXT;
				}
			}
		}
		return Scheduler.Event.FLIP_REPEAT;
	};
}

// This routine handls the score slide
// Should only show when it's the last trial
var SHOW_SCORE_DURATION = 3 // duration of how long to show the score screen
function trialRoutineEachFrameShowScore(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		
		if (!lastTrial) {
			// Go to the next routine if it's not the last trial
			return Scheduler.Event.NEXT;
		}
	
		// get current time
		t = trialClock.getTime();

		if (totalLikesTracker.status != PsychoJS.Status.FINISHED) {
			if (dislike_room) {
				totalLikesTracker.color = new util.Color('red')
				totalLikesText.setText('SOCIAL DISAPPROVAL SCORE')
			} else {
				totalLikesTracker.color = new util.Color('green')
				totalLikesText.setText('SOCIAL APPROVAL SCORE')
			}
			totalLikesTracker.setText(socialApprovalScore)

			totalLikesTracker.setAutoDraw(true)
			totalLikesText.setAutoDraw(true)
		}
		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// Go to next routeing after the set duratino
		if (t > SHOW_SCORE_DURATION) {
			totalLikesTracker.setAutoDraw(false)
			totalLikesText.setAutoDraw(false)
			return Scheduler.Event.NEXT;
		}
		return Scheduler.Event.FLIP_REPEAT;
	};
}
// This the routine when we wait for the user to click a like
function trialRoleReversalRoutineEachFrameWaitforInput(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise
	
		// get current time
		t = trialClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)


		// *resp* updates
		if (t >= 0.5) {
			// keep track of start time/frame for later
			resp.tStart = t;  // (not accounting for frame time here)
			resp.frameNStart = frameN;  // exact frame index

			// keyboard checking is just starting
			psychoJS.window.callOnFlip(function () { resp.clock.reset(); });  // t=0 on next screen flip
			psychoJS.window.callOnFlip(function () { resp.start(); }); // start on screen flip
			psychoJS.window.callOnFlip(function () { resp.clearEvents(); });

			postStims[trial_num].post_text.setAutoDraw(true)

			loadingAnimationText()

			postStims[trial_num].profileRR_photo.setAutoDraw(true)
		}

		if (t >= animation_duration) {
			// Turn the rewards to negative if it's a dislike_chartroom
			if (dislike_room == 1) {
				questionText.setText('\nPress ">" to add a dislike.\nPress "<" to not add a dislike.')
				postStims[trial_num].dislike_icon_outline.setAutoDraw(true)
				postStims[trial_num].dislike_icon.setAutoDraw(false) // filled dislike
			} else {
				questionText.setText('\nPress ">" to add a like.\nPress "<" to not add a like.')
				postStims[trial_num].like_icon_outline.setAutoDraw(true)
				postStims[trial_num].like_icon.setAutoDraw(false) // filed hard
			}
			questionText.setAutoDraw(true)
			
			
			let theseKeys = resp.getKeys({ keyList: [LEFT_KEY, RIGHT_KEY], waitRelease: false });

			// After key is pressed, go to next routine
			if (theseKeys && theseKeys.length == 1) {  // one key was pressed
				resp.keys = theseKeys[0].name;  // just the last key pressed
				resp.rt = theseKeys[0].rt;
				
				lastTrialKeyPressed = resp.keys;
				if (resp.keys == RIGHT_KEY) {
					// For Right Key, subject is adding a like

					if (dislike_room == 1) {
						postStims[trial_num].dislike_icon_outline.setAutoDraw(false)
						postStims[trial_num].dislike_icon.setAutoDraw(true) // filed hard
					} else {
						postStims[trial_num].like_icon_outline.setAutoDraw(false)
						postStims[trial_num].like_icon.setAutoDraw(true) // filed hard
					}
					
				}
				mark_event(trials_data, globalClock, trial_num, trial_type, event_types['RESPONSE'], 'NA',
					resp.keys, trial_reward)
				
				return Scheduler.Event.NEXT;
			}
		}

		
		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		return Scheduler.Event.FLIP_REPEAT;
	};
}

function trialRoleReversalRoutineEachFrameShowPost(trials) {
	return function () {
		//------Loop for each frame of Routine 'trial'-------
		let continueRoutine = true; // until we're told otherwise
	
		// get current time
		t = trialClock.getTime();
		frameN = frameN + 1;// number of completed frames (so 0 is the first frame)

		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		if (!lastTrial) {
			return Scheduler.Event.NEXT;
		} else {
			// Show Instructions about clicking space to go to next chat room
			questionText.setText('\n\nPress SPACE key to go to\nthe next chatroom.')

			// wait for space key
			let theseKeys = resp.getKeys({ keyList: ['space'], waitRelease: false });

			if (theseKeys.length > 0) {
				
				return Scheduler.Event.NEXT;
			}
		}
		return Scheduler.Event.FLIP_REPEAT;
	};
}

function trialRoleReversalRoutineEnd(trials) {
	return function () {
		//------Ending Routine 'trial'-------
		// console.log("Trial Route End for Trial " + trial_num)

		if (resp.keys == LEFT_KEY) {
			lastTrialPoints = left_reward
		}
		if (resp.keys == RIGHT_KEY) {
			lastTrialPoints = right_reward
		}

		lastGameNumber = game_number
		
		// store data for thisExp (ExperimentHandler)

		mark_event(trials_data, globalClock, trial_num, trial_type,
			event_types['SCORE'], 'NA', 'NA', socialApprovalScore)
		
		// psychoJS.experiment.addData('resp.corr', resp.corr);
		if (typeof resp.keys !== 'undefined') {  // we had a response
			psychoJS.experiment.addData('resp.rt', resp.rt);
			routineTimer.reset();
		}
		
		profilePicRRPostStim.setAutoDraw(false)
		resp.stop();
		// the Routine "trial" was not non-slip safe, so reset the non-slip timer
		routineTimer.reset();
		trialClock.reset();

	
		return Scheduler.Event.NEXT;
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

function trialRoutineEnd(trials) {
	return function () {
		//------Ending Routine 'trial'-------

		// console.log("Trial Route End for Trial " + trial_num)

		if (resp.keys == LEFT_KEY) {
			lastTrialPoints = left_reward
		}
		if (resp.keys == RIGHT_KEY) {
			lastTrialPoints = right_reward
		}

		lastGameNumber = game_number
		
		mark_event(trials_data, globalClock, trial_num, trial_type,
			event_types['SCORE'], 'NA', 'NA', socialApprovalScore)
		
		if (typeof resp.keys !== 'undefined') {  // we had a response
			psychoJS.experiment.addData('resp.rt', resp.rt);
			routineTimer.reset();
		}
		
		resp.stop();
		// the Routine "trial" was not non-slip safe, so reset the non-slip timer
		routineTimer.reset();
		trialClock.reset();

	
		return Scheduler.Event.NEXT;
	};
}
var readyComponents;
function readyRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'ready'-------
		t = 0;
		psychoJS.eventManager.clearEvents()
		readyClock.reset(); // clock
		frameN = -1;
	
		routineTimer.add(2.000000);
		track = new Sound({
			win: psychoJS.window,
			value: 'ready.mp3'
		  });
		track.setVolume(1.0);
		track.play();
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
		track.stop()
		for (const thisComponent of readyComponents) {
			if (typeof thisComponent.setAutoDraw === 'function') {
				thisComponent.setAutoDraw(false);
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
		reset_stims()
		t = 0;
		thanksClock.reset(); // clock
		frameN = -1;
		routineTimer.add(10);
		// update component parameters for each repeat
		// keep track of which components have finished

		// Show Final Points and money earned
		thanksText.setText(`This is the end of the task.`)
		
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
		if (typeof loop !== 'undefined'){

		// console.log(psychoJS.experiment._trialsData)
			// ------Check if user ended loop early------
			if (loop.finished) {
				// Check for and save orphaned data
				if (psychoJS.experiment.isEntryEmpty())
				{
					psychoJS.experiment.nextEntry(loop);
				}
				thisScheduler.stop();

				// Send Data at last loop 
				sendData()
			} else {
				// Send Data for Every Trial
				sendData()
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
		// console.log(window)
		return Scheduler.Event.NEXT;
	};
}

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
		ready.keys = undefined;
		ready.rt = undefined;
		// keep track of which components have finished
		instructComponents = [ slideStim];
	
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
		}

		for (const thisComponent of instructComponents)
			if ('status' in thisComponent)
				thisComponent.status = PsychoJS.Status.NOT_STARTED;

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
