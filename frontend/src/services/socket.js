import { io } from "socket.io-client";

// 自動判斷：在本機開發連 localhost，上線後連 Render
const URL = window.location.hostname.includes("localhost")
    ? "http://localhost:3000"
    : "https://my-casino-project.onrender.com";  // 👈 填入你的 Render 網址

const socket = io(URL);
export default socket;