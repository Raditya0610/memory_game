import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import './App.css';

const socket = io("http://localhost:5000");

const App = () => {
  const [cards, setCards] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [score, setScore] = useState({});
  const [pickedCards, setPickedCards] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // Fungsi untuk reset state game
  const resetGameState = (newCards = []) => {
    setCards(newCards);
    setRevealed(new Array(newCards.length).fill(false));
    setPickedCards([]);
    setWinner(null);
    setGameOver(false);
  };

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleConnectError = () => {
      setError("Failed to connect to server");
      setIsConnected(false);
    };

    const handleGameStart = (data) => {
      resetGameState(data.cards);
      setScore({});
    };

    const handleMatch = ({ index1, index2 }) => {
      setRevealed(prev => {
        const updated = [...prev];
        updated[index1] = true;
        updated[index2] = true;
        return updated;
      });
      setPickedCards([]);
    };

    const handleNoMatch = () => {
      setTimeout(() => {
        setPickedCards([]);
      }, 1000);
    };

    const handleScoreUpdate = (players) => {
      setScore(players || {});
    };

    const handleGameOver = ({ winner }) => {
      setWinner(winner);
      setGameOver(true);
    };

    const handleGameReset = () => {
      resetGameState(cards);
      setScore({});
    };

    // Event listeners
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("game-start", handleGameStart);
    socket.on("match", handleMatch);
    socket.on("no-match", handleNoMatch);
    socket.on("score-update", handleScoreUpdate);
    socket.on("game-over", handleGameOver);
    socket.on("game-reset", handleGameReset);

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("game-start", handleGameStart);
      socket.off("match", handleMatch);
      socket.off("no-match", handleNoMatch);
      socket.off("score-update", handleScoreUpdate);
      socket.off("game-over", handleGameOver);
      socket.off("game-reset", handleGameReset);
    };
  }, [cards]); // Tambahkan cards sebagai dependency

  const handleCardClick = (index) => {
    if (!isConnected || gameOver || pickedCards.length === 2 || revealed[index] || pickedCards.includes(index)) {
      return;
    }

    const updatedPickedCards = [...pickedCards, index];
    setPickedCards(updatedPickedCards);

    if (updatedPickedCards.length === 2) {
      socket.emit("card-pick", {
        index1: updatedPickedCards[0],
        index2: updatedPickedCards[1],
      });
    }
  };

  return (
    <div className="container">
      <h1 className="title">Memory Game</h1>

      {error && <div className="error">{error}</div>}
      {!isConnected && <div className="error">Connecting to server...</div>}

      {gameOver && winner && (
        <div className="announcement">
          <h2>GAME OVER! Player {winner.slice(0, 4)} is the winner 🎉</h2>
        </div>
      )}

      <div className="board">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(index)}
            className={`card ${revealed[index] || pickedCards.includes(index) ? 'revealed' : ''} 
                       ${!isConnected ? 'disabled' : ''}`}
          >
            {(revealed[index] || pickedCards.includes(index)) ? card : '?'}
          </div>
        ))}
      </div>

      <div className="scoreboard">
        <h2 className="score-title">Scoreboard</h2>
        {Object.entries(score).map(([id, points]) => (
          <div key={id} className="score-item">
            <span>Player {id.slice(0, 4)}</span>
            <span className="points">{points} pairs</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;