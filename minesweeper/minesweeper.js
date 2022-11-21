// количество строк
const ROWS = 10
// количество колонок
const COLS = 10

// сложность
const COMPLEXITY = 0.20
// считаем количество бомб
let bombsCount = Math.ceil( ROWS * COLS * COMPLEXITY )

const gameElement = document.getElementById("game");
const fieldElement = document.getElementById("field");
const bombsLeftElement = document.getElementById("bombsLeft");
const faceElement = document.getElementById("face");
const timerElement = document.getElementById("timer");

const restartButton = document.getElementById("restart");

let revealedBombKey
let timer
let timerInterval

// MAPS
let map // тут хранятся адреса ячеек с бомбами либо цифрами
let cells // DOM элементы ячеек

// SETS
let revealedKeys
let flaggedKeys

function toKey([r, c]) {
  return `${r}-${c}`;
}

function fromKey(key) {
  return key.split('-').map(Number);
}

// адреса ячеек вокруг
function getNeighbours (key) {
  let [r, c] = fromKey(key);
  return [
    [r - 1, c - 1],
    [r - 1, c],
    [r - 1, c + 1],
    [r, c - 1],
    [r, c + 1],
    [r + 1, c - 1],
    [r + 1, c],
    [r + 1, c + 1],
  ].filter( ([i,j]) => {
    if ( i < 0 || j < 0){
      return false
    }
    if ( i >= ROWS || j >= COLS ){
      return false
    }
    return true
  }).map(toKey)
}

// создать бомбы
function generateBombs() {
  let allKeys = []
  // создаем адреса всех ячеек
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let key = toKey([r, c])
      allKeys.push(key);
    }
  }
  // перемешиваем адреса ячеек
  allKeys.sort(() => {
    return Math.random() > 0.5 ? 1 : -1;
  })
  // берем нужное количество бомб
  return allKeys.slice(0, bombsCount);
}

// структура ячеек, адрес 'ROW-COL', (ячейки без информации не храним) 
/*
{
   "0-0": 'bomb',
   "0-1": 1,
    ...
   "2-4": 3 // - количество бомб вокруг
}
*/

// создать карту
function generateMap() {
  let bombs = generateBombs()
  map = new Map()

  function incrementBombsAround(key){
    let value = map.get(key);
    if ( !value ){
      map.set(key, 1)
    }
    else{
      map.set(key, value + 1)
    }
  }
  
  for( let bombKey of bombs ) {
    map.set(bombKey, 'bomb')
    let neights = getNeighbours(bombKey)

    for (neightbourKey of neights){
      if (!bombs.includes(neightbourKey)){
        incrementBombsAround(neightbourKey)
      }
    }
  }
}

function renderCell(key) {
  let value = map.get(key) // bomb || 1|2|3...
  let isRevealed = revealedKeys.has(key)
  let cell = cells.get(key)

  cell.disabled = isRevealed || revealedBombKey === key
  cell.innerText = ''
  cell.style.background = ''
  cell.style.color = 'inherit'

  if ( revealedBombKey === key )
    cell.style.background = 'red'
  
  if ( value === 'bomb' && revealedBombKey !== null ){
    cell.innerText = '💣'
  }
  else if( isRevealed && value > 0 ){
    cell.innerText = value

    if ( value === 1 )
      cell.style.color = 'blue'
    if ( value === 2 )
      cell.style.color = 'green'
    if ( value === 3 )
      cell.style.color = 'red'
    if ( value >= 4 )
      cell.style.color = 'purple'
  }
  else if ( flaggedKeys.has(key) ){
    cell.innerText = '🚩'
  }
}

// обновить поле
function updateGame() {
  // сколько бомб осталось пометить
  bombsLeftElement.innerText = (bombsCount - flaggedKeys.size)
  
  const isWon = !revealedBombKey && (bombsCount + revealedKeys.size) === COLS * ROWS
  
  if ( revealedBombKey ) {
    faceElement.innerText = '😵'
    // показываем где были бомбы
    map.forEach( (v,k) => renderCell(k));
  }
  else if (isWon)
    faceElement.innerText = '🥳'
  else
    faceElement.innerText = '🤨'
  
  if ( revealedBombKey || isWon) {
    // конец игры
    clearInterval(timerInterval)
    restartButton.style.display = 'block'
  }
}

// поставить флажок
function toggleFlagCell(key) {
  if ( flaggedKeys.has(key) ){
    flaggedKeys.delete(key)
  }
  else {
    flaggedKeys.add(key)
  }
  renderCell(key)
  updateGame()
}

// открыть ячейку
function revealCell(key) {
  if (map.get(key) === 'bomb')
    revealedBombKey = key
  else {
    propagateReveals(key)
  }

  // запускаем отсчет игры
  if ( !timerInterval ){
    timerInterval = setInterval(() => {
      timer++
      timerElement.innerText = timer
    }, 1000)
  }
  
  updateGame()
}

// открываем пустые ячейки
function propagateReveals(key) {
  if ( flaggedKeys.has(key) )
    flaggedKeys.delete(key)
  
  if ( revealedKeys.has(key) )
    return
  
  revealedKeys.add(key)
  renderCell(key)

  const isEmpty = !map.get(key)
  if ( !isEmpty )
    return

  // если нет бомб вокруг, то открываем все соседние ячейки без бомб
  for( let neightbourKey of getNeighbours(key) ){
    if ( map.get(neightbourKey) !== 'bomb' ){
      propagateReveals(neightbourKey)
    }
  }
}

// события нажатия на ячейку
function addCellEvents(key, cell) {
  let clickTimer = null;

  const flagCell = () => {
    clickTimer = null;
    clearTimeout(clickTimer);
    if ( revealedBombKey )
      return
    toggleFlagCell(key);
  }

  const onClickStart = () => {
    if ( revealedBombKey || clickTimer )
      return
    
    if ( !flaggedKeys.has(key) )
      faceElement.innerText = '😲'
    // таймер нажатия, чтобы поставить флажок
    clickTimer = setTimeout(flagCell, 500);
  }

  const onClickEnd = () => {
    if ( revealedBombKey )
      return
    
    faceElement.innerText = '🤨'
    if ( !clickTimer )
      return
    
    clearTimeout(clickTimer);
    
    if ( !flaggedKeys.has(key) )
      revealCell(key);
  }

  cell.onpointerdown = onClickStart
  cell.onpointerup = onClickEnd
  cell.onpointerleave = (e) => {
    clearTimeout(clickTimer);
    clickTimer = null
  }
  cell.oncontextmenu = (e) => {
    e.preventDefault();
    flagCell();
  }
}

// создать ячейки поля
function createCells() {
  document.body.style.setProperty('--rows-num', ROWS);
  document.body.style.setProperty('--cols-num', COLS);
  
  cells = new Map();

  for ( let r = 0; r < ROWS; r++ ) {
    for ( let c = 0; c < COLS; c++ ) {
      let cell = document.createElement('button')
      let key = toKey([r, c]);
      
      addCellEvents(key, cell);
      
      fieldElement.appendChild(cell);
      cells.set(key, cell);
    }
  }
}

// начать игру
function startGame() {
  revealedBombKey = null;
  revealedKeys = new Set();
  flaggedKeys = new Set();
  timer = 0
  restartButton.style.display = 'none'

  generateMap()

  if ( !cells ){
    createCells()
  }
  else {
    // чистим все ячейки
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        let key = toKey([r, c])
        renderCell(key)
      }
    }
  }
  updateGame()

  if ( timerInterval )
    clearInterval(timerInterval)
  
  timerInterval = null
  timerElement.innerText = timer
}

startGame();