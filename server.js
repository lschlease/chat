const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('用户已连接');

  socket.on('message', (data) => {
    // 模拟后端处理逻辑
    const response = {
      text: ``,
      score: Math.floor(Math.random() * 100),
      spiderData: [
        { name: '能力A', value: Math.floor(Math.random() * 100) },
        { name: '能力B', value: Math.floor(Math.random() * 100) },
        { name: '能力C', value: Math.floor(Math.random() * 100) },
        { name: '能力D', value: Math.floor(Math.random() * 100) },
        { name: '能力E', value: Math.floor(Math.random() * 100) }
      ]
    };
    
    socket.emit('message', response);
  });

  socket.on('disconnect', () => {
    console.log('用户已断开连接');
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 