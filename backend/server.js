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
let highestScore = 0;
let winner = null;

// Inisialisasi kartu (8 pasangan)
/* Fungsi Array di sini digunakan untuk memunculkan array yang memiliki panjang 8
dan penggunaan dua kali berarti akan ada pengulangan pemunculan array. Penggunaan '.keys' untuk memunculkan 
angka 0-7*/

/* Math.random akan mengacak angka dari 0-1 dan .sort memastikan pengacakan kartu yang sesuai*/
function initializeGame() {
  cards = [...Array(8).keys(), ...Array(8).keys()];
  cards.sort(() => Math.random() - 0.5);
  highestScore = 0; // Reset skor tertinggi
  winner = null; // Reset pemenang
}

function checkWinner() {
  const maxScore = Math.max(...Object.values(players)); // Mencari skor tertinggi
  if (maxScore > highestScore) {
    highestScore = maxScore;
    winner = Object.keys(players).find(key => players[key] === maxScore); // Menentukan player dengan skor tertinggi
  }

  // Jika semua kartu telah ditemukan (8 pairs)
  if (highestScore === 8) {
    io.emit("game-over", { winner }); // Kirim pengumuman pemenang ke semua klien
    //io.removeAllListeners(); // Hentikan semua listener (opsional untuk mencegah interaksi)
  }
}

// Ketika pemain terkoneksi
io.on("connection", (socket) => {
  /* Socket otomatis memberikan id untuk player dan inisiasi skor awal player*/
  console.log(`Player connected: ${socket.id}`);
  players[socket.id] = 0;


  // Inisialisasi ulang game untuk semua pemain saat pemain baru terhubung
  if (Object.keys(players).length === 1) { // Jika ini pemain pertama
    initializeGame(); // Inisialisasi ulang kartu
  }

  // Kirim kartu ke pemain baru
  socket.emit("game-start", { cards });

  // Hapus status game sebelumnya
  if (winner || highestScore > 0) {
    winner = null;
    highestScore = 0;
  }

  /* Socket mengirim "game start" dan memunculkan kartu-kartu yang sudah
  disimpan di 'cards'*/
  socket.emit("game-start", { cards });
  io.emit("score-update", players); // Kirim skor terbaru ke semua pemain

  /* Socket menerima input dari client yaitu pilihan kartu player dan mengecek kesesuaian*/
  socket.on("card-pick", ({ index1, index2 }) => {
    if (cards[index1] === cards[index2]) {
      players[socket.id]++;
      socket.emit("match", { index1, index2 });
      checkWinner();
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