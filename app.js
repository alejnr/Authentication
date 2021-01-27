const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook')
const findOrCreate = require('mongoose-findorcreate')
const dotenv = require('dotenv')
const ejs = require('ejs')

dotenv.config()

const app = express()
const port = 3000

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    image: String,
})

const secretSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: [true, 'Please write your secret']
    }
})

const Secret = mongoose.model('Secret', secretSchema)


userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model('User', userSchema)

passport.use(User.createStrategy())
 
passport.serializeUser(function(user, done) {
    done(null, user.id);
})
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    })
})

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://anonymoussecret.herokuapp.com/auth/google/secrets',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, { username: profile.emails[0].value, name: profile.displayName, image: profile.photos[0].value }, function (err, user) {
      return cb(err, user)
    })
  }
))

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://anonymoussecret.herokuapp.com/auth/facebook/secrets",
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, { username: profile.emails[0].value, name: profile.displayName, image: profile.photos[0].value }, function (err, user) {
      return cb(err, user)
    })
  }
))

app.get('/', function (req, res) {
    Secret.find(function (err, foundSecrets) {
        if (!err) {
            if (foundSecrets) {
                res.render('home', {secrets: foundSecrets, req: req, user: req.user})
            }
        }
    })
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'https://www.googleapis.com/auth/userinfo.email'] })
)

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/')
})

app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
)

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/')
})


app.get('/submit', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('submit')
    } else {
        res.redirect('/login')
    }
})

app.post('/submit', function (req, res) {

    User.findById(req.user._id, function (err, foundUser) {
        if (!err) {
            if (foundUser) {

                const newSecret = new Secret ({
                    userId: foundUser.id,
                    content: req.body.secret
                })
                newSecret.save(function (err) {
                   if (!err) {
                       res.redirect('/')
                   } else {
                       res.render('submit', {Error: err})
                   }
                })
            }
        } else {
            console.log(err)
        }
    })

})


app.get('/logout', function (req, res) {
    req.logout()
    res.redirect('/')
})


app.get('/login', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/')
    } else {
        res.render('login')
    }
})

app.post('/login', function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (!err) {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/')
            })
        } else {
            console.log(err)
        }
    })

})


app.get('/register', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/')
    } else {
        res.render('register')
    }
})

app.post('/register', function (req, res) {
    
    User.register({})
    User.register({username: req.body.username, name: req.body.name}, req.body.password, function (err, user) {
        if(!err) {
            if (user) {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/')
                })
            } else {
                console.log(err)
            }
        } else {
            res.redirect('/register')
            console.log(err)
        }
    })

})

app.use(function (req, res) {
    res.redirect('/')
  })


app.listen(process.env.PORT || port, function(){
    console.log('Server started on port', port);
})