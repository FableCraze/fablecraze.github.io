// Detecta se está rodando no Electron ou Browser
const isElectron = (function() {
    try {
      return typeof require !== 'undefined' && typeof require('electron') !== 'undefined';
    } catch {
      return false;
    }
  })();
  
  // Carrega módulos do Node.js apenas se estiver no Electron
  let fs, path;
  if (isElectron) {
    fs = require('fs');
    path = require('path');
  }
  
  // VARIÁVEIS GLOBAIS
  let numPlayers = 4;
  let currentDeck = 'baralho1.json';
  let victoryPoints = 50;
  let isRandomMode = true;
  let players = [];
  let currentPlayerIndex = 0;
  let deck = [];
  let deckOriginal = [];
  let scores = {};
  let currentChallenge = null;
  let isRevealed = false;
  let checkboxesProcessed = false;
  
  // Estado dos botões
  let completeSelected = false;
  let drinkSelected = false;
  
  
  // AGUARDA DOM CARREGAR
  document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const playersSetupEl = document.getElementById('playersSetup');
    const gameScreenEl = document.getElementById('gameScreen');
    const cardEl = document.getElementById('card');
    const cardContainerEl = document.getElementById('cardContainer');
    const swipeHintEl = document.getElementById('swipeHint');
    const challengeActionsEl = document.getElementById('challengeActions');
    const winnerEl = document.getElementById('winner');
    
    // Exibe mensagem de ambiente (opcional, remova em produção)
    console.log(`🚀 Rodando em: ${isElectron ? 'Electron' : 'Browser'}`);
    
    // Setup listeners
    document.getElementById('numPlayers').addEventListener('change', (e) => numPlayers = parseInt(e.target.value));
    document.getElementById('deckSelect').addEventListener('change', (e) => currentDeck = e.target.value);
    document.getElementById('victoryPoints').addEventListener('change', (e) => victoryPoints = parseInt(e.target.value));
    document.getElementById('randomMode').addEventListener('change', (e) => isRandomMode = e.target.value === 'true');
    document.getElementById('startGame').addEventListener('click', startGame);
    document.getElementById('restartGame').addEventListener('click', restartGame);
    
    // NOVOS LISTENERS (botões toggle)
    document.getElementById('completeBtn').addEventListener('click', toggleComplete);
    document.getElementById('drinkBtn').addEventListener('click', toggleDrink);
    document.getElementById('challengeDone').addEventListener('click', processChecks);
  
    // FUNÇÕES (usando variáveis locais)
    window.startGame = startGame;
    window.restartGame = restartGame;
    window.processChecks = processChecks;
    window.toggleComplete = toggleComplete;
    window.toggleDrink = toggleDrink;
  });
  
  const HARDCODED_DECKS = {
    'baralho1.json': [
      {text: 'Faça 5 polichinelos', points: 10, shots: 1},
      {text: 'Dança engraçada por 10 segundos', points: 15, shots: 1},
      {text: 'Imite um animal', points: 10, shots: 1},
      {text: 'Conte uma piada', points: 15, shots: 2},
      {text: 'Faça 10 agachamentos', points: 20, shots: 1},
      {text: 'Cante uma música em voz alta', points: 15, shots: 2},
      {text: 'Faça 3 flexões', points: 15, shots: 1},
      {text: 'Imite alguém da sala', points: 20, shots: 2}
    ],
    'baralho2.json': [
      {text: 'Verdade ou desafio para o jogador à direita', points: 15, shots: 1},
      {text: 'Conte um segredo embaraçoso', points: 20, shots: 2},
      {text: 'Beije a mão de alguém', points: 15, shots: 1},
      {text: 'Faça uma declaração romântica improvisada', points: 20, shots: 2},
      {text: 'Dance sensualmente por 15 segundos', points: 25, shots: 2},
      {text: 'Conte sua pior conquista', points: 20, shots: 2},
      {text: 'Dê um elogio sincero para cada jogador', points: 25, shots: 1}
    ]
  };
  
  function startGame() {
    numPlayers = parseInt(document.getElementById('numPlayers').value);
    currentDeck = document.getElementById('deckSelect').value;
    victoryPoints = parseInt(document.getElementById('victoryPoints').value);
    isRandomMode = document.getElementById('randomMode').value === 'true';
    
    // loadDeck agora é assíncrona no browser, mas síncrona no Electron
    const deckPromise = loadDeck();
    
    // Se retornou uma Promise (browser), aguarda
    if (deckPromise instanceof Promise) {
      deckPromise.then(() => {
        initializeGame();
      });
    } else {
      // Electron (síncrono)
      initializeGame();
    }
  }
  
  function initializeGame() {
    players = Array.from({length: numPlayers}, (_, i) => `Jogador ${i+1}`);
    scores = Object.fromEntries(players.map(p => [p, 0]));
    currentPlayerIndex = 0;
    
    document.getElementById('playersSetup').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    document.getElementById('winner').classList.add('hidden');
    
    initGame();
  }
  
  
  function restartGame() {
    document.getElementById('winner').classList.add('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('playersSetup').classList.remove('hidden');
  }
  
  
  function loadDeck() {
    if (isElectron) {
      // Versão Electron (síncrona com fs)
      try {
        const deckPath = path.join(__dirname, currentDeck);
        const data = fs.readFileSync(deckPath, 'utf8');
        deckOriginal = JSON.parse(data);
        prepareDeck();
      } catch (err) {
        console.error('Erro ao carregar baralho:', err);
        useFallbackDeck();
      }
    } else {
      // Versão Browser (usa baralhos hardcoded)
    try {
        if (HARDCODED_DECKS[currentDeck]) {
          deckOriginal = HARDCODED_DECKS[currentDeck];
          prepareDeck();
        } else {
          console.warn(`Baralho ${currentDeck} não encontrado, usando fallback`);
          useFallbackDeck();
        }
      } catch (err) {
        console.error('Erro ao carregar baralho no browser:', err);
        useFallbackDeck();
      }
    }
  }
  
  function prepareDeck() {
    if (isRandomMode) {
      deck = [...deckOriginal];
      shuffle(deck);
    } else {
      deck = [...deckOriginal];
    }
  }
  
  function useFallbackDeck() {
    // Usa o primeiro baralho hardcoded como fallback
    const firstDeckKey = Object.keys(HARDCODED_DECKS)[0];
    deckOriginal = HARDCODED_DECKS[firstDeckKey];
    prepareDeck();
  }
  
  
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  
  function initGame() {
    renderScores();
    setupNextCard();
  }
  
  
  function setupNextCard() {
    if (deck.length === 0) {
      if (isRandomMode) {
        deck = [...deckOriginal];
        shuffle(deck);
      } else {
        deck = [...deckOriginal];
      }
    }
    
    currentChallenge = deck.shift();
    
    checkboxesProcessed = false;
    isRevealed = false;
    
    // Reset estados dos botões
    completeSelected = false;
    drinkSelected = false;
    
    // Reset card
    const cardEl = document.getElementById('card');
    cardEl.className = 'card card-back';
    cardEl.style.transform = '';
    cardEl.style.transition = 'transform 0.3s ease';
    
    cardEl.querySelector('.card-back-content').classList.remove('hidden');
    cardEl.querySelector('.card-front-content').classList.add('hidden');
    
    // UI
    document.getElementById('currentPlayer').textContent = `🎮 ${players[currentPlayerIndex]}`;
    document.getElementById('deckInfo').innerHTML = `🃏 ${deck.length + 1} | ${isRandomMode ? '🎲 Aleatório' : '📋 Sequencial'}`;
    
    document.getElementById('swipeHint').classList.remove('hidden2');
    document.getElementById('challengeActions').classList.add('hidden2');
    
    renderScores();
    initSwipe();
  }
  
  
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  
  
  function initSwipe() {
    const cardEl = document.getElementById('card');
    cardEl.onmousedown = dragStart;
    cardEl.ontouchstart = dragStart;
  }
  
  
  function dragStart(e) {
    if (isRevealed) return;
    e.preventDefault();
    isDragging = true;
    startX = e.clientX || e.touches[0].clientX;
    document.getElementById('card').style.transition = 'none';
  }
  
  
  document.addEventListener('mousemove', dragMove);
  document.addEventListener('touchmove', dragMove, { passive: false });
  
  
  function dragMove(e) {
    if (!isDragging || isRevealed) return;
    e.preventDefault();
    currentX = e.clientX || e.touches[0].clientX;
    const deltaX = currentX - startX;
    document.getElementById('card').style.transform = `translateX(${deltaX}px) rotate(${deltaX / 15}deg)`;
  }
  
  
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchend', dragEnd);
  
  
  function dragEnd(e) {
    if (!isDragging || isRevealed) return;
    isDragging = false;
    
    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || currentX;
    const deltaX = clientX - startX;
    
    const cardEl = document.getElementById('card');
    cardEl.style.transition = 'transform 0.4s ease';
    
    if (Math.abs(deltaX) > 80) {
      revealCard();
    } else {
      cardEl.style.transform = 'translateX(0) rotate(0)';
    }
  }
  
  
  function revealCard() {
    isRevealed = true;
    const cardEl = document.getElementById('card');
    cardEl.style.transform = 'translateX(0) rotate(0)';
    
    setTimeout(() => {
      cardEl.classList.remove('card-back');
      cardEl.classList.add('revealed');
      
      const frontContent = cardEl.querySelector('.card-front-content');
      frontContent.innerHTML = `
        <div class="challenge-text">${currentChallenge.text}</div>
        <div class="challenge-info">
          ✅ ${currentChallenge.points} pontos | 🍺 ${currentChallenge.shots} shot${currentChallenge.shots > 1 ? 's' : ''}
        </div>
      `;
      frontContent.classList.remove('hidden');
      cardEl.querySelector('.card-back-content').classList.add('hidden');
      
      // Configura informações nos botões
      document.getElementById('completePoints').textContent = currentChallenge.points;
      document.getElementById('drinkShots').textContent = currentChallenge.shots;
      
      // Reset visual dos botões
      document.getElementById('completeBtn').classList.remove('selected');
      document.getElementById('drinkBtn').classList.remove('selected');
      
      document.getElementById('swipeHint').classList.add('hidden2');
      document.getElementById('challengeActions').classList.remove('hidden2');
    }, 300);
  }
  
  
  // Toggle do botão "CUMPRI"
  function toggleComplete() {
    completeSelected = !completeSelected;
    const btn = document.getElementById('completeBtn');
    
    if (completeSelected) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  }
  
  
  // Toggle do botão "BEBI"
  function toggleDrink() {
    drinkSelected = !drinkSelected;
    const btn = document.getElementById('drinkBtn');
    
    if (drinkSelected) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  }
  
  
  function processChecks() {
    if (checkboxesProcessed) return;
    checkboxesProcessed = true;
    
    let totalPoints = 0;
    let feedbackText = [];
    
    if (completeSelected) {
      totalPoints += currentChallenge.points;
      feedbackText.push(`+${currentChallenge.points} cumprir`);
    }
    if (drinkSelected) {
      totalPoints += currentChallenge.points;
      feedbackText.push(`+${currentChallenge.points} beber`);
    }
    
    scores[players[currentPlayerIndex]] += totalPoints;
    renderScores();
    
    if (feedbackText.length > 0) {
      showPointsFeedback(feedbackText.join(' + '), totalPoints > currentChallenge.points ? 'gold' : 'green');
    }
    
    if (checkWinner()) return;
    
    animateCardOut(totalPoints > currentChallenge.points ? 'right' : 'left');
  }
  
  
  function animateCardOut(direction) {
    document.getElementById('challengeActions').classList.add('hidden2');
    const cardEl = document.getElementById('card');
    cardEl.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    cardEl.style.transform = `translateX(${direction === 'right' ? 400 : -400}px) rotate(${direction === 'right' ? 30 : -30}deg)`;
    cardEl.style.opacity = '0';
    
    setTimeout(() => {
      cardEl.style.opacity = '1';
      nextPlayer();
    }, 500);
  }
  
  
  function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % numPlayers;
    setupNextCard();
  }
  
  
  function renderScores() {
    const scoresDiv = document.getElementById('scores');
    scoresDiv.innerHTML = 
      `<div style="flex: 100%; margin-bottom: 0.5em; font-size: 0.9em; opacity: 0.8;">
        Meta: ${victoryPoints} pts
      </div>` +
      players.map((p, i) => 
        `<div class="${i === currentPlayerIndex ? 'active' : ''}">${p}<br>${scores[p]}/${victoryPoints}</div>`
      ).join('');
  }
  
  
  function checkWinner() {
    for (let p of players) {
      if (scores[p] >= victoryPoints) {
        document.getElementById('winnerText').innerHTML = 
          `🎉 ${p} VENCEU! 🎉<br><span style="font-size:0.7em">${scores[p]} pts (${victoryPoints} para vitória)</span>`;
        document.getElementById('winner').classList.remove('hidden');
        return true;
      }
    }
    return false;
  }
  
  
  function showPointsFeedback(text, color) {
    const feedback = document.createElement('div');
    feedback.textContent = text;
    feedback.style.cssText = `
      position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%);
      font-size: 1.8em; font-weight: bold; z-index: 1000; pointer-events: none;
      color: ${color === 'green' ? '#4ecdc4' : color === 'gold' ? '#ffd700' : '#ff6b6b'};
      animation: pointsFly 2s ease-out forwards;
    `;
    document.body.appendChild(feedback);
    
    const style = document.createElement('style');
    style.textContent = `@keyframes pointsFly {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
      80% { transform: translate(-50%, -30%) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -100px) scale(1.5); opacity: 0; }
    }`;
    document.head.appendChild(style);
    
    setTimeout(() => {
      feedback.remove();
      style.remove();
    }, 2000);
  }
  