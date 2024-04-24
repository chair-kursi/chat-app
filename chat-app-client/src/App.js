import {useEffect, useMemo, useState} from "react";
import io from "socket.io-client";

function App() {
    const socket = useMemo(() => io("http://localhost:4000", {withCredentials: true}), []);

    const [pvtMsg,
        setPvtMsg] = useState("");
    const [worldMsg,
        setWorldMsg] = useState("");
    const [room,
        setRoom] = useState("");
    const [roomName,
        setRoomName] = useState("");
    const [socketId,
        setSocketId] = useState("");
    const [pvtMessages,
        setPvtMessages] = useState([]);
    const [worldMessages,
        setWorldMessages] = useState([]);
    const [file,
        setFile] = useState(null);
    const [receivedFiles,
        setReceivedFiles] = useState([]);

    const sendGroupMessage = (e) => {

        e.preventDefault();

        socket.emit("send-world-message", {message: worldMsg});
        setWorldMsg("");
    };

    const joinRoom = (e) => {

        e.preventDefault();

        socket.emit("join", roomName);
        setRoomName("");
    };

    const sendPvtMessage = (e) => {

        e.preventDefault();

        socket.emit("send-pvt-message", {room, message: pvtMsg});
        setPvtMsg("");
    };

    const handleFileUpload = (e) => {

        setFile(e.target.files[0]);
    };

    const sendFile = () => {
        const reader = new FileReader();

        reader.onload = (event) => {

            const fileData = event
                .target
                .result
                .split(",")[1];
            const fileName = file.name;
            const sender = socketId;

            socket.emit("pvt-file-share", {fileName, fileData, sender, room});
        };

        reader.readAsDataURL(file);
    };

    useEffect(() => {

        socket.on("connect", () => {
            console.log("user, connected", socket.id);
            setSocketId(socket.id);
        });

        socket.on("welcome", (data) => {
            console.log(data);
        });

        socket.on("receive-pvt-messages", (data) => {
            console.log(data);
            setPvtMessages((prev) => [
                ...prev,
                data
            ]);
        });

        socket.on("receive-world-messages", (data) => {
            console.log(data);
            setWorldMessages((prev) => [
                ...prev,
                data
            ]);
        });

        socket.on("pvt-file-share", (data) => {
            setReceivedFiles([
                ...receivedFiles,
                data
            ]);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });

        //unmounting
        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div style={{
            width: "200px",
            margin: "auto"
        }}>
            <h6>Client - {socketId}</h6>

            <div>
                <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    type="text"
                    placeholder="Id to Join Privately"/>
                <div
                    style={{
                    border: "1px solid #c9c9c9",
                    padding: "8px"
                }}>
                    <div>
                        <input
                            value={pvtMsg}
                            onChange={(e) => setPvtMsg(e.target.value)}
                            type="text"
                            placeholder="Message for private chat"/>
                        <button onClick={sendPvtMessage}>Send</button>
                    </div>
                    <div>
                        <input type="file" onChange={handleFileUpload}/>
                        <button onClick={sendFile}>Upload</button>
                    </div>
                </div>
            </div>
            <hr/>

            <div>
                <input
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    type="text"
                    placeholder="Any room name to join"/>
                <button onClick={joinRoom}>Join</button>
            </div>

            <hr/>

            <div>
                <input
                    value={worldMsg}
                    onChange={(e) => setWorldMsg(e.target.value)}
                    type="text"
                    placeholder="Message for World Chat"/>
                <button onClick={sendGroupMessage}>Send</button>
            </div>

            <hr/>

            <button
                onClick={() => {
                setPvtMessages([]);
                setWorldMessages([]);
                setReceivedFiles([]);
            }}>
                Clear
            </button>

            <div>
                <h6>Shared Files:
                </h6>
                {receivedFiles.map((file, index) => (
                    <div key={index}>
                        <small>{`${file.sender} sent: ${file.fileName}`}</small>
                        <a
                            href={`http://localhost:4000/${file.fileName}`}
                            target="_blank"
                            rel="noopener noreferrer">
                            Download
                        </a>
                    </div>
                ))}
            </div>

            <h6>World Messages:
            </h6>
            {worldMessages.map((msg, index) => (
                <small key={index}>{msg}<hr/></small>
            ))}

            <h6>Private Messages:
            </h6>
            {pvtMessages.map((msg, index) => (
                <small key={index}>{msg}<hr/></small>
            ))}
        </div>
    );
}

export default App;
