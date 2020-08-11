
var form = document.getElementById("adduser");

form.addEventListener('submit', (event) => {
    event.preventDefault();
    var values = {};
    $.each($('#adduser').serializeArray(), function (i, field) {
        values[field.name] = field.value;
    });
    console.log(values)
    $.ajax({
        type: "POST",
        url: '/adduser',
        data: values,
        dataType: 'JSON'
    })
    .done(function() {
        location.reload();
      })
});


function copyToClipboard(elem) {
    // create hidden text element, if it doesn't already exist
  var targetId = "_hiddenCopyText_";
  var isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
  var origSelectionStart, origSelectionEnd;
  if (isInput) {
      // can just use the original source element for the selection and copy
      target = elem;
      origSelectionStart = elem.selectionStart;
      origSelectionEnd = elem.selectionEnd;
  } else {
      // must use a temporary form element for the selection and copy
      target = document.getElementById(targetId);
      if (!target) {
          var target = document.createElement("textarea");
          target.style.position = "absolute";
          target.style.left = "-9999px";
          target.style.top = "0";
          target.id = targetId;
          document.body.appendChild(target);
      }
      target.textContent = elem.textContent;
  }
    
    // console.log(target.textContent)
  // select the content
  var currentFocus = document.activeElement;
  target.focus();
  target.setSelectionRange(0, target.value.length);
  
  // copy the selection
  var succeed;
  try {
        succeed = document.execCommand("copy");
  } catch(e) {
      succeed = false;
  }
  // restore original focus
  if (currentFocus && typeof currentFocus.focus === "function") {
      currentFocus.focus();
  }
  
  if (isInput) {
      // restore prior selection
      elem.setSelectionRange(origSelectionStart, origSelectionEnd);
  } else {
      // clear temporary content
      target.textContent = "";
  }
  return succeed;
}


function shareModal(uuid) {

    var ulink = '/link?id=' + uuid
    // Create Copy Button
    document.getElementById('copyTarget').innerHTML = ulink
    document.getElementById('copyTarget').href = ulink
  
    /* Copy the text inside the text field */
    // document.getElementById("copylink").addEventListener("click", function() {
    //     copyToClipboard(document.getElementById("copyTarget"));
    // });

    document.getElementById('gotoLink').addEventListener('click', function () {
        window.location.href = ulink;
        // alert("Copied the text: " + link);
    })
        
    
        

    modal_elem = document.getElementById('modal1')
    var instance = M.Modal.getInstance(modal_elem);
    instance.open();

}