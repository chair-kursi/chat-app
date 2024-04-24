import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

/*
 Coding standards to follow:
 Use functions and pass them for each event, instead of writing the event logic inside the io.on('connection') block
 Add proper comments to the code
*/

const PORT = 4000;

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
}));

//uploading on cloud
app.use('/uploads', express.static('uploads'));

app.post('/upload', upload.single('file'), (req, res) => {
    res.send(req.file);
});

//test route
app.get('/', (req, res) => {
    res.send('Hello World');
});

io.on('connection', (socket) => {

    console.log(`User joined room: ${socket.id}`);

    socket.on('join', (room) => {
        socket.join(room);
    });

    socket.on('send-world-message', ({ message }) => {

        socket.broadcast.emit('receive-world-messages', message); // for group chats, create / change the event to "receive-group-message"
    });

    socket.on('send-pvt-message', ({ room, message }) => {

        socket.to(room).emit('receive-pvt-messages', message);
    });

    socket.on('pvt-file-share', (data) => {
        
        const fileName = `uploads/${data.fileName}`;
        fs.writeFileSync(fileName, data.fileData, 'base64');
        io.to(data.room).emit('pvt-file-share', { fileName, sender: data.sender });
    });

    socket.on('disconnect', () => {
        
        console.log(`User left room: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
