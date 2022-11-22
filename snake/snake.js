const ROWS = 30
const COLS = 30

const canvas = document.getElementById("canvas")
const gameOverAlert = document.getElementById("gameOver")
const scoreElement = document.getElementById("scoreNum")

let pixels
let snake
let gameInterval
let foodKey
let score 
let speed
let boostSpeed = false
let boostTimeout = null
let directionQueue
let currentDirection

function toKey([x, y]) {
  return `${x}-${y}`
}

function fromKey(key) {
  return key.split('-').map(Number)
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function clearPixels() {
  for ( let y = 0; y < ROWS; y++ ) {
    for ( let x = 0; x < COLS; x++ ) {
      let pixel = pixels.get(toKey([x,y]))
      pixel.className = 'pixel'
    }
  }
}

function initializeCanvas() {
  pixels = new Map()
  document.body.style.setProperty('--rows-num', ROWS)
  document.body.style.setProperty('--cols-num', COLS)
  
  for ( let y = 0; y < ROWS; y++ ) {
    for ( let x = 0; x < COLS; x++ ) {
      let pixel = document.createElement('div')
      pixel.className = 'pixel'
      
      canvas.appendChild(pixel);
      pixels.set(toKey([x, y]), pixel)
    }
  }
}

function drawSnake() {
  for( snakePixelKey of snake ){
    let pixel = pixels.get(snakePixelKey)
    pixel.className = 'pixel snake'
  }
  let pixel = pixels.get(snakePixelKey)
  pixel.className = 'pixel snake head'
}

function gameOver() {
  clearTimeout(gameInterval)
  gameInterval = null
  gameOverAlert.style.display = 'block'
}

function generateFood() {
  foodKey = null
  while( !foodKey || snake.indexOf(foodKey ) >= 0){
    let foodXY = [
      randomIntFromInterval(0, COLS - 1),
      randomIntFromInterval(0, ROWS - 1)
    ]
    foodKey = toKey(foodXY);
  }
  let pixel = pixels.get(foodKey)
  pixel.className = 'pixel food'
}

function addScore() {
  if ( score === null ){
    score = 0
  }
  else{
    score += 15
  }
  
  if ( speed > 10 )
    speed *= 0.9

  scoreElement.innerText = score
}

function getNextDirection(){
  while ( directionQueue && directionQueue.length > 0 ){
    let nextDirection = directionQueue.shift()
    if ( currentDirection.indexOf(0) !== nextDirection.indexOf(0) ){
      currentDirection = nextDirection
      break
    }
  }
}

function step() {
  let [headX, headY] = fromKey(snake[snake.length - 1])

  getNextDirection()

  let newHeadX = headX + currentDirection[0]
  let newHeadY = headY + currentDirection[1]
  let newHeadKey = toKey([newHeadX, newHeadY])

  if ( 
    newHeadX < 0 || newHeadX >= COLS 
    || 
    newHeadY < 0 || newHeadY >= ROWS
    ||
    snake.indexOf(newHeadKey) > -1
  ){
    return gameOver();
  }
  
  if ( foodKey === newHeadKey ) {
    generateFood()
    addScore()
  }
  else{
    let removedPixelKey = snake.shift()
    let removedPixel = pixels.get(removedPixelKey)
    removedPixel.className = 'pixel'
  }

  snake.push(newHeadKey)
  drawSnake()
  next()
}

function next(){
  gameInterval = setTimeout(step, boostSpeed ? 20 : speed)
}

function start() {
  if ( gameInterval )
    clearTimeout(gameInterval)
  
  if (!pixels)
    initializeCanvas()
  else{
    clearPixels()
  }

  score = null
  currentDirection = [0,1]
  directionQueue = []
  gameOverAlert.style.display = 'none'
  speed = 100
  boostSpeed = false

  snake = [
    toKey([0,0]),
    toKey([1,0]),
    toKey([2,0]),
    toKey([3,0]),
    toKey([4,0]),
  ]

  drawSnake()
  generateFood()
  addScore()

  next()
}

// начать заново
gameOverAlert.onclick = (e) => {
  if ( !gameInterval )
    start()
}

// управление с клавиатуры
document.onkeydown = (e) => {
  if ( boostTimeout )
    clearTimeout(boostTimeout)
  
  switch (e.key){
    case 'ArrowUp':
    case 'w':
      directionQueue.push([0,-1])
      break;
    case 'ArrowDown':
    case 's':
      directionQueue.push([0,1])
      break;
    case 'ArrowRight':
    case 'd':
      directionQueue.push([1,0])
      break;
    case 'ArrowLeft':
    case 'a':
      directionQueue.push([-1,0])
      break;
    case 'R':
    case 'r':
      start()
      return
      // break;
  }

  boostSpeed = true
}

document.onkeyup = (e) => {
  if ( boostTimeout )
    clearTimeout(boostTimeout)
  boostSpeed = false
}

// управление с телефона
let touchRef = null
const touchOffset = 20
let moveTimeout = null

document.ontouchstart = (e) => {
  const touch = e.touches[0]
  touchRef = [touch.pageX, touch.pageY]
}

document.ontouchmove = (e) => {
  e.preventDefault();

  const touch = e.touches[0]
  const delta = [touch.pageX - touchRef[0], touch.pageY - touchRef[1]]

  if ( Math.max(Math.abs(delta[0]), Math.abs(delta[1])) < touchOffset )
    return
  
  touchRef = [touch.pageX, touch.pageY]

  clearTimeout(moveTimeout)
  moveTimeout = setTimeout( () => {
    let direction = null
    // Side
    if ( Math.abs(delta[0]) > Math.abs(delta[1]) ){
      direction = [Math.sign(delta[0]),0]
    }
    else {
      direction = [0, Math.sign(delta[1])]
    }

    if ( JSON.stringify(directionQueue[directionQueue.length - 1]) === JSON.stringify(direction) )
      return
    
    directionQueue.push(direction)
  }, 20)
}

start()
