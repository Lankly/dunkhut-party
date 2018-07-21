function openCreateModal() {
  $('#createModal').dialog({ width: 500 });
}

/* After page load */
$( function () {
  $('#datepicker').datepicker();

  // Add initial value of today
  let cur_date = new Date().toLocaleString().split(', ')[0];
  $('#datepicker').datepicker( "setDate", cur_date);

  $('#createTask').submit((e) => {
      e.preventDefault();
      $.ajax({
        url: '/tasks/create',
        type: 'post',
        dataType: 'json',
        mimeType: 'text/json; charset=x-user-defined',
        data: $('#createTask').serialize(),
        success: function(){
          // Hide creation modal before animating card
          $('#createModal').dialog('close');

          let alert_box = $('#alert-box');
          const alert_box_width = 30; // percent
          alert_box.animate({
            // Move to center
            right: (50 - alert_box_width / 2) + "%"
          }, 600, () => {
            // Wait half a second
            setTimeout(() => {
              // Slide off right side of screen
              alert_box.animate({
                right: "-" + (alert_box_width / 2) + "%"
              }, 800, () => {
                // Reset to offscreen on the left
                alert_box.css("right", "100%");
              });
            }, 600)
          });
        }
      });
  });
});

