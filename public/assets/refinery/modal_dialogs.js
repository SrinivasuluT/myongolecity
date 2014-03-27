init_modal_dialogs = function(){
  $('a[href*="dialog=true"]').not('#dialog_container a').each(function(i, anchor) {
    $(anchor).data({
      'dialog-width': parseInt($($(anchor).attr('href').match("width=([0-9]*)")).last().get(0), 10)||928
      , 'dialog-height': parseInt($($(anchor).attr('href').match("height=([0-9]*)")).last().get(0), 10)||473
      , 'dialog-title': ($(anchor).attr('title') || $(anchor).attr('name') || $(anchor).html() || null)
    }).attr('href', $(anchor).attr('href').replace(/(&(amp;)?|\?)(dialog=true|(width|height)=\d+)/g, '')
                                          .replace(/(\/[^&\?]*)&(amp;)?/, '$1?'))
    .click(function(e){
      $anchor = $(this);
      iframe_src = (iframe_src = $anchor.attr('href'))
                   + (iframe_src.indexOf('?') > -1 ? '&' : '?')
                   + 'app_dialog=true&dialog=true';

      iframe = $("<iframe id='dialog_iframe' frameborder='0' marginheight='0' marginwidth='0' border='0'></iframe>");
      iframe.dialog({
        title: $anchor.data('dialog-title')
        , modal: true
        , resizable: false
        , autoOpen: true
        , width: $anchor.data('dialog-width')
        , height: $anchor.data('dialog-height')
        , open: onOpenDialog
        , close: onCloseDialog
      });

      iframe.attr('src', iframe_src);
      e.preventDefault();
    });
  });
};

init_sortable_menu = function(){
  var $menu = $('#menu');

  if($menu.length === 0){return;}

  $menu.sortable({
    axis: 'x',
    cursor: 'crosshair',
    connectWith: '.nested',
    update: function(){
      $.post('/refinery/update_menu_positions', $menu.sortable('serialize', {
                key: 'menu[]'
                , expression: /plugin_([\w]*)$/
              }));
    }
  }).tabs();
  //Initial status disabled
  $menu.sortable('disable');

  $menu.find('#menu_reorder').click(function(e){
    trigger_reordering(e, true);
  });

  $menu.find('#menu_reorder_done').click(function(e){
    trigger_reordering(e, false);
  });
};

trigger_reordering = function(e, enable) {
  e.preventDefault();
  $('#menu_reorder, #menu_reorder_done').toggle();
  $('#site_bar, #content').fadeTo(500, enable ? 0.35 : 1);

  if(enable) {
    $menu.find('.tab a').click(function(ev){
      ev.preventDefault();
    });
  } else {
    $menu.find('.tab a').unbind('click');
  }

  $menu.sortable(enable ? 'enable' : 'disable');
};

init_submit_continue = function(){
  $('#submit_continue_button').click(submit_and_continue);

  $('form').change(function(e) {
    $(this).attr('data-changes-made', true);
  });

  if ((continue_editing_button = $('#continue_editing')).length > 0 && continue_editing_button.attr('rel') != 'no-prompt') {
    $('#editor_switch a').click(function(e) {
      if ($('form[data-changes-made]').length > 0) {
        if (!confirm('translation missing: en.js.admin.confirm_changes')) {
          e.preventDefault();
        }
      }
    });
  }
};

submit_and_continue = function(e, redirect_to) {
  // ensure wymeditors are up to date.
  if ($(this).hasClass('wymupdate')) {
    $.each(WYMeditor.INSTANCES, function(index, wym)
    {
      wym.update();
    });
  }

  $('#continue_editing').val(true);
  $('#flash').fadeOut(250);

  $('.fieldWithErrors').removeClass('fieldWithErrors').addClass('field');
  $('#flash_container .errorExplanation').remove();

  $.post($('#continue_editing').get(0).form.action, $($('#continue_editing').get(0).form).serialize(), function(data) {
    if (($flash_container = $('#flash_container')).length > 0) {
      $flash_container.html(data);

      $('#flash').css({'width': 'auto', 'visibility': null}).fadeIn(550);

      $('.errorExplanation').not($('#flash_container .errorExplanation')).remove();

      if ((error_fields = $('#fieldsWithErrors').val()) != null) {
        $.each(error_fields.split(','), function() {
          $("#" + this).wrap("<div class='fieldWithErrors' />");
        });
      } else if (redirect_to) {
        window.location = redirect_to;
      }

      $('.fieldWithErrors:first :input:first').focus();

      $('#continue_editing').val(false);

      init_flash_messages();
    }
  });

  e.preventDefault();
};

