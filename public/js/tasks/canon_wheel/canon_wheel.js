/**
 * CANON Bonus Wheel (StimTool3 WheelOfFortune)
 * Rigged prize wheel used as the second mood-induction step after each memory recall block.
 * Spec: CANON_StimtoolOnline_Port/tasks/05_WheelOfFortune.md. Participants only ever see "Bonus Wheel".
 *
 * The outcome of every spin is chosen before the wheel moves; the press only starts the spin-down,
 * whose travel is the smallest whole number of turns >= 720 deg that lands on the target. All motion
 * is a function of the run clock, never accumulated per frame.
 * @author Aardron Robinson
 */

import {
  CanonPage, CanonRun, KEYS, DIM_GREY,
  fetchText, parseSchedule, parseParams, parseDeck,
  makeText, makeRect, makeShape, makeCircle, makeImage
} from '/js/tasks/canon_common/canon_common.js'

const event_types = {
  INSTRUCT_ONSET: 1,
  TASK_ONSET: 2,
  SPIN_ONSET: 3,
  PRESS: 4,
  OUTCOME_ONSET: 5,
  ITI_ONSET: 6
}

const TASK_DIR = '/js/tasks/canon_wheel/'
const RUN_FILES = { PRAC: 'WOF_run-PRAC', 1: 'WOF_run-1', 2: 'WOF_run-2' }
const DECKS = { PRAC: 'practice.csv', 1: 'go.csv', 2: 'go.csv' }
const FIXATION = TASK_DIR + 'media/fixation.png'

// --- Layout (wheel_layout.py): angles are degrees clockwise from 12 o'clock --------------------
const VALUE_LAYOUT = [10, -5, 5, -10, 10, -5, 5, -10]
const VALUE_SLICE_DEG = 12
const ZERO_SLICE_DEG = (360 - VALUE_LAYOUT.length * VALUE_SLICE_DEG) / VALUE_LAYOUT.length
const SECTOR_DEG = 360 / VALUE_LAYOUT.length
const VALUE_COLORS = { 10: '#1f8a3b', 5: '#14622a', '-5': '#8a2118', '-10': '#c0392b' }
const ZERO_COLORS = ['#3c3c3c', '#4c4c4c']
const RIM_COLOR = '#ffffff'
const HUB_COLOR = '#1a1a1a'

// --- Geometry, height units ------------------------------------------------------------------
const WHEEL_RADIUS = 0.32
const HUB_RADIUS = 0.05
const LABEL_RADIUS = 0.23
const LABEL_HEIGHT = 0.030
const RIM_WIDTH = 3 // px
const HIGHLIGHT_WIDTH = 6 // px
const ARC_STEP_DEG = 1.5
const POINTER_TIP_Y = 0.305
const POINTER_BASE_Y = 0.375
const POINTER_HALF_W = 0.028
const OUTCOME_BOX_SIZE = [0.34, 0.12]

// --- Text, desktop norm units ----------------------------------------------------------------
const PROMPT_POS = [0, -0.85]
const PROMPT_HEIGHT = 0.09
const OUTCOME_HEIGHT = 0.12
const SPIN_COUNTER_POS = [-0.97, 0.95]
const SPIN_COUNTER_HEIGHT = 0.06
const PROMPT_TEXT = 'Press SPACE or click to start slowing the wheel'

// --- Motion ----------------------------------------------------------------------------------
const SPIN_SPEED = 420.0 // deg/s
const SPIN_UP_DUR = 0.6
const MIN_SPIN_BEFORE_STOP = 1.2
const MAX_SPIN_DURATION = 20.0
const MIN_STOP_TRAVEL = 720.0
const LANDING_MARGIN_DEG = 3.0

function slices () {
  const out = []
  VALUE_LAYOUT.forEach((value, i) => {
    out.push({ value, center: i * SECTOR_DEG, width: VALUE_SLICE_DEG, color: VALUE_COLORS[value] })
    out.push({ value: 0, center: i * SECTOR_DEG + SECTOR_DEG / 2, width: ZERO_SLICE_DEG, color: ZERO_COLORS[i % 2] })
  })
  return out
}

/** How an amount is written on the wheel and in the data ('+$10', '-$5', '$0'). */
function amountLabel (value) {
  if (value === 0) return '$0'
  return (value > 0 ? '+$' : '-$') + Math.abs(value)
}

/** What is shown in the centre of the wheel once it stops. */
function outcomeMessage (value) {
  if (value === 0) return '$0'
  return value > 0 ? `Win $${value}!` : `Lose $${Math.abs(value)}`
}

function mod360 (a) {
  return ((a % 360) + 360) % 360
}

/** Wheel angle while free-running: accelerate from rest over SPIN_UP_DUR, then constant speed. */
function freeSpinAngle (elapsed) {
  if (elapsed < SPIN_UP_DUR) return SPIN_SPEED * elapsed * elapsed / (2 * SPIN_UP_DUR)
  return SPIN_SPEED * SPIN_UP_DUR / 2 + SPIN_SPEED * (elapsed - SPIN_UP_DUR)
}

/** Fan of vertices for one slice, in height units, wheel centre at the origin (y up). */
function wedgeVertices (center, width) {
  const steps = Math.max(2, Math.ceil(width / ARC_STEP_DEG) + 1)
  const verts = [[0, 0]]
  for (let i = 0; i < steps; i++) {
    const a = (center - width / 2 + width * i / (steps - 1)) * Math.PI / 180
    verts.push([WHEEL_RADIUS * Math.sin(a), WHEEL_RADIUS * Math.cos(a)])
  }
  return verts
}

// run state filled in by prepare()
let runSpec

new CanonPage({
  expName: 'Bonus Wheel',
  prepare: async (page) => {
    const runKey = page.cfg.run
    if (!(runKey in RUN_FILES)) throw new Error('unknown wheel run: ' + runKey)
    const stem = TASK_DIR + 'schedules/study-SMITH-2026-CANON_task-' + RUN_FILES[runKey]
    const [scheduleText, paramsText, deckText] = await Promise.all([
      fetchText(stem + '.schedule'), fetchText(stem + '.params'), fetchText(TASK_DIR + 'decks/' + DECKS[runKey])
    ])
    const params = parseParams(paramsText)
    let rows = parseSchedule(scheduleText)
    if (page.cfg.debugTrials) rows = rows.slice(0, page.cfg.debugTrials)

    const spins = rows.map((row) => {
      const type = row[0].trim().toUpperCase()
      const durations = (row[2] || '').trim().split(/\s+/).map(Number)
      if (type !== 'ZERO' && type !== 'RIGGED') throw new Error('bad spin type: ' + row[0])
      if (durations.length !== 2 || durations.some(isNaN)) throw new Error('each spin needs "outcome iti" durations')
      return { type, outcomeDur: durations[0], itiDur: durations[1] }
    })

    // Rigged amount: no RIGGED row -> 0/'none'; otherwise the session's memory valence picks it.
    // There is deliberately no default: guessing the sign would run the wrong mood condition.
    let riggedAmount = 0
    let label = 'none'
    let error = null
    if (spins.some((s) => s.type === 'RIGGED')) {
      const key = { happy: 'rigged_amount_happy', sad: 'rigged_amount_sad' }[page.cfg.valence]
      if (!key || params[key] === undefined) {
        error = 'BONUS WHEEL OUTCOME NOT CONFIGURED (memory valence = ' + (page.cfg.valence || 'missing') + ').'
      } else {
        riggedAmount = parseInt(params[key], 10)
        label = page.cfg.valence
      }
    }
    for (const s of spins) s.amount = s.type === 'RIGGED' ? riggedAmount : 0

    runSpec = {
      runId: params.run_id,
      deck: parseDeck(deckText),
      spins,
      error,
      valenceLabel: label + ' ' + amountLabel(riggedAmount)
    }
    return [...runSpec.deck, FIXATION]
  },
  build: (page) => {
    if (runSpec.error) {
      page.add(page.errorRoutine(runSpec.error))
      return
    }
    const run = new CanonRun({
      page,
      runId: runSpec.runId,
      runSlot: 'WOF-' + page.cfg.run,
      extraColumns: ['final_angle', 'jitter', 'travel', 'stop_duration']
    })
    const wheel = buildWheel(page)
    let instructOnset

    page.add({
      begin: () => {
        run.start()
        run.logCounterbalance()
        run.logCounterbalance('wheel_valence', runSpec.valenceLabel)
        instructOnset = run.now()
        run.log('NA', 'NA', event_types.INSTRUCT_ONSET, 'NA', 'NA', 'NA')
      }
    })
    page.add(page.deckRoutine(runSpec.deck))
    page.add({
      begin: () => {
        // no start gate: straight from the last slide to the first spin
        const t = run.now()
        run.log('NA', 'NA', event_types.TASK_ONSET, t - instructOnset, 'NA', runSpec.valenceLabel)
      }
    })
    page.add(spinsRoutine(page, run, wheel))
    page.add(page.finishRoutine(run))
  }
})

/** Build every wheel stimulus once; the wheel is turned by setting ori each frame. */
function buildWheel (page) {
  const win = page.win
  const stage = page.stage
  const sl = slices()
  const wedges = sl.map((s, i) => {
    const verts = wedgeVertices(s.center, s.width)
    return makeShape(win, { name: 'wedge_' + i, vertices: verts, fill: s.color, line: s.color, lineWidth: 1 })
  })
  const highlights = sl.map((s, i) => makeShape(win, {
    name: 'highlight_' + i, vertices: wedgeVertices(s.center, s.width), line: 'white', lineWidth: HIGHLIGHT_WIDTH
  }))
  const labels = sl.map((s, i) => makeText(win, { name: 'label_' + i, text: amountLabel(s.value), height: LABEL_HEIGHT }))
  return {
    slices: sl,
    wedges,
    highlights,
    labels,
    rim: makeCircle(win, { name: 'rim', radius: WHEEL_RADIUS, edges: 180, line: RIM_COLOR, lineWidth: RIM_WIDTH }),
    hub: makeCircle(win, { name: 'hub', radius: HUB_RADIUS, edges: 72, fill: HUB_COLOR, line: RIM_COLOR, lineWidth: RIM_WIDTH }),
    pointer: makeShape(win, {
      name: 'pointer',
      vertices: [[-POINTER_HALF_W, POINTER_BASE_Y], [POINTER_HALF_W, POINTER_BASE_Y], [0, POINTER_TIP_Y]],
      fill: 'white',
      line: 'white',
      lineWidth: 1
    }),
    counter: makeText(win, {
      name: 'spin_counter', pos: stage.pos(SPIN_COUNTER_POS), height: stage.h(SPIN_COUNTER_HEIGHT),
      colour: DIM_GREY, alignHoriz: 'left', alignVert: 'top'
    }),
    prompt: makeText(win, { name: 'prompt', text: PROMPT_TEXT, pos: stage.pos(PROMPT_POS), height: stage.h(PROMPT_HEIGHT), wrapWidth: stage.wrap(1.8) }),
    outcomeBox: makeRect(win, { name: 'outcome_box', width: OUTCOME_BOX_SIZE[0], height: OUTCOME_BOX_SIZE[1], fill: HUB_COLOR, line: RIM_COLOR, lineWidth: RIM_WIDTH }),
    outcomeText: makeText(win, { name: 'outcome_text', height: stage.h(OUTCOME_HEIGHT), wrapWidth: stage.wrap(1.8) }),
    fixation: makeImage(win, { name: 'fixation', image: FIXATION, size: stage.size([0.5, 0.5]) })
  }
}

/**
 * Stimuli of the wheel turned `angle` degrees clockwise, bottom to top. psychoJS 2021.2 turns a
 * positive ori COUNTER-clockwise (its root container is y-flipped), the opposite of PsychoPy, so
 * every desktop ori is negated: wedges -angle, labels -(a - 90).
 */
function wheelStims (wheel, angle, highlight = null) {
  const list = []
  for (const wedge of wheel.wedges) {
    wedge.setOri(-angle)
    list.push(wedge)
  }
  wheel.labels.forEach((label, i) => {
    // reads outward along the radius (desktop ori = a - 90, clockwise)
    const a = wheel.slices[i].center + angle
    const r = a * Math.PI / 180
    label.setPos([LABEL_RADIUS * Math.sin(r), LABEL_RADIUS * Math.cos(r)])
    label.setOri(-(a - 90))
    list.push(label)
  })
  if (highlight !== null) {
    wheel.highlights[highlight].setOri(-angle)
    list.push(wheel.highlights[highlight])
  }
  list.push(wheel.rim, wheel.hub, wheel.pointer, wheel.counter)
  return list
}

/** All spins of the run as one routine (phase machine on the run clock). */
function spinsRoutine (page, run, wheel) {
  const spins = runSpec.spins
  let n = 0
  let phase
  let lastSlice = null
  let s // current spin state
  let prevMouseDown = false

  const startSpin = () => {
    const spin = spins[n]
    const pool = wheel.slices.map((slice, i) => (slice.value === spin.amount ? i : -1)).filter((i) => i >= 0)
    const choices = pool.filter((i) => i !== lastSlice)
    const pick = choices.length ? choices : pool
    const target = pick[Math.floor(Math.random() * pick.length)]
    s = { spin, target, spinStart: run.now() }
    wheel.counter.setText(`Spin ${n + 1} of ${spins.length}`)
    run.log(n, spin.type, event_types.SPIN_ONSET, 'NA', 'NA', amountLabel(spin.amount), {}, s.spinStart)
    page.clearKeys()
    prevMouseDown = page.mouse.getPressed()[0] === 1
    phase = 'free'
  }

  const press = (pressTime, response) => {
    s.pressTime = pressTime
    s.pressAngle = mod360(freeSpinAngle(pressTime - s.spinStart))
    run.log(n, s.spin.type, event_types.PRESS, pressTime - s.spinStart, response, s.pressAngle.toFixed(1), {}, pressTime)
    const target = wheel.slices[s.target]
    const span = Math.max(0, target.width / 2 - LANDING_MARGIN_DEG)
    s.jitter = (Math.random() * 2 - 1) * span
    s.finalAngle = mod360(-target.center + s.jitter)
    s.travel = mod360(s.finalAngle - s.pressAngle)
    while (s.travel < MIN_STOP_TRAVEL) s.travel += 360
    s.stopDuration = 2 * s.travel / SPIN_SPEED
    phase = 'down'
  }

  return {
    begin: () => {
      n = 0
      startSpin()
    },
    frame: () => {
      const now = run.now()
      if (phase === 'free') {
        const elapsed = now - s.spinStart
        // Input: SPACE or a click/tap; presses before MIN_SPIN_BEFORE_STOP are discarded.
        const keys = page.keys([KEYS.select])
        const mouseDown = page.mouse.getPressed()[0] === 1
        const clicked = mouseDown && !prevMouseDown
        prevMouseDown = mouseDown
        const key = keys.find((k) => run.keyTime(k) - s.spinStart >= MIN_SPIN_BEFORE_STOP)
        if (key) {
          press(Math.max(run.keyTime(key), s.spinStart + MIN_SPIN_BEFORE_STOP), 'space')
        } else if (clicked && elapsed >= MIN_SPIN_BEFORE_STOP) {
          press(now, 'mouse')
        } else if (elapsed >= MAX_SPIN_DURATION) {
          press(s.spinStart + MAX_SPIN_DURATION, 'no_response')
        } else {
          page.scene.set([...wheelStims(wheel, mod360(freeSpinAngle(elapsed))), wheel.prompt])
          return true
        }
      }
      if (phase === 'down') {
        const tau = now - s.pressTime
        if (tau < s.stopDuration) {
          const angle = s.pressAngle + SPIN_SPEED * tau - 0.5 * (SPIN_SPEED * SPIN_SPEED / (2 * s.travel)) * tau * tau
          page.scene.set(wheelStims(wheel, mod360(angle))) // prompt removed at the press
          return true
        }
        // the spin is participant-paced, so the ideal clock is re-anchored at the stop
        s.outcomeStart = now
        lastSlice = s.target
        const landed = wheel.slices[s.target].value
        wheel.outcomeText.setText(outcomeMessage(landed))
        run.log(n, s.spin.type, event_types.OUTCOME_ONSET, 'NA', String(s.target), amountLabel(landed), {
          final_angle: s.finalAngle, jitter: s.jitter, travel: s.travel, stop_duration: s.stopDuration
        }, s.outcomeStart)
        page.scene.set([...wheelStims(wheel, s.finalAngle, s.target), wheel.outcomeBox, wheel.outcomeText])
        phase = 'outcome'
        return true
      }
      if (phase === 'outcome') {
        if (!page.due(run, s.outcomeStart + s.spin.outcomeDur)) return true
        run.log(n, s.spin.type, event_types.ITI_ONSET, 'NA', 'NA', String(s.spin.itiDur))
        page.scene.set([wheel.fixation])
        phase = 'iti'
        return true
      }
      if (phase === 'iti') {
        if (!page.due(run, s.outcomeStart + s.spin.outcomeDur + s.spin.itiDur)) return true
        run.checkpoint()
        n += 1
        if (n >= spins.length) return false
        startSpin()
        page.scene.set([...wheelStims(wheel, 0), wheel.prompt])
        return true
      }
      return true
    },
    end: () => page.scene.clear()
  }
}
