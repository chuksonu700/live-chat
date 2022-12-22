

app.post('/login', function(request, response) {
    let email = request.body.email;
    let ticket = request.body.ticket;
    if (email && ticket) {
        connection.query('SELECT * FROM accounts WHERE email = ? AND ticket = ?', [email, sha512(ticket)], function(error, result, fields) {
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