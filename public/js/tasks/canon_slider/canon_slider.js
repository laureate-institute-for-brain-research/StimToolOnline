/**
 * CANON Slider ratings
 * Self-report rating blocks bracketing the PST and SET blocks (PRE-PST, POST-TRAIN, POST-TEST,
 * PRE-SET, POST-SET). Port of StimTool3 Slider; spec: CANON_StimtoolOnline_Port/tasks/02_Slider-Ratings.md
 * @author Aardron Robinson
 */

import {
  CanonPage, CanonRun, KEYS, RatingScale, fetchText, parseSchedule, parseParams, parseDeck,
  makeText, makeImage, makeRect
} from '/js/tasks/canon_common/canon_common.js'

const event_types = {
  INSTRUCT_ONSET: 0,
  RESPONSE: 1
}

const TASK_DIR = '/js/tasks/canon_slider/'
const HAPPY_SCALE = TASK_DIR + 'media/happy_scale.png'
const SLOTS = ['PRE-PST', 'POST-TRAIN', 'POST-TEST', 'PRE-SET', 'POST-SET']

let run
let items = []
let deck = []
let runId = ''

/**
 * One schedule row -> item. Columns: Question_Type, Question, Sub Text, Audio, Number of Choices,
 * then one cell per tick label (empty = unlabeled tick). Literal "\n" in a label is a line break.
 */
function toItem (row, i) {
  const n = parseInt(row[4], 10)
  const labels = []
  for (let k = 0; k < n; k++) labels.push((row[5 + k] || '').replace(/\\n/g, '\n'))
  return { index: i + 1, type: row[0], question: row[1], n, labels }
}

/**
 * Rating loop for one item. Keyboard reproduces desktop (first press lands next to the
 * midpoint, then +/-1, SELECT commits; select without a marker shows a reminder). Mouse: click a
 * tick to place the marker, then click Continue (or press SPACE).
 */
function itemRoutine (page, item) {
  let scale, prompt, face, reminder, button, buttonText
  let onset, firstKey, showReminder, wasPressed, done
  const isHappy = item.type === 'happy'
  return {
    begin: () => {
      const st = page.stage
      prompt = makeText(page.win, { name: 'prompt', text: item.question, pos: st.pos([0, 0.7]), height: st.h(0.1), wrapWidth: st.wrap(1.5) })
      scale = new RatingScale(page.win, {
        nTicks: item.n,
        pos: st.pos([0, 0]),
        width: st.x(1.5),
        tickHeight: st.h(0.1),
        labels: item.labels,
        labelHeight: st.h(0.08),
        markerColour: 'white'
      })
      if (isHappy) face = makeImage(page.win, { name: 'happy_scale', image: HAPPY_SCALE, pos: st.pos([0, 0.3]), size: st.size([1.8, 0.4]) })
      reminder = makeText(page.win, { name: 'reminder', text: 'Please enter a response', pos: st.pos([0, -0.7]), height: st.h(0.1) })
      button = makeRect(page.win, { name: 'continue_box', pos: st.pos([0, -0.5]), width: 0.22, height: 0.07, fill: '#333333', line: 'white', lineWidth: 2 })
      buttonText = makeText(page.win, { name: 'continue_text', text: 'Continue', pos: st.pos([0, -0.5]), height: 0.035 })
      firstKey = true
      showReminder = false
      wasPressed = true // ignore a mouse button still held from the previous screen
      done = false
      onset = run.now()
      page.psychoJS.window.callOnFlip(() => { onset = run.now() })
      page.clearKeys()
    },
    frame: () => {
      const mid = Math.floor(item.n / 2)
      let commit = null // { time, input }

      for (const key of page.keys([KEYS.left, KEYS.right, KEYS.select])) {
        if (key.name === KEYS.left) {
          const target = firstKey ? mid - 1 : scale.marker - 1
          firstKey = false
          if (target >= 0) scale.setMarker(target)
        } else if (key.name === KEYS.right) {
          const target = firstKey ? (item.n % 2 === 0 ? mid : mid + 1) : scale.marker + 1
          firstKey = false
          if (target <= item.n - 1) scale.setMarker(target)
        } else if (key.name === KEYS.select) {
          if (scale.marker === null) {
            showReminder = true
          } else {
            commit = { time: run.keyTime(key), input: 'keyboard' }
            break
          }
        }
      }

      const pressed = page.mouse.getPressed()[0] === 1
      if (pressed && !wasPressed && !commit) {
        const pos = page.mouse.getPos()
        const tick = scale.tickAt(pos, page.stage.h(0.1))
        if (tick !== null) {
          scale.setMarker(tick)
          firstKey = false
        } else if (Math.abs(pos[0] - button.pos[0]) <= 0.11 && Math.abs(pos[1] - button.pos[1]) <= 0.035) {
          if (scale.marker === null) showReminder = true
          else commit = { time: run.now(), input: 'mouse' }
        }
      }
      wasPressed = pressed

      if (commit) {
        const label = item.labels[scale.marker] || ''
        run.log(item.type, 'NA', event_types.RESPONSE, commit.time - onset, scale.marker, item.question, {
          item_index: item.index,
          response_label: label.replace(/\n/g, ' '),
          response_value_1based: scale.marker + 1,
          input: commit.input
        }, commit.time)
        run.checkpoint()
        done = true
        return false
      }

      const stims = [prompt]
      if (isHappy) stims.push(face)
      stims.push(...scale.stims(), button, buttonText)
      if (showReminder) stims.push(reminder)
      page.scene.set(stims)
      return !done
    },
    end: () => page.scene.clear()
  }
}

new CanonPage({
  expName: 'Ratings',
  prepare: async (page) => {
    const slot = page.cfg.run
    if (!SLOTS.includes(slot)) throw new Error('unknown rating slot ' + slot)
    // -R and -L schedules of a slot are identical; online uses one keyboard map.
    const stem = TASK_DIR + 'schedules/study-SMITH-2026-CANON_task-RATE_run-' + slot + '-R'
    items = parseSchedule(await fetchText(stem + '.schedule')).map(toItem)
    runId = parseParams(await fetchText(stem + '.params')).run_id
    deck = parseDeck(await fetchText(TASK_DIR + 'decks/rating.csv'))
    if (page.cfg.debugTrials) items = items.slice(0, page.cfg.debugTrials)
    return [...deck, HAPPY_SCALE]
  },
  build: (page) => {
    run = new CanonRun({
      page,
      runId,
      runSlot: page.cfg.run,
      extraColumns: ['item_index', 'response_label', 'response_value_1based', 'input']
    })
    page.add({
      begin: () => {
        run.start()
        run.logCounterbalance()
        run.log('NA', 'NA', event_types.INSTRUCT_ONSET, 'NA', 'NA', 'NA')
      }
    })
    page.add(page.deckRoutine(deck))
    page.add(page.messageRoutine('Are you ready to begin rating?\n\nPress the RIGHT ARROW key to start.', { height: 0.05 }))
    for (const item of items) page.add(itemRoutine(page, item))
    page.add(page.finishRoutine(run))
  }
})
