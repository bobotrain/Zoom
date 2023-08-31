const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message){
    //메시지 받아서 저장
    const ul = room.querySelector("ul");
    //li 생성
    const li = document.createElement("li");
    //li에 저장해둔 메시지 담음
    li.innerText = message;
    //ul에 가져다 붙힘
    ul.appendChild(li);
}

function showRoom(){
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText  =`Room ${roomName}`;
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room", input.value, showRoom); 
    roomName = input.value;
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

//서버로부터 welcome받으면 메시지 날리도록 체킹
socket.on("welcome", () => {
    addMessage("someone joined!");
})