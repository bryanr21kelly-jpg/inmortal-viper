// Pong Game in JavaScript

// Set up canvas
const canvas = document.getElementById('pong');
const context = canvas.getContext('2d');

// Create the pong paddle
const paddleWidth = 10, paddleHeight = 100;
const player = { x: 0, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: 'WHITE', score: 0 };
const computer = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: 'WHITE', score: 0 };

// Create the pong ball
const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, speed: 4, velocityX: 4, velocityY: 4, color: 'WHITE' };

// Draw the rectangular paddle
function drawRect(x, y, width, height, color) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
}

// Draw the circle
function drawArc(x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, false);
    context.closePath();
    context.fill();
}

// Draw the net
function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(canvas.width / 2 - 1, i, 2, 10, 'WHITE');
    }
}

// Draw everything
function draw() {
    // Clear the canvas
    drawRect(0, 0, canvas.width, canvas.height, 'BLACK');
    drawNet();
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(computer.x, computer.y, computer.width, computer.height, computer.color);
    drawArc(ball.x, ball.y, ball.radius, ball.color);
}

// Control the paddle
document.addEventListener('mousemove', (event) => {
    let rect = canvas.getBoundingClientRect();
    player.y = event.clientY - rect.top - player.height / 2;
});

// Reset the ball
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 4;
    ball.velocityX = -ball.velocityX;
}

// Update the game logic
function update() {
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Player paddle interaction
    if (ball.x + ball.radius > player.x && ball.y > player.y && ball.y < player.y + player.height) {
        ball.velocityX = -ball.velocityX;
    }
    // Computer paddle interaction
    if (ball.x - ball.radius < computer.x + computer.width && ball.y > computer.y && ball.y < computer.y + computer.height) {
        ball.velocityX = -ball.velocityX;
    }

    // Ball collision with top and bottom
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.velocityY = -ball.velocityY;
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        computer.score++;
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        player.score++;
        resetBall();
    }
}

// Main game loop
function game() {
    draw();
    update();
    requestAnimationFrame(game);
}

game();