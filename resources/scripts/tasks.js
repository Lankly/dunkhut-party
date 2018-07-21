function openCreateModal () {
  $('#createModal').dialog({ width: 500 });
}

function deleteTask (elem, id) {
  $("#confirmModal").dialog({
    buttons : {
      "Yes" : function() {
        $.ajax({
          url: '/tasks/delete',
          context: this,
          type: 'post',
          dataType: 'json',
          mimeType: 'text/json; charset=x-user-defined',
          data: { id: id },
          success: function (data) {
            // Hide confirm modal before animating card
            $(this).dialog("close");

            showAlertBox(() => {
              // elem is a <td>
              $(elem).parent().parent().remove();
            });
          }
        });
      },
      "No" : function () {
        $(this).dialog("close");
      }
    }
  });
  $('#confirmModal').dialog("open");
}

function showAlertBox (midway_func) {
  let alert_box = $('#alert-box');
  const alert_box_width = 30; // percent

  alert_box.animate({
    // Move to center
    right: (50 - alert_box_width / 2) + "%"
  }, 500, () => {
    // Wait half a second
    setTimeout(() => {
      // Slide off right side of screen
      alert_box.animate({
        right: "-" + (alert_box_width / 2) + "%"
      }, 500, () => {
        // Reset to offscreen on the left
        alert_box.css("right", "100%");
      });
    }, 500)

    midway_func();
  });
}

/* After page load */
$( function () {
  $('#datepicker').datepicker();

  // Add initial value of today
  let cur_date = new Date().toLocaleString().split(', ')[0];
  $('#datepicker').datepicker("setDate", cur_date);

  // Initialize confirm dialog
  $('#confirmModal').dialog({autoOpen: false, modal: true });

  // Hook into the submit function for createTask
  $('#createTask').submit((e) => {
    e.preventDefault();

    // Stop if no title
    let new_title = $('#addTitle').val().trim();
    if (!new_title) { return $('#addTitle').effect("shake"); }

    $.ajax({
      url: '/tasks/create',
      type: 'post',
      dataType: 'json',
      mimeType: 'text/json; charset=x-user-defined',
      data: $('#createTask').serialize(),
      success: function (data) {
        // Hide creation modal before animating card
        $('#createModal').dialog('close');

        showAlertBox(() => {
          // Add new item to table
          let cur_count = $('.todo-table tr').length;
          let new_row = `<tr>
            <td>${cur_count + 1}.</td>
            <td>${new_title}</td>
            <td>
              <a class="delete-button" onclick="deleteTask(this, ${data.obj[0].id})">
                <i class="fas fa-times-circle"></i>
              </a>
            </td>
            </tr>`;

          // Insert row
          $('.todo-table tbody').append(new_row);
        })
      }
    });
  });
});

