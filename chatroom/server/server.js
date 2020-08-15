$(function () {
    //create a socket variable
    var socket = io();
    //run the 'chat message' emit when the chat room form is submitted
    $('form').submit(function(e){
      e.preventDefault(); // prevents page reloading
      //use the socket to emit the message
      socket.emit('chat message', $('#message-input').val());
      $('#message-input').val('');
      return false;
    });
    socket.on('chat message', function(msg, USER){
        //Append the message bounced from the server to the chat box
        $('#chat-box').append($('<span>').text(USER + ": " + msg));
    });
  });