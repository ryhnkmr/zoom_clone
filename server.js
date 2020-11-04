const express = require('express');
const app = express();
const server = require('http').Server(app);
const { v4: uuidv4 } = require('uuid');
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});


app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use('/peerjs', peerServer);
app.get('/', (req, res) => {
  res.redirect(`/${uuidv4()}`);
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    const numOfClients = io.nsps['/'].adapter.rooms[roomId].length;
    totalClients = numOfClients; 
    socket.to(roomId).broadcast.emit('user-connected', userId, numOfClients);
    socket.on('message', message => {
      io.to(roomId).emit('createMessage', message)
    })
    socket.on('sendHand', (hand, userId) => {
      const userHand = { choice: hand, id: userId }

      io.to(roomId).emit('prepareHands', userHand)
    })
    socket.on('readyResult', (hands) => {
      io.to(roomId).emit('showResult', hands);
    })
  })
})

server.listen(process.env.PORT || 3030);