function startTask(){

    var timeline = [];

    timeline.push({
        type: 'html-keyboard-response',
        stimulus: 'Welcome, Press any key to to beghin'
    });

    timeline.push({
        type: "html-keyboard-response",
        stimulus: "<p>In this experiment, a circle will appear in the center " +
            "of the screen.</p><p>If the circle is <strong>blue</strong>, " +
            "press the letter F on the keyboard as fast as you can.</p>" +
            "<p>If the circle is <strong>orange</strong>, press the letter J " +
            "as fast as you can.</p>" +
            "<div style='width: 700px;'>"+
            "<div style='float: left;'><img src='img/blue.png'></img>" +
            "<p class='small'><strong>Press the F key</strong></p></div>" +
            "<div class='float: right;'><img src='img/orange.png'></img>" +
            "<p class='small'><strong>Press the J key</strong></p></div>" +
            "</div>"+
            "<p>Press any key to begin.</p>",
        post_trial_gap: 2000
      })

    timeline.push({
    type: 'html-keyboard-response',
    stimulus: 'This trial will be in fullscreen mode.'
    });

    jsPsych.init({
    timeline: timeline
    });
}

/* Get into full screen */
function GoInFullscreen(element) {
	if(element.requestFullscreen)
		element.requestFullscreen();
	else if(element.mozRequestFullScreen)
		element.mozRequestFullScreen();
	else if(element.webkitRequestFullscreen)
		element.webkitRequestFullscreen();
	else if(element.msRequestFullscreen)
		element.msRequestFullscreen();
}

/* Get out of full screen */
function GoOutFullscreen() {
	if(document.exitFullscreen)
		document.exitFullscreen();
	else if(document.mozCancelFullScreen)
		document.mozCancelFullScreen();
	else if(document.webkitExitFullscreen)
		document.webkitExitFullscreen();
	else if(document.msExitFullscreen)
		document.msExitFullscreen();
}

/* Is currently in full screen or not */
function IsFullScreenCurrently() {
	var full_screen_element = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || null;
	
	// If no element is in full-screen
	if(full_screen_element === null)
		return false;
	else
		return true;
}

$("#starttask").on('click', function() {
	if(IsFullScreenCurrently())
		GoOutFullscreen();
	else
        GoInFullscreen($("#element").get(0));
        startTask();
   
});

$(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', function() {
	if(IsFullScreenCurrently()) {
		$("#element span").text('Full Screen Mode Enabled');
		$("#go-button").text('Disable Full Screen');
	}
	else {
		$("#element span").text('Full Screen Mode Disabled');
		$("#go-button").text('Enable Full Screen');
	}
});