/**
 * StimTool Lib
 * Library used shared across Tasks
 * 
 * @author James Touthang <jtouthang@laureateinstitute.org>
 */

console.log('StimToolLib loaded')
 
/**
 * Retrieves the URL query value.
 * i.e. /?test=value : getQueryVariable('test') -> 'value'
 * @param {String} variable URL quiery name we want to get teh value for
 */
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    return null
}


/**
 * Returns Date String in the format "YYYY_MM_DD_HH_MM"
 */
function formatDate() {
    var d = new Date(),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();
    hour = d.getHours()
    minutes = d.getMinutes()

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day, hour,minutes ].join('_');
}


/**
 * Returns JSON given a csv string
 * @param {String} csv String in csv format
 */
function csvJSON(csv){
    var lines=csv.split("\n");
    var result = [];
    var headers=lines[0].split(",");
    for(var i=1;i<lines.length;i++){
        var obj = {};
        var currentline=lines[i].split(",");
  
        for(var j=0;j<headers.length;j++){
            obj[headers[j]] = currentline[j];
        }
        result.push(obj);
    }
    
    //return result; //JavaScript object
    return result; //JSON
}

/**
 * Save the current trial to file on the server
 */
function saveData(){
    row_data = jsPsych.data.get().last().json()
    trial_data = JSON.parse(jsPsych.data.get().json())

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
    
    // console.log(row_data);
}

/**
 * Cleans resources, function basically makes sures there's no empty
 * name and and path elements
 * @param {Array} resources Array of raw resources with name and path element
 */
function sanitizeResources(resources) {
    sanitized_resources = []

    // Iterate over Array
    for (const value of resources) {

        // Iterave over object
        empty = false // if there is an undefined value, skip over
        for (var key in value) {
            if (value[key] == undefined) {
                empty = true
            }
        }

        if (!empty) sanitized_resources.push(value) 
      }
    return(sanitized_resources)
}