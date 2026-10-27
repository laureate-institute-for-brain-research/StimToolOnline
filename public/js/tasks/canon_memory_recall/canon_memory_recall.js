/**
 * CANON MemoryRecall
 * Port of StimTool3 MemoryRecall (CANON_StimtoolOnline_Port/tasks/01_MemoryRecall.md).
 *   run=entry    participant types their 6 memory sentences (stored server-side per subject + visit)
 *   run=recall1  memories 1-3 shown as timed recall slides
 *   run=recall2  memories 4-6
 * @author Aardron Robinson
 */

import { CanonPage, CanonRun, fetchText, parseSchedule, parseDeck, makeRect, makeText } from '/js/tasks/canon_common/canon_common.js'

const event_types = {
  INSTRUCT_ONSET: 1,
  TASK_ONSET: 2,
  SENTENCE_ENTRY: 3,
  SLIDE_ONSET: 4,
  TRANSITION_ONSET: 5
}

const TASK_DIR = '/js/tasks/canon_memory_recall/'
const SCHEDULE = (run) => TASK_DIR + 'schedules/study-SMITH-2026-CANON_task-MEM_run-' + run + '.schedule'

const RUNS = {
  entry: { runId: '_MEM-EN-_BEH' },
  recall1: { runId: '_MEM-R1-_BEH' },
  recall2: { runId: '_MEM-R2-_BEH' }
}

const NUM_MEMORIES = 6
const MAX_MEMORY_LENGTH = 250

// Recall colours (MemoryRecall.py:72-73): the same blue for every valence, and a grey that is
// luminance-matched to it for the transition between memories
const RECALL_BACKGROUND = '#0000A8'
const TRANSITION_COLOUR = '#2F2F2F'
const TRANSITION_DUR = 3.0

// Participant-facing entry wording (replaces the RA's verbal briefing on desktop).
// DRAFT: needs study-team review.
const ENTRY_PROMPTS = {
  happy: {
    title: 'Your Happy Memories',
    body: [
      'Please think of <b>six different times in your life when you felt happy</b>. Choose specific events that you remember well, such as a particular day or moment, rather than a general period of time.',
      'For each memory, write one short sentence that will help you bring that memory back to mind. Later in this session you will see your sentences again and will be asked to remember each event in as much detail as you can.',
      'Please choose memories you feel comfortable recalling.'
    ]
  },
  sad: {
    title: 'Your Sad Memories',
    body: [
      'Please think of <b>six different times in your life when you felt sad</b>. Choose specific events that you remember well, such as a particular day or moment, rather than a general period of time.',
      'For each memory, write one short sentence that will help you bring that memory back to mind. Later in this session you will see your sentences again and will be asked to remember each event in as much detail as you can.',
      'Please choose memories you feel comfortable recalling.'
    ]
  }
}

let run
let slot
let deckUrls = []
let scheduleRows = []
let memories = null
let setupError = null

async function postJson (url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!response.ok) throw new Error(url + ' failed (' + response.status + ')')
  return response.json()
}

new CanonPage({
  expName: 'Memories',
  prepare: async (page) => {
    slot = page.cfg.run
    if (!(slot in RUNS)) throw new Error('unknown run ' + slot)
    if (slot === 'entry') {
      if (!(page.cfg.valence in ENTRY_PROMPTS)) setupError = 'The memory condition is not set (valence=' + (page.cfg.valence || 'missing') + ').'
      return []
    }
    scheduleRows = parseSchedule(await fetchText(SCHEDULE(slot)))
    if (page.cfg.debugTrials) scheduleRows = scheduleRows.slice(0, page.cfg.debugTrials)
    deckUrls = parseDeck(await fetchText(TASK_DIR + 'decks/recall.csv'))
    if (page.link) {
      try {
        memories = (await postJson('/getCanonMemories', { id: page.link })).memories
      } catch (err) {
        console.error(err)
      }
    }
    if (!Array.isArray(memories) || memories.length !== NUM_MEMORIES) {
      setupError = 'Your memory sentences from the start of this session could not be found.'
    }
    return deckUrls
  },
  build: (page) => {
    run = new CanonRun({ page, runId: RUNS[slot].runId, runSlot: slot })
    if (setupError) {
      page.add(page.errorRoutine(setupError))
      return
    }
    if (slot === 'entry') {
      buildEntry(page)
    } else {
      buildRecall(page)
    }
  }
})

// ---------------------------------------------------------------------------------------------
// entry
// ---------------------------------------------------------------------------------------------

function buildEntry (page) {
  page.add({
    begin: () => {
      run.start()
      run.logCounterbalance()
      run.log('NA', 'NA', event_types.INSTRUCT_ONSET, 'NA', 'NA', 'NA')
    }
  })

  let form
  let done = false
  page.add({
    begin: () => {
      page.scene.clear()
      form = createEntryForm(page.cfg.valence, async (sentences) => {
        if (page.link) {
          await postJson('/saveCanonMemories', { id: page.link, memories: sentences })
        }
        const t = run.now()
        sentences.forEach((sentence, i) => {
          run.log(i + 1, 'ENTRY', event_types.SENTENCE_ENTRY, 'NA', 'NA', sentence, {}, t)
        })
        done = true
      })
    },
    frame: () => !done,
    end: () => {
      form.remove()
      page.clearKeys()
    }
  })
  page.add(page.finishRoutine(run))
}

/**
 * Participant-facing replacement for the desktop RA dialog: six required single-line fields.
 * onSubmit(sentences) is awaited; if it throws, the error is shown and the participant can retry.
 */
function createEntryForm (valence, onSubmit) {
  const prompt = ENTRY_PROMPTS[valence]
  const overlay = document.createElement('div')
  overlay.id = 'canon-memory-entry'
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#000;color:#fff;overflow-y:auto;font-family:Arial,sans-serif;'
  const panel = document.createElement('div')
  panel.style.cssText = 'max-width:900px;margin:4vh auto;padding:0 24px;font-size:18px;line-height:1.45;'
  overlay.appendChild(panel)

  const title = document.createElement('h2')
  title.textContent = prompt.title
  title.style.cssText = 'text-align:center;font-size:30px;margin:0 0 18px 0;'
  panel.appendChild(title)
  for (const paragraph of prompt.body) {
    const p = document.createElement('p')
    p.innerHTML = paragraph
    panel.appendChild(p)
  }

  const inputs = []
  for (let i = 0; i < NUM_MEMORIES; i++) {
    const label = document.createElement('label')
    label.textContent = 'Memory ' + (i + 1)
    label.style.cssText = 'display:block;margin:14px 0 4px 0;font-weight:bold;'
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = MAX_MEMORY_LENGTH
    input.autocomplete = 'off'
    input.style.cssText = 'width:100%;box-sizing:border-box;padding:8px;font-size:18px;border-radius:4px;border:1px solid #888;'
    label.htmlFor = input.id = 'canon-memory-' + (i + 1)
    panel.appendChild(label)
    panel.appendChild(input)
    inputs.push(input)
  }

  const message = document.createElement('p')
  message.style.cssText = 'color:#ff6b6b;min-height:1.4em;'
  panel.appendChild(message)

  const button = document.createElement('button')
  button.textContent = 'Continue'
  button.disabled = true
  button.style.cssText = 'display:block;margin:6px auto 40px auto;padding:10px 40px;font-size:20px;border-radius:6px;cursor:pointer;'
  panel.appendChild(button)

  // one sentence per memory: no line breaks (recall reads memories by index)
  const clean = (value) => value.replace(/[\r\n]+/g, ' ').trim()
  const update = () => {
    const complete = inputs.every((input) => clean(input.value) !== '')
    button.disabled = !complete
    message.textContent = complete ? '' : 'Please fill in all 6 memories to continue.'
  }
  for (const input of inputs) {
    input.addEventListener('input', () => {
      if (/[\r\n]/.test(input.value)) input.value = input.value.replace(/[\r\n]+/g, ' ')
      update()
    })
    // Enter must not submit or add a line; it moves to the next field
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        const next = inputs[inputs.indexOf(input) + 1]
        if (next) next.focus()
      }
    })
  }
  update()

  button.addEventListener('click', async () => {
    const sentences = inputs.map((input) => clean(input.value))
    if (sentences.some((s) => s === '')) return update()
    button.disabled = true
    inputs.forEach((input) => { input.disabled = true })
    message.textContent = 'Saving...'
    try {
      await onSubmit(sentences)
      message.textContent = ''
    } catch (err) {
      console.error(err)
      message.textContent = 'Your memories could not be saved. Please check your internet connection and press Continue to try again.'
      inputs.forEach((input) => { input.disabled = false })
      button.disabled = false
    }
  })

  document.body.appendChild(overlay)
  inputs[0].focus()
  return overlay
}

// ---------------------------------------------------------------------------------------------
// recall1 / recall2
// ---------------------------------------------------------------------------------------------

function buildRecall (page) {
  const stage = page.stage
  // "<valence> #0000A8" (MemoryRecall.py:107-111); desktop logs 'none' when no valid valence is set
  const valenceLabel = ['happy', 'sad'].includes(page.cfg.valence) ? page.cfg.valence : 'none'
  let instructOnset

  // Segments: memory slides with a grey transition only BETWEEN them (MemoryRecall.py:301-319)
  const segments = []
  let slide = 0
  for (const row of scheduleRows) {
    const index = parseInt(row[0], 10)
    if (isNaN(index)) continue // non-numeric index: skipped silently, as on desktop
    if (index < 1 || index > NUM_MEMORIES) throw new Error('memory index out of range: ' + row[0])
    if (slide > 0) segments.push({ kind: 'transition', duration: TRANSITION_DUR, slide, index })
    segments.push({ kind: 'slide', duration: parseFloat(row[2]), slide, index })
    slide += 1
  }

  page.add({
    begin: () => {
      run.start()
      run.logCounterbalance()
      instructOnset = run.now()
      run.log('NA', 'NA', event_types.INSTRUCT_ONSET, 'NA', 'NA', 'NA')
    }
  })
  page.add(page.deckRoutine(deckUrls))
  page.add(page.waitStartRoutine(3))

  const background = makeRect(page.win, { name: 'recall_background', width: stage.fullWidth + 0.02, height: 1.02, fill: RECALL_BACKGROUND })
  const transition = makeRect(page.win, { name: 'transition', width: stage.fullWidth + 0.02, height: 1.02, fill: TRANSITION_COLOUR })
  const text = makeText(page.win, { name: 'memory', text: '', height: stage.h(0.1), wrapWidth: stage.wrap(1.6) })

  let current = -1
  let segmentEnd = 0
  const startSegment = (k) => {
    current = k
    const seg = segments[k]
    segmentEnd += seg.duration // cumulative from TASK_ONSET: lateness never accumulates
    if (seg.kind === 'slide') {
      const sentence = memories[seg.index - 1]
      text.setText(sentence)
      page.scene.set([background, text])
      run.logOnFlip(seg.slide, String(seg.index), event_types.SLIDE_ONSET, 'NA', 'NA', sentence)
    } else {
      page.scene.set([transition])
      run.logOnFlip(seg.slide, String(seg.index), event_types.TRANSITION_ONSET, 'NA', 'NA', TRANSITION_DUR.toFixed(1) + 's ' + TRANSITION_COLOUR)
    }
  }

  page.add({
    begin: () => {
      const taskOnset = run.now()
      run.log('NA', 'NA', event_types.TASK_ONSET, taskOnset - instructOnset, 'NA', valenceLabel + ' ' + RECALL_BACKGROUND, {}, taskOnset)
      segmentEnd = taskOnset
      if (segments.length) startSegment(0)
    },
    frame: () => {
      if (current < 0) return false
      if (page.due(run, segmentEnd)) {
        if (current + 1 >= segments.length) return false
        startSegment(current + 1)
        run.checkpoint()
      }
      return true
    },
    end: () => page.scene.clear()
  })
  page.add(page.finishRoutine(run))
}
