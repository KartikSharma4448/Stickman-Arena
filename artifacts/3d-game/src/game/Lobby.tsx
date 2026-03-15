import { useState, useEffect } from "react";
import { useGameStore } from "./store";
import { getSocket } from "./socket";

export default function Lobby() {
  const rooms = useGameStore((s) => s.rooms);
  const setRooms = useGameStore((s) => s.setRooms);
  const myName = useGameStore((s) => s.myName);
  const setMyName = useGameStore((s) => s.setMyName);
  const [newRoomName, setNewRoomName] = useState("");
  const [nameInput, setNameInput] = useState(myName);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("get_rooms");
    const interval = setInterval(() => socket.emit("get_rooms"), 3000);
    const onRooms = (data: typeof rooms) => setRooms(data);
    socket.on("rooms_list", onRooms);
    return () => {
      clearInterval(interval);
      socket.off("rooms_list", onRooms);
    };
  }, []);

  const applyName = () => {
    const name = nameInput.trim() || "Player";
    setMyName(name);
    getSocket().emit("set_name", { name });
  };

  const createRoom = () => {
    getSocket().emit("create_room", { name: newRoomName || "Arena" });
  };

  const joinRoom = (roomId: string) => {
    getSocket().emit("join_room", { roomId });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif",
        zIndex: 1000,
      }}
    >
      <div style={{ maxWidth: 500, width: "90%", color: "#fff" }}>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 900,
            textAlign: "center",
            marginBottom: 6,
            letterSpacing: 2,
            background: "linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          STICKMAN FPS
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#888",
            marginBottom: 32,
            fontSize: 13,
          }}
        >
          Online Multiplayer Shooter
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <label style={{ fontSize: 12, color: "#aaa", display: "block", marginBottom: 6 }}>
            YOUR NAME
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyName()}
              placeholder="Enter your name..."
              maxLength={20}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              onClick={applyName}
              style={{
                background: "#4a9eff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: "bold",
              }}
            >
              SET
            </button>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <label
            style={{ fontSize: 12, color: "#aaa", display: "block", marginBottom: 6 }}
          >
            CREATE ROOM
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createRoom()}
              placeholder="Room name (optional)..."
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              onClick={createRoom}
              style={{
                background: "linear-gradient(135deg, #ff6b6b, #ee5a24)",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: "bold",
              }}
            >
              CREATE
            </button>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: 16,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#aaa",
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>AVAILABLE ROOMS</span>
            <span style={{ color: "#666" }}>{rooms.length} room{rooms.length !== 1 ? "s" : ""}</span>
          </div>

          {rooms.length === 0 ? (
            <div style={{ textAlign: "center", color: "#555", padding: "20px 0", fontSize: 14 }}>
              No rooms yet. Create one to start playing!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
              {rooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(255,255,255,0.04)",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 14 }}>{room.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {room.playerCount} / {room.maxPlayers} players
                    </div>
                  </div>
                  <button
                    onClick={() => joinRoom(room.id)}
                    disabled={room.playerCount >= room.maxPlayers}
                    style={{
                      background:
                        room.playerCount >= room.maxPlayers
                          ? "#333"
                          : "linear-gradient(135deg, #6bcb77, #4caf50)",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 14px",
                      color: room.playerCount >= room.maxPlayers ? "#666" : "#fff",
                      cursor: room.playerCount >= room.maxPlayers ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {room.playerCount >= room.maxPlayers ? "FULL" : "JOIN"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 20,
            padding: "10px 16px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            fontSize: 12,
            color: "#555",
            textAlign: "center",
          }}
        >
          WASD to move • Mouse to aim • LMB to shoot • ESC to unlock cursor
        </div>
      </div>
    </div>
  );
}
