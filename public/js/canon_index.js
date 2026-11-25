/**
 * Picker for the CANON condition landing pages (public/canon/index.html, served at /canon/).
 * Lists the 24 CANON_{A|B}{1|2}_{HAPPY|SAD}_PM{1|2|3} pages in a dropdown and opens the chosen one,
 * optionally with ?session=T1|T2 so the landing page pre-selects the visit. The Surveys group lists the
 * three survey sets (CANON_V1-Surveys, CANON_V2-Surveys, CANON_Screening-Surveys); each has a single
 * session (T1, T2, Screening), so choosing one pins the visit list to it.
 * @author Aardron Robinson
 */

/* ---- particles.js config (same as the landing pages) ---- */
var colors = ['#4b3064', '#b61924', '#e86638', '#f0bd4a', '#de1874', '#b52236', '#e85733', '#7b8da7']
$('#particles-js').css('background-color', colors[Math.floor(Math.random() * colors.length)])

particlesJS('particles-js', {
  particles: {
    number: { value: 150, density: { enable: true, value_area: 800 } },
    color: { value: ['#BD10E0', '#B8E986', '#50E3C2', '#FFD300', '#E86363'] },
    shape: { type: 'circle', stroke: { width: 1, color: '#000000' } },
    opacity: { value: 0.8, random: false },
    size: { value: 5, random: true },
    line_linked: { enable: true, distance: 130, color: '#000000', opacity: 1, width: 1 },
    move: { enable: true, speed: 1, direction: 'left', random: true, straight: false, out_mode: 'out', bounce: false }
  },
  interactivity: {
    detect_on: 'canvas',
    events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
    modes: { repulse: { distance: 50, duration: 0.4 }, push: { particles_nb: 4 } }
  },
  retina_detect: true
})

/* ---- condition list: one optgroup per schedule (A1, A2, B1, B2) ---- */
var conditionList = document.getElementById('condition-list')
var visitList = document.getElementById('visit-list')
var linkOutput = document.getElementById('link-output')
var openButton = document.getElementById('open')
var copyButton = document.getElementById('copy')

;['A1', 'A2', 'B1', 'B2'].forEach(function (schedule) {
  var group = document.createElement('optgroup')
  group.label = 'Schedule ' + schedule
  ;['HAPPY', 'SAD'].forEach(function (mood) {
    ;['PM1', 'PM2', 'PM3'].forEach(function (pm) {
      var option = document.createElement('option')
      option.value = 'CANON_' + schedule + '_' + mood + '_' + pm
      option.textContent = schedule + ' · ' + mood.charAt(0) + mood.slice(1).toLowerCase() + ' · ' + pm
      group.appendChild(option)
    })
  })
  conditionList.appendChild(group)
})

/* ---- survey sets: each has one fixed session (study JSON public/study/<study>_<session>.json) ---- */
var surveyGroup = document.createElement('optgroup')
surveyGroup.label = 'Surveys'
;[
  ['CANON_V1-Surveys', 'V1-Surveys', 'T1'],
  ['CANON_V2-Surveys', 'V2-Surveys', 'T2'],
  ['CANON_Screening-Surveys', 'Screening-Surveys', 'Screening']
].forEach(function (set) {
  var option = document.createElement('option')
  option.value = set[0]
  option.textContent = set[1]
  option.setAttribute('data-session', set[2])
  surveyGroup.appendChild(option)
})
conditionList.appendChild(surveyGroup)

// The visit list's own options (Choose on the next page / T1 / T2), restored when a condition is chosen
var visitOptions = Array.prototype.slice.call(visitList.options)
var chosenVisit = visitList.value

/** The fixed session of the chosen survey set, or null for a condition (or nothing chosen). */
function fixedSession () {
  var option = conditionList.options[conditionList.selectedIndex]
  return option ? option.getAttribute('data-session') : null
}

/** A survey set pins the visit to its session; a condition gets the T1/T2 choice back. */
function syncVisitList () {
  var session = fixedSession()
  if (session) {
    if (!visitList.disabled) chosenVisit = visitList.value
    var only = document.createElement('option')
    only.value = session
    only.textContent = session
    visitList.options.length = 0
    visitList.appendChild(only)
    visitList.disabled = true
  } else if (visitList.disabled) {
    visitList.options.length = 0
    visitOptions.forEach(function (option) { visitList.appendChild(option) })
    visitList.value = chosenVisit
    visitList.disabled = false
  }
}

/** Path of the chosen landing page, or null when no condition is chosen yet. */
function chosenPath () {
  if (!conditionList.value) return null
  var path = '/canon/' + conditionList.value + '.html'
  return visitList.value ? path + '?session=' + visitList.value : path
}

function update () {
  syncVisitList()
  var path = chosenPath()
  linkOutput.value = path ? window.location.origin + path : ''
  openButton.disabled = !path
  copyButton.disabled = !path
}

conditionList.addEventListener('change', update)
visitList.addEventListener('change', update)

document.getElementById('canon-picker').addEventListener('submit', function (event) {
  event.preventDefault()
  var path = chosenPath()
  if (path) window.location.href = path
})

copyButton.addEventListener('click', function () {
  linkOutput.select()
  var done = function () {
    copyButton.textContent = 'Copied'
    setTimeout(function () { copyButton.textContent = 'Copy' }, 1500)
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(linkOutput.value).then(done, function () { document.execCommand('copy'); done() })
  } else {
    document.execCommand('copy')
    done()
  }
})

// The browser may restore a selection on Back; sync the link and buttons with it
window.addEventListener('pageshow', update)
update()
