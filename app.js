//Modules
let express = require('express')
let http = require('http')
let socketio = require('socket.io')
let striptags = require('striptags')

let config = require('./config')

//Module dev dependencies
let morgan
if(!config.prod)
    morgan = require('morgan')

//Constantes
const app = express()
const server = http.Server(app)
const io = socketio(server)
const port = config.express.port
const options = 
{
    root: __dirname + '/views'
}

//Variables globales
let usernames = []
let peopleWriting = []

//Middlewares
app.use(express.static(options.root))
app.get('/', (req, res) => {
    res.redirect('/home')
})

//Roots
if(!config.prod)
    app.use(morgan('dev'))

app.get('/home', (req, res) => {
    res.sendfile('index.html', options)
})
app.get('/params/:name', (req, res) => {
    res.send(req.params.name)
})

//IO
io.on('connection', function (socket)
{
    console.log('a user connected : '+socket.id);

    //Assignation d'un username
    socket.on('setUsername', (usernameWanted) => {

        //Traitement string
        usernameWanted = striptags(usernameWanted.trim())

        //Vérif unicité
        let usernametaken = false
        for(let socketid in usernames)
        {
            if(usernames[socketid] == usernameWanted)
            {
                usernametaken = true
            }
        }
        
        //Traitement final
        let timeFakeLoading = 1000
        setTimeout(() => { 
            if(usernametaken)
            {
                socket.emit('rejectUsername', usernameWanted)
            }
            else
            {
                socket.join('users', () => {
                    usernames[socket.id] = usernameWanted
                    let justUsernames = getUsernames()
                    socket.emit('acceptUsername', usernameWanted, justUsernames)
                    socket.to('users').emit('newUser', usernameWanted, justUsernames)
                })
            }
        }, timeFakeLoading)

    })

    //Reception d'un message
    socket.on('sendMessage', (text) => {
        text = striptags(text.trim())

        if(text != "")
        {
            socket.to('users').emit('newMessage', text, usernames[socket.id])
            socket.emit('confirmMessage', text)
        }
    })

    //Information sur l'écriture d'un message
    socket.on('startWriting', () => {
        if(!peopleWriting.includes(usernames[socket.id]))
        {
            peopleWriting.push(usernames[socket.id])
        }
        socket.to('users').emit('userStartWriting', peopleWriting)
    })

    socket.on('stopWriting', () => {
        if(peopleWriting.includes(usernames[socket.id]))
        {
            peopleWriting.splice(peopleWriting.indexOf(usernames[socket.id], 1))
        }
        
        socket.to('users').emit('userStopWriting')
    })


    //Deconnexion d'un user
    socket.on('disconnect', () => {
        if(usernames[socket.id])
        {
            const tempUserName = usernames[socket.id]
            delete usernames[socket.id]
            socket.to('users').emit('leftUser', tempUserName, getUsernames())
        }
    })
})

//Lancement de l'application
server.listen(process.env.PORT || 5000, () => {
    console.log("Server started on port "+port)
});


//Fonction qui envoi uniquement les usernames sous la forme d'un array
function getUsernames()
{
    let users = []

    for(let socketid in usernames)
    {
        users.push(usernames[socketid])
    }

    return users
}