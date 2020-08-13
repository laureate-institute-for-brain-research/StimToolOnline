// This javascript containes function that are used from this entire application


function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return 'NULL'
}

function sendData(trial_data) {
	$.ajax({
        type: "POST",
        url: '/save',
		data: {
			"trials_data": trial_data,
			"expInfo": expInfo
		},
		dataType: 'JSON',
		success:function(data) {
			console.log(data)
		  }
    })
}

function showEnd() {
    // Redirection based on study
    if (getQueryVariable('study') == 'mindreal') {
        link = '/mindreal/rating/?subsession=post&study=mindreal&session=' + getQueryVariable('session') + '&subject=' +
            getQueryVariable('mkturk_id')
        console.log(link);
        window.location.replace(link);
    } else {
        switch (getQueryVariable('session')) {
            case '1':
                window.location.replace("/tooearly?" + "&mkturk_id=" + mkturkid + '&study=' + getQueryVariable('study'));
                break;
            case '2':
                window.location.replace("/?" + "&mkturk_id=" + mkturkid + '&study=' + getQueryVariable('study') +
                    '&survey=feedback');
                break;
        }
    }
}

function postData(data, session, mkturkid, task, pattern, type, version) {
    console.log('Sending Data to backend')
    $("#loader").show()
    $.ajax({
        type: 'POST',
        url: 'saveChickenTask?session=' + session + '&mkturk_id=' + mkturkid + '&task=' + task + '&study=' +
            getQueryVariable('study') + '&pattern=' + pattern + '&type=' + type + '&version=' + version,
        data: JSON.stringify({
            content: data
        }), // or JSON.stringify ({name: 'jonas'}),
        success: function (data) {
            //console.log(data)
            showEnd()
            //alert('data: ' + data);
        },
        contentType: "application/json",
        dataType: 'json'
    });
}


function toCSV(text) {
    tmp = text.split(/\r?\n/);
    out = "";
    for (i = 0; i < tmp.length - 1; i++) {
        tmp2 = tmp[i].split(/\s+/);
        for (j = 0; j < tmp2.length; j++) {
            // multiplies the 5th and 6th column by .001 to turn into seconds
            // for absolute time and reaction time
            if (j == 5 || j == 6) {
                out = out + "" + (tmp2[j] * 0.001) + ","
            } else if(j == tmp2.length - 1){
                out = out + "" + tmp2[j] // don't put the last comma on the last column
            }
            else {
                out = out + "" + tmp2[j] + ","
            }

        }
        out = out + "\n"
    }
    return out
}