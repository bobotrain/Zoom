const messageList = document.querySelector("ul");
const nickForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");
const socket = new WebSocket(`ws://${window.location.host}`);

//JSON을 문자열로 변환하기
function makeMessage(type, payload){
    const msg = { type, payload};
    return JSON.stringify(msg);
}


//연결되었을 때
socket.addEventListener("open", () => {
    console.log("Connected to Server");
})

//서버로부터 메시지를 받았을 때 때
socket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
})

//서버가 오프라인 되었을 때
socket.addEventListener("close", () => {
    console.log("Disconnected from Server");
})
//메시지 이벤트 처리
function handleSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMessage("new_message", input.value));
    input.value = "";
}
//닉네임 이벤트처리
function handleNickSubmit(event){
    event.preventDefault();
    const input = nickForm.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
    input.value = "";
}

//서버로 메시지 보내기
messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);
