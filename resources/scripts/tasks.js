function openCreateModal () {
  $('#createModal').dialog({ width: 500 });
}

function completeTask (elem, id) {
  $.ajax({
    url: '/tasks/complete',
    context: this,
    type: 'post',
    dataType: 'json',
    mimeType: 'text/json; charset=x-user-defined',
    data: { id: id, completed_by: "Web Interface" },
    success: function (data) {
      showAlertBox(() => {
        // elem is a <td>
        let row = $(elem).parent().parent();
        let next_row = row.next('tr');

        // Move description first, if it exists
        if (!next_row.hasClass('todo-item-main')) {
          next_row.prependTo(".completed-table tbody");
        }

        // Move to todo table
        row.prependTo(".completed-table tbody");

        // Reformat to look like completed items
        row.removeClass('todo-item-main');
        row.addClass('completed-item-main');
        row.find('td:nth-child(3)').html(`
          ${ makeReopenButton(row.attr('id')) }
          `);
      });
    }
  });
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
function reopenTask (elem, id) {
  $.ajax({
    url: '/tasks/reopen',
    context: this,
    type: 'post',
    dataType: 'json',
    mimeType: 'text/json; charset=x-user-defined',
    data: { id: id },
    success: function (data) {
      showAlertBox(() => {
        // elem is a <td>
        let row = $(elem).parent().parent();
        let next_row = row.next('tr');

        // Move to todo table
        row.appendTo(".todo-table tbody");

        // Reformat to look like todo items
        row.removeClass('completed-item-main');
        row.addClass('todo-item-main');
        row.find('td:nth-child(3)').html(`
          ${ makeCheckButton(row.attr('id')) }
          ${ makeDeleteButton(row.attr('id')) }
        `)

        // Move description second, if it exists
        if (!next_row.hasClass('completed-item-main')) {
          next_row.appendTo(".todo-table tbody");
        }
      });
    }
  });
}

function makeCheckButton (id) {
  return `<a class="check-button"
             onclick="completeTask(this, ${id})">
            <i class="fas fa-check-circle"></i>
          </a>`;
}
function makeDeleteButton (id) {
  return `<a class="delete-button"
             onclick="deleteTask(this, ${id})">
            <i class="fas fa-times-circle"></i>
          </a>`;
}
function makeReopenButton (id) {
  return `<a class="reopen-button"
             onclick="reopenTask(this, ${id})">
            <i class="fas fa-sync-alt"></i>
          </a>`;
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

    // midway_func typically changes tables, so fix them
    fixTables();
  });
}

function toggleDescription (index) {
  let desc = $(`.todo-item-description${index}`)

  if (desc.is(":hidden")) {
    desc.show();
    desc
      .find('td')
      .wrapInner('<div style="display: none;" />')
      .parent()
      .find('td > div')
      .slideDown(700, function () {
     
       let  $set = $(this);
       $set.replaceWith($set.contents());
     })
  }
  else {
    desc.hide();
  }
}

function fixTables () {
  // List counts for both tables
  ['.todo-item-main', '.completed-item-main']
    .forEach((itemClass) => {
      $(itemClass).each(function (index) {
        $(this).find('td:nth-child(1)').text((index + 1) + ".");
      });
    });

  // Set status message
  if ($('.todo-item-main').length > 0) {
    $('#todo-table-status').text("TODO:");
  }
  else {
    $('#todo-table-status').text("All done!");
  }

  // Completed table visibility
  if ($('.completed-item-main').length > 0) {
    $('.completed-table').show();
  }
  else {
    $('.completed-table').hide();
  }
}

/* After page load */
$( function () {
  $('#datepicker').datepicker();

  // Add initial value of today
  let cur_date = new Date().toLocaleString().split(', ')[0];
  $('#datepicker').datepicker("setDate", cur_date);

  // Initialize confirm dialog
  $('#confirmModal').dialog({autoOpen: false, modal: true });

  fixTables();

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
          let cur_count = $('.todo-item-main').length;
          let new_row = `<tr id="${data.data[0].id}" class="todo-item-main">
            <td>${cur_count + 1}.</td>
            <td>${new_title}</td>
            <td>
              ${makeCheckButton(data.data[0].id)}
              ${makeDeleteButton(data.data[0].id)}
            </td>
            </tr>`;

          // Insert row
          $('.todo-table tbody').append(new_row);
        })
      }
    });
  });
});

