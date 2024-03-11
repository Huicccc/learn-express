const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
var cors = require('cors');
const port = 8000;

let users;
fs.readFile(path.resolve(__dirname, './data/users.json'), function (err, data) {
  console.log('reading file ... ');
  if (err) {
    throw err;
  }
  users = JSON.parse(data);
})

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

// order matters
app.use(cors({origin: 'http://localhost:3000'})); // cors: Used to specify cross-origin request policy.
app.use('/read/usernames', addMsgToRequest); // define our own middleware

app.get('/read/usernames', (req, res) => {
  let usernames = req.users.map(function (user) {
    return {id: user.id, username: user.username};
  });
  res.send(usernames); // express: end, automatically, nodejs: end, manually
});

// express.json: Used to preprocess incoming request and parse associated json
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/write/adduser', addMsgToRequest);

app.post('/write/adduser', (req, res) => {
  let newuser = req.body; // parse by middleware
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
