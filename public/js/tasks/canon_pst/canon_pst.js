/**
 * CANON Probability Selection Task (PST)
 * Port of StimTool3 ProbabilitySelectionTask (CANON runs). Spec:
 * CANON_StimtoolOnline_Port/tasks/03_ProbabilitySelectionTask.md
 *
 * One page per desktop run: run=PRAC | TRAIN-P1 | TRAIN-P2 | TEST, resolved with the participant's
 * schedule letter (A/B) and outcome list (1/2) to the verbatim desktop schedule files.
 * @author Aardron Robinson
 */

import {
  CanonPage, CanonRun, RatingScale, KEYS, DIM_GREY,
  fetchText, parseSchedule, parseParams, parseDeck, csvLines,
  makeText, makeImage, makeCircle, makeRect
} from '/js/tasks/canon_common/canon_common.js'

const event_types = {
  INSTRUCT_ONSET: 1,
  TASK_ONSET: 2,
  TRIAL_ONSET: 3,
  IMAGE_ONSET: 4,
  FIXATION: 5,
  RESPONSE: 6,
  ACCURACY: 7,
  FEEDBACK: 8,
  RATING_ONSET: 9,
  RATING_CHANGE: 10,
  RATING_SELECTION: 11
}

const TASK_DIR = '/js/tasks/canon_pst/'
const SCHEDULE_PREFIX = 'study-SMITH-2026-CANON_task-PST_run-'

// Timing (GlobalVars + module constants, ProbabilitySelectionTask.py)
const RESPONSE_DURATION = 3.0
const FEEDBACK_DURATION = 1.0
const RATING_DURATION = 5.0
const HAPPY_POST_FIXATION = 0.25
const HAPPY_START_POS = 5

// Geometry, desktop norm units
const STIM_ECCENTRICITY = 0.33
const SELECT_RADIUS = 0.30
const HAPPY_MARKER_IDLE = DIM_GREY
const HAPPY_MARKER_SET = 'white'

// Token -> reward probability (PROB_MAPS); token -> picture letter (A/B = tokens 1/6, C/D = 2/5, E/F = 3/4)
const PROB_MAPS = {
  CURRENT: { 1: 80, 2: 70, 3: 60, 4: 40, 5: 30, 6: 20 },
  ALT1: { 1: 20, 2: 30, 3: 40, 4: 60, 5: 70, 6: 80 },
  ALT2: { 1: 40, 2: 20, 3: 30, 4: 70, 5: 80, 6: 60 }
}
const LETTER_TOKENS = [['A', '1'], ['B', '6'], ['C', '2'], ['D', '5'], ['E', '3'], ['F', '4']]
const PROB_MAP_PAIRS = [['1', '6'], ['2', '5'], ['3', '4']]

let run
let probMap // token -> probability under this run's map
let trials = [] // parsed schedule rows
let nRows = 0 // counter denominator: all schedule rows, HAPPY included
let deckUrls = []
let isTest = false
let jitterFixation = false
let countBased = false
let outcomeTable = null // {prob: [0/1,...]}
let choiceCounts = null // {prob: n}, fresh every run
let runId = ''

/** Python str(float) for logged durations: 2 -> '2.0', 0.25 -> '0.25' */
function pyFloat (x) {
  return Number.isInteger(x) ? x.toFixed(1) : String(x)
}

/** Schedule image path (media\canon_images\A.bmp) -> served PNG URL */
function imageUrl (schedulePath) {
  const name = schedulePath.replace(/\\/g, '/').split('/').pop().replace(/\.bmp$/i, '.png')
  return TASK_DIR + 'media/canon_images/' + name
}

function formatProbMap (name) {
  return name + ' ' + LETTER_TOKENS.map(([letter, token]) => letter + ':' + probMap[token]).join(' ')
}

function validProbMap (map) {
  const sorted = Object.values(map).sort((a, b) => a - b).join(',')
  if (sorted !== '20,30,40,60,70,80') return false
  return PROB_MAP_PAIRS.every(([a, b]) => map[a] + map[b] === 100)
}

function scoreAccuracy (chosen, other) {
  return probMap[chosen] > probMap[other] ? 1 : 0
}

/** determine_reward: null = no response; TRAIN uses the count list, PRAC the ExtraArgs rule. */
function determineReward (selection, accuracy, feedback, leftNum, rightNum) {
  if (accuracy === 999 || selection === null) return null
  if (countBased) {
    const prob = String(probMap[selection === 'left' ? leftNum : rightNum])
    choiceCounts[prob] += 1
    const column = outcomeTable[prob]
    return column[(choiceCounts[prob] - 1) % column.length] === 1
  }
  return accuracy === parseInt(feedback, 10)
}

function parseOutcomeTable (text) {
  const lines = csvLines(text).map((l) => l.split(','))
  const probs = lines[0].slice(1).map((h) => h.trim().replace(/%$/, ''))
  const table = {}
  probs.forEach((p) => { table[p] = [] })
  for (const row of lines.slice(1)) {
    if (!row[0].trim()) continue
    probs.forEach((p, i) => table[p].push(parseInt(row[i + 1], 10)))
  }
  const counts = {}
  probs.forEach((p) => { counts[p] = 0 })
  return [table, counts]
}

async function prepare (page) {
  const cfg = page.cfg
  const bad = cfg.errors.filter((e) => !e.startsWith('valence'))
  if (bad.length) throw new Error('invalid condition: ' + bad.join(', '))
  probMap = PROB_MAPS[cfg.probmap]
  if (!validProbMap(probMap)) throw new Error('invalid probability map ' + cfg.probmap)

  let scheduleName, deck
  switch (cfg.run) {
    case 'PRAC':
      scheduleName = `PRAC-R-${cfg.letter}`
      deck = `prac_${cfg.letter}.csv`
      break
    case 'TRAIN-P1':
    case 'TRAIN-P2':
      scheduleName = `TRAIN-${cfg.letter}${cfg.outlist}-${cfg.run.slice(-2)}`
      deck = cfg.run === 'TRAIN-P1' ? 'train_p1.csv' : 'train_p2.csv'
      break
    case 'TEST':
      scheduleName = `TEST-${cfg.letter}`
      deck = 'test.csv'
      break
    default:
      throw new Error('unknown run ' + cfg.run)
  }
  isTest = cfg.run === 'TEST'
  const base = TASK_DIR + 'schedules/' + SCHEDULE_PREFIX + scheduleName
  const [scheduleText, paramsText, deckText] = await Promise.all([
    fetchText(base + '.schedule'), fetchText(base + '.params'), fetchText(TASK_DIR + 'decks/' + deck)
  ])
  const params = parseParams(paramsText)
  runId = params.run_id
  jitterFixation = params.jitter_fixation === 'True'
  // TEST names an outcome list but never reads it (no reward in TEST)
  countBased = params.count_based_outcome === 'True' && !isTest
  if (countBased) {
    [outcomeTable, choiceCounts] = parseOutcomeTable(await fetchText(TASK_DIR + 'schedules/' + params.count_outcome_schedule))
  }

  const rows = parseSchedule(scheduleText)
  nRows = rows.length
  trials = rows.map((r) => {
    const [iti, isi] = r[2].trim().split(/\s+/).map(Number)
    const [leftPath, rightPath] = r[1].trim().split(/\s+/)
    return { type: r[0].trim(), leftPath, rightPath, iti, isi, feedback: r[3].trim() }
  })
  if (cfg.debugTrials) trials = trials.slice(0, cfg.debugTrials)
  deckUrls = parseDeck(deckText)

  const images = [...deckUrls, TASK_DIR + 'media/fixation.png', TASK_DIR + 'media/canon_images/reward.png', TASK_DIR + 'media/canon_images/zero.png']
  for (const t of trials) {
    if (t.type !== 'HAPPY') images.push(imageUrl(t.leftPath), imageUrl(t.rightPath))
  }
  return images
}

function build (page) {
  const stage = page.stage
  const win = page.win
  run = new CanonRun({ page, runId, runSlot: page.cfg.run })
  let instructStart = 0

  // ----- stimuli -----
  const firstChoice = trials.find((t) => t.type !== 'HAPPY') || { leftPath: 'A.bmp', rightPath: 'B.bmp' }
  const picSize = stage.size([0.5, stage.ratio * 0.5])
  const leftImg = makeImage(win, { name: 'left', image: imageUrl(firstChoice.leftPath), pos: stage.pos([-STIM_ECCENTRICITY, 0]), size: picSize })
  const rightImg = makeImage(win, { name: 'right', image: imageUrl(firstChoice.rightPath), pos: stage.pos([STIM_ECCENTRICITY, 0]), size: picSize })
  const fixation = makeImage(win, { name: 'fixation', image: TASK_DIR + 'media/fixation.png', size: stage.size([0.25, stage.ratio * 0.25]) })
  const ringRadius = stage.x(SELECT_RADIUS) // size=(1, win_ratio): a true circle of 0.30 norm-x
  const leftRing = makeCircle(win, { name: 'left_ring', pos: stage.pos([-STIM_ECCENTRICITY, 0]), radius: ringRadius, edges: 128, line: 'white', lineWidth: 4 })
  const rightRing = makeCircle(win, { name: 'right_ring', pos: stage.pos([STIM_ECCENTRICITY, 0]), radius: ringRadius, edges: 128, line: 'white', lineWidth: 4 })
  const outcomeSize = stage.size([1, stage.ratio])
  const reward = makeImage(win, { name: 'reward', image: TASK_DIR + 'media/canon_images/reward.png', size: outcomeSize })
  const zero = makeImage(win, { name: 'zero', image: TASK_DIR + 'media/canon_images/zero.png', size: outcomeSize })
  const noResponse = makeText(win, { name: 'no_response', text: 'No Response Detected!', height: stage.h(0.15), wrapWidth: stage.fullWidth })
  const counter = makeText(win, { name: 'counter', pos: stage.pos([-0.97, 0.95]), height: stage.h(0.06), colour: DIM_GREY, alignHoriz: 'left', alignVert: 'top' })
  const happyText = makeText(win, { name: 'happy_text', text: 'How happy do you feel at this moment?', pos: stage.pos([0, 0.75]), height: stage.h(0.1), wrapWidth: stage.wrap(1.8) })
  const happyLabels = new Array(11).fill('')
  happyLabels[0] = 'not happy\nat all'
  happyLabels[10] = 'very happy'
  const slider = new RatingScale(win, {
    nTicks: 11, pos: [0, 0], width: stage.x(1.6), tickHeight: stage.h(0.1), labels: happyLabels, labelHeight: stage.h(0.1), markerRadius: 0.02, markerColour: HAPPY_MARKER_IDLE
  })

  // ----- run start -----
  page.add({
    begin: () => {
      run.start()
      run.logCounterbalance()
      run.logCounterbalance('pst_prob_map', formatProbMap(page.cfg.probmap))
      instructStart = run.now()
      run.log('NA', 'NA', event_types.INSTRUCT_ONSET, 'NA', 'NA', 'NA')
    }
  })
  page.add(page.deckRoutine(deckUrls))
  // Texture warm-up: the first render of an image uploads it to the GPU (~0.1 s for the 2041 px
  // outcome PNGs), which would make that phase's onset late. Render everything once, hidden under a
  // black cover, before the timed part of the run.
  let warmFrames = 0
  const warmImages = [...new Set(trials.filter((tr) => tr.type !== 'HAPPY').flatMap((tr) => [tr.leftPath, tr.rightPath]))]
    .map((path, k) => makeImage(win, { name: 'warm_' + k, image: imageUrl(path), size: picSize }))
  const cover = makeRect(win, { name: 'warm_cover', width: stage.fullWidth + 0.1, height: 1.1, fill: 'black' })
  page.add({
    begin: () => {
      warmFrames = 0
      page.scene.set([...warmImages, fixation, reward, zero, noResponse, happyText, ...slider.stims(), cover])
    },
    frame: () => ++warmFrames < 2,
    end: () => page.scene.clear()
  })
  page.add(page.waitStartRoutine(3))

  // ----- trials: one non-slip state machine anchored on TASK_ONSET -----
  let i = 0 // schedule row (= trial_number)
  let t // current trial
  let phases // [{name, end}] for this trial, ends on the ideal grid
  let p // phase index
  let idealStart // ideal start of the current trial
  let onset // run-clock time of the choice / rating onset flip
  let selection, accuracy, leftNum, rightNum, label, selected

  const pairLabel = () => `${probMap[leftNum]}_${probMap[rightNum]}`
  const withCounter = (stims) => [counter, ...stims]

  function startTrial () {
    t = trials[i]
    counter.setText(`${i + 1}/${nRows}`)
    if (t.type === 'HAPPY') {
      const ratingEnd = idealStart + RATING_DURATION
      phases = [{ name: 'rating', end: ratingEnd }, { name: 'happy_fix', end: ratingEnd + HAPPY_POST_FIXATION }]
    } else {
      [leftNum, rightNum] = t.type.split('_')
      label = pairLabel()
      leftImg.setImage(imageUrl(t.leftPath))
      rightImg.setImage(imageUrl(t.rightPath))
      selection = null
      accuracy = 999
      const responseEnd = idealStart + RESPONSE_DURATION
      if (isTest) {
        const feedbackEnd = responseEnd + FEEDBACK_DURATION
        phases = [{ name: 'choice', end: responseEnd }, { name: 'test_feedback', end: feedbackEnd }, { name: 'iti', end: feedbackEnd + t.iti }]
      } else {
        const isiEnd = responseEnd + (jitterFixation ? t.isi : 0)
        const feedbackEnd = isiEnd + FEEDBACK_DURATION
        phases = [{ name: 'choice', end: responseEnd }]
        if (jitterFixation) phases.push({ name: 'isi', end: isiEnd })
        phases.push({ name: 'feedback', end: feedbackEnd }, { name: 'iti', end: feedbackEnd + t.iti })
      }
    }
    p = 0
    enterPhase()
  }

  function enterPhase () {
    const phase = phases[p].name
    const win = page.psychoJS.window
    switch (phase) {
      case 'choice':
        page.scene.set(withCounter([fixation, leftImg, rightImg]))
        page.clearKeys()
        win.callOnFlip(() => {
          onset = run.now()
          const resp = isTest ? t.type : label
          run.log(i, label, event_types.TRIAL_ONSET, 'NA', resp, t.feedback, {}, onset)
          run.log(i, label, event_types.IMAGE_ONSET, 'NA', resp, `${t.leftPath} ${t.rightPath}`, {}, onset)
        })
        break
      case 'isi':
        page.scene.set([fixation])
        run.logOnFlip(i, label, event_types.FIXATION, 'NA', 'NA', pyFloat(t.isi))
        break
      case 'feedback': {
        const rewarded = determineReward(selection, accuracy, t.feedback, leftNum, rightNum)
        page.scene.set(withCounter([rewarded === null ? noResponse : (rewarded ? reward : zero)]))
        const mark = rewarded === null ? 'no response' : (rewarded ? 'reward' : 'zero')
        run.logOnFlip(i, label, event_types.FEEDBACK, 'NA', `${t.feedback}_${accuracy}`, mark)
        break
      }
      case 'test_feedback':
        if (selection === null) {
          page.scene.set(withCounter([noResponse]))
          run.logOnFlip(i, label, event_types.FEEDBACK, 'NA', 'NA', 'no_response')
        } else {
          page.scene.clear() // matched 1.0 s pure black blank, no counter
          run.logOnFlip(i, label, event_types.FEEDBACK, 'NA', 'NA', 'blank')
        }
        break
      case 'iti':
        page.scene.set([fixation])
        run.logOnFlip(i, label, event_types.FIXATION, 'NA', 'NA', pyFloat(t.iti))
        break
      case 'rating':
        selected = false
        slider.setMarker(HAPPY_START_POS)
        slider.setMarkerColour(HAPPY_MARKER_IDLE)
        page.scene.set(withCounter([happyText, ...slider.stims()]))
        page.clearKeys()
        win.callOnFlip(() => {
          onset = run.now()
          run.log(i, 'HAPPY', event_types.RATING_ONSET, 'NA', 'NA', HAPPY_START_POS, {}, onset)
        })
        break
      case 'happy_fix':
        if (!selected) {
          const now = run.now()
          run.log(i, 'HAPPY', event_types.RATING_SELECTION, now - onset, 'no_response', slider.marker, {}, now)
        }
        page.scene.set([fixation])
        run.logOnFlip(i, 'HAPPY', event_types.FIXATION, 'NA', 'NA', pyFloat(HAPPY_POST_FIXATION))
        break
    }
  }

  /** Per-frame input for the phase being shown. */
  function pollPhase () {
    const phase = phases[p].name
    if (phase === 'choice' && selection === null && onset !== undefined) {
      const pressed = page.keys([KEYS.left, KEYS.right])
      if (pressed.length) {
        const key = pressed[0]
        const time = run.keyTime(key)
        selection = key.name === KEYS.left ? 'left' : 'right'
        const [chosen, other, path] = selection === 'left' ? [leftNum, rightNum, t.leftPath] : [rightNum, leftNum, t.rightPath]
        accuracy = scoreAccuracy(chosen, other)
        run.log(i, label, event_types.RESPONSE, time - onset, selection, path, {}, time)
        run.log(i, label, event_types.ACCURACY, time - onset, selection, accuracy, {}, time)
        page.scene.set(withCounter([fixation, leftImg, rightImg, selection === 'left' ? leftRing : rightRing]))
      }
    } else if (phase === 'rating' && !selected && onset !== undefined) {
      for (const key of page.keys([KEYS.left, KEYS.right, KEYS.select])) {
        const time = run.keyTime(key)
        if (key.name === KEYS.select) {
          selected = true
          slider.setMarkerColour(HAPPY_MARKER_SET)
          run.log(i, 'HAPPY', event_types.RATING_SELECTION, time - onset, 'select', slider.marker, {}, time)
          break
        }
        const step = key.name === KEYS.left ? -1 : 1
        const before = slider.marker
        slider.setMarker(before + step)
        if (slider.marker !== before) {
          run.log(i, 'HAPPY', event_types.RATING_CHANGE, time - onset, key.name, slider.marker, {}, time)
        }
      }
      page.scene.set(withCounter([happyText, ...slider.stims()]))
    }
  }

  page.add({
    begin: () => {
      const now = run.now()
      run.log('NA', 'NA', event_types.TASK_ONSET, now - instructStart, 'NA', 'NA', {}, now)
      idealStart = now
      i = 0
      onset = undefined
      if (trials.length) startTrial()
    },
    frame: () => {
      if (i >= trials.length) return false
      pollPhase()
      if (page.due(run, phases[p].end)) {
        p += 1
        if (p >= phases.length) {
          idealStart = phases[phases.length - 1].end // next trial starts where this one should have ended
          i += 1
          onset = undefined
          run.checkpoint()
          if (i >= trials.length) {
            page.scene.clear() // desktop: one blank flip, no end fixation
            return false
          }
          startTrial()
        } else {
          enterPhase()
        }
      }
      return true
    }
  })
  page.add(page.finishRoutine(run))
}

new CanonPage({ expName: 'Probability Selection Task', prepare, build })
