// importing/ requiring packages
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const User = require('./models/user')
const Token = require('./models/token')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');

// creating express server
const app = express();
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.json())
// setting cors options
const corsOptions = {
  origin: ["https://enki-bookstore.herokuapp.com/"," https://enki-cart.herokuapp.com/"]
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
      console.log(err);
    } else if (!!result === true) {
      res.status(400).json({message: 'user already exists'});
    } else {
      new User(req.body).save()
        .then(() => {
          res.status(201).json({message: 'user was created'});
        })
        .catch(err => console.log(err));
    }
  })
});

// function that deletes an user, if the user is logged in
app.delete('/user', authenticateToken, (req, res) => {
  User.deleteOne({email: req.user.email}, (err, result) => {
    if (err) console.log(err);
    else res.sendStatus(204);
  })
})

// function that updates specific parameters of the user
app.patch('/user', authenticateToken, (req, res) => {
  User.findOneAndUpdate({email: req.user.email}, { ...req.body }, {}, (err, result) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      res.status(205);
    }
  })
})

// funtion that logs in an user after checking if credentials are correct. It also creates an JWT Token for authentication
// and returns an refresh token to refresh the JWT authentication token
app.post('/login', (req, res) => {
  User.exists({email: req.body.email, password: req.body.password}, (err, result) => {
    if (err) {
      console.log(err);
    } else if (!!result === false) {
      res.status(400).json({message: 'wrong email or password'})
    } else {
      // create jwt, store it and send it back to the user with the user id
      const tempUser = User.findOne({email: req.body.email, password: req.body.password}).exec()
        .then(user => {
          generateAccessToken(user.toJSON()).then(token => {
            user.password = null;
            res.status(200).json({token})
          });
        });
    }
  })
})

// funtion that logs out an user -> deletes refresh token in database
app.delete('/logout', (req, res) => {
  Token.deleteOne({token: req.body.token}, (err, result) => {
    if (err) console.log(err);
    res.sendStatus(204);
  });
})

// function taht returns if user is logged in
app.post('/checkLogin', authenticateToken, (req, res) => {
  res.status(200).json({checkLogin: true, user: req.user})
})

// function that is used to verify is the user is logged in/ has verification
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) res.sendStatus(401);
  else {
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        console.log(err);
        res.sendStatus(403).json({checkLogin: false});
      } else {
        req.user = user;
        next();
      }
    })
  }
}

// function to generate an acces token
async function generateAccessToken(user) {
  return await jwt.sign(user, jwtSecret, {expiresIn: '30d'});
}
