const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
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

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model('User', userSchema)

passport.use(User.createStrategy())
 
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.get('/', function (req, res) {
    res.render('home')
})

app.get('/logout', function (req, res) {
    req.logout()
    res.redirect('/')
})


app.get('/login', function (req, res) {
    res.render('login')
})

app.post('/login', function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function (err) {
        if (!err) {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/secrets')
            })
        } else {
            console.log(err)
        }
    })

})

app.get('/secrets', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('secrets')
    } else {
        res.redirect('/login')
    }
}) 


app.get('/register', function (req, res) {
    res.render('register')
})

app.post('/register', function (req, res) {
    
    User.register({})
    User.register({username: req.body.username}, req.body.password, function (err, user) {
        if(!err) {
            if (user) {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/secrets')
                })
            } else {
                console.log(err)
            }
        } else {
            res.redirect('/register')
            console.log('A user with the given Email is already registered')
        }
    })

})


app.listen(port, function(){
    console.log('Server started on port', port);
})