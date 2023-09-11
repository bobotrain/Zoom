const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");


/// Welcome Form (join a room) 
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

//chat From
const chat = document.getElementById("chat");
const chatForm = chat.querySelector("form");

let myStream;
let muted = false;
let cameraOff = false;
let roomName; 
let myPeerConnection; 
let myDataChannel;

async function getCameras(){
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if(currentCamera.label == camera.label){
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" }
  };
  const cameraConstraints= {
    audio: true,
    video: { deviceId: { exact: deviceId } }
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints: initialConstraints
    );
    myFace.srcObject = myStream;
    if(!deviceId){
      await getCameras();
    }
  } catch(e) {
    console.log(e);
  }
}

function handleMuteClick(){
  myStream.getAudioTracks()
  .forEach((track) => (track.enabled = !track.enabled));
  if(!muted){
    muteBtn.innerText = "Unmute";
    muted = true;
  }else{
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
 
function handleCameraClick(){
  myStream.getVideoTracks()
  .forEach((track) => (track.enabled = !track.enabled));
  if(!cameraOff){
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }else{
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  }
}
 
async function handleCameraChange(){ 
  await getMedia(cameraSelect.value);
  if(myPeerConnection){
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
    .getSenders()
    .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick); 
cameraSelect.addEventListener("input", handleCameraChange);


 
call.hidden = true; 
 
async function initCall(){
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}


welcomeForm.addEventListener("submit", handleWelcomeSubmit);

async function handleWelcomeSubmit(event){
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";

  const h3 = chat.querySelector("h3");
  h3.innerText = `Room <${roomName}>`;
  const form = chat.querySelector("form");
  form.addEventListener("submit",handleMessageSubmit);
}
 

function addMessage(message){
    const ul = chat.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

//submit 메시지 눌렀을때
async function handleMessageSubmit(event){
    event.preventDefault();
    const input = chat.querySelector("input")
    const value = input.value;
    //보낸사람.
    myDataChannel.send(value);
    //보낸사람 화면에 띄울 메시지
    addMessage(`You: ${value}`);
    input.value = "";
}

// Socket Code 
socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");

  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  //console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});


socket.on("bye", () => {
    addMessage("someone left!");
});


//메시지 받는 쪽.
socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event) => {
             //받는사람
            addMessage(`someone : ${event.data}`);
        });
    });
  //console.log("received the offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  //console.log("sent the answer");
  
 
})
 
socket.on("answer", answer => {
  addMessage("someone joined!");
  myPeerConnection.setRemoteDescription(answer);

  const form = document.querySelector("#messageForm input");
  form.addEventListener("submit", handleMessageSubmit);
})
 
socket.on("ice", ice => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});







// RTC Code
 
function makeConnection(){
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",          
        ]
      }
    ]
  });
  myPeerConnection.addEventListener("icecandidate", handleIce); 
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream.getTracks()
  .forEach(track => myPeerConnection.addTrack(track, myStream));
}
 
function handleIce(data){ 
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data){ 
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}



