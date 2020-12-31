const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const ejs = require('ejs')

const app = express()
const port = 3000

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true})


app.get('/', function (req, res) {
    res.render('home')
})


app.get('/login', function (req, res) {
    res.render('login')
})


app.get('/register', function (req, res) {
    res.render('register')
})


app.listen(port, function(){
    console.log('Server started on port', port);
})