/**
 * CANON common library
 * Shared plumbing for the CANON StimtoolOnline tasks (canon_memory_recall, canon_slider,
 * canon_pst, canon_set, canon_wheel, canon_break). Port of the StimTool3 CANON functional session;
 * the specs live in CANON_StimtoolOnline_Port/.
 *
 * Every CANON page is one desktop run. A page:
 *   1. reads its condition from the URL (letter / outlist / valence / probmap, written into the
 *      task URLs of the condition study's JSON), and its subject/session from /getInfo,
 *   2. shows the usual psychoJS info dialog while resources download (OK also enters fullscreen),
 *   3. runs its routines, logging desktop-style event rows,
 *   4. saves to /save and redirects to the next entry of the study order.
 *
 * @author Aardron Robinson
 */

import { core, util, visual } from '/psychojs/psychojs-2021.2.3.js'
const { PsychoJS } = core
const { Scheduler } = util

// ---------------------------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------------------------

/** psychoJS key names for the desktop LEFT / RIGHT / SELECT buttons. */
export const KEYS = { left: 'left', right: 'right', select: 'space' }

/** Shared desktop event codes (StimToolLib.py). */
export const COUNTERBALANCE = 92
export const TASK_END = 99

/**
 * First segment of the arm string logged in the COUNTERBALANCE row. Desktop arms start with the
 * response hand (RIGHT-/LEFT-); online there is one fixed keyboard map, so the hand is replaced by
 * this label. The rest of the arm string keeps the desktop format: <hand>-PST-FIRST-<letter><digit>.
 */
export const ARM_HAND_LABEL = 'KEYBOARD'

/** Data folder under DATA_PATH that every CANON page saves into (whatever the condition study). */
export const DATA_STUDY = 'CANON'

/** Widest stage aspect used for layout; wider windows are pillar-boxed (see Stage). */
export const MAX_STAGE_ASPECT = 16 / 9

/** The trial counter / spin counter style shared by PST, SET and the wheel (desktop #9a9a9a). */
export const DIM_GREY = '#9a9a9a'

const SAVE_INTERVAL_S = 15
const SAVE_RETRIES = 3

// ---------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------

/** Read a URL query parameter (StimToolLib.js getQueryVariable, re-implemented for modules). */
export function getQuery (name) {
  const params = new URLSearchParams(window.location.search)
  return params.has(name) ? params.get(name) : null
}

/** YYYY_MM_DD_HH_MM_SS, used in the saved file name. */
export function fileDate () {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return [d.getFullYear(), p(d.getMonth() + 1), p(d.getDate()), p(d.getHours()), p(d.getMinutes()), p(d.getSeconds())].join('_')
}

export async function fetchText (url) {
  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`could not load ${url} (${response.status})`)
  return response.text()
}

/** Split a CSV into lines with CR stripped and blank lines dropped (desktop files are CRLF). */
export function csvLines (text) {
  return text.replace(/\r/g, '').split('\n').filter((line) => line.trim() !== '')
}

/**
 * Parse a StimTool .schedule: skip the header row, naive comma split (no quoting, like
 * StimToolLib.read_trial_structure).
 */
export function parseSchedule (text) {
  return csvLines(text).slice(1).map((line) => line.split(','))
}

/** Parse a StimTool .params file: "key value" per line, quotes around strings removed. */
export function parseParams (text) {
  const params = {}
  for (const line of csvLines(text)) {
    const match = line.trim().match(/^(\S+)\s+(.*)$/)
    if (!match) continue
    params[match[1]] = match[2].trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1')
  }
  return params
}

/** Online deck: one slide URL per line. */
export function parseDeck (text) {
  return csvLines(text).map((line) => line.trim())
}

export function formatNumber (x, digits = 4) {
  return (typeof x === 'number' && isFinite(x)) ? Number(x.toFixed(digits)) : x
}

// ---------------------------------------------------------------------------------------------
// Condition config
// ---------------------------------------------------------------------------------------------

const VALID = {
  letter: ['A', 'B'],
  outlist: ['1', '2'],
  valence: ['happy', 'sad'],
  probmap: ['CURRENT', 'ALT1', 'ALT2']
}

/**
 * Condition factors from the URL. Every CANON task URL in the study JSON carries all four, so a
 * page never has to guess. Missing/invalid values are reported in `errors`; each task decides
 * whether it can run without them (e.g. the wheel refuses to run a rigged spin without valence).
 */
export function readConfig () {
  const cfg = {
    run: getQuery('run'),
    index: parseInt(getQuery('index') || '0', 10),
    id: getQuery('id'),
    letter: (getQuery('letter') || '').toUpperCase(),
    outlist: getQuery('outlist') || '',
    valence: (getQuery('valence') || '').toLowerCase(),
    probmap: (getQuery('probmap') || '').toUpperCase(),
    // Testing only: truncate the trial list to the first N rows.
    debugTrials: getQuery('debug_trials') ? parseInt(getQuery('debug_trials'), 10) : null,
    errors: []
  }
  for (const key of Object.keys(VALID)) {
    if (!VALID[key].includes(cfg[key])) cfg.errors.push(`${key}=${cfg[key] || '(missing)'}`)
  }
  cfg.arm = `${ARM_HAND_LABEL}-PST-FIRST-${cfg.letter}${cfg.outlist}`
  return cfg
}

// ---------------------------------------------------------------------------------------------
// Stage: desktop norm coordinates -> psychoJS height units
// ---------------------------------------------------------------------------------------------

/**
 * Desktop CANON layouts are written in PsychoPy norm units with a win_ratio (= W/H) correction,
 * i.e. they scale with window width. The window here uses 'height' units. With a = stage aspect:
 *   x_height = x_norm * a / 2,  y_height = y_norm / 2.
 * The stage aspect is the window aspect, capped at MAX_STAGE_ASPECT so ultra-wide screens do not
 * blow up width-scaled stimuli (e.g. PST outcome images, which are 0.5*W tall on desktop).
 */
export class Stage {
  constructor (win) {
    this.win = win
    this.update()
  }

  update () {
    this.windowAspect = this.win.size[0] / this.win.size[1]
    this.a = Math.min(this.windowAspect, MAX_STAGE_ASPECT)
  }

  /** desktop win_ratio */
  get ratio () { return this.a }
  x (xNorm) { return xNorm * this.a / 2 }
  y (yNorm) { return yNorm / 2 }
  pos (p) { return [this.x(p[0]), this.y(p[1])] }
  size (s) { return [this.x(s[0]), this.y(s[1])] }
  /** norm text height -> height units */
  h (hNorm) { return hNorm / 2 }
  /** norm wrapWidth -> height units */
  wrap (wNorm) { return this.x(wNorm) }
  /** full-window width in height units (not capped) */
  get fullWidth () { return this.windowAspect }
}

// ---------------------------------------------------------------------------------------------
// Scene: explicit stacking order
// ---------------------------------------------------------------------------------------------

/**
 * psychoJS 2021.2 re-adds any stimulus that changed to the top of the window's container, so
 * updating something every frame (a rotating wheel, a moving slider marker) would scramble the
 * draw order. Scene.set(list) shows exactly `list`, bottom to top, and hides everything else.
 */
export class Scene {
  constructor (win) {
    this.win = win
    this.shown = []
  }

  set (stims) {
    const root = this.win._rootContainer
    for (const stim of this.shown) {
      if (!stims.includes(stim)) stim.setAutoDraw(false)
    }
    for (const stim of stims) {
      if (!stim.autoDraw) stim.setAutoDraw(true)
    }
    for (const stim of stims) {
      if (stim._pixi) root.removeChild(stim._pixi)
      stim._updateIfNeeded()
      if (stim._pixi) root.addChild(stim._pixi)
    }
    this.shown = stims.slice()
  }

  clear () {
    this.set([])
  }
}

// ---------------------------------------------------------------------------------------------
// Stimulus factories (all in height units)
// ---------------------------------------------------------------------------------------------

export function color (c) {
  return new util.Color(c)
}

export function makeText (win, { name = 'text', text = '', pos = [0, 0], height = 0.04, wrapWidth = undefined, colour = 'white', alignHoriz = 'center', alignVert = 'center', ori = 0, bold = false } = {}) {
  return new visual.TextStim({
    win,
    name,
    text,
    font: 'Arial',
    units: 'height',
    pos,
    height,
    wrapWidth,
    ori,
    bold,
    color: color(colour),
    alignHoriz,
    alignVert,
    opacity: 1,
    depth: 0
  })
}

export function makeRect (win, { name = 'rect', pos = [0, 0], width = 1, height = 1, fill = null, line = null, lineWidth = 0 } = {}) {
  return new visual.Rect({
    win,
    name,
    units: 'height',
    pos,
    width,
    height,
    fillColor: fill === null ? undefined : color(fill),
    lineColor: color(line === null ? (fill || 'black') : line),
    lineWidth: line === null ? 0 : lineWidth,
    opacity: 1,
    depth: 0
  })
}

export function makeShape (win, { name = 'shape', vertices, pos = [0, 0], fill = null, line = null, lineWidth = 0, ori = 0, closeShape = true } = {}) {
  return new visual.ShapeStim({
    win,
    name,
    units: 'height',
    vertices,
    pos,
    ori,
    closeShape,
    fillColor: fill === null ? undefined : color(fill),
    lineColor: color(line === null ? (fill || 'black') : line),
    lineWidth: line === null ? 0 : lineWidth,
    opacity: 1,
    depth: 0
  })
}

export function makeCircle (win, { name = 'circle', pos = [0, 0], radius = 0.1, edges = 64, fill = null, line = null, lineWidth = 0 } = {}) {
  return new visual.Polygon({
    win,
    name,
    units: 'height',
    pos,
    radius,
    edges,
    fillColor: fill === null ? undefined : color(fill),
    lineColor: color(line === null ? (fill || 'black') : line),
    lineWidth: line === null ? 0 : lineWidth,
    opacity: 1,
    depth: 0
  })
}

export function makeImage (win, { name = 'image', image, pos = [0, 0], size = [0.5, 0.5] } = {}) {
  return new visual.ImageStim({
    win,
    name,
    units: 'height',
    image,
    pos,
    size,
    interpolate: true,
    opacity: 1,
    depth: 0
  })
}

/** Width of `text` in height units, rendered in `heightUnits`-tall Arial (canvas metrics). */
export function measureTextWidth (win, text, heightUnits, bold = false) {
  const px = heightUnits * win.size[1]
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.font = `${bold ? 'bold ' : ''}${px}px Arial`
  return ctx.measureText(text).width / win.size[1]
}

// ---------------------------------------------------------------------------------------------
// Rating scale widget (PST HAPPY probe, SET self-esteem probe, Slider ratings)
// ---------------------------------------------------------------------------------------------

/**
 * Horizontal tick scale drawn from primitives (line, ticks, labels, circular marker), so the
 * marker colour, keyboard stepping and lock-in behave exactly as the desktop specs require.
 * Geometry is given in height units.
 */
export class RatingScale {
  constructor (win, { nTicks, pos = [0, 0], width = 0.8, tickHeight = 0.05, labels = [], labelHeight = 0.05, markerRadius = 0.018, markerColour = DIM_GREY }) {
    this.win = win
    this.n = nTicks
    this.pos = pos
    this.width = width
    this.tickHeight = tickHeight
    this.marker = null
    this.line = makeRect(win, { name: 'scale_line', pos, width, height: 0.004, fill: 'white' })
    this.ticks = []
    for (let i = 0; i < nTicks; i++) {
      this.ticks.push(makeRect(win, { name: 'scale_tick_' + i, pos: [this.tickX(i), pos[1]], width: 0.004, height: tickHeight, fill: 'white' }))
    }
    this.labels = []
    labels.forEach((label, i) => {
      if (!label) return
      this.labels.push(makeText(win, {
        name: 'scale_label_' + i,
        text: label,
        pos: [this.tickX(i), pos[1] - tickHeight / 2 - 0.012],
        height: labelHeight,
        alignVert: 'top'
      }))
    })
    this.markerStim = makeCircle(win, { name: 'scale_marker', pos, radius: markerRadius, fill: markerColour })
  }

  tickX (i) {
    return this.pos[0] - this.width / 2 + (this.n === 1 ? 0.5 : i / (this.n - 1)) * this.width
  }

  setMarker (i) {
    this.marker = (i === null || i === undefined) ? null : Math.max(0, Math.min(this.n - 1, i))
    if (this.marker !== null) this.markerStim.setPos([this.tickX(this.marker), this.pos[1]])
  }

  setMarkerColour (c) {
    this.markerStim.setFillColor(color(c))
    this.markerStim.setLineColor(color(c))
  }

  /** Index of the tick under a mouse position (height units), or null if not on the scale. */
  tickAt (mousePos, yTolerance = 0.05) {
    const halfStep = this.n > 1 ? this.width / (this.n - 1) / 2 : this.width / 2
    if (Math.abs(mousePos[1] - this.pos[1]) > yTolerance) return null
    if (mousePos[0] < this.pos[0] - this.width / 2 - halfStep || mousePos[0] > this.pos[0] + this.width / 2 + halfStep) return null
    const frac = (mousePos[0] - (this.pos[0] - this.width / 2)) / this.width
    return Math.max(0, Math.min(this.n - 1, Math.round(frac * (this.n - 1))))
  }

  stims () {
    const list = [this.line, ...this.ticks, ...this.labels]
    if (this.marker !== null) list.push(this.markerStim)
    return list
  }
}

// ---------------------------------------------------------------------------------------------
// Run: event logging, saving, hand-off
// ---------------------------------------------------------------------------------------------

/**
 * One desktop run. Rows keep the desktop columns
 *   trial_number, trial_type, event_code, absolute_time, response_time, response, result
 * plus condition/session columns on every row, so the CANON folder can be split back into the
 * desktop per-run tables. `extraColumns` are task-specific (default 'NA').
 */
export class CanonRun {
  constructor ({ page, runId, runSlot, extraColumns = [] }) {
    this.page = page
    this.runId = runId
    this.runSlot = runSlot
    this.extraColumns = extraColumns
    this.rows = []
    this.clock = new util.Clock()
    this.lastSave = 0
    this.saving = null
    this.savePending = false
  }

  /** task_start: zero the run clock. */
  start () {
    this.clock.reset()
  }

  now () {
    return this.clock.getTime()
  }

  /** Run-clock time of a psychoJS KeyPress (keydown timestamp). */
  keyTime (keyPress) {
    return keyPress.tDown - this.clock.getLastResetTime()
  }

  log (trial, trialType, code, responseTime, response, result, extras = {}, time = undefined) {
    const p = this.page
    const row = {
      participant: p.expInfo.participant,
      visit: p.expInfo.session,
      study: p.linkStudy,
      counterbalance: p.cfg.arm,
      schedule_letter: p.cfg.letter,
      outcome_list: p.cfg.outlist,
      memory_valence: p.cfg.valence,
      pst_prob_map: p.cfg.probmap,
      run_id: this.runId,
      run_slot: this.runSlot,
      trial_number: trial,
      trial_type: trialType,
      event_code: code,
      absolute_time: formatNumber(time === undefined ? this.now() : time),
      response_time: formatNumber(responseTime),
      response,
      result
    }
    for (const col of this.extraColumns) row[col] = (col in extras) ? formatNumber(extras[col]) : 'NA'
    row.frame_rate = p.frameRate
    this.rows.push(row)
    return row
  }

  /** Log at the time of the next screen flip (stimulus onset), like desktop's mark-after-flip. */
  logOnFlip (...args) {
    this.page.psychoJS.window.callOnFlip(() => this.log(...args))
  }

  /** First data row of every CANON run: the arm. */
  logCounterbalance (factor = 'NA', value = undefined) {
    this.log('NA', factor, COUNTERBALANCE, 'NA', 'NA', value === undefined ? this.page.cfg.arm : value)
  }

  /** Throttled save while the run is going (crash insurance). */
  checkpoint () {
    if (this.now() - this.lastSave >= SAVE_INTERVAL_S) this.save()
  }

  /** POST the whole run to /save. Saves are serialised so files are never written out of order. */
  save () {
    this.lastSave = this.now()
    if (this.saving) {
      this.savePending = true
      return this.saving
    }
    const p = this.page
    const body = {
      trials_data: this.rows,
      expInfo: {
        task: 'CANON' + (this.runId.startsWith('_') ? '' : '_') + this.runId,
        participant: p.expInfo.participant,
        session: p.expInfo.session,
        study: DATA_STUDY,
        date: p.fileDate
      }
    }
    this.saving = fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then((response) => {
      if (!response.ok) throw new Error('save failed: ' + response.status)
      return true
    }).finally(() => {
      this.saving = null
      if (this.savePending) {
        this.savePending = false
        this.save()
      }
    })
    return this.saving
  }

  /** Final save with retries; resolves true when the server has the data. */
  async finalSave () {
    for (let attempt = 0; attempt < SAVE_RETRIES; attempt++) {
      try {
        while (this.saving) await this.saving.catch(() => {})
        await this.save()
        return true
      } catch (err) {
        console.error(err)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
    return false
  }
}

// ---------------------------------------------------------------------------------------------
// Page: psychoJS setup, info dialog, routines
// ---------------------------------------------------------------------------------------------

/**
 * Build a CANON page.
 *   expName  - shown as the dialog title
 *   prepare  - async (page) => array of image URLs to preload; load schedules etc. here
 *   build    - (page) => called once after the dialog; add routines with page.add(...)
 */
export class CanonPage {
  constructor ({ expName, prepare, build }) {
    this.expName = expName
    this.prepare = prepare
    this.build = build
    this.cfg = readConfig()
    this.expInfo = { participant: getQuery('participant') || '', session: getQuery('session') || '' }
    this.linkStudy = getQuery('study') || ''
    this.link = this.cfg.id
    this.fileDate = fileDate()
    this.frameRate = 'NA'
    this.fatal = null

    this.psychoJS = new PsychoJS({ debug: false })
    this.psychoJS.openWindow({
      fullscr: (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'),
      color: new util.Color('black'),
      units: 'height',
      waitBlanking: true
    })
    this.psychoJS.schedule(this.psychoJS.gui.DlgFromDict({ dictionary: this.expInfo, title: expName }))
    this.flow = new Scheduler(this.psychoJS)
    const cancel = new Scheduler(this.psychoJS)
    this.psychoJS.scheduleCondition(() => this.psychoJS.gui.dialogComponent.button === 'OK', this.flow, cancel)
    cancel.add(() => {
      this.psychoJS.quit({ message: 'The session was cancelled.', isCompleted: false })
      return Scheduler.Event.QUIT
    })
    this.flow.add(() => this._init())

    this._disableOkUntilLoaded()
    window.onload = () => this._load()
  }

  _disableOkUntilLoaded () {
    const poll = setInterval(() => {
      const button = document.getElementById('buttonOk')
      const progress = document.getElementById('progressMsg')
      if (!button || !progress || typeof $ === 'undefined') return
      if (progress.textContent.startsWith('all resources downloaded')) {
        $('#buttonOk').button('option', 'disabled', false)
        clearInterval(poll)
      } else {
        $('#buttonOk').button('option', 'disabled', true)
      }
    }, 100)
  }

  async _getInfo () {
    if (!this.link) return
    try {
      const response = await fetch('/getInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: this.link })
      })
      const info = await response.json()
      if (info.subject) this.expInfo.participant = info.subject
      if (info.session) this.expInfo.session = info.session
      if (info.study) this.linkStudy = info.study
    } catch (err) {
      console.error('getInfo failed', err)
    }
  }

  async _load () {
    await this._getInfo()
    // URL values override /getInfo, as in the other StimtoolOnline tasks
    if (getQuery('participant')) this.expInfo.participant = getQuery('participant')
    if (getQuery('session')) this.expInfo.session = getQuery('session')
    let images = []
    try {
      images = await this.prepare(this)
    } catch (err) {
      console.error(err)
      this.fatal = 'This part of the session could not be loaded (' + err.message + ').'
    }
    // psychoJS 2021.2 only reports "all resources downloaded" (which enables OK) if there is at
    // least one resource, so always preload the shared fixation image.
    images = ['/js/tasks/canon_common/media/fixation.png', ...(images || [])]
    const resources = [...new Set(images)].map((path) => ({ name: path, path }))
    this.psychoJS.start({ expName: this.expName, expInfo: this.expInfo, resources })
    this.psychoJS._config.experiment.saveFormat = undefined // the server keeps the data (/save)
  }

  _init () {
    this.frameRate = this.psychoJS.window.getActualFrameRate()
    this.frameDur = (this.frameRate && isFinite(this.frameRate)) ? 1 / Math.round(this.frameRate) : 1 / 60
    this.frameRate = (this.frameRate && isFinite(this.frameRate)) ? Number(this.frameRate.toFixed(2)) : 'NA'
    this.win = this.psychoJS.window
    this.stage = new Stage(this.win)
    this.scene = new Scene(this.win)
    this.kb = new core.Keyboard({ psychoJS: this.psychoJS, clock: new util.Clock(), waitForStart: false })
    this.mouse = new core.Mouse({ win: this.win })
    if (this.fatal) {
      this.add(this.errorRoutine(this.fatal))
    } else {
      try {
        this.build(this)
      } catch (err) {
        console.error(err)
        this.add(this.errorRoutine('This part of the session could not start (' + err.message + ').'))
      }
    }
    return Scheduler.Event.NEXT
  }

  /**
   * Add a routine: { begin(), frame() -> true to keep going, end() }. frame() runs once per
   * screen refresh; returning false ends the routine and the next one begins in the same frame.
   */
  add ({ begin, frame, end }) {
    let started = false
    this.flow.add(() => {
      if (!started) {
        started = true
        if (begin) begin()
      }
      if (frame && frame()) return Scheduler.Event.FLIP_REPEAT
      if (end) end()
      return Scheduler.Event.NEXT
    })
  }

  /** Keys pressed since the last call (psychoJS names), cleared from the buffer. */
  keys (keyList) {
    return this.kb.getKeys({ keyList, waitRelease: false, clear: true })
  }

  clearKeys () {
    this.kb.clearEvents()
  }

  /** Has the phase that should end at run-clock time `t` ended? (onset lands on the next flip) */
  due (run, t) {
    return run.now() >= t - this.frameDur * 0.5
  }

  /** Index of the next page in the study order. */
  nextUrl () {
    return '/link?id=' + this.link + '&index=' + (this.cfg.index + 1)
  }

  // ----- stock routines -----

  /** Self-paced image deck; RIGHT advances, no going back (allow_instructions_back False). */
  deckRoutine (urls, { onStart } = {}) {
    let i = 0
    let shownAt = 0
    const clock = new util.Clock()
    const slide = () => {
      const fit = Math.min(0.95, 0.95 * this.stage.fullWidth / (4 / 3))
      return makeImage(this.win, { name: 'slide', image: urls[i], size: [fit * 4 / 3, fit] })
    }
    let stim
    return {
      begin: () => {
        if (onStart) onStart()
        i = 0
        stim = slide()
        this.scene.set([stim])
        this.clearKeys()
        clock.reset()
        shownAt = 0
      },
      frame: () => {
        if (urls.length === 0) return false
        const pressed = this.keys([KEYS.right])
        // ignore presses in the first 200 ms of a slide (a double press must not skip a slide)
        if (pressed.length && clock.getTime() - shownAt >= 0.2) {
          i += 1
          if (i >= urls.length) return false
          stim.setImage(urls[i])
          this.scene.set([stim])
          shownAt = clock.getTime()
          this.clearKeys()
        }
        return true
      },
      end: () => this.scene.clear()
    }
  }

  /** Text screen that waits for a key. */
  messageRoutine (text, { keyList = [KEYS.right], height = 0.04, onEnd } = {}) {
    let stim
    return {
      begin: () => {
        stim = makeText(this.win, { name: 'message', text, height, wrapWidth: Math.min(1.2, this.stage.fullWidth * 0.9) })
        this.scene.set([stim])
        this.clearKeys()
      },
      frame: () => this.keys(keyList).length === 0,
      end: () => {
        this.scene.clear()
        if (onEnd) onEnd()
      }
    }
  }

  /**
   * Desktop BEHAVIORAL start gate (StimToolLib.wait_start): "Task will begin soon" for 3 s.
   * Online every run uses this gate; the RA ENTER gate and the scanner trigger do not exist.
   */
  waitStartRoutine (seconds = 3) {
    const clock = new util.Clock()
    return {
      begin: () => {
        this.scene.set([makeText(this.win, { name: 'wait_start', text: 'Task will begin soon', height: 0.045 })])
        clock.reset()
      },
      frame: () => clock.getTime() < seconds - this.frameDur * 0.5,
      end: () => this.scene.clear()
    }
  }

  /** Write TASK_END, save, then hand off to the next page in the study order. */
  finishRoutine (run) {
    let state = 'saving'
    let stim
    return {
      begin: () => {
        run.log('NA', 'NA', TASK_END, 'NA', 'NA', 'NA')
        stim = makeText(this.win, { name: 'saving', text: 'Saving your responses...', height: 0.04 })
        this.scene.set([stim])
        run.finalSave().then((ok) => {
          if (ok) {
            state = 'done'
          } else {
            state = 'failed'
            stim.setText('There was a problem saving your responses.\n\nPlease check your internet connection, then press the RIGHT ARROW key to try again.')
            this.scene.set([stim])
            this.clearKeys()
          }
        })
      },
      frame: () => {
        if (state === 'done') {
          if (this.link) {
            window.location.replace(this.nextUrl())
            state = 'redirecting'
          } else {
            stim.setText('This part is complete.\n\n(No session link: nothing to continue to.)')
            this.scene.set([stim])
            state = 'idle'
          }
        } else if (state === 'failed' && this.keys([KEYS.right]).length) {
          state = 'saving'
          stim.setText('Saving your responses...')
          this.scene.set([stim])
          run.finalSave().then((ok) => {
            state = ok ? 'done' : 'failed'
            if (!ok) {
              stim.setText('There was a problem saving your responses.\n\nPlease check your internet connection, then press the RIGHT ARROW key to try again.')
              this.scene.set([stim])
            }
          })
        }
        return true // the page ends by navigating away
      }
    }
  }

  /** A screen the participant cannot get past; used when the run must not start. */
  errorRoutine (message) {
    return {
      begin: () => {
        this.scene.set([makeText(this.win, {
          name: 'error',
          text: message + '\n\nPlease contact the study team.',
          height: 0.035,
          wrapWidth: Math.min(1.2, this.stage.fullWidth * 0.9)
        })])
      },
      frame: () => true
    }
  }
}
