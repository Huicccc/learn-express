const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express(); // Creates an instance of an Express application to set up the server.
var cors = require('cors'); //  Imports the CORS package to enable Cross-Origin Resource Sharing, allowing the server to accept requests from different origins.
const port = 8000; // Defines the port number on which the Express server will listen.

let users;
fs.readFile(
    path.resolve(__dirname, './data/users.json'), // creates an absolute path to the JSON file, ensuring it is correctly located regardless of the current working directory.
    function (err, data) {
      console.log('reading file ... ');
      if (err) {
        throw err;
      }
      users = JSON.parse(data); // parses the read data into a JavaScript object and assigns it to the users variable
    }
)

/**
 * Middleware to add user data to the request object. If user data is available,
 * it attaches the user data to the `req` object under the `users` property and
 * passes control to the next middleware in the stack using `next()`. If no user data
 * is available, it sends a response with an error message and a 404 status.
 *
 * @param {object} req The request object from the client. This function adds user
 * data to this object if available.
 * @param {object} res The response object to send back to the client. Used here to
 * send an error response if no user data is available.
 * @param {function} next The callback function to pass control to the next middleware
 * in the stack.
 * @returns {any} This function returns the execution of `next()` to continue the
 * middleware chain or sends a JSON response directly with `res.json()` in case of an error.
 */
const addMsgToRequest = function (req, res, next) {
  if (users) {
    req.users = users;
    next(); // triggers the succeeding middleware function in the stack
  } else {
    return res.json({
      error: {message: 'users not found', status: 404}
    });
  }
}

app.use(cors({origin: 'http://localhost:3000'})); // Applies the CORS middleware to allow requests from the specified origin (http://localhost:3000).
app.use('/read/usernames', addMsgToRequest); // Applies the addMsgToRequest middleware specifically to routes that start with /read/usernames
// Defines a GET endpoint at /read/usernames that maps user data to id and username and sends this data back to the client.
app.get('/read/usernames', (req, res) => {
  let usernames = req.users.map(function (user) {
    return {id: user.id, username: user.username};
  });
  res.send(usernames); // express: end, automatically, nodejs: end, manually
});

app.use(express.json()); // enables parsing of JSON-formatted request bodies.
app.use(express.urlencoded({extended: true})); // enables parsing of URL-encoded bodies, extended: true option allowing for rich objects and arrays to be encoded into the URL-encoded format.
app.use('/write/adduser', addMsgToRequest);

app.post('/write/adduser', (req, res) => {
  let newuser = req.body; // parsed by the previously added middleware
  req.users.push(newuser);
  fs.writeFile(
      path.resolve(__dirname, './data/users.json'),
      JSON.stringify(req.users), (err) => {
        if (err) {
          console.log('Failed to write');
        } else {
          console.log('User Saved');
        }
      });
  res.send('done');
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
