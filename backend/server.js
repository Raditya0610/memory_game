const http = require("http");
const { Server } = require("socket.io");

// Server HTTP
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*", // Izinkan semua koneksi
  },
});

let players = {}; // Simpan skor pemain
let cards = []; // Kartu permainan

// Inisialisasi kartu (8 pasangan)
function initializeGame() {
  cards = [...Array(8).keys(), ...Array(8).keys()];
  cards.sort(() => Math.random() - 0.5);
}

// Ketika pemain terkoneksi
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);
  players[socket.id] = 0;

  socket.emit("game-start", { cards });

  // Terima pilihan kartu
  socket.on("card-pick", ({ index1, index2 }) => {
    if (cards[index1] === cards[index2]) {
      players[socket.id]++;
      socket.emit("match", { index1, index2 });
    } else {
      socket.emit("no-match", { index1, index2 });
    }

    // Kirim skor terbaru
    io.emit("score-update", players);
  });

  // Ketika pemain keluar
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
  });
});

// Mulai server
initializeGame();
server.listen(5000, () => console.log("Server running on port 5000"));
