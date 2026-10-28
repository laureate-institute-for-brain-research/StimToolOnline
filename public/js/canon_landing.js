/**
 * Landing page logic for the CANON condition studies (public/canon/CANON_*.html).
 * Same Begin / Skip behaviour as index.js, plus a check that a T2 visit uses the
 * opposite schedule letter from the participant's T1 visit.
 * @author Aardron Robinson
 */

/* ---- particles.js config ---- */
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

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

function formValues () {
  var values = {}
  $.each($('#adduser').serializeArray(), function (i, field) {
    values[field.name] = field.value
  })
  return values
}

function formIsComplete () {
  return document.getElementById('id_input').value.trim().length !== 0 &&
    document.getElementById('session-list').value !== 'Choose Session'
}

/**
 * Ask the server whether this visit's schedule letter clashes with the participant's other visit.
 * Resolves to '' when everything is fine, or to a warning message.
 */
function checkVisit (values) {
  return new Promise((resolve) => {
    $.ajax({
      type: 'POST',
      url: '/checkCanonVisit',
      data: JSON.stringify(values),
      contentType: 'application/json',
      dataType: 'JSON',
      success: (result) => resolve(result && result.warning ? result.warning : ''),
      error: () => resolve('') // the check is advisory; never block a session on it
    })
  })
}

function addUser (values) {
  return new Promise((resolve) => {
    $.ajax({
      type: 'POST',
      url: '/adduser',
      data: values,
      dataType: 'JSON',
      success: resolve
    })
  })
}

function showWarning (message, onProceed) {
  $('#modalCenter').modal({})
  document.getElementById('errorMessage').innerText = message
  $('#procceed_anyways').off('click').on('click', onProceed)
}

// About
document.getElementById('about').addEventListener('click', function (event) {
  event.preventDefault()
  var study = document.getElementById('study-list').value
  $.getJSON('/study/' + study + '_T1.json', data => {
    document.getElementById('info-container').style.display = 'block'
    document.getElementById('info-title').innerHTML = 'CANON Task List'
    document.getElementById('info-text').innerHTML = data.text_html
  })
})

// Begin
document.getElementById('begin').addEventListener('click', (event) => {
  event.preventDefault()
  if (!formIsComplete()) return
  var values = formValues()
  values.subject = values.subject.trim()

  checkVisit(values)
    .then((warning) => {
      var start = () => addUser(values).then((result) => {
        if (result.message === 'ok') {
          window.location.replace('/link?id=' + result.info.link)
        } else {
          showWarning(result.message, () => window.location.replace('/link?id=' + result.info.link))
        }
      })
      if (warning) {
        showWarning(warning, start)
      } else {
        start()
      }
    })
})

// Skip: jump to a run of this session (for resuming an interrupted session)
document.getElementById('skip').addEventListener('click', (event) => {
  event.preventDefault()
  if (!formIsComplete()) return
  var values = formValues()
  values.subject = values.subject.trim()
  addUser(values)
    .then((result) => {
      return new Promise((resolve) => {
        $.getJSON('/study/' + result.info.study + '_' + result.info.session + '.json', function (data) {
          data.respond = result
          resolve(data)
        })
      })
    })
    .then((result) => {
      $('#modalSkipCenter').modal({})
      var selectForm = document.getElementById('run-list')
      for (var i = 0; i < result.order.length; i++) {
        var elem = result.order[i]
        if (elem.includes('completed') || elem.includes('complete')) continue
        var option = document.createElement('option')
        option.value = elem
        option.appendChild(document.createTextNode(elem))
        selectForm.appendChild(option)
      }
      $('#modalSkipCenter').on('hidden.bs.modal', function () {
        selectForm.length = 1
      })
      $('#skip_begn').off('click').on('click', function (event) {
        event.preventDefault()
        // each order entry already carries its own index=N
        var runVal = selectForm.options[selectForm.selectedIndex].value
        window.location.replace(runVal + '&id=' + result.respond.info.link)
      })
    })
})

// ?session=T1 / ?session=T2 pre-selects the visit
if (getQueryVariable('session')) {
  $('#session-list').val(getQueryVariable('session'))
}

if (performance.navigation.type === 2) {
  location.reload(true)
}
