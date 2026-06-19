
import { useRef, useEffect, useState } from "react";
import "./Whiteboard.css";
import { io } from "socket.io-client";
const socket = io("http://localhost:3001");
import { useParams } from "react-router-dom";



function Whiteboard() {
 console.log("Whitwboarrd");
  const canvasRef = useRef(null);
const [isDrawing, setIsDrawing] = useState(false);
const [color, setColor] = useState("black");
const [brushSize, setBrushSize] = useState(4);
const [users, setUsers] = useState(1);
const [history, setHistory] = useState([]);

const { roomId } = useParams();
console.log("Room:", roomId);

useEffect(() => {
  socket.emit("joinRoom", roomId);
}, [roomId]);
  
useEffect(() => {

  socket.on("startDrawing", (data) => {
    const ctx = canvasRef.current.getContext("2d");

    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.brushSize;



    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
  });

  socket.on("draw", (data) => {
    const ctx = canvasRef.current.getContext("2d");

    ctx.lineTo(data.x, data.y);
    ctx.stroke();
  });

  socket.on("stopDrawing", () => {
    const ctx = canvasRef.current.getContext("2d");

    ctx.closePath();
  });

  socket.on("clearBoard", () => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on("userCount", (count) => {
  setUsers(count);
});

  return () => {
    socket.off("startDrawing");
    socket.off("draw");
    socket.off("stopDrawing");
    socket.off("clearBoard");
    socket.off("userCount");
  };

}, []);
  
useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected");
    });

    return () => {
      socket.off("connect");
    };
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.85;

    const ctx = canvas.getContext("2d");

    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
  }, []);

  const startDrawing = (e) => {
  const x = e.nativeEvent.offsetX;
  const y = e.nativeEvent.offsetY;

  const ctx = canvasRef.current.getContext("2d");

  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;

  setHistory((prev) => [
    ...prev,
    canvasRef.current.toDataURL()
  ]);

  ctx.beginPath();
  ctx.moveTo(x, y);

  socket.emit("startDrawing", {
    x,
    y,
    color,
    brushSize,
    roomId,
  });

  setIsDrawing(true);
};



 const draw = (e) => {
  if (!isDrawing) return;

  const x = e.nativeEvent.offsetX;
  const y = e.nativeEvent.offsetY;

  const ctx = canvasRef.current.getContext("2d");
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  
  ctx.lineTo(x, y);
  ctx.stroke();

  socket.emit("draw", { x, y ,roomId});
};

  const stopDrawing = () => {
    socket.emit("stopDrawing" , {roomId});
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clearBoard" , 
      {roomId}
    );
  };


  const undo = () => {
  if (history.length === 0) return;

  const previousState = history[history.length - 1];

  const img = new Image();
  img.src = previousState;

  img.onload = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };

  setHistory((prev) => prev.slice(0, -1));
};

  const saveBoard = () => {
  const canvas = canvasRef.current;

  const link = document.createElement("a");
  link.download = "whiteboard.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};
  


  return (
    <div className="container">
     
      <div className="toolbar">
       <h2 className="logo">🎨 SyncBoard</h2>
        <h3>🎨 Room: {roomId}</h3>
        <p>👥 {users} Users</p>
 <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
      >
        <option value="black">⚫ Black</option>
        <option value="red">🔴 Red</option>
        <option value="blue">🔵 Blue</option>
         <option value="green">🟢 Green</option>
</select>

<select
        value={brushSize}
        onChange={(e) => setBrushSize(Number(e.target.value))}
      >
        <option value="2">2px</option>
        <option value="4">4px</option>
        <option value="8">8px</option>
        <option value="12">12px</option>
      </select>

        <button className="clear-btn"onClick={clearCanvas}>🗑️ Clear Board</button>
        <button className="save-btn" onClick={saveBoard}> 💾 Save PNG</button>
        <button className="undo-btn" onClick={undo}>  ↩️ Undo</button>
        
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="canvas"
      />
    </div>
  );

}
export default Whiteboard;