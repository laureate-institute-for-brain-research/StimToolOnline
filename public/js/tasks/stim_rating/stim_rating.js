﻿/* eslint-disable no-undef */
/* eslint-disable camelcase */
/* eslint-disable eqeqeq */
/**
 * Stim Rating
 * @author Aardron Robinson
 */

/* jshint -W069 */
/* Disable Warning Justification:
Using bracket notation because it's familiar coding convention with python
Counterpart
*/

import { core, data, sound, util, visual } from '../../../../../../../psychojs/psychojs-2021.2.3.js'

import { Sound } from '../../../../../../../lib/sound-2020.1.js'

const event_types = {
  INSTRUCT_ONSET: 1,
  TASK_ONSET: 2,
  TRIAL_ONSET: 3,
  CHOICE_ONSET: 4,
  CHOICE: 5,
  FEEDBACK_ONSET: 6,
  FIXATION_ONSET: 7,
  AUDIO_ONSET: 8
}

const trials_data = []
let config_values = {}

let main_loop_count = 0
var last_trial_num = 0
let total_requests = 0
const { PsychoJS } = core
const { TrialHandler } = data
const { Scheduler } = util
// some handy aliases as in the psychopy scripts;
const { abs, sin, cos, PI: pi, sqrt } = Math
const { round } = util

// TASK PARAMS
const RIGHT_KEY = 'right'

let window_ratio = 4 / 3 // used for general stimuli sizing

// global flags
let init_fixation_flag = true
let in_practice = false
let passed_instr_check = false
let instr_check_selections = []

// init psychoJS:
const psychoJS = new PsychoJS({
  debug: false
})

function waitForElm (selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector))
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector))
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  })
}

window.onload = function () {
  const id = getQueryVariable('id')

  // Get info Promize
  const getInfoPromise = new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: '/getInfo',
      data: { id },
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
          url: '/js/tasks/stim_rating/' + getQueryVariable('run'),
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
      resources.push({ name: 'practice_schedule.csv', path: values.practice_schedule })
      resources.push({ name: 'config.csv', path: values.config })

      // Add file paths to expInfo
      if (values.schedule) expInfo.task_schedule = values.schedule
      if (values.instruct_schedule) expInfo.instruct_schedule = values.instruct_schedule
      if (values.practice_schedule) expInfo.practice_schedule = values.practice_schedule
      if (values.config) expInfo.task_config = values.config

      // Import the instruction slides
      return new Promise((resolve, reject) => {
        $.ajax({
          type: 'GET',
          url: values.instruct_schedule,
          dataType: 'text',
          async: false,
          success: (data) => {
            const out = []
            const allRows = data.split('\n') // split rows at new line

            const headerRows = allRows[0].split(',')

            for (let i = 1; i < allRows.length; i++) {
              const obj = {}
              const currentLine = allRows[i].split(',')
              for (let j = 0; j < headerRows.length; j++) {
                obj[headerRows[j]] = currentLine[j]
              }
              out.push(obj)

              if (obj.instruct_slide && obj.instruct_slide != '\n') {
                resources.push({ name: obj.instruct_slide, path: obj.instruct_slide })
              }

              if (obj.audio_path && obj.audio_path != '\n') {
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
      return new Promise((resolve, reject) => {
        $.ajax({
          type: 'GET',
          url: expInfo.task_schedule,
          dataType: 'text',
          async: false,
          success: (data) => {
            const allRows = data.split('\n') // split rows at new line

            const headerRows = allRows[0].split(',')

            for (let i = 1; i < allRows.length; i++) {
              const obj = {}
              const currentLine = allRows[i].split(',')
              for (let j = 0; j < headerRows.length; j++) {
                obj[headerRows[j]] = currentLine[j]
              }
              // If there's media add to resources
              if (obj.images != 'None' && obj.images != undefined) {
                obj.images.split(' ').forEach((x) => {
                  resources.push({ name: x, path: x })
                })
              }
              if (obj.videos != 'None' && obj.videos != undefined) {
                obj.videos.split(' ').forEach((x) => {
                  resources.push({ name: x, path: x })
                })
              }
              if (obj.sounds != 'None' && obj.sounds != undefined) {
                obj.sounds.split(' ').forEach((x) => {
                  resources.push({ name: x, path: x })
                })
              }
              if (obj.others != 'None' && obj.others != undefined) {
                obj.others.split(' ').forEach((x) => {
                  resources.push({ name: x, path: x })
                })
              }
            }

            resolve(data)
          }
        })
      })
    })
  // Add config values resources
    .then((values) => {
      // Add instrcution Images
      return new Promise((resolve, reject) => {
        $.ajax({
          type: 'GET',
          url: expInfo.task_config,
          dataType: 'text',
          async: false,
          success: (data) => {
            const allRows = data.split('\n') // split rows at new line

            const headerRows = allRows[0].split(',')

            for (let i = 1; i < 2; i++) {
              var obj = {}
              const currentLine = allRows[i].split(',')
              for (let j = 0; j < headerRows.length; j++) {
                obj[headerRows[j]] = currentLine[j]
              }
            }

            config_values = obj

            resolve(data)
          }
        })
      })
    })
    .then((values) => {
      // Add practice Images
      return new Promise((resolve, reject) => {
        $.ajax({
          type: 'GET',
          url: expInfo.practice_schedule,
          dataType: 'text',
          async: false,
          success: (data) => {
            const allRows = data.split('\n') // split rows at new line

            const headerRows = allRows[0].split(',')

            for (let i = 1; i < allRows.length; i++) {
              const obj = {}
              const currentLine = allRows[i].split(',')
              for (let j = 0; j < headerRows.length; j++) {
                obj[headerRows[j]] = currentLine[j]
              }
              // If there's media add to resources
              if (obj.images != 'None' && obj.images != undefined) {
                obj.images.split(' ').forEach((x) => {
                  resources.push({ name: x, path: x })
                })
              }
              if (obj.videos != 'None' && obj.videos != undefined) {
                obj.videos.split(' ').forEach((x) => {
                  resources.push({ name: x, path: x })
                })
              }
              if (obj.sounds != 'None' && obj.sounds != undefined) {
                obj.sounds.split(' ').forEach((x) => {
                  resources.push({ name: x, path: x })
                })
              }
              if (obj.others != 'None' && obj.others != undefined) {
                obj.others.split(' ').forEach((x) => {
                  resources.push({ name: x, path: x })
                })
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

      // Sanitze the resources. Needs to be clean so that psychoJS doesn't complain
      resources = sanitizeResources(resources)
      // expInfo.study = study
      psychoJS.start({
        expName,
        expInfo,
        resources
      })
      psychoJS._config.experiment.saveFormat = undefined // don't save to client side
    })
}

// open window:
psychoJS.openWindow({
  fullscr: (window.location.hostname != 'localhost'), // not full screen at localhost
  color: new util.Color('black'),
  units: 'height',
  waitBlanking: true
})

// store info about the experiment session:
const expName = 'Stim Rating' // from the Builder filename that created this script
var expInfo = { participant: '', session: '', run_id: '', date: formatDate(), study: '' }

// schedule the experiment:
psychoJS.schedule(psychoJS.gui.DlgFromDict({
  dictionary: expInfo,
  title: expName
}))

waitForElm('.ui-dialog').then((elm) => {
  $('#buttonOk').button('option', 'disabled', true)
  $('#progressMsg').on('DOMSubtreeModified', function () {
    if (document.getElementById('progressMsg').textContent == 'all resources downloaded') {
      $('#buttonOk').button('option', 'disabled', false)
    }
  })
})

const flowScheduler = new Scheduler(psychoJS)
const dialogCancelScheduler = new Scheduler(psychoJS)
psychoJS.scheduleCondition(function () { return (psychoJS.gui.dialogComponent.button === 'OK') }, flowScheduler, dialogCancelScheduler)

// flowScheduler gets run if the participants presses OK
flowScheduler.add(updateInfo) // add timeStamp
flowScheduler.add(experimentInit)

// INSTRUCTIONS BLOCK
// Runs through instructions
if (!getQueryVariable('skip_instructions')) {
  const instruct_pagesLoopScheduler = new Scheduler(psychoJS)
  flowScheduler.add(instruct_pagesLoopBegin, instruct_pagesLoopScheduler)
  flowScheduler.add(instruct_pagesLoopScheduler)
  flowScheduler.add(instruct_pagesLoopEnd)
}

// PRACTICE BLOCK
if (!getQueryVariable('skip_practice')) {
  // Single Slide
  flowScheduler.add(readyRoutineBegin('PRACTICE'))
  flowScheduler.add(readyRoutineEachFrame())
  flowScheduler.add(readyRoutineEnd())

  const practiceTrialsLoopScheduler = new Scheduler(psychoJS)
  flowScheduler.add(practiceTrialsLoopBegin, practiceTrialsLoopScheduler)
  flowScheduler.add(practiceTrialsLoopScheduler)
  flowScheduler.add(trialsLoopEnd)
}

// MAIN BLOCK
// Ready Routine
flowScheduler.add(readyRoutineBegin('MAIN'))
flowScheduler.add(readyRoutineEachFrame())
flowScheduler.add(readyRoutineEnd())

const trialsLoopScheduler = new Scheduler(psychoJS)
flowScheduler.add(trialsLoopBegin, trialsLoopScheduler)
flowScheduler.add(trialsLoopScheduler)
flowScheduler.add(trialsLoopEnd)

// quit if user presses Cancel in dialog box:
dialogCancelScheduler.add(quitPsychoJS, '', false)

// Add Slides to resources
var resources = [
  { name: 'practice_schedule.csv', path: '/js/tasks/stim_rating/practice_schedule.csv' },
  { name: 'PRACTICE_ready', path: '/js/tasks/stim_rating/media/instructions/Slide10.JPG' },
  { name: 'MAIN_ready', path: '/js/tasks/stim_rating/media/instructions/Slide11.JPG' },
  { name: 'PRACTICE_ready_audio.mp3', path: '/js/tasks/stim_rating/media/instructions_audio/Slide10.mp3' },
  { name: 'MAIN_ready_audio.mp3', path: '/js/tasks/stim_rating/media/instructions_audio/Slide11.mp3' }
]

let frameDur
function updateInfo () {
  expInfo.date = util.MonotonicClock.getDateStr() // add a simple timestamp
  expInfo.expName = expName
  expInfo.psychopyVersion = '2021.2.3'
  expInfo.OS = window.navigator.platform

  // store frame rate of monitor if we can measure it successfully
  expInfo.frameRate = psychoJS.window.getActualFrameRate()
  if (typeof expInfo.frameRate !== 'undefined') { frameDur = 1.0 / Math.round(expInfo.frameRate) } else { frameDur = 1.0 / 60.0 } // couldn't get a reliable measure so guess

  // add info from the URL:
  util.addInfoFromUrl(expInfo)

  return Scheduler.Event.NEXT
}

let slideStim
let slides
let instructClock

let kb
let trialClock
let toneClock
let feedbackClock
let respondClock

// static stim
let questionText
let tryAgainText
/// / UI Trackers
let currentTrialNumber
let currentTrialText

/// / Fixation
let points_fixation_stim

// timers
let t_end
let readyClock
let endClock
let track

let resp
let thanksClock
let thanksText
let globalClock
let routineTimer

function experimentInit () {
  // Check if there is an practice

  psychoJS.window.color = new util.Color(config_values.background_color)

  window_ratio = psychoJS.window.size[0] / psychoJS.window.size[1]

  // Initialize components for Routine "instruct"
  instructClock = new util.Clock()
  instructClock.reset()

  slideStim = new visual.ImageStim({
    win: psychoJS.window,
    name: 'slide_stim',
    units: 'height',
    image: undefined,
    mask: undefined,
    ori: 0,
    pos: [0, 0],
    color: new util.Color([1, 1, 1]),
    opacity: 1,
    flipHoriz: false,
    flipVert: false,
    texRes: 128,
    interpolate: true,
    depth: 0
  })

  readyStim = new visual.ImageStim({
    win: psychoJS.window,
    name: 'ready_stim',
    units: 'height',
    image: 'PRACTICE_ready',
    mask: undefined,
    ori: 0,
    pos: [0, 0],
    color: new util.Color([1, 1, 1]),
    opacity: 1,
    flipHoriz: false,
    flipVert: false,
    texRes: 128,
    interpolate: true,
    depth: 0
  })

  kb = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true })

  // Initialize components for Routine "trial"
  trialClock = new util.Clock()
  toneClock = new util.Clock()
  feedbackClock = new util.Clock()
  respondClock = new util.Clock()

  // Trial/Choice counter
  currentTrialText = new visual.TextStim({
    win: psychoJS.window,
    name: 'trialTracker',
    text: 'Trial Number: ',
    font: 'Arial',
    units: 'height',
    pos: [window_ratio * 0.35, 0.46],
    height: 0.027,
    wrapWidth: undefined,
    ori: 0,
    alignHoriz: 'right',
    color: new util.Color('white'),
    opacity: 1,
    depth: 0.0
  })
  currentTrialNumber = new visual.TextStim({
    win: psychoJS.window,
    name: 'trialTracker',
    text: '1',
    font: 'Arial',
    units: 'height',
    pos: [currentTrialText.getBoundingBox().right + (window_ratio * 0.005), 0.46],
    height: 0.027,
    wrapWidth: undefined,
    ori: 0,
    alignHoriz: 'left',
    color: new util.Color('white'),
    opacity: 1,
    depth: 0.0
  })

  questionText = new visual.TextStim({
    win: psychoJS.window,
    name: 'trialTracker',
    text: '',
    font: 'Arial',
    units: 'height',
    pos: [0, 0.4],
    height: 0.027,
    wrapWidth: undefined,
    ori: 0,
    alignHoriz: 'center',
    color: new util.Color('white'),
    opacity: 1,
    depth: 0.0
  })

  tryAgainText = new visual.TextStim({
    win: psychoJS.window,
    name: 'trialTracker',
    text: 'Your answer/answers are NOT correct. Please read the instructions and try again.',
    font: 'Arial',
    units: 'height',
    pos: [0, 0],
    height: 0.05,
    wrapWidth: undefined,
    ori: 0,
    alignHoriz: 'center',
    color: new util.Color('white'),
    opacity: 1,
    depth: 0.0
  })

  // Fixation
  points_fixation_stim = new visual.TextStim({
    win: psychoJS.window,
    name: 'pointsTracker',
    text: 'X',
    font: 'Arial',
    units: 'norm',
    pos: [0, 0],
    height: 0.12,
    wrapWidth: undefined,
    ori: 0,
    color: new util.Color('white'),
    opacity: 1,
    depth: 0.0
  })

  endClock = new util.Clock()

  resp = new core.Keyboard({ psychoJS, clock: new util.Clock(), waitForStart: true })

  // Initiali comnponenents for Routine 'read'y
  readyClock = new util.Clock()
  // Initialize components for Routine "thanks"
  thanksClock = new util.Clock()
  thanksText = new visual.TextStim({
    win: psychoJS.window,
    name: 'thanksText',
    text: 'This is the end of the task run. Please wait for the upcoming survey and for all task data to be saved.\n This may take a while, so please be patient.\n There will be no payment if you do not progress to the follow-up page containg the submission code.\n Thank you!',
    font: 'Arial',
    units: 'height',
    pos: [0, 0],
    height: 0.05,
    wrapWidth: undefined,
    ori: 0,
    color: new util.Color('white'),
    opacity: 1,
    depth: 0.0
  })

  // Create some handy timers
  globalClock = new util.Clock() // to track the time since experiment started
  routineTimer = new util.CountdownTimer() // to track time remaining of each (non-slip) routine

  globalClock.reset() // start Global Clock

  mark_event(trials_data, globalClock, 'NA', 'NA', event_types.TASK_ONSET,
    'NA', 'NA', 'NA')
  return Scheduler.Event.NEXT
}

/**
 * Reset the Stims back to their intiaiization configurations
 */
function instruct_pagesLoopBegin (thisScheduler) {
  // set up handler to look up the conditions

  slides = new TrialHandler({
    psychoJS,
    nReps: 1,
    method: TrialHandler.Method.SEQUENTIAL,
    extraInfo: expInfo,
    originPath: undefined,
    trialList: 'instruct_schedule.csv',
    seed: undefined,
    name: 'slides'
  })

  psychoJS.experiment.addLoop(slides) // add the loop to the experiment

  const snapshot = slides.getSnapshot()
  thisScheduler.add(importConditions(snapshot))
  thisScheduler.add(instructRoutineBegin(snapshot))
  thisScheduler.add(instructSlideRoutineEachFrame(snapshot, slides))
  thisScheduler.add(instructRoutineEnd(snapshot))
  thisScheduler.add(endLoopIteration(thisScheduler, snapshot))

  // console.log(thisScheduler)
  block_type = 'INSTRUCTIONS'
  mark_event(trials_data, globalClock, 0, block_type, event_types.BLOCK_ONSET,
    'NA', 'NA', 'NA')

  return Scheduler.Event.NEXT
}

let block_type
let t
let frameN
let instructComponents
let time_audio_end
function instructRoutineBegin (trials) {
  return function () {
    // ------Prepare to start Routine 'instruct'-------
    t = 0
    instructClock.reset() // clock
    frameN = -1
    // console.log(instruct_slide)
    slideStim.setImage(instruct_slide)
    // update component parameters for each repeat
    kb.keys = undefined
    kb.rt = undefined
    // keep track of which components have finished
    instructComponents = [slideStim]

    instructComponents.push(kb)

    console.log('InstructionSlides Index: ', trials.thisIndex)
    instruct_prev_pressed = false

    if (audio_path) {
      track = new Sound({
        win: psychoJS.window,
        value: audio_path
      })
      console.log(audio_path)
      time_audio_end = t + track.getDuration()
      track.setVolume(1.0)
      track.play()
      mark_event(trials_data, globalClock, trials.thisIndex, block_type, event_types.AUDIO_ONSET,
        'NA', instruct_slide, audio_path)
    }

    for (const thisComponent of instructComponents) {
      if ('status' in thisComponent) { thisComponent.status = PsychoJS.Status.NOT_STARTED }
    }

    return Scheduler.Event.NEXT
  }
}

let continueRoutine
let newSlide
var instruct_prev_pressed = false
function instructSlideRoutineEachFrame (trials, slides) {
  return function () {
    // ------Loop for each frame of Routine 'instruct'-------
    let continueRoutine = true // until we're told otherwise
    // get current time
    t = instructClock.getTime()
    frameN = frameN + 1// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame

    // *instrText1* updates
    if (t >= 0 && slideStim.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      slideStim.tStart = t // (not accounting for frame time here)
      slideStim.frameNStart = frameN // exact frame index
      slideStim.setAutoDraw(true)
      // instrText1.setAutoDraw(true);
    }

    // New Slide Call, set it after pressing key
    // console.log(track.status)
    if (newSlide) {
      console.log('setting new image', instruct_slide, 'index:', trials.thisIndex, 'Audio: ', audio_path)
      slideStim.setImage(instruct_slide)
      newSlide = false

      if (audio_path && !instruct_prev_pressed) {
        if (track && (track.status != PsychoJS.Status.NOT_STARTED)) {
          track.stop()
          track = new Sound({
            win: psychoJS.window,
            value: audio_path
          })
          time_audio_end = t + track.getDuration()
          // console.log(audio_path)
          track.setVolume(1.0)
          track.play()
        } else {
          track = new Sound({
            win: psychoJS.window,
            value: audio_path
          })
          time_audio_end = t + track.getDuration()
          // console.log(audio_path)
          track.setVolume(1.0)
          track.play()
        }
      }
    }
    // *ready* updates
    if (t >= 0 && kb.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      kb.tStart = t // (not accounting for frame time here)
      kb.frameNStart = frameN // exact frame index

      // keyboard checking is just starting
      psychoJS.window.callOnFlip(function () { kb.clock.reset() }) // t=0 on next screen flip
      psychoJS.window.callOnFlip(function () { kb.start() }) // start on screen flip
      psychoJS.window.callOnFlip(function () { kb.clearEvents() })
    }

    if (kb.status === PsychoJS.Status.STARTED) {
      const theseKeys = kb.getKeys({ keyList: ['right', 'left', 'z'], waitRelease: false })

      // Force Progression
      if (theseKeys.length > 0 && theseKeys[0].name == 'z') { // at least one key was pressed
        slides.thisIndex++ // incremenet the index
        if (slides.thisIndex >= slides.nTotal) {
          // if we reached here, it means we reached the last and we should move on.
          continueRoutine = false
        }
        trials = slides.getSnapshot() // get new snapshot after incrementing index
        psychoJS.importAttributes(trials.getCurrentTrial()) // import the attributes to main class
        // console.log(trials)
        newSlide = true
      }

      if (theseKeys.length > 0 && theseKeys[0].name == 'right') { // at least one key was pressed
        // Verify if the audio has beend played
        instruct_prev_pressed = false
        if (audio_path && (t <= time_audio_end)) {
          return Scheduler.Event.FLIP_REPEAT
        }

        slides.thisIndex++ // incremenet the index
        if (slides.thisIndex >= slides.nTotal) {
          // if we reached here, it means we reached the last and we should move on.
          continueRoutine = false
        }
        trials = slides.getSnapshot() // get new snapshot after incrementing index
        psychoJS.importAttributes(trials.getCurrentTrial()) // import the attributes to main class
        // console.log(trials)
        newSlide = true
      }
      if (theseKeys.length > 0 && theseKeys[0].name == 'left') {
        // Presse the back button
        instruct_prev_pressed = true
        // Verify if the audio has beend played
        if (audio_path && (t <= time_audio_end)) {
          return Scheduler.Event.FLIP_REPEAT
        }
        slides.thisIndex-- // decremenet the index
        if (slides.thisIndex < 0) {
          // If the index is 0, that means we reached the very first slide
          slides.thisIndex = 0
        } else {
          trials = slides.getSnapshot()
          psychoJS.importAttributes(trials.getCurrentTrial())
          // console.log(trials)
          newSlide = true
        }
      }
    }

    // check for quit (typically the Esc key)
    if (psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false)
    }

    // check if the Routine should terminate
    if (!continueRoutine) { // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT
    }

    continueRoutine = false // reverts to True if at least one component still running
    for (const thisComponent of instructComponents) {
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true
        break
      }
    }

    // refresh the screen if continuing
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT
    } else {
      return Scheduler.Event.NEXT
    }
  }
}

function instructRoutineEnd (trials) {
  return function () {
    // ------Ending Routine 'instruct'-------
    for (const thisComponent of instructComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false)
      }
    }
    // the Routine "instruct" was not non-slip safe, so reset the non-slip timer
    routineTimer.reset()

    return Scheduler.Event.NEXT
  }
}

var frameRemains

var readyComponents
let readyStim
function readyRoutineBegin (block_type) {
  return function () {
    // ------Prepare to start Routine 'ready'-------
    t = 0
    psychoJS.eventManager.clearEvents()
    readyClock.reset() // clock
    frameN = -1

    // Set readyStim based on block_type
    in_practice = false
    switch (block_type) {
      case 'PRACTICE':
        in_practice = true
        readyStim = new visual.ImageStim({
          win: psychoJS.window,
          name: 'ready_stim',
          units: 'height',
          image: 'PRACTICE_ready',
          mask: undefined,
          ori: 0,
          pos: [0, 0],
          color: new util.Color([1, 1, 1]),
          opacity: 1,
          flipHoriz: false,
          flipVert: false,
          texRes: 128,
          interpolate: true,
          depth: 0
        })
        track = new Sound({
          win: psychoJS.window,
          value: 'PRACTICE_ready_audio.mp3'
        })
        track.setVolume(1.0)
        break
      case 'MAIN':
        readyStim = new visual.ImageStim({
          win: psychoJS.window,
          name: 'ready_stim',
          units: 'height',
          image: 'MAIN_ready',
          mask: undefined,
          ori: 0,
          pos: [0, 0],
          color: new util.Color([1, 1, 1]),
          opacity: 1,
          flipHoriz: false,
          flipVert: false,
          texRes: 128,
          interpolate: true,
          depth: 0
        })
        track = new Sound({
          win: psychoJS.window,
          value: 'MAIN_ready_audio.mp3'
        })
        track.setVolume(1.0)
        break
      case 'MAIN2':
        readyStim = new visual.ImageStim({
          win: psychoJS.window,
          name: 'break_stim',
          units: 'height',
          image: 'BREAK.jpeg',
          mask: undefined,
          ori: 0,
          pos: [0, 0],
          color: new util.Color([1, 1, 1]),
          opacity: 1,
          flipHoriz: false,
          flipVert: false,
          texRes: 128,
          interpolate: true,
          depth: 0
        })
        break
      case 'MAIN3':
        readyStim = new visual.ImageStim({
          win: psychoJS.window,
          name: 'break_stim',
          units: 'height',
          image: 'BREAK.jpeg',
          mask: undefined,
          ori: 0,
          pos: [0, 0],
          color: new util.Color([1, 1, 1]),
          opacity: 1,
          flipHoriz: false,
          flipVert: false,
          texRes: 128,
          interpolate: true,
          depth: 0
        })
        break
      default:
        readyStim = new visual.ImageStim({
          win: psychoJS.window,
          name: 'ready_stim',
          units: 'height',
          image: 'MAIN_ready',
          mask: undefined,
          ori: 0,
          pos: [0, 0],
          color: new util.Color([1, 1, 1]),
          opacity: 1,
          flipHoriz: false,
          flipVert: false,
          texRes: 128,
          interpolate: true,
          depth: 0
        })
        track = undefined
    }

    mark_event(trials_data, globalClock, 0, block_type, event_types.BLOCK_ONSET,
      'NA', 'NA', 'NA')

    routineTimer.add(2.000000)
    // update component parameters for each repeat
    // keep track of which components have finished
    readyComponents = [readyStim]
    readyStim.setAutoDraw(true)
    return Scheduler.Event.NEXT
  }
}

function readyRoutineEachFrame () {
  return function () {
    // ------Loop for each frame of Routine 'ready'-------
    let continueRoutine = true // until we're told otherwise

    if (config_values.instr_check === 'true') {
      return Scheduler.Event.NEXT
    }
    // get current time
    t = readyClock.getTime()
    if (resp.status == PsychoJS.Status.NOT_STARTED) {
      resp.start()

      if (track) {
        console.log('ready track: ', track)
        track.play()
      }
    }

    // update/draw components on each frame
    const theseKeys = resp.getKeys({ keyList: [RIGHT_KEY, 'right'], waitRelease: false })
    if (theseKeys.length > 0) {
      if (track) track.stop()
      continueRoutine = false
    }

    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false)
    }
    // refresh the screen if continuing
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT
    } else {
      resp.stop()
      return Scheduler.Event.NEXT
    }
  }
}

function readyRoutineEnd (trials) {
  return function () {
    // ------Ending Routine 'ready'-------
    for (const thisComponent of readyComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false)
      }
    }
    return Scheduler.Event.NEXT
  }
}

let trials
let trial_type
function practiceTrialsLoopBegin(thisScheduler) {
  if (expInfo.practice_schedule == undefined) {
    return Scheduler.Event.NEXT
  }
  trials = new TrialHandler({
    psychoJS,
    nReps: 1,
    method: TrialHandler.Method.SEQUENTIAL,
    extraInfo: expInfo,
    originPath: undefined,
    trialList: 'practice_schedule.csv',
    seed: undefined,
    name: 'trials'
  })

  last_trial_num = trials.nTotal

  psychoJS.experiment.addLoop(trials) // add the loop to the experiment

  endClock.reset()
  resp.stop()
  resp.clearEvents()
  resp.status = PsychoJS.Status.NOT_STARTED
  init_fixation_flag = true
  // Schedule all the trials in the trialList:
  if (config_values.instr_check === 'false') {
    for (const thisTrial of trials) {
      const snapshot = trials.getSnapshot()

      thisScheduler.add(importConditions(snapshot))
      thisScheduler.add(initialFixation(snapshot))
      thisScheduler.add(trialRoutineBegin(snapshot))
      thisScheduler.add(trialRoutineRespond(snapshot))
      thisScheduler.add(trialRoutineEnd(snapshot))
      thisScheduler.add(endLoopIteration(thisScheduler, snapshot))
    }
    trial_type = 'PRACTICE'
    mark_event(trials_data, globalClock, 'NA', trial_type, event_types.BLOCK_ONSET,
      'NA', 'NA', 'NA')
  }
  return Scheduler.Event.NEXT
}

function trialsLoopBegin (thisScheduler) {
  endClock.reset()

  resp.stop()
  resp.clearEvents()
  resp.status = PsychoJS.Status.NOT_STARTED

  trials = new TrialHandler({
    psychoJS,
    nReps: 1,
    method: TrialHandler.Method.SEQUENTIAL,
    extraInfo: expInfo,
    originPath: undefined,
    trialList: 'run_schedule.xls',
    seed: undefined,
    name: 'trials'
  })

  main_loop_count = 0
  last_trial_num = trials.nTotal

  psychoJS.experiment.addLoop(trials) // add the loop to the experiment

  init_fixation_flag = true

  // Schedule all the trials in the trialList:
  for (const thisTrial of trials) {
    const snapshot = trials.getSnapshot()

    thisScheduler.add(importConditions(snapshot))
    thisScheduler.add(initialFixation(snapshot))
    thisScheduler.add(trialRoutineBegin(snapshot))
    thisScheduler.add(trialRoutineRespond(snapshot))
    thisScheduler.add(trialRoutineEnd(snapshot))
    thisScheduler.add(endLoopIteration(thisScheduler, snapshot))
  }
  trial_type = 'MAIN'
  return Scheduler.Event.NEXT
}

function instruct_pagesLoopEnd () {
  psychoJS.experiment.removeLoop(slides)
  return Scheduler.Event.NEXT
}

// SHow the points in the trial
function trialsLoopEnd () {
  currentTrialNumber.setAutoDraw(false)
  slideStim.setAutoDraw(false)

  psychoJS.experiment.removeLoop(trials)
  psychoJS.experiment.addData('globalClock', globalClock.getTime())

  if (config_values.instr_check === 'true' && !passed_instr_check && !in_practice) {
    // INSTRUCTIONS BLOCK
    // Runs through instructions
    if (!getQueryVariable('skip_instructions')) {
      const instruct_pagesLoopScheduler = new Scheduler(psychoJS)
      flowScheduler.add(instruct_pagesLoopBegin, instruct_pagesLoopScheduler)
      flowScheduler.add(instruct_pagesLoopScheduler)
      flowScheduler.add(instruct_pagesLoopEnd)
    }

    // MAIN BLOCK
    // Ready Routine
    flowScheduler.add(readyRoutineBegin('MAIN'))
    flowScheduler.add(readyRoutineEachFrame())
    flowScheduler.add(readyRoutineEnd())

    const trialsLoopScheduler = new Scheduler(psychoJS)
    flowScheduler.add(trialsLoopBegin, trialsLoopScheduler)
    flowScheduler.add(trialsLoopScheduler)
    flowScheduler.add(trialsLoopEnd)
  } else if (!in_practice) {
    let thanks_text = 'This is the end of the task run. Thank you!'
    if (config_values.instr_check === 'true') {
      thanks_text = 'Your answer/answers are correct! We will now proceed to the task.'
    }
    flowScheduler.add(thanksRoutineBegin(thanks_text))
    flowScheduler.add(thanksRoutineEachFrame(thanks_text))
    flowScheduler.add(thanksRoutineEnd(thanks_text))
    flowScheduler.add(quitPsychoJS, thanks_text, true)
  }

  return Scheduler.Event.NEXT
}

// Recursively set multiplier to find one that both keeps the images ratio and keeps it in the window
function resize_image (image, image_ratio, multiplier) {
  // check if it is not in window ratio (with a 10% tolerance)
  if ((image_ratio * multiplier) > (window_ratio - (window_ratio * 0.1))) {
    // decrease multiplier to try and get it in tolerance
    resize_image(image, image_ratio, multiplier - 0.015)
  } else {
    // set size of image
    image.size = [parseFloat((image_ratio * multiplier).toPrecision(4)), parseFloat(multiplier)]
  }
}

let option_list = []
let options_text_list = []
let option_list_list = []
let option_list_for_input = []
let option_count = 0
let option_row_count = 0
let list_count = 0
let row_center_index = 0
let button_pos = [0, -0.2] // center position
let button_spacing = 0.02
let signage = -1 // screen side
let anchor_type = 'right'
const possible_keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'] // 20 button max for input keys
let input_key_list = []

function generate_option_list () {
  // RESET THESE FOR OPTION PLACEMENT
  option_list = []
  option_list_list = []
  option_list_for_input = []
  input_key_list = []
  row_center_index = 0
  option_row_count = 0
  option_count = 0
  list_count = 0
  button_pos = [0, -0.2] // center position
  signage = -1 // screen side
  anchor_type = 'right'
  button_spacing = parseFloat(config_values.button_spacing)

  // Generate a list for each row of options
  options = options.toString()
  if (config_values.instr_check === 'true') {
    options = options + ' ENTER'
  }
  options_text_list = options.split(' ')
  for (let i = 0; i < options_text_list.length; i += parseInt(config_values.buttons_per_row)) {
    const row = options_text_list.slice(i, i + parseInt(config_values.buttons_per_row))
    option_list_list.push(row)
  }

  // Generate usable key inputs list
  let ix = 0
  options_text_list.forEach((opt) => {
    input_key_list.push(possible_keys[ix])
    ix++
  })

  // Generate properly positioned option buttons
  // Loop through the list of rows
  option_list_list.forEach((opts) => {
    // RESET for new list/row
    list_count++
    option_row_count = 0
    button_pos = [0, -0.2 - ((0.05 + button_spacing) * (list_count - 1))] // center position
    signage = -1 // screen side
    anchor_type = 'right'
    if (list_count > 1) {
      row_center_index = parseInt(config_values.buttons_per_row) * (list_count - 1)
    }
    // Handle proper option button placement one row at a time
    opts.forEach((opt) => {
      option_count++
      option_row_count++
      // positioning logic:
      // If only one, then center.
      // Else, bounce between left and right screen placement.
      if (opts.length == 1) {
        anchor_type = 'center'
      } else if (opts.length % 2 != 0) {
        if (option_row_count == 1) { // special case for first one
          // Either anchor positioning on left or right depending on side placement
          anchor_type = 'center'
          button_pos[0] = button_pos[0]
          signage = signage * -1
        } else if (option_row_count == 2 || option_row_count == 3) { // special case for second and third
          // Either anchor positioning on left or right depending on side placement
          anchor_type = (signage > 0) ? 'left' : 'right'
          button_pos[0] = (option_list[row_center_index].pos[0] + // start at position of furthest button position on correct side
						(signage * option_list[row_center_index].size[0] / 2) + // Add half of size of center button in correct direction
						(signage * button_spacing)) // add button spacing in correct direction
          signage = signage * -1
        } else {
          // Either anchor positioning on left or right depending on side placement
          anchor_type = (signage > 0) ? 'left' : 'right'
          button_pos[0] = (option_list[option_count - 3].pos[0] + // start at position of furthest button position on correct side
						(signage * option_list[option_count - 3].size[0]) + // Add size of button in the correct direction
						(signage * button_spacing)) // add button spacing in correct direction
          signage = signage * -1
        }
      } else {
        if (option_row_count == 1 || option_row_count == 2) { // special case for first two
          // Either anchor positioning on left or right depending on side placement
          anchor_type = (signage > 0) ? 'left' : 'right'
          button_pos[0] = button_pos[0] + (button_spacing / 2 * option_row_count * signage)
          signage = signage * -1
        } else {
          // Either anchor positioning on left or right depending on side placement
          anchor_type = (signage > 0) ? 'left' : 'right'
          button_pos[0] = (option_list[option_count - 3].pos[0] + // start at position of furthest button position on correct side
						(signage * option_list[option_count - 3].size[0]) + // Add size of button in the correct direction
						(signage * button_spacing)) // add button spacing in correct direction
          signage = signage * -1
        }
      }
      // Create the button and add to list
      const temp_button = new visual.ButtonStim({
        win: psychoJS.window,
        name: `button${option_count}`,
        units: 'height',
        text: opt,
        mask: undefined,
        ori: 0,
        pos: [button_pos[0], button_pos[1] + parseFloat(config_values.button_y_offset)],
        anchor: anchor_type,
        letterHeight: 0.023,
        fillColor: new util.Color('darkgrey'),
        borderColor: new util.Color('grey'),
        borderWidth: 0.005,
        color: new util.Color('white'),
        opacity: 1,
        flipHoriz: false,
        flipVert: false,
        texRes: 128,
        interpolate: true,
        depth: 0
      })
      temp_button.setSize([parseFloat(config_values.button_width), 0.06])
      option_list.push(temp_button)
    })
  })

  // generate option list that is index aligned with input key list
  // (farthest left is lowest index and farthest right is highest index)
  // farthest left -> o o o o
  //                  o o o o
  //                  o o o o <- farthest right
  let first_in = true
  option_list.forEach((opt) => { // loop through original option list
    option_list_for_input.forEach((optin) => { // loop through input option list
      if (first_in) { // just push the first one
        option_list_for_input.push(opt)
        first_in = false
      }
      // button name is unique, so used to skip duplicates
      else if (opt.pos[0] < optin.pos[0] && opt.pos[1] >= optin.pos[1] && !option_list_for_input.includes(opt)) {
        // if position is 'farther left' than an existing entry, then add it before
        option_list_for_input.splice(option_list_for_input.indexOf(optin), 0, opt)
      }
    })
    // if position is not 'farther left' than existing, then add to end (farthest right)
    if (!option_list_for_input.includes(opt)) {
      option_list_for_input.push(opt)
    }
  })

  // rename the buttons to include input key when keys are the input type
  if (config_values.input_type == 'keys') {
    option_list_for_input.forEach((opt) => {
      opt.setText(`${input_key_list[option_list_for_input.indexOf(opt)]}. ${opt.text}`)
    })
  }

  // TODO: Order based on position and reassign the texts so that they are in order
  option_list = []
  let ixx = 0
  option_list_for_input.forEach((opt) => {
    opt.text = options_text_list[ixx].replaceAll('+', ' ')
    option_list.push(opt)
    ixx++
  })
}

let images_list = []
let images_text_list = []
let images_count = 0
let images_row_count = 0
let images_list_list = []
let images_list_pos_order = []
let images_list_count = 0
let img_row_center_index = 0
let img_pos = [0, 0] // center position
let img_spacing = 0.01
let img_signage = -1 // screen side

function generate_image_list () {
  // RESET THESE FOR IMAGE PLACEMENT
  images_list = []
  images_list_pos_order = []
  images_list_list = []
  images_list_count = 0
  img_row_center_index = 0
  images_count = 0
  images_row_count = 0
  img_spacing = parseFloat(config_values.image_spacing)
  img_pos = [0, -0.21] // center position
  img_signage = -1 // screen side

  // Generate a list for each row of options
  images_text_list = images.split(' ')
  for (let i = 0; i < images_text_list.length; i += parseInt(config_values.images_per_row)) {
    const row = images_text_list.slice(i, i + parseInt(config_values.images_per_row))
    images_list_list.push(row)
  }

  // Generate properly positioned images
  // Loop through the list of rows
  images_list_list.forEach((imgs) => {
    // RESET for new list/row
    images_list_count++
    // images_count = 0;
    images_row_count = 0
    img_pos = [0, 0.0 + ((parseFloat(config_values.image_size) + img_spacing) * (images_list_list.length - images_list_count))] // separate row positioning
    img_signage = -1 // screen side
    if (images_list_count > 1) {
      img_row_center_index = parseInt(config_values.images_per_row) * (images_list_count - 1)
    }
    // Handle proper option image placement one row at a time
    imgs.forEach((img) => {
      images_count++
      images_row_count++
      // positioning logic:
      // If only one, then center.
      // Else, bounce between left and right screen placement.
      if (imgs.length % 2 != 0) {
        if (images_row_count == 1) { // special case for first one
          // Either anchor positioning on left or right depending on side placement
          img_pos[0] = img_pos[0]
          img_signage = img_signage * -1
        } else if (images_row_count == 2 || images_row_count == 3) { // special case for second and third
          // Either anchor positioning on left or right depending on side placement
          img_pos[0] = (images_list[img_row_center_index].pos[0] + // start at position of furthest image position on correct side
				    (img_signage * images_list[img_row_center_index].size[0]) + // Add half of size of center image in correct direction
				    (img_signage * img_spacing)) // add image spacing in correct direction
          img_signage = img_signage * -1
        } else {
          // Either anchor positioning on left or right depending on side placement
          img_pos[0] = (images_list[images_count - 3].pos[0] + // start at position of furthest image position on correct side
						(img_signage * images_list[images_count - 3].size[0]) + // Add size of image in the correct direction
						(img_signage * img_spacing)) // add image spacing in correct direction
          img_signage = img_signage * -1
        }
      } else {
        if (images_row_count == 1 || images_row_count == 2) { // special case for first two
          // Either anchor positioning on left or right depending on side placement
          img_pos[0] = (parseFloat(config_values.image_size) / 2 + img_spacing / 2) * img_signage
          img_signage = img_signage * -1
        } else {
          // Either anchor positioning on left or right depending on side placement
          img_pos[0] = (images_list[images_count - 3].pos[0] + // start at position of furthest image position on correct side
						(img_signage * images_list[images_count - 3].size[0]) + // Add size of image in the correct direction
						(img_signage * img_spacing)) // add image spacing in correct direction
          img_signage = img_signage * -1
        }
      }
      // Create the image and add to list
      const temp_image = new visual.ImageStim({
        win: psychoJS.window,
        name: `stim${images_count}`,
        units: 'height',
        image: img,
        mask: undefined,
        ori: 0,
        pos: [img_pos[0], img_pos[1] + parseFloat(config_values.image_y_offset)],
        size: [parseFloat(config_values.image_size), parseFloat(config_values.image_size)],
        color: new util.Color([1, 1, 1]),
        opacity: 1,
        flipHoriz: false,
        flipVert: false,
        texRes: 128,
        interpolate: true,
        depth: 0
      })
      images_list.push(temp_image)
    })
  })

  // TODO: Order based on position and reassign the images so that they are in order
  let first_in = true
  images_list.forEach((img) => { // loop through original option list
    images_list_pos_order.forEach((imgin) => { // loop through input option list
      if (first_in) { // just push the first one
        images_list_pos_order.push(img)
        first_in = false
      }
      // button name is unique, so used to skip duplicates
      else if (img.pos[0] < imgin.pos[0] && img.pos[1] >= imgin.pos[1] && !images_list_pos_order.includes(img)) {
        // if position is 'farther left' than an existing entry, then add it before
        images_list_pos_order.splice(images_list_pos_order.indexOf(imgin), 0, img)
      }
    })
    // if position is not 'farther left' than existing, then add to end (farthest right)
    if (!images_list_pos_order.includes(img)) {
      images_list_pos_order.push(img)
    }
  })

  images_list = []
  let ixx = 0
  images_list_pos_order.forEach((img) => {
    console.log(images_text_list[ixx])
    img.image = images_text_list[ixx]
    images_list.push(img)
    ixx++
  })
}

let videos_list = []
let videos_text_list = []
let videos_count = 0
let videos_row_count = 0
let videos_list_list = []
let videos_list_pos_order = []
let videos_list_count = 0
let vid_row_center_index = 0
let vid_pos = [0, 0] // center position
let vid_spacing = 0.01
let vid_signage = -1 // screen side

function generate_video_list() {
  videos_list = []
  videos_list_pos_order = []
  videos_list_list = []
  videos_list_count = 0
  vid_row_center_index = 0
  videos_count = 0
  videos_row_count = 0
  vid_spacing = parseFloat(config_values.image_spacing)
  vid_pos = [0, -0.21] // center position
  vid_signage = -1 // screen side

  // Generate a list for each row of options
  videos_text_list = videos.split(' ')
  for (let i = 0; i < images_text_list.length; i += parseInt(config_values.images_per_row)) {
    const row = videos_text_list.slice(i, i + parseInt(config_values.images_per_row))
    videos_list_list.push(row)
  }

  // Generate properly positioned images
  // Loop through the list of rows
  videos_list_list.forEach((vids) => {
    // RESET for new list/row
    videos_list_count++
    // images_count = 0;
    videos_row_count = 0
    vid_pos = [0, 0.0 + ((parseFloat(config_values.image_size) + vid_spacing) * (videos_list_list.length - videos_list_count))] // separate row positioning
    vid_signage = -1 // screen side
    if (videos_list_count > 1) {
      vid_row_center_index = parseInt(config_values.images_per_row) * (videos_list_count - 1)
    }
    // Handle proper option image placement one row at a time
    vids.forEach((vid) => {
      videos_count++
      videos_row_count++
      // positioning logic:
      // If only one, then center.
      // Else, bounce between left and right screen placement.
      if (vids.length % 2 != 0) {
        if (videos_row_count == 1) { // special case for first one
          // Either anchor positioning on left or right depending on side placement
          vid_pos[0] = vid_pos[0]
          vid_signage = vid_signage * -1
        } else if (videos_row_count == 2 || videos_row_count == 3) { // special case for second and third
          // Either anchor positioning on left or right depending on side placement
          vid_pos[0] = (videos_list[vid_row_center_index].pos[0] + // start at position of furthest video position on correct side
				    (vid_signage * videos_list[vid_row_center_index].size[0]) + // Add half of size of center video in correct direction
				    (vid_signage * vid_spacing)) // add video spacing in correct direction
          vid_signage = vid_signage * -1
        } else {
          // Either anchor positioning on left or right depending on side placement
          vid_pos[0] = (videos_list[videos_count - 3].pos[0] + // start at position of furthest video position on correct side
						(vid_signage * videos_list[videos_count - 3].size[0]) + // Add size of video in the correct direction
						(vid_signage * vid_spacing)) // add video spacing in correct direction
          vid_signage = vid_signage * -1
        }
      } else {
        if (videos_row_count == 1 || videos_row_count == 2) { // special case for first two
          // Either anchor positioning on left or right depending on side placement
          vid_pos[0] = (parseFloat(config_values.video_size) / 2 + vid_spacing / 2) * vid_signage
          vid_signage = vid_signage * -1
        } else {
          // Either anchor positioning on left or right depending on side placement
          vid_pos[0] = (videos_list[videos_count - 3].pos[0] + // start at position of furthest video position on correct side
						(vid_signage * videos_list[videos_count - 3].size[0]) + // Add size of video in the correct direction
						(vid_signage * vid_spacing)) // add video spacing in correct direction
          vid_signage = vid_signage * -1
        }
      }
      // Create the video and add to list
      const temp_video = new visual.MovieStim({
        win: psychoJS.window,
        name: `stim${videos_count}`,
        units: 'height',
        movie: vid,
        loop: true,
        mask: undefined,
        ori: 0,
        pos: [vid_pos[0], vid_pos[1] + parseFloat(config_values.image_y_offset)],
        size: [parseFloat(config_values.image_size), parseFloat(config_values.image_size)],
        color: new util.Color([1, 1, 1]),
        opacity: 1,
        flipHoriz: false,
        flipVert: false,
        texRes: 128,
        interpolate: true,
        depth: 0
      })
      videos_list.push(temp_video)
    })
  })

  // TODO: Order based on position and reassign the videos so that they are in order
  let first_in = true
  videos_list.forEach((vid) => { // loop through original option list
    videos_list_pos_order.forEach((vidin) => { // loop through input option list
      if (first_in) { // just push the first one
        videos_list_pos_order.push(vid)
        first_in = false
      }
      // button name is unique, so used to skip duplicates
      else if (vid.pos[0] < vidin.pos[0] && vid.pos[1] >= vidin.pos[1] && !videos_list_pos_order.includes(vid)) {
        // if position is 'farther left' than an existing entry, then add it before
        videos_list_pos_order.splice(videos_list_pos_order.indexOf(vidin), 0, vid)
      }
    })
    // if position is not 'farther left' than existing, then add to end (farthest right)
    if (!videos_list_pos_order.includes(vid)) {
      videos_list_pos_order.push(vid)
    }
  })

  videos_list = []
  let ixx = 0
  videos_list_pos_order.forEach((vid) => {
    console.log(videos_text_list[ixx])
    vid.movie = videos_text_list[ixx]
    videos_list.push(vid)
    ixx++
  })
}

let pressed
var last_trial_num = 0
let clicked_option = ['', 0] // [option name, times clicked]
let clicked_count = 0

function trialRoutineBegin (trials) {
  return function () {
    // ------Prepare to start Routine 'trial'-------
    t = 0
    trialClock.reset() // clock
    toneClock.reset() // toneclock
    frameN = -1

    currentTrialText.status = PsychoJS.Status.NOT_STARTED
    currentTrialNumber.setText(`${trial_number} / ${last_trial_num}`)

    clicked_count = 0
    clicked_option = ['', 0]
    instr_check_selections = []

    generate_option_list()
    if (media_type == 'image') {
      generate_image_list()
    } else if (media_type == 'video') {
      generate_video_list()
    } else if (media_type == 'audio') {
      // TODO generate_audios()
    } else if (media_type == 'text') {
      // TODO generate_texts()
    } else if (media_type == 'image+audio') {
      // TODO generate_image_audio_pairs()
    } else if (media_type == 'audio+text') {
      // TODO generate_audio_text_pairs()
    }

    questionText.setText(question)
    questionText.height = parseFloat(config_values.question_size)
    questionText.pos[1] = questionText.pos[1] + parseFloat(config_values.question_y_offset)

    console.log('Trial Number: ', trial_number)

    pressed = false

    endClock.reset()

    resp.keys = undefined
    resp.rt = undefined

    return Scheduler.Event.NEXT
  }
}

/**
 * Respond Routine
 * @param {*} trials
 * @returns
 */
function trialRoutineRespond (trials) {
  return function () {
    // ------Loop for each frame of Routine 'trial'-------
    let continueRoutine = true // until we're told otherwise

    // get current time
    t = respondClock.getTime()

    // Draw the Texts
    if (currentTrialText.status == PsychoJS.Status.NOT_STARTED) {
      currentTrialText.setAutoDraw(true)
      currentTrialNumber.setAutoDraw(true)
      questionText.setAutoDraw(true)
      videos_list.forEach((vid) => {
        vid.setAutoDraw(true)
        vid.play()
      })
      images_list.forEach((img) => {
        img.setAutoDraw(true)
      })
      option_list.forEach((opt) => {
        opt.setAutoDraw(true)
      })
      currentTrialText.status = PsychoJS.Status.FINISHED

      mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types.TRIAL_ONSET,
        'NA', 'NA', images_text_list.toString().replaceAll(',', ' '))
      mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types.CHOICE_ONSET,
        'NA', 'NA', options_text_list.toString().replaceAll(',', ' '))
    }

    if (config_values.input_type == 'keys') {
      if (resp.status === PsychoJS.Status.NOT_STARTED) {
        // keep track of start time/frame for later
        resp.tStart = t // (not accounting for frame time here)
        resp.frameNStart = frameN // exact frame index

        // keyboard checking is just starting
        resp.clock.reset() // t=0 on next screen flip
        resp.start() // start on screen flip
        resp.clearEvents()
      }

      const theseKeys = resp.getKeys({ keyList: input_key_list, waitRelease: false })
      if (!pressed && theseKeys.length > 0) {
        resp.keys = theseKeys[0].name // just the last key pressed
        resp.rt = theseKeys[0].rt

        // choice
        if (input_key_list.includes(resp.keys)) {
          pressed = true
          option_list_for_input.forEach((opt) => {
            if (input_key_list.indexOf(resp.keys) == option_list_for_input.indexOf(opt)) {
              if (config_values.instr_check === 'true' && opt.text != 'ENTER') {
                instr_check_selections.push(option_list_for_input.indexOf(opt))
              } else {
                pressed = true
              }
              opt.setColor(new util.Color('darkgrey'))
              opt.setFillColor(new util.Color('grey'))
              opt.setBorderColor(new util.Color('darkgrey'))
              clicked_option = [opt.text, clicked_count++]
              // pressed = true
              mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types.CHOICE,
                'NA', resp.keys, opt.text)
              feedbackClock.reset()
            }
          })
          feedbackClock.reset()
        }

        resp.keys = undefined
        resp.rt = undefined
      }
      if (config_values.instr_check === 'true') {
        if (clicked_option[0] == 'ENTER') {
          continueRoutine = false
        } else if (clicked_option[0] != 'ENTER') {
          continueRoutine = true
        }
      } else if ((pressed) && (feedbackClock.getTime() > parseFloat(config_values.feedback_duration))) {
        continueRoutine = false
      }
    }

    if (config_values.input_type == 'mouse') {
      if (pressed == false) {
        option_list.forEach((opt) => {
          if (opt.isClicked) {
            if (config_values.instr_check === 'true' && opt.text != 'ENTER') {
              instr_check_selections.push(option_list_for_input.indexOf(opt))
            }
            opt.setColor(new util.Color('darkgrey'))
            opt.setFillColor(new util.Color('grey'))
            opt.setBorderColor(new util.Color('darkgrey'))
            clicked_option = [opt.text, clicked_count++]
          }
          if (clicked_option[1] >= 1 && !pressed) {
            mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types.CHOICE,
              'NA', config_values.input_type, opt.text)
            if (config_values.instr_check === 'true') {
              pressed = false
            } else {
              pressed = true
            }
            feedbackClock.reset()
          }
        })
      }

      if (config_values.instr_check === 'true') {
        if (clicked_option[0] == 'ENTER') {
          continueRoutine = false
        } else if (clicked_option[0] != 'ENTER') {
          continueRoutine = true
        }
      } else if ((pressed) && (feedbackClock.getTime() > parseFloat(config_values.feedback_duration))) {
        continueRoutine = false
      }
    }

    // check for quit (typically the Esc key)
    if (psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false)
    }

    // check if the Routine should terminate
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT
    } else {
      currentTrialText.setAutoDraw(false)
      currentTrialNumber.setAutoDraw(false)
      questionText.setAutoDraw(false)
      videos_list.forEach((vid) => {
        vid.setAutoDraw(false)
        vid.stop()
      })
      images_list.forEach((img) => {
        img.setAutoDraw(false)
      })
      option_list.forEach((opt) => {
        opt.setAutoDraw(false)
      })

      // set_fixation_flag = true
      endClock.reset()
      return Scheduler.Event.NEXT
    }
  }
}

// Initial Fixation
// Show a 2 second fixation cross at the start of the first trial
function initialFixation (trials) {
  return function () {
    // ------Loop for each frame of Routine 'trial'-------
    let continueRoutine = true // until we're told otherwise
    if (trial_number != 1) continueRoutine = false // if not the firt trial, skip this routine

    if (!init_fixation_flag) {
      return Scheduler.Event.NEXT
    }

    // get current time
    t_end = endClock.getTime()

    if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED) {
      points_fixation_stim.color = new util.Color('white')
      points_fixation_stim.setText('+')
      points_fixation_stim.setAutoDraw(true)
      // console.log('Initial Fixation')

      mark_event(trials_data, globalClock, 'NA', trial_type, event_types.FIXATION_ONSET,
        'NA', 'NA', 'NA')
    }

    if (t_end >= 3) {
      continueRoutine = false
      points_fixation_stim.setAutoDraw(false)
      points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
    }

    // check for quit (typically the Esc key)
    if (psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false)
    }

    // check if the Routine should terminate
    if (continueRoutine) {
      return Scheduler.Event.FLIP_REPEAT
    } else {
      points_fixation_stim.setAutoDraw(false)
      points_fixation_stim.status = PsychoJS.Status.NOT_STARTED

      init_fixation_flag = false

      endClock.reset()
      return Scheduler.Event.NEXT
    }
  }
}

const key_map = {
  ',': 'left',
  '.': 'right',
  '<': 'left',
  '>': 'right',
  left: 'left',
  right: 'right',
  comma: 'left',
  period: 'right'
}

function sendData () {
  total_requests += 1
  $.ajax({
    type: 'POST',
    url: '/save',
    data: {
      trials_data,
      expInfo
    },
    // dataType: 'JSON',
    success: function (data) {
      console.log(data)
		  }
  })
    .done(function (data) {
      total_requests -= 1
      console.log('success:')
      console.log(Date.now())
      console.log(data)
    })
    .fail(function (err) {
      console.log('ERR:')
      console.log(err)
    })
}

/**
 * Trial Routine End
 * @param {*} trials
 * @returns
 */
function trialRoutineEnd (trials) {
  return function () {
    // ------Ending Routine 'trial'-------
    t = endClock.getTime()

    // passed instruction check is true unless a wrong selection was made
    passed_instr_check = true
    instr_check_selections.forEach((sel) => {
      if (!config_values.instr_check_conditions.split(' ').includes(sel.toString())) {
        // console.log('failed instr check')
        passed_instr_check = false
      }
    })
    if (!instr_check_selections.length) { // no selection (a.k.a. enter was the only selection)
      passed_instr_check = false
    }

    let try_again_duration = 0
    if (!passed_instr_check) {
      try_again_duration = 10
    }

    if (points_fixation_stim.status == PsychoJS.Status.NOT_STARTED && passed_instr_check) {
      points_fixation_stim.setText('+')
      mark_event(trials_data, globalClock, trials.thisIndex, trial_type, event_types.FIXATION_ONSET,
        'NA', 'NA', 'NA')

      points_fixation_stim.setAutoDraw(true)
    }

    // hold the fixation for jitter time
    if (t <= ITI && passed_instr_check) {
      return Scheduler.Event.FLIP_REPEAT
    } else if (t <= try_again_duration && config_values.instr_check == 'true') {
      tryAgainText.setAutoDraw(true)
      return Scheduler.Event.FLIP_REPEAT
    } else {
      tryAgainText.setAutoDraw(false)
      resp.stop()
      resp.status = PsychoJS.Status.NOT_STARTED
      // sendData()
      // Clear Fixation
      points_fixation_stim.setAutoDraw(false)
      points_fixation_stim.status = PsychoJS.Status.NOT_STARTED
      return Scheduler.Event.NEXT
    }
  }
}

var readyComponents
let thanksComponents
function thanksRoutineBegin (trials, thanks_text) {
  return function () {
    // ------Prepare to start Routine 'thanks'-------
    // Clear Trial Components
    t = 0
    thanksClock.reset() // clock
    frameN = -1
    routineTimer.add(20.000000)

    // Show Final Points and money earned
    // 100 points = 10 cents
    thanksText.setText(thanks_text)
    // update component parameters for each repeat
    // keep track of which components have finished
    thanksComponents = []
    // thanksComponents.push(thanksText);

    for (const thisComponent of thanksComponents) {
      if ('status' in thisComponent) { thisComponent.status = PsychoJS.Status.NOT_STARTED }
    }

    return Scheduler.Event.NEXT
  }
}

var frameRemains
function thanksRoutineEachFrame (trials) {
  return function () {
    // ------Loop for each frame of Routine 'thanks'-------
    let continueRoutine = true // until we're told otherwise
    // get current time
    t = thanksClock.getTime()
    frameN = frameN + 1// number of completed frames (so 0 is the first frame)
    // update/draw components on each frame

    // *thanksText* updates
    if (t >= 0.0 && thanksText.status === PsychoJS.Status.NOT_STARTED) {
      // keep track of start time/frame for later
      thanksText.tStart = t // (not accounting for frame time here)
      thanksText.frameNStart = frameN // exact frame index
      thanksText.setAutoDraw(true)
    }

    frameRemains = 0.0 + 2.0 - psychoJS.window.monitorFramePeriod * 0.75 // most of one frame period left
    if (thanksText.status === PsychoJS.Status.STARTED && t >= frameRemains) {
      thanksText.setAutoDraw(false)
    }
    // check for quit (typically the Esc key)
    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({ keyList: ['escape'] }).length > 0) {
      return quitPsychoJS('The [Escape] key was pressed. Goodbye!', false)
    }

    // check if the Routine should terminate
    if (!continueRoutine) { // a component has requested a forced-end of Routine
      return Scheduler.Event.NEXT
    }

    continueRoutine = false // reverts to True if at least one component still running
    for (const thisComponent of thanksComponents) {
      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {
        continueRoutine = true
        break
      }
    }

    // reverts to true if we are still waiting for http requests to finish
    if (total_requests > 0) {
      continueRoutine = true
    }

    // refresh the screen if continuing
    if (continueRoutine && routineTimer.getTime() > 0) {
      return Scheduler.Event.FLIP_REPEAT
    } else {
      return Scheduler.Event.NEXT
    }
  }
}

function thanksRoutineEnd (trials) {
  return function () {
    // ------Ending Routine 'thanks'-------
    for (const thisComponent of thanksComponents) {
      if (typeof thisComponent.setAutoDraw === 'function') {
        thisComponent.setAutoDraw(false)
      }
    }
    return Scheduler.Event.NEXT
  }
}

function endLoopIteration (thisScheduler, loop = undefined) {
  // ------Prepare for next entry------
  return function () {
    if (typeof loop !== 'undefined') {
      // ------Check if user ended loop early------
      if (loop.finished) {
        // Check for and save orphaned data
        if (psychoJS.experiment.isEntryEmpty()) {
          psychoJS.experiment.nextEntry(loop)
        }
        thisScheduler.stop()
      } else {
        const thisTrial = loop.getCurrentTrial()
        if (typeof thisTrial === 'undefined' || !('isTrials' in thisTrial) || thisTrial.isTrials) {
          psychoJS.experiment.nextEntry(loop)
        }
      }
    }

    main_loop_count += 1
    console.log('should we send data???\n')
    console.log(`${main_loop_count} / ${last_trial_num}`)
    if (main_loop_count % 10 == 0) {
      console.log('sending data')
      sendData()
    } else if (main_loop_count == last_trial_num) {
      console.log('sending data last trial num')
      sendData()
    }

    // sendData()

    return Scheduler.Event.NEXT
  }
}

function importConditions (trials) {
  return function () {
    psychoJS.importAttributes(trials.getCurrentTrial())

    return Scheduler.Event.NEXT
  }
}

function quitPsychoJS (message, isCompleted) {
  // Check for and save orphaned data
  if (psychoJS.experiment.isEntryEmpty()) {
    psychoJS.experiment.nextEntry()
  }

  psychoJS.window.close()
  psychoJS.quit({ message, isCompleted })

  return Scheduler.Event.QUIT
}
