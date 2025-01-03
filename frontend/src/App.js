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

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on("connect_error", () => {
      setError("Failed to connect to server");
      setIsConnected(false);
    });

    socket.on("game-start", (data) => {
      setCards(data.cards);
      setRevealed(new Array(data.cards.length).fill(false));
      setPickedCards([]);
    });

    socket.on("match", ({ index1, index2 }) => {
      setRevealed(prev => {
        const updated = [...prev];
        updated[index1] = true;
        updated[index2] = true;
        return updated;
      });
      setPickedCards([]);
    });

    socket.on("no-match", () => {
      setTimeout(() => {
        setPickedCards([]);
      }, 1000);
    });

    socket.on("score-update", (players) => {
      setScore(players);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("game-start");
      socket.off("match");
      socket.off("no-match");
      socket.off("score-update");
    };
  }, []);

  const handleCardClick = (index) => {
    if (pickedCards.length === 2 || revealed[index] || pickedCards.includes(index)) return;

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
      
      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <div className="board">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(index)}
            className={`card ${revealed[index] || pickedCards.includes(index) ? 'revealed' : ''}`}
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