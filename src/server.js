//console.log("hello");
import http from 'http';
import WebSocket from 'ws';
import express from 'express';



const app = express();

app.set("view engine", "pug");
//dirname은 Node.js기본 전역변수로, 현재 실행되는 폴더의 경로를 의미
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

// '/'를 받으면 home으로 가게 설정
app.get("/", (req, res) => res.render("home"));
//만약홈이 아닌 다른 주소로 get요청을 보내더라도 홈으로 리다이렉션하게 예외처리함
app.get("/*", (req, res) => res.redirect("/"));


const handleListen = () => console.log("Listening on http://localhost:3000");
//app.listen(3000, handleListen);

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

const sockets = [];

wss.on("connection", (socket) => {
   sockets.push(socket);

   // 브라우저가 연결됐을 때.
   console.log("Connected to Browser");
   //브라우저가 종료되었을 때를 의미하는 close
   socket.on("close", () => console.log("Disconnected from Browser"));

   //브라우저에서 서버로 메시지가 보내졌을때, 콘솔(터미널)에 그 내용을 출력
   socket.on("message", (msg) => {
        const message = JSON.parse(msg);
        console.log(message.type, message.payload);
        sockets.forEach(aSocket => aSocket.send(`${message}`));
   });

   //브라우저로 메시지 전송 테스트
   //socket.send("hello!!");
})

server.listen(3000,handleListen);