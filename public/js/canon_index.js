/**
 * Picker for the CANON condition landing pages (public/canon/index.html, served at /canon/).
 * Lists the 24 CANON_{A|B}{1|2}_{HAPPY|SAD}_PM{1|2|3} pages in a dropdown and opens the chosen one,
 * optionally with ?session=T1|T2 so the landing page pre-selects the visit.
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

/** Path of the chosen landing page, or null when no condition is chosen yet. */
function chosenPath () {
  if (!conditionList.value) return null
  var path = '/canon/' + conditionList.value + '.html'
  return visitList.value ? path + '?session=' + visitList.value : path
}

function update () {
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
