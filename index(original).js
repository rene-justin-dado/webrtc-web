'use strict' 
// Codelab step-04

const os = require('os')
const nodeStatic = require('node-static')
const http = require('http')
const socketIO = require('socket.io')

const fileServer = new(nodeStatic.Server)()
const app = http.createServer((req, res) => {
  fileServer.serve(req, res)
}).listen(8080)

const io = socketIO.listen(app)

io.sockets.on('connection', socket => {

  // convenience function to log server messages on the client
  function log() {
    let array = ['Message from server:']
    array.push.apply(array, arguments)
    socket.emit('log', array)
  }

  socket.on('message', message => {
    log('Client said: ', message)
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message)
  })

  socket.on('create or join', room => {
    log('Received request to create or join room ' + room)

    let numClients = io.sockets.sockets.length
    log('Room ' + room + ' now has ' + numClients + ' client(s)')

    if (numClients === 1) {
      socket.join(room)
      log('Client ID ' + socket.id + ' created room ' + room)
      socket.emit('created', room, socket.id)

    } else if (numClients === 2) {
      log('Client ID ' + socket.id + ' joined room ' + room)
      io.sockets.in(room).emit('join', room)
      socket.join(room)
      socket.emit('joined', room, socket.id)
      io.sockets.in(room).emit('ready')
    } else { // max two clients
      socket.emit('full', room)
    }
  })

  socket.on('ipaddr', () => {
    const ifaces = os.networkInterfaces()
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address)
        }
      })
    }
  })

})
