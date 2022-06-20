/**
 * Horizon Task
 * @author James Touthang <jtouthang@laureateinstitute.org>
 */

import { core, data, sound, util, visual } from '/psychojs/psychojs-2021.2.3.js';
 const { PsychoJS } = core;
 const { TrialHandler } = data;
 const { Scheduler } = util;
 //some handy aliases as in the psychopy scripts;
 const { abs, sin, cos, PI: pi, sqrt } = Math;
const { round } = util;
 
 log4javascript.setEnabled(false);

// import { PsychoJS } from '/lib/core-2020.1.js';
// import * as core from '/lib/core-2020.1.js';
// import { TrialHandler } from '/lib/data-2020.1.js';
// import { Scheduler } from '/lib/util-2020.1.js';
// import * as util from '/lib/util-2020.1.js';
// import * as visual from '/lib/visual-2020.1.js';
// import { Sound } from '/lib/sound-2020.1.js';

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

			

			// If vanderbelt, send them to next run

			console.log(expInfo)
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


// // // Example Play
if (getQueryVariable('run').includes('R1') ){
	// const example_playScheduler = new Scheduler(psychoJS);
	// flowScheduler.add(trials_exampleLoopBegin, example_playScheduler);
	// flowScheduler.add(example_playScheduler);
	// flowScheduler.add(exampleLoopEnd);

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
	{ name: 'logo', path: '/js/tasks/social_media/media/mice.png' },
	{ name: 'home', path: '/js/tasks/social_media/media/home.png' },
	{ name: 'hashtag', path: '/js/tasks/social_media/media/hashtag.png' },
	{ name: 'notification', path: '/js/tasks/social_media/media/bell.png' },
	{ name: 'message', path: '/js/tasks/social_media/media/email.png' },
	{ name: 'bookmark', path: '/js/tasks/social_media/media/bookmark.png' },
	{ name: 'list', path: '/js/tasks/social_media/media/list.png' },
	{ name: 'profile', path: '/js/tasks/social_media/media/user.png' },
	{ name: 'more', path: '/js/tasks/social_media/media/more.png' },
	{ name: 'search', path: '/js/tasks/social_media/media/search.png' },
	{ name: 'profile_pic', path: '/js/tasks/social_media/media/profile_photo.png' },
	{ name: 'like', path: '/js/tasks/social_media/media/like.png' },
	{ name: 'heart', path: '/js/tasks/social_media/media/heart.png' },
	{ name: 'heart_outline', path: '/js/tasks/social_media/media/heart_outline.png' },
	{ name: 'loading0', path: '/js/tasks/social_media/media/loading/loading0.png' },
	{ name: 'loading1', path: '/js/tasks/social_media/media/loading/loading1.png' },
	{ name: 'loading2', path: '/js/tasks/social_media/media/loading/loading2.png' },
	{ name: 'loading3', path: '/js/tasks/social_media/media/loading/loading3.png' },
	{ name: 'loading4', path: '/js/tasks/social_media/media/loading/loading4.png' },
	{ name: 'loading5', path: '/js/tasks/social_media/media/loading/loading5.png' },
	{ name: 'loading6', path: '/js/tasks/social_media/media/loading/loading6.png' },
	{ name: 'loading7', path: '/js/tasks/social_media/media/loading/loading7.png' },
	{ name: 'loading8', path: '/js/tasks/social_media/media/loading/loading8.png' },
	{ name: 'loading9', path: '/js/tasks/social_media/media/loading/loading9.png' },
	{ name: 'loading10', path: '/js/tasks/social_media/media/loading/loading10.png' },
	{ name: 'loading11', path: '/js/tasks/social_media/media/loading/loading11.png' },
	{ name: 'loading12', path: '/js/tasks/social_media/media/loading/loading12.png' },
	{ name: 'loading13', path: '/js/tasks/social_media/media/loading/loading13.png' },
	{ name: 'loading14', path: '/js/tasks/social_media/media/loading/loading14.png' },
	{ name: 'loading15', path: '/js/tasks/social_media/media/loading/loading15.png' },
	{ name: 'loading16', path: '/js/tasks/social_media/media/loading/loading16.png' },
	{ name: 'loading17', path: '/js/tasks/social_media/media/loading/loading17.png' },
	{ name: 'loading18', path: '/js/tasks/social_media/media/loading/loading18.png' },
	{ name: 'loading19', path: '/js/tasks/social_media/media/loading/loading19.png' },
	{ name: 'loading20', path: '/js/tasks/social_media/media/loading/loading20.png' },
	{ name: 'loading21', path: '/js/tasks/social_media/media/loading/loading21.png' },
	{ name: 'loading22', path: '/js/tasks/social_media/media/loading/loading22.png' },
	{ name: 'loading23', path: '/js/tasks/social_media/media/loading/loading23.png' },
	{ name: 'loading24', path: '/js/tasks/social_media/media/loading/loading24.png' },
	{ name: 'loading25', path: '/js/tasks/social_media/media/loading/loading25.png' },
	{ name: 'loading26', path: '/js/tasks/social_media/media/loading/loading26.png' },
	{ name: 'loading27', path: '/js/tasks/social_media/media/loading/loading27.png' },
	{ name: 'loading28', path: '/js/tasks/social_media/media/loading/loading28.png' },
	{ name: 'loading29', path: '/js/tasks/social_media/media/loading/loading29.png' },
]

var frameDur;
function updateInfo() {
	expInfo.date = util.MonotonicClock.getDateStr();  // add a simple timestamp
	expInfo.expName = expName;
	expInfo.psychopyVersion = '3.2.5';
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

var leftTopicCounter = 0
var leftTopic = [
	'I listened to country all the time at my friends house when I was younger, but never really by myself.',
	'I feel like some country songs are super sad. Might make me feel better though if I was having a bad day.',
	'Bars in the southwest are definitely fun if you like to dance to country music. I went to one the other night and stayed for like 4 hours!',
	"It seems like people outside of America aren't as into country music. If not, they're missing out!"
]
var rightTopicCounter = 0
var rightTopic = [
	'My parents were pretty conservative growing up and never let me listen to rap. So I only got into it when I was older.',
	"I'm trying to decide which concert to go to. Both have rappers I really like!",
	"I like listening to rap when I'm in some moods, but not others.",
	"Rappers talk so fast I sometimes can't understand what they're saying, but it still sounds good anyway!",
	"I can't believe they cancelled the concert. Good rap artists never come do shows here anymore!"
]

var samplePosts = [
	'It\'s #NationalVegetarianWeek! Here are our exciting recipe ideas for tasty snacks and sides. ⚡️',
	'🚨 IT\'S FINALLY HAPPENING 🚨 @kendricklamar is set to drop his new album "Mr. Morale & The Big Steppers" on May 13th',
	'More music on the way from Jamie Foxx. He discusses his new single, “LET\'S DO IT AGAIN,” and what\'s ahead with @zanelow. 🙌 http://apple.co/JamiexxZLS',
	'@arzE and the @timecrisis2000 crew chat with @brucehornsby about his new single "Sidelines," plus they get into the top hits of 1988 and today',
	'Celebrate Easter with @HillaryScottLA and guest Chandler Moore of @MavCityMusic on #CountryFaith Radio. 🌼',
	'"The beauty of making music is the magical moments that can\'t be repeated or explained." Hear @swedishousemfia\'s "Heaven Takes You Home" on #danceXL.',
	'@Camila_Cabello chats with @zanelowe about the making of #Familia and gets candid about her mental health journey.',
	'.@lizzo is here to slay. ✨ Turn up on #NewMusicDaily: http://apple.co/NMDLizzo',
	'.@HueyLewisNews is going back in time for another season of #80sRadio! Listen to episode 1 right now on Apple Music Hits: http://apple.co/80sRadioHL',
	'.@Bas always delivers. \'\[BUMP\] Pick Me Up\' is out now ft. @Galimatias x @1GunnaGunna x @JColeNC x @liltjay x @AriLennox http://apple.co/PickMeUp',
]


var moreStim;

var fontColor = '#ffffff'
var fontFadeColor = '#545454'

var leftColor = '#56B4E9'
var leftFadeColor = '#142833'

var rightColor = '#db6e00'
var rightFadeColor = '#361b01'

var slideStim;
var slides;
var instructClock;
var instrBelow;
var ready;
var trialClock;
var word;

var currentTrialNumber;
var currentTrialText;
var dayNumberTracker;
var dayNumberTrackerText;
var totalPoints = 0;
var totalLikesTracker;
var totalLikesText;

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

var loadingStim = {};
var loadingCounter = 0;

function removeLoadingAnimation() {
	for (var i = 0; i <= 29; i++){
		loadingStim[i].setAutoDraw(false)
	}
}

function newLoadingAnimation() {

	for (var i = 0; i <= 29; i++){
		loadingStim[i] = new visual.ImageStim({
			win : psychoJS.window,
			name : `loading${i}`, units : 'norm', 
			image: `loading${i}`,
			mask: undefined,
			ori: 0,
			pos: [ 0, postStims[trial_num].postlike_y ], 
			size: [0.09, 0.11],
			opacity: 1,
			flipHoriz : false, flipVert : false,
			texRes : 128, interpolate : true, depth : 0
		});
	}
}

function loadingAnimation() {
	if (loadingCounter > 0) {
		loadingStim[loadingCounter - 1].setAutoDraw(false)
	}
	if (loadingCounter <= 29) {
		if (resp.keys == LEFT_KEY) {
			loadingStim[loadingCounter].pos[0] = post_stim_x_pos.left.like_posts // x position
			loadingStim[loadingCounter].pos[1] = postStims[trial_num].postlike_y // y position
		} else {
			loadingStim[loadingCounter].pos[0] = post_stim_x_pos.right.like_posts
			loadingStim[loadingCounter].pos[1] = postStims[trial_num].postlike_y // y position
		}

		loadingStim[loadingCounter].setAutoDraw(true)
		loadingCounter++
		//loadingStim[loadingCounter].setAutoDraw(false)
	} else {
		loadingCounter = 0
	}
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
		image : 'logo', mask : undefined,
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
		image : 'home', mask : undefined,
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
		image : 'hashtag', mask : undefined,
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
		image : 'notification', mask : undefined,
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
		image : 'message', mask : undefined,
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
		image : 'bookmark', mask : undefined,
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
		image : 'list', mask : undefined,
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
		image : 'profile', mask : undefined,
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
		image : 'more', mask : undefined,
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
		image : 'profile_pic', mask : undefined,
		ori : 0, pos : [-0.87, -0.86],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});

	profilePicPostStim = new visual.ImageStim({
		win : psychoJS.window,
		name : 'profile_pic_post', units : 'norm', 
		image : 'profile_pic', mask : undefined,
		ori: 0,
		pos: [ -0.373, 0.82 ], 
		size: [0.09,0.11],
		color: undefined, opacity: 1,
		flipHoriz : false, flipVert : false,
		texRes : 128, interpolate : true, depth : 0
	});


	choice1Button = new visual.ButtonStim({
		win : psychoJS.window,
		name : 'choice_1_button', units : 'norm', 
		text: 'Post Topic 1', 
		size: [0.4, 1],
		anchor: 'center',
		fillColor: new util.Color(leftColor),
		// opacity: .5,
		letterHeight: 0.04,
		font: 'lucida grande',
		ori : 0, pos : [0, 0.8],
	});

	choice2Button = new visual.ButtonStim({
		win : psychoJS.window,
		name : 'choice_2_button', units : 'norm', 
		text: 'Post Topic 2', 
		size: [0.4, 1],
		alignVert: 'center',
		fillColor: new util.Color(rightColor),
		// opacity: .5,
		letterHeight: 0.04,
		font: 'lucida grande',
		ori : 0, pos : [0.4, 0.8],
	});

	
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
			text: samplePosts[i],
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
			image : 'profile_pic', mask : undefined,
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
			image : 'heart', mask : undefined,
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
			image : 'heart_outline', mask : undefined,
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

	currentTrialText  = new visual.TextStim({
		win: psychoJS.window,
		name: 'trialTrackerText',
		text: 'POST:',
		font: 'lucida grande',
		units: 'norm',
		alignHoriz: 'center',
		alignVert: 'center',
		pos: [ 0.86, 0.93], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('#FFFF00'), opacity: 1,
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
		pos: [0.86, 0.87], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('#FFFF00'), opacity: 1,
		depth: 0.0
	});

	dayNumberTrackerText = new visual.TextStim({
		win: psychoJS.window,
		name: 'gameTrackerText',
		text: 'CHAT ROOM:',
		font: 'lucida grande',
		units: 'norm',
		alignHoriz: 'center',
		alignVert: 'center',
		pos: [ 0.865, 0.7], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('#00FF00'), opacity: 1,
		depth: 0.0
	});

	dayNumberTracker = new visual.TextStim({
		win: psychoJS.window,
		name: 'gameTracker',
		text: '1/80',
		font: 'lucida grande',
		units: 'norm',
		alignHoriz: 'center',
		alignVert: 'center',
		pos: [ 0.86, 0.63], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('#00FF00'), opacity: 1,
		depth: 0.0
	});

	totalLikesText = new visual.TextStim({
		win: psychoJS.window,
		name: 'pointsTracker',
		text: 'SOCIAL\nAPPROVAL:',
		font: 'lucida grande',
		units: 'norm',
		alignHoriz: 'center',
		alignVert: 'center',
		pos: [0.87, 0.44], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('#00FFFF'), opacity: 1,
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
		pos: [ 0.86, 0.33], height: 0.05, wrapWidth: undefined, ori: 0,
		color: new util.Color('#00FFFF'), opacity: 1,
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
				if (track) track.stop();
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
	if (getQueryVariable('practice') == 'true') {
		total_games = 5
		practice = true;
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
		thisScheduler.add(trialRoutineEachFrameWaitforInput(snapshot));
		thisScheduler.add(trialRoutineEachFrameShowPost(snapshot));
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


/**
 * Call this function to prepate the Post Rectangles
 * @param {*} game_type 
 */
function setupPosts(game_type) {
	// Depending on the game_type, show the recangle Boxies
	if (game_type == 'h6') {
		var MAXPOST = 9
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


		// choice1Button.fillColor = new util.Color(leftFadeColor)
		// choice1Button.color = new util.Color(fontFadeColor)
		// choice2Button.fillColor = new util.Color(rightFadeColor)
		// choice2Button.color = new util.Color(fontFadeColor)

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

		// If it's a new game, clear other texts
		// console.log(lastGameNumber)
		if (game_number != lastGameNumber) {
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

		setupPosts(game_type)
		

		choice1Button.setText('Country Music') // will need to grap topc from schedule // TODO
		choice2Button.setText('Rap Music') // will need to grab the topic from schedule // TODO
		
		currentTrialNumber.setText(`${trial_num}`)
		dayNumberTracker.setText(`${game_number + 1}/${total_games}`)
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
		dayNumberTrackerText.setAutoDraw(true)
		dayNumberTracker.setAutoDraw(true)
		totalLikesText.setAutoDraw(true)
		totalLikesTracker.setAutoDraw(true)

		choice1Button.setAutoDraw(true)
		choice2Button.setAutoDraw(true)


		newLoadingAnimation()

		
		logoStim.setAutoDraw(true)
		usernameStim.setAutoDraw(true)
		fullNameStim.setAutoDraw(true)

		pageName.setAutoDraw(true)
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


function reset_stims() {

	console.log('reset stims called')
	choice1Button.setAutoDraw(false)
	choice2Button.setAutoDraw(false)

	for (var i = 0; i <= 9; i++) {
		// Init Left textStims
		postStims[i].rect.status = PsychoJS.Status.FINISHED
		postStims[i].rect.setAutoDraw(false) // draw rect

		postStims[i].post_text.status = PsychoJS.Status.FINISHED
		postStims[i].post_text.setAutoDraw(false)

		postStims[i].like_icon.status = PsychoJS.Status.FINISHED
		postStims[i].like_icon.setAutoDraw(false)

		postStims[i].like_icon_outline.status = PsychoJS.Status.FINISHED
		postStims[i].like_icon_outline.setAutoDraw(false)

		postStims[i].like_posts.status = PsychoJS.Status.FINISHED
		postStims[i].like_posts.setAutoDraw(false)

		postStims[i].profile_photo.status = PsychoJS.Status.FINISHED
		postStims[i].profile_photo.setAutoDraw(false) // draw profile pic post
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
			if ( theseKeys && theseKeys.length > 0 ){  // at least one key was pressed
				resp.keys = theseKeys[0].name;  // just the last key pressed
				resp.rt = theseKeys[0].rt;
				
				
				lastTrialKeyPressed = resp.keys;
				console.log(lastTrialKeyPressed)

				// Set the position of the stims so that the posts overlapp based on resopnse
				// For Left Topic, Put the Likes on the Left and the Profile logo on the right
				// For Right Topic, Put the Lines on the Right and the Profile logo on the left.
				
				if (resp.keys == LEFT_KEY) {
					
					postStims[trial_num].profile_photo = new visual.ImageStim({
						win : psychoJS.window,
						name : `profile_pic_post_${trial_num}`, units : 'norm', 
						image : 'profile_pic',
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
						image : 'heart', mask : undefined,
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
						image : 'heart_outline', mask : undefined,
						ori: 0,
						pos: [ post_stim_x_pos.left.like_icon, postStims[trial_num].postlikeIcon_y ], 
						size: [0.04,0.05],
						color: undefined, opacity: 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});

					// postStims[i].like_animation = new visual.ImageStim({
					// 	win : psychoJS.window,
					// 	name : `loading_${trial_num}`, units : 'norm', 
					// 	image : 'loading', mask : undefined,
					// 	ori: 0,
					// 	pos: [ post_stim_x_pos.left.like_icon, postStims[trial_num].postlikeIcon_y + .03 ], 
					// 	size: [0.04,0.05],
					// 	color: undefined, opacity: 1,
					// 	flipHoriz : false, flipVert : false,
					// 	texRes : 128, interpolate : true, depth : 0
					// });
					

					// postStims[trial_num]['profile_photo'].pos[0] = post_stim_x_pos.left.profile_photo
					postStims[trial_num].post_text.setText(leftTopic[leftTopicCounter])
					leftTopicCounter++
					postStims[trial_num].post_text.pos[0] = post_stim_x_pos.left.post_text
					postStims[trial_num].post_text.alignVert = 'right'
					postStims[trial_num].post_text.alignHoriz = 'right'
			
					postStims[trial_num].like_posts.pos[0] = post_stim_x_pos.left.like_posts
					// postStims[trial_num]['like_posts'].setText(left_reward)
					trial_reward = left_reward
					
					postStims[trial_num].rect.fillColor = new util.Color(leftColor)
					postStims[trial_num].rect.lineColor = new util.Color(leftColor)

					// Set the other bandit as XX
					// bandits['right'][trial_num].setText('XX')
					totalPoints = totalPoints + left_reward
				} else if (resp.keys == RIGHT_KEY) {

					postStims[trial_num].profile_photo = new visual.ImageStim({
						win : psychoJS.window,
						name : `profile_pic_post_${trial_num}`, units : 'norm', 
						image : 'profile_pic',
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
						image : 'heart', mask : undefined,
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
						image : 'heart_outline', mask : undefined,
						ori: 0,
						pos: [ post_stim_x_pos.right.like_icon, postStims[trial_num].postlikeIcon_y ], 
						size: [0.04,0.05],
						color: undefined, opacity: 1,
						flipHoriz : false, flipVert : false,
						texRes : 128, interpolate : true, depth : 0
					});


					// postStims[i].like_animation = new visual.ImageStim({
					// 	win : psychoJS.window,
					// 	name : `loading_${trial_num}`, units : 'norm', 
					// 	image : 'loading', mask : undefined,
					// 	ori: 0,
					// 	pos: [ post_stim_x_pos.right.like_icon, postStims[trial_num].postlikeIcon_y + .03 ],
					// 	size: [0.04,0.05],
					// 	color: undefined, opacity: 1,
					// 	flipHoriz : false, flipVert : false,
					// 	texRes : 128, interpolate : true, depth : 0
					// });

					postStims[trial_num].post_text.setText(rightTopic[rightTopicCounter])
					rightTopicCounter++
					postStims[trial_num].post_text.pos[0] = post_stim_x_pos.right.post_text
					postStims[trial_num].post_text.alignVert = 'left'
					postStims[trial_num].post_text.alignHoriz = 'left'			
					postStims[trial_num].like_posts.pos[0] = post_stim_x_pos.right.like_posts
					// postStims[trial_num]['like_posts'].setText(right_reward)
					trial_reward = right_reward
					
					postStims[trial_num].rect.fillColor = new util.Color(rightColor)
					// bandits['left'][trial_num].setText('XX')
					totalPoints = totalPoints + right_reward
				}
			

				// Fade out the choices
				choice1Button.fillColor = new util.Color(leftFadeColor)
				choice1Button.color = new util.Color(fontFadeColor)
				choice2Button.fillColor = new util.Color(rightFadeColor)
				choice2Button.color = new util.Color(fontFadeColor)

				// Reset Trial Time
				trialClock.reset();

				animationAttributes = getAnimationAttributes(trial_reward)

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

		if (t > 0.5) {
			postStims[trial_num].post_text.setAutoDraw(true)
			postStims[trial_num].like_icon_outline.setAutoDraw(true) // show the heart outline
			
			// postStims[trial_num].like_posts.setAutoDraw(true)
			postStims[trial_num].profile_photo.setAutoDraw(true)
			
			loadingAnimation()
		}

		
		
		

		// check for quit (typically the Esc key)
		if (psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {
			return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false);
		}

		// After 5 seconds go to the next Trial (post)
		if (t > 3) {
			removeLoadingAnimation()
			newLoadingAnimation()
			postStims[trial_num].like_icon_outline.setAutoDraw(false) // don't show the heart outline
			postStims[trial_num].like_icon.setAutoDraw(true) // show filled in heart
			postStims[trial_num].like_posts.setText(trial_reward)
			postStims[trial_num].like_posts.setAutoDraw(true)
			return Scheduler.Event.NEXT;
		}
		return Scheduler.Event.FLIP_REPEAT;
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

		// console.log("Trial Route End for Trial " + trial_num)

		if (resp.keys == LEFT_KEY) {
			lastTrialPoints = left_reward
		}
		if (resp.keys == RIGHT_KEY) {
			lastTrialPoints = right_reward
		}

		lastGameNumber = game_number
		
		// store data for thisExp (ExperimentHandler)
		psychoJS.experiment.addData('resp.keys', key_map[resp.keys]);
		psychoJS.experiment.addData('points', totalPoints);
		// psychoJS.experiment.addData('resp.corr', resp.corr);
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
		// update component parameters for each repeat
		// keep track of which components have finished
		readyComponents = [];

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

var thanksComponents;
function thanksRoutineBegin(trials) {
	return function () {
		//------Prepare to start Routine 'thanks'-------
		// Clear Trial Components
		reset_stims()
		t = 0;
		thanksClock.reset(); // clock
		frameN = -1;
		routineTimer.add(25.000000);
		// update component parameters for each repeat
		// keep track of which components have finished

		// Show Final Points and money earned
		thanksText.setText(`This is the end of the task run.\n\n\n Total Points Earned: ${totalPoints} \n\n Total Cents Earned: ${totalPoints / 10 } =  $${ (totalPoints / 1000).toFixed(2)}`)
		
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
				sendData(psychoJS.experiment._trialsData)
			} else {
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