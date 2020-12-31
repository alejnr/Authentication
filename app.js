const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const md5 = require('md5')
const ejs = require('ejs')

dotenv.config()

const app = express()
const port = 3000

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true})

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const User = new mongoose.model('User', userSchema)


app.get('/', function (req, res) {
    res.render('home')
})


app.get('/login', function (req, res) {
    res.render('login')
})

app.post('/login', function (req, res) {

    User.findOne({email: req.body.username}, function (err, foundUser) {
        if (!err) {
            if (foundUser) {
                if (foundUser.password === req.body.password) {
                    res.render('secrets')
                } else {
                    console.log('Invalid Password!')
                }
            } else {
                console.log('Invalid Username or Password!')
            }
        } else {
            console.log(err)
        }
    })

})


app.get('/register', function (req, res) {
    res.render('register')
})

app.post('/register', function (req, res) {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save(function (err) {
        if (!err) {
            res.render('secrets')
        } else {
            console.log(err)
        }
    })
})


app.listen(port, function(){
    console.log('Server started on port', port);
})