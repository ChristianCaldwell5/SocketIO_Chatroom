/*

NAME: CHRISTIAN CALDWELL
PAWPRINT: CGCNBF
DATE: 11/18/20
PROJECT DES: This echo chat room was created using a FULL STACK. The server is backed by node.js and express.js
             MySQL database was used to hold account information (Approved by prof. Culmer). Socket.io library of 
             the websocket API is used for client/server communication. A single user may log on using their
             credentials and use the echo chat room. No other users may join if a user is connected. Logout to allow
             other users to join the server.

*/

//Necessary Requires
var app = require('express')(); //import the express module into the app
var express = require('express'); //use the express module through variable: express
var http = require('http').createServer(app); //create an express server over http
var io = require('socket.io')(http); //include the Socket.io library of the Websocket API
var mysql = require('mysql'); //include the MySQL module found in node modules
var tools = require('./server/chatroom'); //allow the use and calls of chatroom.js functions within this file
const bodyParser = require("body-parser"); //include a parser for post data sent over the server

//Amazon Web Service RDS connection
//Connection credentials to MySQL database hosted by AWS
var con = mysql.createConnection({
  host: "mychat.clyfvv0ob313.us-east-1.rds.amazonaws.com", //dns for hosted database
  user: "mychat", //generic login username
  password: "mychat55", //generic login password
  database: "ChatUsers", //database used. Holds user table
  port: '3306' //database instance port. 
});
//current user after login.
//USER will store userID of currently logged in user
var USER = "none";
//Global variable for checking if a userID already exist in the database
//Used for when a client attempts to create a UserID that already exist
// \ 0 = exist
// \ Any other number = not exist
var doesExist = '';
//get the pages the app will use
//Redirect to the index
app.get('/index', function (req, res,html) {
  res.sendFile(__dirname + '/index.html');
});
//Redirect to the chat room
app.get('/mychat', function (req, res,html) {
  res.sendFile(__dirname+ '/mychat.html');
});
//Alert templates
//Createion error, non valid parameters
app.get('/indexcf', function (req, res,html) {
  res.sendFile(__dirname+ '/alertTemplates/indexcf.html');
});
//Creation success. User has been created
app.get('/indexcs', function (req, res,html) {
  res.sendFile(__dirname+ '/alertTemplates/indexcs.html');
});
//Lofin failure. Credentials do not match
app.get('/indexlf', function (req, res,html) {
  res.sendFile(__dirname+ '/alertTemplates/indexlf.html');
});
//Login failure. User is already using the app
app.get('/indexla', function (req, res,html) {
  res.sendFile(__dirname+ '/alertTemplates/indexla.html');
});
//Creation error. Username already exist
app.get('/indexae', function (req, res,html) {
  res.sendFile(__dirname+ '/alertTemplates/indexae.html');
});
//Use these folders for the app
//base directory
app.use(express.static(__dirname));
//css folder
app.use(express.static(__dirname + '/css'));
//js folder
app.use(express.static(__dirname + '/server'));
//alert templates
app.use(express.static(__dirname + '/alertTemplates'));
//images/fonts folder
app.use(express.static('assets'));
//For POST api body parsing.
//This allows us to parse the html input values
app.use(bodyParser.urlencoded({
  extended: true
}));
// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

//Function to connect to database and execute user creation query
//A new user will be added if an erro is not thrown 
var executeCreateQuery = function(res, query){
  con.query(query, (err,rows) => {
    if(err){
      throw err;
    }
    console.log('Data received from database.');
  });
};
//Function to connect to database and execute user validation query
//If user is valid, sign them in to the application
var executeValidateQuery = function(res, query, formData){
  var username = formData.userID;
  var password = formData.password;
  con.query(query, function(error, results, fields){
    //query error or a user is already logged in
    if(error || USER != "none"){
      return res.redirect('/indexla');
    }
    else {
      if(results.length > 0){
        //successful login 
        if(results[0].password == password){
          console.log("Successful login");
          USER = username; 
          return res.redirect('/mychat');
        }
        //incorrect credentials matching username
        else{
          console.log("Username or Password is incorrect");
          return res.redirect('/indexlf');
        }
      }
      //no such username exist
      else{
        console.log("No such username exist");
        return res.redirect('/indexlf');
      }
    }
  });
};
//Function to check if userID already exist in database
function executeCheckQuery(query, callback){
  con.query(query, function(error, results){
    if(error){
      return;
    }
    else {
      if(results.length > 0){
        //callback 0 to indicate username already exist
        return callback(0);
      }
      else{
        //callback 1 to indicate username does not exist
        return callback(1);
      }
    }
  }); 
}
//POST API for user creation
//This post will execute when the CREATE ACCOUNT form is submitted
app.post("/api/user-create", function(req , res){
  //pare the html form items sent with the post
  var formData = {
    userID: req.body.user.userID,
    password: req.body.user.password
  };
  //use chatroom.js function to check for valid username and password parameters
  var valid = tools.create_user_validate(formData.userID, formData.password);
  //if parametes did not meet the requirements
  if(valid == 0){
    return res.redirect('/indexcf');
  }
  //parameters met requirements
  else{
    //check that username isn't already taken
    var query = `SELECT * FROM users WHERE userID = '${formData.userID}'`; 
    //This function will set doesExist to 0 if the user already exist;
    executeCheckQuery(query, function(result){
      doesExist = result;
    });
    if(doesExist == 0){
      //user alreasy exist. Alert and refresh
      return res.redirect('/indexae'); 
    }
    else{
      //User doesn't exist. Insert new user and create
      query = `INSERT INTO users (userID, password) VALUES ('${formData.userID}', '${formData.password}')`;
      //run the create query to establish a new user in the database
      executeCreateQuery(res, query, 1);
      return res.redirect('/indexcs');
    }
  }
});
//POST API for user validation
//This post will execute when the SIGN IN form is submitted
app.post("/api/user-validate", function(req , res){
  //pare the html form items sent with the post
  var formData = {
    userID: req.body.user.userID,
    password: req.body.user.password,
  };
  var query = `SELECT * FROM users WHERE userID = '${formData.userID}'`;
  //run the validation query to check for proper credentials and account existence
  executeValidateQuery (res, query, formData);
});
//show connection or disconnection
io.on('connection', function(socket){
  //A user connected. Let the server know
  console.log(USER + ' connected');
  socket.on('disconnect', function(){
    //A user disconnected. Let the server know
    console.log(USER + ' disconnected');
    //reset the signed in user to 'none'
    USER = "none";
  });
  //when a message is entered on the chat page, this socket will send is to the server
  //then bounce it back to the client with their name prepended to the message.
  socket.on('chat message', function(msg){
    //call the emit function for 'chat message'. Can be found in server.js
    io.emit('chat message', msg, USER);
    //show that the message made it to the server
    console.log(USER + ' says: ' + msg);
  });
});
//PORT TO LISTEN TO
//student ID: 16218049. Port number will be 1+last four of ID
http.listen(18049, "0.0.0.0", function () {
  console.log('myChat is running on port 18049');
});
//For convenience, a link to the server from terminal
console.log("http://www.chriscaldwelldev.com:18049"); 