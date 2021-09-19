// importing/ requiring packages
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const User = require('./models/user')
const Token = require('./models/token')
const Log = require('./models/log')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');

// creating express server
const app = express();
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.json())
// setting cors options
const corsOptions = {
  origin: ["https://enki-bookstore.herokuapp.com", " https://enki-cart.herokuapp.com"]
};
app.use(cors(corsOptions));
// set port to listen for requests
const PORT = process.env.PORT || 8080;

// secret for jwt authentication
const jwtSecret = 'enki-online-book-store';
const refreshTokenSecret = 'enki-refresh-token';

// connection to database
const databaseUri = 'mongodb+srv://enki-admin-cart:enki1234@cluster0.5xz0p.mongodb.net/enki-users?retryWrites=true&w=majority'
mongoose.connect(databaseUri)
  .then(r => {
    app.listen(PORT, () => {
      console.log('Server is running on Port', PORT)
    })
  })
  .catch(err => console.log(err));

// post route to create an user that checks if email already exists
app.post('/user', (req, res) => {
  User.exists({email: req.body.email}, (err, result) => {
    if (err) {
      writeLog(null, 'createUser', err);
    } else if (!!result === true) {
      writeLog(null, 'createUser', 'user already exists');
      res.status(400).json({message: 'user already exists'});
    } else {
      new User(req.body).save()
        .then((user) => {
          writeLog(user.id, 'createUser', null);
          res.status(201).json({message: 'user was created'});
        })
        .catch(err => writeLog(null, 'createUser', err));
    }
  })
});

// function that deletes an user, if the user is logged in
app.delete('/user', authenticateToken, (req, res) => {
  User.deleteOne({email: req.user.email}, (err, result) => {
    if (err) writeLog(req.user.id, 'deleteUser', err);
    else {
      writeLog(req.user._id, 'deleteUser', null);
      res.status(204).json({msg: 'user was deleted'});
    }
  })
})

// function that updates specific parameters of the user
app.patch('/user', authenticateToken, (req, res) => {
  User.findOneAndUpdate({email: req.user.email}, {...req.body}, {}, (err, result) => {
    if (err) {
      writeLog(req.user._id, 'updateUser', err);
      res.sendStatus(500);
    } else {
      writeLog(req.user._id, 'updateUser', null);
      res.sendStatus(205);
    }
  })
})

// funtion that logs in an user after checking if credentials are correct. It also creates an JWT Token for authentication
// and returns an refresh token to refresh the JWT authentication token
app.post('/login', (req, res) => {
  User.exists({email: req.body.email, password: req.body.password}, (err, result) => {
    if (err) {
      writeLog(req.user._id, 'login', err);
    } else if (!!result === false) {
      writeLog(req.user._id, 'login', 'wrong email or password');
      res.status(400).json({message: 'wrong email or password'})
    } else {
      // create jwt, store it and send it back to the user with the user id
      const tempUser = User.findOne({email: req.body.email, password: req.body.password}).exec()
        .then(user => {
          generateAccessToken(user.toJSON()).then(token => {
            user.password = null;
            writeLog(user.id, 'login', null)
            new Token({token}).save().catch(err => console.log(err));
            res.status(200).json({token})
          });
        });
    }
  })
})

// funtion that logs out an user -> deletes refresh token in database
app.delete('/logout', authenticateToken, (req, res) => {
  Token.deleteOne({token: req.token}, (err, result) => {
    if (err) writeLog(req.user._id, 'logout', err);
    writeLog(req.user._id, 'logout', null)
    res.sendStatus(204);
  });
})

// function taht returns if user is logged in
app.post('/checkLogin', authenticateToken, (req, res) => {
  writeLog(req.user._id, 'checkLogin', null)
  res.status(200).json({checkLogin: true, user: req.user})
})

app.get('/log', (req, res) => {
  let log = Log.find({}).exec().then(log => {
    res.json(log);
  });
})

// function that is used to verify is the user is logged in/ has verification
function authenticateToken(req, res, next) {
  let token = req.headers['authorization'];
  if (token.split(' ').length > 1) {
    token = token.split(' ')[1];
  }

  if (token == null) res.sendStatus(401);
  else {
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        writeLog(null, 'authenticateToken', err);
        res.status(403).json({checkLogin: false});
      } else {
        req.user = user;
        req.token = token;
        writeLog(user._id, 'authenticateToken', null)
        next();
      }
    })
  }
}

// function to write into the log
function writeLog(userId, func, log) {
  let id = userId || '/';
  let msg = log || 'success';
  let name = func || '/'
  new Log({userId: id, functionName: func, log: msg}).save().catch(err => console.log(err));
}

// function to generate an acces token
async function generateAccessToken(user) {
  return await jwt.sign(user, jwtSecret, {expiresIn: '30d'});
}
