const socket = new WebSocket("ws://localhost:3000");

socket.onopen = () => {
  console.log("WebSocket connected");
};

socket.onmessage = (e) => {
  const msg = JSON.parse(e.data);

  if (typeof handleMessage === "function") {
    handleMessage(msg);
  }
};

socket.onclose = () => {
  console.log("WebSocket closed");
};