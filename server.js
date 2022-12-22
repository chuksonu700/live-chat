const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const Pusher = require('pusher');
const mysql = require('mysql');
const sha512 = require('js-sha512').sha512;
var jsdom = require("jsdom");
const { urlencoded } = require('express');


dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded(
    {extended:false}
))
app.use(session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true
}));

app.use(express.static(path.join('__dirname','/../public')));
//sql Connection
const connection = mysql.createConnection({
    host     : '127.0.0.1',
    port     : '3306',
    user     : 'root',
    password : '',
    database : 'eventdb'
});
const PORT = process.env.PORT || 3300;
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    forceTLS: true,
});
//routes
app.get('/', function(request, response) {
    if (request.session.loggedin) {
        if (request.session.isadmin) {
            return response.sendFile(path.join(__dirname + '/public/admin/admin.html'));
        } else {
            return response.sendFile(path.join(__dirname + '/public/landing/index.html'));
        }
    } else {
        response.sendFile(path.join(__dirname + '/public/login/login.html'));
   
    }

});

//post login 

app.post('/login', function(request, response) {
    let email = request.body.email;
    let ticket = request.body.ticket;
    if (email && ticket) {
        connection.query('SELECT * FROM accounts WHERE email = ? AND ticket = ?', [email, ticket], function(error, result, fields) {
        // connection.query('SELECT * FROM accounts WHERE email = ? AND ticket = ?', [email, sha512(ticket)], function(error, result, fields) {
            if (error) throw error;
            if (result.length > 0) {
                request.session.loggedin = true;
                request.session.email = result[0].email;
                request.session.username = result[0].username;
                request.session.fullname = result[0].fullname;
                if (request.session.username === 'admin') {
                    request.session.isadmin = true
                }
                return response.redirect('/');
            } else {
                return response.send('Incorrect input data provided!');
            }
        });
    } else {
        return response.send('Please enter username, email and ticket number!');
    }
});

app.post('/pusher/auth', (request, response) => {
    const socketId = request.body.socket_id;
    const channel = request.body.channel_name;
    const presenceData = {
        user_id: request.session.username,
        user_info: {
            fullname: request.session.fullname,
        }
    };
    const auth = pusher.authorizeChannel(socketId, channel, presenceData);
    response.send(auth);
   });

app.post("/pusher/user-auth", (request, response) => {
    const socketId = request.body.socket_id;
    const userData = {
        id: request.session.username,
        email: request.session.email,
        fullname: request.session.fullname,
    };
    const authUser = pusher.authenticateUser(socketId, userData);
    response.send(authUser);
});

//warn user
const warningEvent = 'client-warn-user'
    const warningMessage = 'This is your first warning. Further misbehaving will lead to your removal from the event.'
    app.post('/warn', (request, response) => {
        const warnResp = pusher.sendToUser(request.body.user_id, warningEvent, {
            message: warningMessage
        });
        response.send(warnResp);
    });
//terminate user
const terminateEvent = 'client-terminate-user'
    const terminateMessage = 'Your chat sessions have been terminated by the Admin.'
    app.post('/terminate', (request, response) => {
        pusher.sendToUser(request.body.user_id, terminateEvent, {
            message: terminateMessage
        });
        const terminateResp = pusher.terminateUserConnections(request.body.user_id);
        response.send(terminateResp)
    });
//Listen Method
app.listen(PORT, () => {
    console.log('Server is up on 3300')
});