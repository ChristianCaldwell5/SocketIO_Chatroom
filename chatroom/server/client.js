$(function () {
    var socket = io();
    socket.on('create status', function(valid){
        if(valid == 0){
            $("#alertMessage").toggle();
        }
        else{
            $("#alertMessage").toggle();
        }
    });
  });