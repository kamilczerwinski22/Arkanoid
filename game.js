// Arcanoid type game by kamilczerwinski22


/// VARIABLES 
// Make canvas
const cvs = document.getElementById("arcanoid_canvas");
const cvs_ctx = cvs.getContext("2d");
cvs_ctx.lineWidth = 2;

// Ending screen div`s
const game_over = document.getElementById("game_over");
const game_win = document.getElementById("win");
const restart = document.getElementById("play_again");
const game_score = document.getElementById("score");
const game_start = document.getElementById("start");
const game_progress = document.getElementById("game_progress");

// Variables and consts
const PADDLE_WIDTH = 100;
const PADDLE_BOTTOM_MARGIN = 50;
const PADDLE_HEIGHT = 5;
const BALL_RADIUS = 8;
const SCORE_INC = 10;
const WIN_LVL = 3;
let ball_speed = 6;
let current_game_lifes = 3;
let current_game_score = 0;
let current_game_level = 1;
let hot_brick_counter = 0;
let game_in_progress = false;
let game_is_over = false;


// PADDLE AND BALL
// Make paddle
const paddle = {
    pos_x: cvs.width/2 - PADDLE_WIDTH/2,  // starting x
    pos_y: cvs.height - PADDLE_HEIGHT - PADDLE_BOTTOM_MARGIN,  // starting y
    height: PADDLE_HEIGHT,
    width: PADDLE_WIDTH,
    delta_x: 7  // amout of pixels paddle will move when pressed 
}

const ball = {
    pos_x: cvs.width/2,  // starting x
    pos_y: paddle.pos_y - BALL_RADIUS,  // ball starts at paddle 
    speed: ball_speed, 
    radius: BALL_RADIUS,
    delta_x: -(ball_speed * 0.75),  // ball movement x (x++ - to the right; x-- - to the left)
    delta_y: -(ball_speed * 0.75),  // ball movement y (y++ - to the bottom; y-- to the top) 
}

const brick = {  
    width : 60,
    height : 25,
    fill_color : "#98b000",
    stroke_color : "#212F3D"
}

const hot_brick = {
    width : 60,
    height : 25,
    fill_color : "#A21D00",
    stroke_color : "#4A0D00"
}

const obstacle = {
    fill_color : "#3E0303",
    stroke_color : "#212F3D"
}


// GAME LOGIC
// Drawing
function draw_paddle(){
    cvs_ctx.fillStyle = "#212F3D";
    cvs_ctx.fillRect(paddle.pos_x, paddle.pos_y, paddle.width, paddle.height);
    cvs_ctx.strokeStyle = "#7B241C";
    cvs_ctx.strokeRect(paddle.pos_x, paddle.pos_y, paddle.width, paddle.height);
}

function draw_ball(){
    cvs_ctx.beginPath();  // used to draw circle, creating new path, which is not subpath (so everything after `cvs_ctx.` will be applied to ball, not full canvas)
    cvs_ctx.arc(ball.pos_x, ball.pos_y, ball.radius, 0, Math.PI * 2);
    cvs_ctx.fillStyle = "#98b000";
    cvs_ctx.fill();
    cvs_ctx.strokeStyle = "#212F3D";
    cvs_ctx.stroke();
    cvs_ctx.closePath();  // closing current arc
}

function draw_bricks(lvl){
    for (let idx = 0; idx < lvl.length; idx += 1){      
        let current_brick = lvl[idx];
        if (current_brick.status){
            cvs_ctx.fillStyle = brick.fill_color;
            cvs_ctx.fillRect(current_brick.pos_x, current_brick.pos_y, brick.width, brick.height);
            cvs_ctx.strokeStyle = brick.stroke_color;
            cvs_ctx.strokeRect(current_brick.pos_x, current_brick.pos_y, brick.width, brick.height);
        }
    }
}

function draw_hot_bricks(lvl){
    for (let idx = 0; idx < lvl.length; idx += 1){      
        let current_brick = lvl[idx];
        if (current_brick.status){
            cvs_ctx.fillStyle = hot_brick.fill_color;
            cvs_ctx.fillRect(current_brick.pos_x, current_brick.pos_y, hot_brick.width, hot_brick.height);
            cvs_ctx.strokeStyle = hot_brick.stroke_color;
            cvs_ctx.strokeRect(current_brick.pos_x, current_brick.pos_y, hot_brick.width, hot_brick.height);
        }
    }
}

// Paddle and ball movement
let left_arrow = false;
let right_arrow = false;

// pressing key
document.addEventListener("keydown", function(event){
    if (event.code == "ArrowLeft"){
        left_arrow = true;
    } else if (event.code == "ArrowRight"){
        right_arrow = true;
    }
 });

// releasingkey
document.addEventListener("keyup", function(event){
    if (event.code == "ArrowLeft"){
        left_arrow = false;
    } else if (event.code == "ArrowRight"){
        right_arrow = false;
    }
 });

// moving paddle
function move_paddle(){
    if(right_arrow && paddle.pos_x + paddle.width < cvs.width){  // don't let paddle go beyond canvas
        paddle.pos_x += paddle.delta_x;
    }else if(left_arrow && paddle.pos_x > 0){
        paddle.pos_x -= paddle.delta_x;
    }
}

// moving ball
function move_ball(){
    ball.pos_x += ball.delta_x; 
    ball.pos_y += ball.delta_y; 
}

// Collisions
function wall_collision(){
    // right wall
    if (ball.pos_x + ball.radius > cvs.width){
        ball.delta_x = -ball.delta_x;
    } 
    // top wall
    if (ball.pos_y - ball.radius < 0){
        ball.delta_y = -ball.delta_y;
    }
    // left wall
    if (ball.pos_x - ball.radius < 0){
        ball.delta_x = -ball.delta_x;
    }
    // bottom wall (lose)
    if (ball.pos_y + ball.radius > cvs.height){
        current_game_lifes--;
        reset_positions();
    }
}

function paddle_collision(){
    if ((ball.pos_y + ball.radius > paddle.pos_y) &&
        (ball.pos_x > paddle.pos_x) &&
        (ball.pos_x < paddle.pos_x + paddle.width &&
        (paddle.pos_y < paddle.pos_y + paddle.height))){
            let collide_point = (ball.pos_x - (paddle.pos_x + paddle.width/2)) / (paddle.width/2);  // collide point in respect of paddle middle point and normalized to [-1, 1]
            let angle = collide_point * (Math.PI/2.4);  // [-1, 1] * 60 degrees
            ball.delta_x = ball.speed * Math.sin(angle);  // new delta_x depending on angle and speed
            ball.delta_y = - ball.speed * Math.cos(angle);  // new delta_y depending on angle and speed. Multiply by -1 for correct delta_y.
                                                           // It needs to be <0 for going up, because top of the canvas is 0, and bottom is >0 (opposite to classic way)
        }
}

function brick_collision(lvl){
    for (let idx = 0; idx < lvl.length; idx += 1){  
        let current_brick = lvl[idx];
        // if brick isn't broke make hitbox, otherwise go through it
        // console.log(current_brick.status);
        if (current_brick.status){
            // check hitbox
            if (ball.pos_x + ball.radius > current_brick.pos_x &&  // brick left side - ball right side
                ball.pos_x - ball.radius < current_brick.pos_x + brick.width &&  // brick right side - ball left side
                ball.pos_y + ball.radius > current_brick.pos_y &&  // brick top side - ball bottom side
                ball.pos_y - ball.radius < current_brick.pos_y + brick.height){  // brick bottom side - ball top side
                    current_brick.status = false;
                    ball.delta_y = -ball.delta_y;
                    current_game_score += SCORE_INC;
            }
        }
    }
}

function hot_brick_collision(lvl){
    for (let idx = 0; idx < lvl.length; idx += 1){  
        let current_brick = lvl[idx];
        // if brick isn't broke make hitbox, otherwise go through it
        // console.log(current_brick.status);
        if (current_brick.status){
            // check hitbox
            if (ball.pos_x + ball.radius > current_brick.pos_x &&  // brick left side - ball right side
                ball.pos_x - ball.radius < current_brick.pos_x + hot_brick.width &&  // brick right side - ball left side
                ball.pos_y + ball.radius > current_brick.pos_y &&  // brick top side - ball bottom side
                ball.pos_y - ball.radius < current_brick.pos_y + hot_brick.height){  // brick bottom side - ball top side
                    current_brick.status = false;
                    ball.delta_y = -ball.delta_y;
                    current_game_score -= current_game_level * SCORE_INC;
            }
        }
    }
}


function reset_positions(){
    // start position same as before
    paddle.pos_x = cvs.width/2 - PADDLE_WIDTH/2;
    paddle.pos_y =  cvs.height - PADDLE_HEIGHT - PADDLE_BOTTOM_MARGIN;
    ball.pos_x = cvs.width/2;
    ball.pos_y = paddle.pos_y - BALL_RADIUS;
    ball.delta_y = -(ball.speed * 0.75);  // going up same as before
    ball.delta_x = Math.floor(Math.random() * ((ball.speed * 0.75) - (-ball.speed * 0.75) + 1)) + (-ball.speed * 0.75); // random between [-3, 3]
    if (!check_lose() && !check_win()){
        game_in_progress = false;
        game_progress.style.display = "block";
    }
}


//........................................................................
//.LLLL.......EEEEEEEEEEEEEVV....VVVVVVEEEEEEEEEE.ELLL........SSSSSSS.....
//.LLLL.......EEEEEEEEEEEEEVV....VVVV.VEEEEEEEEEE.ELLL.......LSSSSSSSS....
//.LLLL.......EEEEEEEEEEEEEVV....VVVV.VEEEEEEEEEE.ELLL.......LSSSSSSSSS...
//.LLLL.......EEEE.......EEVVV..VVVV..VEEE........ELLL......LLSSS..SSSS...
//.LLLL.......EEEE........EVVV..VVVV..VEEE........ELLL......LLSSS.........
//.LLLL.......EEEEEEEEEE..EVVV..VVVV..VEEEEEEEEE..ELLL.......LSSSSSS......
//.LLLL.......EEEEEEEEEE..EVVVVVVVV...VEEEEEEEEE..ELLL........SSSSSSSSS...
//.LLLL.......EEEEEEEEEE...VVVVVVVV...VEEEEEEEEE..ELLL..........SSSSSSS...
//.LLLL.......EEEE.........VVVVVVVV...VEEE........ELLL.............SSSSS..
//.LLLL.......EEEE.........VVVVVVV....VEEE........ELLL......LLSS....SSSS..
//.LLLLLLLLLL.EEEEEEEEEEE...VVVVVV....VEEEEEEEEEE.ELLLLLLLLLLLSSSSSSSSSS..
//.LLLLLLLLLL.EEEEEEEEEEE...VVVVVV....VEEEEEEEEEE.ELLLLLLLLL.LSSSSSSSSS...
//.LLLLLLLLLL.EEEEEEEEEEE...VVVVV.....VEEEEEEEEEE.ELLLLLLLLL..SSSSSSSS....
//........................................................................


// BRICKS 
// Create array of arrays, where each internal array is current level bricks (lvl 1 == index 0)
let brick_lvls = create_bricks_levels();
// console.log(brick_lvls);
function create_bricks_levels(){
    let levels = [lvl_1(), lvl_2(), lvl_3(), lvl_4()];
    function lvl_1(){
        // 14 bricks, 7 per row; brick = 60px * 7; spaces between = 22.5px * 6; sum = 600px (canvas length)
        let current_lvl = [];  // main array for all current lvl brick
        for (let row = 0; row < 2; row += 1){
            for (let col = 0; col < 7; col += 1){
                let current_brick = {
                    pos_x: col * (brick.width + 22.5) + 22.5, // pos in col
                    pos_y: row * (brick.height + 20) + 20 + 40,  // pos in row
                    status: true  // starting status true, as brick is not broken
                }
                current_lvl.push(current_brick);
            }
        }
        return current_lvl;
    }
    function lvl_2(){
        let current_lvl = [];  // main array for all current lvl brick
        for (let row = 0; row < 3; row += 1){
            for (let col = 0; col < 7; col += 1){
                let current_brick = {
                    pos_x: col * (brick.width + 22.5) + 22.5, // pos in col
                    pos_y: row * (brick.height + 20) + 20 + 40,  // pos in row
                    status: true  // starting status true, as brick is not broken
                }
                current_lvl.push(current_brick);
            }
        }
        return current_lvl;
    }

    function lvl_3(){
        let current_lvl = [];  // main array for all current lvl brick
        for (let row = 0; row < 3; row += 1){
            for (let col = 0; col < 7; col += 1){
                let current_brick = {
                    pos_x: col * (brick.width + 22.5) + 22.5, // pos in col
                    pos_y: row * (brick.height + 20) + 20 + 40,  // pos in row
                    status: true  // starting status true, as brick is not broken
                }
                current_lvl.push(current_brick);
            }
        }
        current_lvl.splice(0, 1);  // delete bricks at the corner
        current_lvl.splice(5, 1);
        return current_lvl;
    }

    function lvl_4(){
        let current_lvl = [];  // main array for all current lvl brick
        for (let row = 1; row < 4; row += 1){
            for (let col = 0; col < 7; col += 1){
                let current_brick = {
                    pos_x: col * (brick.width + 22.5) + 22.5, // pos in col
                    pos_y: row * (brick.height + 20) + 20 + 40,  // pos in row
                    status: true  // starting status true, as brick is not broken
                }
                current_lvl.push(current_brick);
            }
        }
        return current_lvl;
    }
    return levels;
}

// Create array of arrays, where each internal array is current level hot spots (lvl 1 == index 0). If you hit hotspot, you lose points. Hit it 3 times and you lose a life
let hot_bricks_lvls = create_hot_bricks_levels();
// console.log(hot_bricks_lvls);
function create_hot_bricks_levels(){
    let levels = [[], [], lvl_3(), lvl_4()];
    function lvl_3(){
        let current_lvl = [];  // main array for all current lvl brick
        let hot_brick_1 = {
            pos_x: 22.5, 
            pos_y: 60,
            status: true
        }
        let hot_brick_2 = {
            pos_x: 517.5, 
            pos_y: 60,
            status: true
        }
        current_lvl.push(hot_brick_1);
        current_lvl.push(hot_brick_2);
        return current_lvl;
    }
    function lvl_4(){
        let current_lvl = [];  // main array for all current lvl brick
        for (let row = 0; row < 1; row += 1){
            for (let col = 0; col < 7; col += 1){
                let current_brick = {
                    pos_x: col * (brick.width + 22.5) + 22.5, // pos in col
                    pos_y: row * (brick.height + 20) + 20 + 40,  // pos in row
                    status: true  // starting status true, as brick is not broken
                }
                current_lvl.push(current_brick);
            }
        }
        return current_lvl;
    }
    return levels;
}


// /LEVELS

function level_checker(lvl){
    let lvl_done = true;
    // check if all the bricks are broken
    for (let idx = 0; idx < lvl.length; idx += 1){
            lvl_done = lvl_done && !lvl[idx].status;
    }
    // if all bricks are destroyed, lvl up
    if (lvl_done) {
        ball.speed += 1.5;
        current_game_level += 1;
        hot_brick_counter = 0;
        reset_positions();
    }
}


// GAME STATS
function show_game_score(score, lifes, level){
    
    let text_score = "SCORE: " + score;
    let text_live = "LIFES: " + lifes;
    let text_lvl = "LEVEL: " + level;
    cvs_ctx.font = "18px Arial";
    cvs_ctx.fillStyle = "#ffffff";
    cvs_ctx.strokeStyle = "#000000";
    cvs_ctx.lineWidth = 2.5;
    // Stroke first
    // score
    cvs_ctx.textAlign = "left";
    cvs_ctx.strokeText(text_score, 15, 25);
    cvs_ctx.fillText(text_score, 15, 25);  
    // level 
    cvs_ctx.textAlign = "center";
    cvs_ctx.strokeText(text_lvl, cvs.width/2, 25);
    cvs_ctx.fillText(text_lvl, cvs.width/2, 25);
    // lives
    cvs_ctx.textAlign = "right";
    cvs_ctx.strokeText(text_live, cvs.width - 15, 25);
    cvs_ctx.fillText(text_live, cvs.width - 15, 25);
}

// 

function check_win(){
    return (current_game_level == WIN_LVL + 1);
}

function check_lose(){
    return (current_game_lifes <= 0);
}

// Make final score
function make_final_score(){
    document.getElementById("score").innerHTML = "Score: " + current_game_score;
    game_score.style.display = "block";
}

// Play again
function play_again(){
    restart.style.display = "block";  // show play again
    restart.addEventListener("click", function(){
        location.reload();  // reload the page if user wants to play again  
    });
}

// Darken the canvas
function darken_canvas(){
    cvs_ctx.globalAlpha = 0.85;
    cvs_ctx.fillStyle = "#2b2b2b";
    cvs_ctx.fillRect(0, 0, cvs.width, cvs.height);
}


// Game win and over
function show_game_results(status){
    // darken the canvas
    darken_canvas();
    game_is_over = true;
    status.style.display = "block";  // show the div
    make_final_score();
    play_again();
}

// Game start
function start_game_screen(){
    darken_canvas();
    game_start.addEventListener("click", function(){
        game_start.style.display = "none";  // don't show the div anymore
        game_progress.style.display = "block";
        main_loop();
    })
    
}


// MAIN GAME LOOP
function game_draw(){
    draw_paddle();
    show_game_score(current_game_score, current_game_lifes, current_game_level);
    draw_ball();
    draw_bricks(brick_lvls[current_game_level - 1]); // draw current lvl bricks (lvl 1 = index 0)
    draw_hot_bricks(hot_bricks_lvls[current_game_level - 1]);  // -||-
    // draw_obstacles(obstacles_lvls[current_game_level - 1]);  // -||-
    // console.log("detla y = " + ball.delta_y);
    // console.log("detla x = " + ball.delta_x);
}


function game_update(){
        move_ball();
        move_paddle();
        paddle_collision();
        // obstacle_collision(obstacles_lvls[current_game_level - 1]);  // -||-
        brick_collision(brick_lvls[current_game_level - 1]);  // use current lvl bricks (lvl 1 = index 0)
        hot_brick_collision(hot_bricks_lvls[current_game_level - 1]);  // -||-
        wall_collision();
        level_checker(brick_lvls[current_game_level - 1]);
}


function main_loop(){
    
    // game lose
    

    // clear canvas each loop
    cvs_ctx.clearRect(0, 0, cvs.width, cvs.height);
    game_draw();
    if (game_in_progress){
        game_update();
    } else {
        darken_canvas();
        document.addEventListener("keydown", function(event){
            // console.log(event); 
            if (event.code == "Enter"){  
                game_in_progress = true;
                game_progress.style.display = "none";
            }
        });
    }

    let req_id = requestAnimationFrame(main_loop); // better than interval
    if (check_lose()){
        cancelAnimationFrame(req_id);
        show_game_results(game_over);
        
    }

    // game win
    if (check_win()){
        cancelAnimationFrame(req_id);
        show_game_results(game_win);
    }
}
start_game_screen();

// setInterval(main_loop, 100);



