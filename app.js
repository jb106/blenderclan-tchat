//Modules
let express = require('express')
let http = require('http')
let socketio = require('socket.io')
let striptags = require('striptags')
let mysql = require('mysql')
let axios = require('axios')

let config = require('./config')
const { isNullOrUndefined } = require('util')

//Module dev dependencies
let morgan
if(!config.prod)
    morgan = require('morgan')

//Constantes
const app = express()
const server = http.Server(app)
const io = socketio(server)

const port = process.env.PORT || config.express.port;

const options = 
{
    root: __dirname + '/views'
}

//Variables globales
let usernames = []
let usernamesColors = []
let peopleWriting = []

let messagesHistory = {};

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
    socket.on('setUsername', (usernameWanted, colorPicked) => {

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

        let incorrectSyntax = false

        if(usernameWanted == "")
        {
            incorrectSyntax = true
        }

        axios.get('http://jeanbaptiste-leonelli.fr/blenderclan_gethistory.php?limit=500')
        .then(response => {
            messagesHistory = response.data;
        }).catch(error => console.log(error));

        //Traitement final
        let timeFakeLoading = 1000
        setTimeout(() => { 
            if(usernametaken || incorrectSyntax)
            {
                socket.emit('rejectUsername', usernameWanted, incorrectSyntax)
            }
            else
            {
                socket.join('users', () => {
                    usernames[socket.id] = usernameWanted
                    usernamesColors[usernameWanted] = colorPicked

                    let justUsernames = getUsernames()
                    let justUsernamesColors = getUsernamesColors()

                    socket.emit('acceptUsername', usernameWanted, justUsernames, justUsernamesColors, messagesHistory)
                    socket.to('users').emit('newUser', usernameWanted, justUsernames, justUsernamesColors, colorPicked)
                })
            }
        }, timeFakeLoading)

    })

    //Reception d'un message
    socket.on('sendMessage', (text) => {
        text = striptags(text.trim(), '<b><i><p>')

        if(text != "")
        {
            if(usernames[socket.id] == undefined)
            {
                socket.emit("wrongConnection")
            }
            else
            {
                socket.to('users').emit('newMessage', text, usernames[socket.id], usernamesColors[usernames[socket.id]])
                socket.emit('confirmMessage', text)
                
                axios
                .post('http://jeanbaptiste-leonelli.fr/blenderclan_appendnewmessage.php', {
                username: usernames[socket.id],
                usercolor: usernamesColors[usernames[socket.id]],
                messagecontent: text,
                messagedate: formatDate(new Date()),
                passcheck: "9173515316157fsdfds54a6dza6za4d"
                })
                .then(res => {
                console.log(res)
                })
                .catch(error => {
                console.error(error)
                })
            }
        }
    })

    //Check en continu pour vérifier qu'on est bien connecté à la même salle
    socket.on('checkConnection', (username) => {
        if(usernames[socket.id] == undefined)
        {
            socket.emit("wrongConnection")
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
            const tempsUserNameColor = usernamesColors[tempUserName]

            delete usernames[socket.id]
            delete usernamesColors[tempUserName]
            socket.to('users').emit('leftUser', tempUserName, getUsernames(), getUsernamesColors(), tempsUserNameColor)
        }
    })
})

//Lancement de l'application
server.listen(port, () => {
    console.log("Server started on port "+ port)
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

function getUsernamesColors()
{
    let colors = []

    for(let username in usernamesColors)
    {
        colors.push(usernamesColors[username])
    }

    return colors
}

function formatDate(date) {
    const h = "0" + date.getHours();
    const m = "0" + date.getMinutes();

    return `${h.slice(-2)}:${m.slice(-2)}`;
}