const socket = io();
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

//카메라 목록 가져오기.
async function getCameras() {
    try {
       const devices = await navigator.mediaDevices.enumerateDevices();
       const cameras = devices.filter((device) => device.kind === "videoinput");
       const currentCameras = myStream.getVideoTracks()[0];
       cameras.forEach((camera) => {
        const option = document.createElement("option");
        option.value = camera.deviceId;
        option.innerText = camera.label;
        if(currentCameras.label == camera.label){
            option.selected = true;
        }
        cameraSelect.appendChild(option);
       });
    } catch(e) {
        console.log(e);
    }
}


async function getMedia(deviceId) {
    const initialConstraints = {
        audio: true,
        video: { facingMode: "user" }
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: {exact: deviceId} }
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


function handleMuteClick() {
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

function handleCameraClick() {
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

async function handleCameraChange() {
    await getMedia(cameraSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

//채팅룸 입장과 관련된 기능 추가
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

call.hidden = true;

async function startMedia(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    socket.emit("join_room", input.value, startMedia);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//Socket Code
socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", offer => {
    console.log(offer);
})

//RTC Code
function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    myStream.getTracks()
    .forEach(track => myPeerConnection.addTrack(track, myStream));
}