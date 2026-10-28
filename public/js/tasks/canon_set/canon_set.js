/**
 * CANON Social Evaluation Task (SET)
 * Port of StimTool3 SocialEvaluationTask, CANON runs: practice (SET_run-PRAC-R) and the main run
 * (SET_run-A / SET_run-B by schedule letter). Spec: CANON_StimtoolOnline_Port/tasks/04_SocialEvaluationTask.md
 * @author Aardron Robinson
 */

import {
  CanonPage, CanonRun, KEYS, DIM_GREY, RatingScale,
  fetchText, parseSchedule, parseParams, parseDeck,
  makeText, makeRect, makeImage, measureTextWidth
} from '/js/tasks/canon_common/canon_common.js'

const event_types = {
  INSTRUCT_ONSET: 1,
  TASK_ONSET: 2,
  TRIAL_ONSET: 3,
  FIXATION: 4,
  RATER_ONSET: 5,
  PREDICTION: 6,
  DELAY_ONSET: 7,
  FEEDBACK: 8,
  QUESTION_ONSET: 9,
  RATING_ONSET: 10,
  RATING_CHANGE: 11,
  RATING_SELECTION: 12
}

const TASK_DIR = '/js/tasks/canon_set/'
const SCHEDULE_PREFIX = 'study-SMITH-2026-CANON_task-SET_run-'

// Phase durations (SET.py GlobalVars; CANON run params set response_duration 2.0)
const DELAY_DURATION = 1.0 // fallback only: every CANON row carries its own delay
const FEEDBACK_DURATION = 1.0
const QUESTION_DURATION = 2.0
const RATING_DURATION = 5.0

// Layout, desktop norm units (SET.py:101-180)
const TRIAL_COUNTER_POS = [-0.97, 0.95]
const TRIAL_COUNTER_HEIGHT = 0.06
const PERSON_SIZE = 0.50
const PERSON_POS = [0, -0.12]
const FIXATION_SIZE = 0.25
const NAME_HEIGHT = 0.16
const NAME_GAP = 0.03
const YESNO_Y = -0.80
const QUESTION_POS = [0, 0.75]
const QUESTION_HEIGHT = 0.15
const RATING_LINES = ['How good do you feel about', 'yourself at this moment?']
const RATING_UNDERLINE_WORD = 'yourself'
const RATING_TEXT_HEIGHT = 0.1
const RATING_TEXT_Y = 0.75
const RATING_LINE_OFFSET = 0.06 // each line's centre sits this far above/below RATING_TEXT_Y
const RATING_UNDERLINE_DROP = 0.115 // below RATING_TEXT_Y, as on desktop
const RATING_UNDERLINE_THICK = 0.006
const SLIDER_SIZE = [1.6, 0.1]

const RATING_MARKER_IDLE = DIM_GREY
const RATING_MARKER_SET = 'white'
const RATING_START = 5

const AVATARS = {
  MG: 'male_green_text.png',
  MLG: 'male_lightgreen_text.png',
  MLR: 'male_lightred_text.png',
  MR: 'male_red_text.png',
  FG: 'female_green_text.png',
  FLG: 'female_lightgreen_text.png',
  FLR: 'female_lightred_text.png',
  FR: 'female_red_text.png'
}
const FEEDBACK_IMAGES = { 1: 'thumbsup.png', 2: 'thumbsdown.png', 0: 'nothumbs.png' }

let runFile // schedule stem, e.g. study-SMITH-2026-CANON_task-SET_run-A
let runParams = {}
let trials = []
let deck = []
let run

/** Python str(float): durations are logged as desktop wrote them (3 -> '3.0'). */
function pyFloat (x) {
  return Number.isInteger(x) ? x.toFixed(1) : String(x)
}

/** One schedule row -> trial description (SET.py:300, 517-526, 591-596). */
function parseTrial (row, index) {
  const trialType = row[0].trim()
  const durations = row[2].trim().split(/\s+/).map(Number)
  const feedback = (row[3] || '').trim()
  const trial = {
    index,
    trialType,
    isRating: trialType === 'RATING',
    fixation: durations[0],
    delay: durations.length > 1 ? durations[1] : DELAY_DURATION,
    nDurations: durations.length,
    feedback
  }
  if (!trial.isRating) {
    const code = trialType.split('_')[0]
    trial.code = code
    trial.sex = code[0]
    trial.group = code.slice(1)
    trial.name = trialType.split('_')[1]
    if (!(code in AVATARS)) throw new Error(`unknown rater code ${code}`)
    if (!(feedback in FEEDBACK_IMAGES)) throw new Error(`unknown feedback ${feedback}`)
  }
  return trial
}

async function prepare (page) {
  const slot = page.cfg.run
  let deckFile
  if (slot === 'PRAC') {
    runFile = SCHEDULE_PREFIX + 'PRAC-R'
    deckFile = 'prac.csv'
  } else if (slot === 'MAIN') {
    if (!['A', 'B'].includes(page.cfg.letter)) throw new Error(`no schedule letter (letter=${page.cfg.letter || 'missing'})`)
    runFile = SCHEDULE_PREFIX + page.cfg.letter
    deckFile = 'main.csv'
  } else {
    throw new Error(`unknown SET run ${slot}`)
  }
  runParams = parseParams(await fetchText(TASK_DIR + 'schedules/' + runFile + '.params'))
  trials = parseSchedule(await fetchText(TASK_DIR + 'schedules/' + runFile + '.schedule')).map(parseTrial)
  if (new Set(trials.map((t) => t.nDurations)).size !== 1) {
    // SET.py:527-532 refuses a schedule whose rows disagree on the number of Durations values
    throw new Error(`${runFile} rows carry different numbers of Durations values`)
  }
  if (page.cfg.debugTrials) trials = trials.slice(0, page.cfg.debugTrials)
  deck = parseDeck(await fetchText(TASK_DIR + 'decks/' + deckFile))

  const media = [...Object.values(AVATARS), ...Object.values(FEEDBACK_IMAGES), 'fixation.png'].map((f) => TASK_DIR + 'media/' + f)
  return [...deck, ...media]
}

function build (page) {
  const responseDuration = parseFloat(runParams.response_duration || '3.0')
  run = new CanonRun({
    page,
    runId: runParams.run_id,
    runSlot: page.cfg.run,
    extraColumns: ['sex', 'group', 'rater_name', 'feedback_code', 'fixation_dur', 'delay_dur']
  })

  const win = page.win
  const st = page.stage
  const ratio = st.ratio

  // ----- stimuli -----
  const counter = makeText(win, { name: 'counter', pos: st.pos(TRIAL_COUNTER_POS), height: st.h(TRIAL_COUNTER_HEIGHT), colour: DIM_GREY, alignHoriz: 'left', alignVert: 'top' })
  const fixation = makeImage(win, { name: 'fixation', image: TASK_DIR + 'media/fixation.png', pos: [0, 0], size: st.size([FIXATION_SIZE, ratio * FIXATION_SIZE]) })
  const question = makeText(win, { name: 'question', text: 'Did this person like you?', pos: st.pos(QUESTION_POS), height: st.h(QUESTION_HEIGHT), wrapWidth: st.wrap(1.9) })
  const yes = makeText(win, { name: 'yes', text: 'Yes', pos: st.pos([-0.5, YESNO_Y]), height: st.h(QUESTION_HEIGHT) })
  const no = makeText(win, { name: 'no', text: 'No', pos: st.pos([0.5, YESNO_Y]), height: st.h(QUESTION_HEIGHT) })
  const personSize = st.size([PERSON_SIZE, ratio * PERSON_SIZE])
  const persons = {}
  for (const [code, file] of Object.entries(AVATARS)) {
    persons[code] = makeImage(win, { name: code, image: TASK_DIR + 'media/' + file, pos: st.pos(PERSON_POS), size: personSize })
  }
  const thumbs = {}
  for (const [code, file] of Object.entries(FEEDBACK_IMAGES)) {
    thumbs[code] = makeImage(win, { name: 'feedback_' + code, image: TASK_DIR + 'media/' + file, pos: st.pos(PERSON_POS), size: personSize })
  }
  // the name hangs NAME_GAP over the top of the person's box (SET.py:585)
  const nameY = PERSON_POS[1] + PERSON_SIZE * ratio / 2 + NAME_GAP + NAME_HEIGHT / 2
  const name = makeText(win, { name: 'rater_name', pos: st.pos([0, nameY]), height: st.h(NAME_HEIGHT), wrapWidth: st.wrap(1.9) })

  // self-esteem question: explicit line break, "yourself" underlined (SET.py:152-230)
  const ratingTextHeight = st.h(RATING_TEXT_HEIGHT)
  const ratingLine1 = makeText(win, { name: 'rating_line1', text: RATING_LINES[0], pos: st.pos([0, RATING_TEXT_Y + RATING_LINE_OFFSET]), height: ratingTextHeight })
  const ratingLine2 = makeText(win, { name: 'rating_line2', text: RATING_LINES[1], pos: st.pos([0, RATING_TEXT_Y - RATING_LINE_OFFSET]), height: ratingTextHeight })
  const line2Width = measureTextWidth(win, RATING_LINES[1], ratingTextHeight)
  const wordWidth = measureTextWidth(win, RATING_UNDERLINE_WORD, ratingTextHeight)
  const underline = makeRect(win, {
    name: 'rating_underline',
    pos: [-line2Width / 2 + wordWidth / 2, st.y(RATING_TEXT_Y - RATING_UNDERLINE_DROP)],
    width: wordWidth,
    height: st.h(RATING_UNDERLINE_THICK),
    fill: 'white'
  })
  const ratingText = [ratingLine1, ratingLine2, underline]

  const sliderLabels = new Array(11).fill('')
  sliderLabels[0] = 'very bad'
  sliderLabels[10] = 'very good'
  const slider = new RatingScale(win, {
    nTicks: 11,
    pos: [0, 0],
    width: st.x(SLIDER_SIZE[0]),
    tickHeight: st.h(SLIDER_SIZE[1]),
    labels: sliderLabels,
    labelHeight: st.h(0.1),
    markerColour: RATING_MARKER_IDLE
  })

  // ----- run start -----
  let instructStart
  page.add({
    begin: () => {
      run.start()
      run.logCounterbalance()
      instructStart = run.now()
      run.log('NA', 'NA', event_types.INSTRUCT_ONSET, 'NA', 'NA', 'NA')
    }
  })
  page.add(page.deckRoutine(deck))
  page.add(page.waitStartRoutine(3))

  // ----- trial loop: one routine, clock-anchored phases (SET.py PHASE TIMING) -----
  let i = -1
  let trial
  let phase
  let phaseEnd
  let idealTrialStart
  let prediction // 'YES' | 'NO' | null
  let raterOnset
  let ratingOnset
  let locked

  const extras = (t) => t.isRating
    ? { sex: 'NA', group: 'NA', rater_name: 'NA', feedback_code: t.feedback, fixation_dur: t.fixation, delay_dur: 'NA' }
    : { sex: t.sex, group: t.group, rater_name: t.name, feedback_code: t.feedback, fixation_dur: t.fixation, delay_dur: t.delay }
  const log = (code, responseTime, response, result, time) => run.log(trial.index, trial.trialType, code, responseTime, response, result, extras(trial), time)
  const logOnFlip = (code, result, callback) => page.psychoJS.window.callOnFlip(() => {
    const row = log(code, 'NA', 'NA', result)
    if (callback) callback(row.absolute_time)
  })

  const chosen = () => prediction === 'YES' ? [yes] : prediction === 'NO' ? [no] : []

  function scene () {
    const base = [counter]
    switch (phase) {
      case 'fixation':
        return [...base, fixation, question]
      case 'prediction':
        return [...base, name, question, persons[trial.code], ...(prediction === null ? [yes, no] : chosen())]
      case 'delay':
        return [...base, name, question, persons[trial.code], ...chosen()]
      case 'feedback':
        return [...base, name, question, thumbs[trial.feedback], ...chosen()]
      case 'question':
        return [...base, ...ratingText]
      case 'rating':
        return [...base, ...ratingText, ...slider.stims()]
    }
    return []
  }

  function startTrial () {
    i += 1
    if (i >= trials.length) return false
    trial = trials[i]
    counter.setText(`${trial.index + 1}/${trials.length}`)
    if (!trial.isRating) name.setText(trial.name)
    prediction = null
    locked = false
    phase = 'fixation'
    phaseEnd = idealTrialStart + trial.fixation
    page.clearKeys()
    page.psychoJS.window.callOnFlip(() => {
      log(event_types.TRIAL_ONSET, 'NA', 'NA', trial.trialType)
      log(event_types.FIXATION, 'NA', 'NA', pyFloat(trial.fixation))
    })
    return true
  }

  /** Move to the next phase; false when the run is over. */
  function advance () {
    if (trial.isRating) {
      if (phase === 'fixation') {
        phase = 'question'
        phaseEnd += QUESTION_DURATION
        page.clearKeys() // SET.py:405 clears at QUESTION_ONSET; presses during the question reach the slider
        logOnFlip(event_types.QUESTION_ONSET, 'NA')
        return true
      }
      if (phase === 'question') {
        phase = 'rating'
        phaseEnd += RATING_DURATION
        slider.setMarker(RATING_START)
        slider.setMarkerColour(RATING_MARKER_IDLE)
        ratingOnset = undefined
        logOnFlip(event_types.RATING_ONSET, RATING_START, (t) => { ratingOnset = t })
        return true
      }
      // end of rating window
      if (!locked) {
        const now = run.now()
        log(event_types.RATING_SELECTION, now - ratingOnset, 'no_response', slider.marker, now)
      }
    } else {
      if (phase === 'fixation') {
        phase = 'prediction'
        phaseEnd += responseDuration
        page.clearKeys() // SET.py:329: only presses after the rater appears count
        raterOnset = undefined
        logOnFlip(event_types.RATER_ONSET, 'NA', (t) => { raterOnset = t })
        return true
      }
      if (phase === 'prediction') {
        phase = 'delay'
        phaseEnd += trial.delay
        logOnFlip(event_types.DELAY_ONSET, pyFloat(trial.delay))
        return true
      }
      if (phase === 'delay') {
        phase = 'feedback'
        phaseEnd += FEEDBACK_DURATION
        logOnFlip(event_types.FEEDBACK, 'NA')
        return true
      }
    }
    // trial over: the next one is timed from where this one should have ended
    idealTrialStart = phaseEnd
    run.checkpoint()
    return startTrial()
  }

  function handleKeys () {
    if (phase === 'prediction') {
      if (raterOnset === undefined) return
      const pressed = page.keys([KEYS.left, KEYS.right])
      if (pressed.length && prediction === null) {
        const key = pressed[0]
        const t = run.keyTime(key)
        prediction = key.name === KEYS.left ? 'YES' : 'NO'
        log(event_types.PREDICTION, t - raterOnset, 'NA', prediction, t)
      }
    } else if (phase === 'rating') {
      if (ratingOnset === undefined) return // desktop starts polling after the slider's first flip
      const pressed = page.keys([KEYS.left, KEYS.right, KEYS.select])
      if (pressed.length && !locked) {
        const key = pressed[0] // desktop acts on the first key of each poll
        const t = run.keyTime(key)
        if (key.name === KEYS.select) {
          locked = true
          slider.setMarkerColour(RATING_MARKER_SET)
          log(event_types.RATING_SELECTION, t - ratingOnset, 'select', slider.marker, t)
        } else {
          slider.setMarker(slider.marker + (key.name === KEYS.left ? -1 : 1))
          // response_time is the key's absolute time, as on desktop (SET.py:463); logged even when clamped
          log(event_types.RATING_CHANGE, t, key.name, slider.marker)
        }
      }
    } else if (phase !== 'question') {
      page.clearKeys()
    }
  }

  page.add({
    begin: () => {
      idealTrialStart = run.now()
      run.log('NA', 'NA', event_types.TASK_ONSET, idealTrialStart - instructStart, 'NA', 'NA', {}, idealTrialStart)
      if (!startTrial()) phase = null
    },
    frame: () => {
      if (phase === null) return false
      if (page.due(run, phaseEnd)) {
        if (!advance()) return false
      }
      handleKeys()
      page.scene.set(scene())
      return true
    },
    end: () => page.scene.clear()
  })

  page.add(page.finishRoutine(run))
}

new CanonPage({ expName: 'Social Evaluation Task', prepare, build })
