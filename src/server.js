import http from 'http';
import express from 'express';
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";


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
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});

instrument(wsServer, {
    auth: false
});

function publicRooms() {
    const {
        sockets: {
            adapter: {sids, rooms},
        },
    }= wsServer;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key)
        }
    })
    return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
    //닉네임이 입력되기 전까지는 익명으로 표시
    socket["nickname"] = "Anon";
    socket.onAny((event) => {
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event: ${event}`);
        
    });
    socket.on("enter_room", (roomName,done) => {
        done();
       socket.join(roomName);
       //to메서드
       socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
       wsServer.sockets.emit("room_change", publicRooms());
    });
    //완전히 해제되기 직전
    socket.on("disconnecting", () =>{
        socket.rooms.forEach(room =>
             socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
    });
    //완전히 해제되었을 때.
    socket.on("disconnect", () =>{
        wsServer.sockets.emit("room_change", publicRooms());
    });

    socket.on("new_message", (msg, room, done) =>{
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    })
    //닉네임 세이브
    socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000,handleListen);