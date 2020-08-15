module.exports = {
    create_user_validate: function (u,p,$) {
        //check username length
        if(u.length == 0 || u.length > 32){
            $("#alertMessage").toggle();
            return 0;
        }
        //check password length
        else if(p.length < 4 || p.length > 8){
            $("#alertMessage").toggle();
            return 0;
        }
        else{
            return 1;
        }
    },
    bar: function () {
      // whatever
    }
  };