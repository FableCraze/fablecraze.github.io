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
      {"text": "Deixe alguém beijar suavemente o seu pescoço por 10s", "points": 3, "shots": 3},
      {"text": "Deixe um jogador passar gelo na sua barriga", "points": 2, "shots": 2},
      {"text": "Deixe outra pessoa massagear seus ombros por 30s", "points": 2, "shots": 2},
      {"text": "Deixe alguém sussurrar algo picante no seu ouvido", "points": 2, "shots": 2},
      {"text": "Deixe uma pessoa te vendar e acariciar o rosto por 15s", "points": 2, "shots": 2},
      {"text": "Deixe alguém te dar 3 tapinhas leves na bunda", "points": 3, "shots": 3},
      {"text": "Deixe outro jogador lamber o lóbulo da sua orelha", "points": 3, "shots": 3},
      {"text": "Deixe o grupo escolher quem pode te fazer cócegas nas costelas", "points": 1, "shots": 1},
      {"text": "Deixe alguém encostar os lábios na sua nuca por 10s", "points": 2, "shots": 2},
      {"text": "Deixe uma pessoa massagear suas coxas lentamente", "points": 3, "shots": 3},
      {"text": "Deixe alguém beijar sua palma da mão", "points": 1, "shots": 1},
      {"text": "Deixe uma pessoa lamber mel do seu pescoço", "points": 3, "shots": 3},
      {"text": "Deixe alguém morder seu lábio inferior de leve", "points": 3, "shots": 3},
      {"text": "Deixe o jogador da esquerda tocar sua barriga por 10s", "points": 2, "shots": 2},
      {"text": "Deixe uma pessoa te dar uma massagem nos pés", "points": 2, "shots": 2},
      {"text": "Deixe alguém erguer sua camisa até o peito", "points": 4, "shots": 4},
      {"text": "Deixe alguém beijar o seu pulso bem devagar", "points": 2, "shots": 2},
      {"text": "Deixe o grupo decidir quem pode dar um tapa leve na sua coxa", "points": 2, "shots": 2},
      {"text": "Deixe um jogador lamber seu pescoço por 10s", "points": 3, "shots": 3},
      {"text": "Escolha alguém para sentar no seu colo por 3 rodadas", "points": 3, "shots": 3},
      {"text": "Deixe outra pessoa beijar sua barriga por 10s", "points": 3, "shots": 3},
      {"text": "Deixe alguém tocar seus peitos ou peito por cima da roupa", "points": 4, "shots": 4},
      {"text": "Deixe outro jogador passar os dedos pelo seu cabelo", "points": 2, "shots": 2},
      {"text": "Deixe alguém te amarrar as mãos por 1 minuto", "points": 3, "shots": 3},
      {"text": "Deixe uma pessoa te segurar pela cintura por 10s", "points": 2, "shots": 2},
      {"text": "Deixe um jogador tocar sua nuca com beijos suaves", "points": 2, "shots": 2},
      {"text": "Deixe alguém beijar seu ombro lentamente", "points": 2, "shots": 2},
      {"text": "Deixe outro jogador lamber o seu dedo de forma provocante", "points": 2, "shots": 2},
      {"text": "Deixe alguém te dar um selinho de olhos fechados", "points": 2, "shots": 2},
      {"text": "Deixe o grupo escolher uma parte do corpo para alguém beijar", "points": 3, "shots": 3},
      {"text": "Deixe outra pessoa tirar uma peça pequena de roupa sua", "points": 4, "shots": 4},
      {"text": "Deixe alguém colocar chantilly no seu pescoço e lamber", "points": 4, "shots": 4},
      {"text": "Deixe um jogador massagear sua nuca e costas", "points": 2, "shots": 2},
      {"text": "Deixe o jogador da esquerda sussurrar uma fantasia no seu ouvido", "points": 2, "shots": 2},
      {"text": "Deixe outra pessoa te dar um beijo no peito por cima da roupa", "points": 4, "shots": 4},
      {"text": "Deixe alguém segurar sua mão e beijar o dorso", "points": 1, "shots": 1},
      {"text": "Deixe um jogador beijar sua testa", "points": 1, "shots": 1},
      {"text": "Deixe alguém passar gelo no seu pescoço", "points": 2, "shots": 2},
      {"text": "Deixe outra pessoa dar leves mordidinhas na sua orelha", "points": 3, "shots": 3},
      {"text": "Deixe o grupo escolher quem segura sua cintura por 30s", "points": 2, "shots": 2},
      {"text": "Deixe alguém massagear sua perna enquanto você fecha os olhos", "points": 3, "shots": 3},
      {"text": "Deixe outra pessoa beijar sua bochecha com intenção", "points": 1, "shots": 1},
      {"text": "Deixe alguém te fazer cócegas por 15s", "points": 1, "shots": 1},
      {"text": "Deixe um jogador encostar a testa na sua e ficar 10s assim", "points": 2, "shots": 2},
      {"text": "Deixe uma pessoa cheirar o seu pescoço lentamente", "points": 3, "shots": 3},
      {"text": "Deixe alguém dar uma mordidinha leve no seu ombro", "points": 2, "shots": 2},
      {"text": "Deixe outra pessoa beijar sua clavícula", "points": 3, "shots": 3},
      {"text": "Deixe alguém brincar com seus dedos das mãos", "points": 1, "shots": 1},
      {"text": "Deixe alguém olhar nos seus olhos por 15s sem falar", "points": 1, "shots": 1},
      {"text": "Dê um beijo lento no pescoço de alguém", "points": 3, "shots": 3},
      {"text": "Massageie as costas de quem está ao seu lado", "points": 2, "shots": 2},
      {"text": "Beije o pulso de outra pessoa bem devagar", "points": 2, "shots": 2},
      {"text": "Sussurre algo provocante para o jogador da esquerda", "points": 2, "shots": 2},
      {"text": "Dance no colo de alguém por 15s", "points": 3, "shots": 3},
      {"text": "Toque a nuca de um jogador com beijos leves", "points": 2, "shots": 2},
      {"text": "Passe a língua lentamente no dedo de alguém", "points": 2, "shots": 2},
      {"text": "Beije a barriga de uma pessoa do grupo", "points": 3, "shots": 3},
      {"text": "Mordisque o lábio de alguém que você escolher", "points": 2, "shots": 2},
      {"text": "Faça uma massagem nos pés de outro jogador", "points": 2, "shots": 2},
      {"text": "Lamba o pescoço de quem perder a próxima rodada", "points": 3, "shots": 3},
      {"text": "Beije o ombro de outro jogador por 5s", "points": 2, "shots": 2},
      {"text": "Dê um selinho em um jogador", "points": 2, "shots": 2},
      {"text": "Dê uma mordidinha leve na orelha de alguém", "points": 2, "shots": 2},
      {"text": "Sente no colo de alguém e encoste testa com testa por 10s", "points": 3, "shots": 3},
      {"text": "Passe seus dedos no braço de alguém de forma sedutora", "points": 2, "shots": 2},
      {"text": "Beije a palma da mão de outra pessoa", "points": 1, "shots": 1},
      {"text": "Dê três beijos rápidos na bochecha de um jogador", "points": 1, "shots": 1},
      {"text": "Beije o dorso da mão de alguém com paixão", "points": 1, "shots": 1},
      {"text": "Dê um tapa leve na bunda de alguém", "points": 3, "shots": 3},
      {"text": "Imite um gemido suave na orelha de alguém", "points": 2, "shots": 2},
      {"text": "Acaricie o cabelo de um jogador por 20s", "points": 1, "shots": 1},
      {"text": "Deixe alguém beijar seu peito por baixo da roupa por 10s", "points": 5, "shots": 5},
      {"text": "Diga a um jogador algo que faria com ele(a)", "points": 2, "shots": 2},
      {"text": "Faça um lap dance breve em um jogador", "points": 3, "shots": 3},
      {"text": "Dê um abraço demorado em alguém até o silêncio ficar estranho", "points": 1, "shots": 1},
      {"text": "Toque a ponta do nariz de alguém com um beijo leve", "points": 1, "shots": 1},
      {"text": "Ofereça sua mão para alguém beijar", "points": 1, "shots": 1},
      {"text": "Beije o pescoço de um jogador sem falar nada", "points": 3, "shots": 3},
      {"text": "Dê uma piscada e um sorriso provocante para alguém", "points": 1, "shots": 1},
      {"text": "Toque o rosto de outra pessoa com as pontas dos dedos", "points": 1, "shots": 1},
      {"text": "Encoste o nariz no pescoço de alguém e respire fundo", "points": 2, "shots": 2},
      {"text": "Diga algo realmente bonito para alguém olhando nos olhos", "points": 1, "shots": 1},
      {"text": "Faça cócegas em outra pessoa até ela rir", "points": 1, "shots": 1},
      {"text": "Sente no colo de alguém (de frente) sorria sem falar nada por 5s", "points": 3, "shots": 3},
      {"text": "Dance lentamente encarando alguém", "points": 2, "shots": 2},
      {"text": "Beije o queixo de uma pessoa", "points": 1, "shots": 1},
      {"text": "Apoie a cabeça no ombro de alguém por 10s", "points": 1, "shots": 1},
      {"text": "Coloque seu braço em volta da cintura de outra pessoa", "points": 2, "shots": 2},
      {"text": "Sussurre uma palavra proibida no ouvido de alguém", "points": 2, "shots": 2},
      {"text": "Ofereça seu pescoço para alguém aproximar o rosto", "points": 3, "shots": 3}
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
    
    document.getElementById('swipeHint').classList.remove('hidden');
    document.getElementById('challengeActions').classList.add('hidden');
    
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
      
      document.getElementById('swipeHint').classList.add('hidden');
      document.getElementById('challengeActions').classList.remove('hidden');
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
    document.getElementById('challengeActions').classList.add('hidden');
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
  