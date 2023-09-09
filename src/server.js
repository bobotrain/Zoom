import http from 'http';
import SocketIO from "socket.io";
import express from "express";


const app = express();

app.set("view engine", "pug");
//dirname은 Node.js기본 전역변수로, 현재 실행되는 폴더의 경로를 의미
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

// '/'를 받으면 home으로 가게 설정
app.get("/", (req, res) => res.render("home"));
//만약홈이 아닌 다른 주소로 get요청을 보내더라도 홈으로 리다이렉션하게 예외처리함
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomName,) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
});

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000,handleListen);   