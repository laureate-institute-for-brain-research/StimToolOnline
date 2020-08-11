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