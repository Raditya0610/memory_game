const http = require("http");
const { Server } = require("socket.io");

// Server HTTP
/* Di http server ini mengijinkan dari segala server untuk bisa memainkan*/
const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*", 
  },
});

let players = {}; // Simpan skor pemain
let cards = []; // Kartu permainan

// Inisialisasi kartu (8 pasangan)
/* Fungsi Array di sini digunakan untuk memunculkan array yang memiliki panjang 8
dan penggunaan dua kali berarti akan ada pengulangan pemunculan array. Penggunaan '.keys' untuk memunculkan 
angka 0-7*/

/* Math.random akan mengacak angka dari 0-1 dan .sort memastikan pengacakan kartu yang sesuai*/
function initializeGame() {
  cards = [...Array(8).keys(), ...Array(8).keys()];
  cards.sort(() => Math.random() - 0.5);
}

// Ketika pemain terkoneksi
io.on("connection", (socket) => {
  /* Socket otomatis memberikan id untuk player dan inisiasi skor awal player*/
  console.log(`Player connected: ${socket.id}`);
  players[socket.id] = 0;

  /* Socket mengirim "game start" dan memunculkan kartu-kartu yang sudah
  disimpan di 'cards'*/
  socket.emit("game-start", { cards });

  /* Socket menerima input dari client yaitu pilihan kartu player dan mengecek kesesuaian*/
  socket.on("card-pick", ({ index1, index2 }) => {
    if (cards[index1] === cards[index2]) {
      players[socket.id]++;
      socket.emit("match", { index1, index2 });
    } else {
      socket.emit("no-match", { index1, index2 });
    }

    // Socket mengirimkan skor terbaru
    io.emit("score-update", players);
  });

  // Ketika pemain keluar
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
  });
});

// Mulai server
/* contoh menggunakan port 5000 karena di port 3000 sudah digunakan untuk frontend*/
initializeGame();
server.listen(5000, () => console.log("Server running on port 5000"));
