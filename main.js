// == Global Values == \\
//Bouncing bullets
const bullets = [];

// constants \\
const ROW = 10; 		// total rows in maze
const COLUMN = 15;		// total columns in maze
const MAX_BULLETS = 3;		// total active bullets cap for normal bullets
const TANK_LENGTH = 24;	// size of the tank length
const TANK_WIDTH = 20;		// size of the tank width

const DEBUG = false;
const NORM_TILE_SIZE = 80;
function fitCanvasToScreen(canvas, maxWidth, maxHeight) {
	const mazeWidth = COLUMN * NORM_TILE_SIZE;
	const mazeHeight = ROW * NORM_TILE_SIZE;

	// Calculate scale to fit screen
	const scaleX = maxWidth / mazeWidth;
	const scaleY = maxHeight / mazeHeight;
	const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1x

	const finalSize = NORM_TILE_SIZE * scale;
	const width = COLUMN * finalSize;
	const height = ROW * finalSize;
	
	canvas.width = width+5;
	canvas.height = height+5;
	canvas.style.width = width + 'px';
	canvas.style.height = height + 'px';
   
	return finalSize; // Return actual tile size used
}
const TILE_SIZE = fitCanvasToScreen(document.getElementById('gameCanvas'), window.innerWidth - 40, window.innerHeight - 40);		// size of the maze grid in pixles

// == Classes == \\
class Vector2{
	constructor(x=0, y=0){
		this.x = x;
		this.y = y;
	}
	add(v){return new Vector2(this.x + v.x, this.y + v.y)}
	subtract(v){return new Vector2(this.x - v.x, this.y - v.y)}
	scale(s){return new Vector2(this.x * s, this.y * s)}
	rotate(angle){
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return new Vector2(
			this.x * cos - this.y * sin,
			this.x * sin + this.y * cos
		);
	}
	length(){
		return Math.hypot(this.x, this.y);
	}
	normalize(){
		const len = this.length();
		return len === 0 ? new Vector2() : new Vector2(this.x /  len, this.y / len); 
	}
	addNums(x, y){
		this.x += x;
		this.y += y;
	}
	isValid(){return !isNaN(this.x) && !isNaN(this.y)}
	tileToWall(dir_name){
		let dir_vector2 = T2WALL[dir_name];
		return new Vector2(
			this.x + dir_vector2.x,
			this.y * 2 + 1  + dir_vector2.y
		);
	}
}
const T2WALL = {
	UP: new Vector2(0,-1), 
	DOWN: new Vector2(0,1), 
	LEFT: new Vector2(0,0), 
	RIGHT: new Vector2(1,0), 
};


// Bullet classes
class Bullet {
	constructor(x, y, angle, speed=5, bounce=6) {
		this.x = x;
		this.y = y;
		this.vx = Math.cos(angle) * speed;
		this.vy = Math.sin(angle) * speed;
		this.dtx = this.vx;
		this.dty = this.vy;
		this.bounces = bounce;
		this.alive = true;
			if (this.update === undefined) {throw new Error('Missing update() method');}

		if (this.draw === undefined) {throw new Error('Missing draw() method');}

	}
}

class NormalBullet extends Bullet {
	#ctx = document.getElementById('gameCanvas').getContext('2d');
	constructor(x, y, angle) {
		super(x, y, angle)
	}
	
	update(delta) {
	if (!this.alive) return;
		this.dtx = this.vx*delta
		this.dty = this.vy*delta
		// Horizontal Movement & Wall Bounce
		if (isWall(this.x + this.dtx, this.y, 3)) {
			this.vx *= -1;
			this.dtx *= -1;
			this.bounces--;
		}
		this.x += this.vx;
	
		// Vertical Movement & Wall Bounce
		if (isWall(this.x, this.y + this.dty, 3)) {
			this.vy *= -1;
			this.dty *= -1;
			this.bounces--;
		}
		this.y += this.vy;

		if (this.bounces < 0) this.alive = false;
	}
	draw() {
		ctx.fillStyle = '#FF5722';
		ctx.beginPath();
		ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
		ctx.fill();
	}
}


// Simple true/false Grid Maze (true = filled, false = Empty)
class MapGenerator {
	#ctx = document.getElementById('gameCanvas').getContext('2d');
	#WALL_STYLE = 'black';
	#WALL_THICK = 2;
	gen_type = 0; // 0:Recursive, 1:Eulers
	#tiles = Array.from({length:ROW}, () => Array(COLUMN).fill(true));
	#walls = [];
	DIRECTION_NAMES = ["UP", "DOWN", "LEFT", "RIGHT"];
	DIR = { // x and y values on grid
		UP: new Vector2(0, -1), 
		DOWN: new Vector2(0, 1), 
		LEFT: new Vector2(-1, 0), 
		RIGHT: new Vector2(1, 0),
	};
	constructor(){
		this.rebuild();
	}
 
	//map building functions
	#getTile(location){
		if (location instanceof Vector2){return this.#tiles[location.y][location.x]}
	}
	#setTile(value1, value2, value3){
		if (value1 instanceof Vector2){this.#tiles[value1.y][value1.x] = value2}
		else if (typeof value1 === "number"){this.#tiles[value1][value2] = value3}
	}
	#getWall(row, col){
		const hRow = row*2;
		const vRow = col*2+1;
		return {
			UP: this.#walls[hRow]?.[col] || false,
			DOWN: this.#walls[hRow]?.[col + 1] || false,
			LEFT: this.#walls[vRow]?.[col] || false,
			RIGHT: this.#walls[vRow]?.[col + 1] || false
		};
	}
	#setWall(location, value){
		if (location instanceof Vector2){
			if (!this.#walls[location.y]) {return}
			this.#walls[location.y][location.x] = value
		}
	}
	#breakWall(current_pos, dir_name) {
		if (DEBUG){console.log(current_pos, dir_name)}
		
		//getting target wall and validating ability to break
		let wall_address = current_pos.tileToWall(dir_name);
		if (!(wall_address instanceof Vector2 || wall_address == null)){return false}
		if (!wall_address.isValid()){return false}
		//needs to shift cordinates to horrizontal walls according to array format
		if (wall_address.y < 0 || wall_address.y > this.#walls.length){return false}
		//needs to shift cordinates to verticle walls according to array format
		if (wall_address.x < wall_address.y%2 || wall_address.x > this.#walls[wall_address.y].length) {return false}
		
		this.#setWall(wall_address, false);
		return true;
	}

	//maze generation algorythms
	#recursive(current_pos) {
		//get genearetd randomly generated digging directions
		const direction = [...this.DIRECTION_NAMES];
		direction.sort(() => Math.random() - 0.5);

		//digging and recursive
		this.#setTile(0,0,false);
		for (const dir_name of direction) {
			//target tile for tunneling
			let targ_pos = current_pos.add(this.DIR[dir_name]);
			
			//clamping restrictions of target tile to break the walls to
			if (!targ_pos.isValid()){continue}
			if (targ_pos.y < 0 || targ_pos.y >= this.#tiles.length
					|| targ_pos.x < 0 || targ_pos.x >= this.#tiles[targ_pos.y].length) {continue}
			if (!this.#tiles[targ_pos.y]?.[targ_pos.x]){continue}
			
			//digging
			this.#setTile(targ_pos, false);

			let success = this.#breakWall(current_pos, dir_name);
			if (!success) {continue}
			this.#recursive(targ_pos);
		}
	}
	#eulers(location){
	}
	//maze algorithm organized forlder
	#mapBuilders = [
		(start) => this.#recursive(start),
		(start) => this.#eulers(start),
	];

	//wall collision check
	checkWallCollision(pos, angle) {
		const hw = TANK_WIDTH / 2;
		const hl = TANK_LENGTH / 2;
	
		const corners = [
			new Vector2(-hl, -hw),
			new Vector2(hl, -hw),
			new Vector2(hl, hw),
			new Vector2(-hl, hw)
		];
		   
		for (const corner of corners) {
			const rotated = corner.rotate(angle);
			const worldPos = pos.add(rotated);
	
			const col = Math.floor(worldPos.x / TILE_SIZE);
			const row = Math.floor(worldPos.y / TILE_SIZE);
		
			// Check horizontal walls (even rows)
			const hRow = row * 2;
			if (this.#walls[hRow]?.[col] === true) {
				const wallY = row * TILE_SIZE;
				if (worldPos.y < wallY + this.WALL_THICK / 2) return true
			}
			if (this.#walls[hRow]?.[col + 1] === true) {
				const wallY = (row + 1) * TILE_SIZE;
				if (worldPos.y > wallY - this.WALL_THICK / 2) return true
			}

			// Check vertical walls (odd rows)
			const vRow = row * 2 + 1;
			if (this.#walls[vRow]?.[col] === true) {
				const wallX = col * TILE_SIZE;
				if (worldPos.x < wallX + this.WALL_THICK / 2) return true
			}
			if (this.#walls[vRow]?.[col + 1] === true) {
				const wallX = (col + 1) * TILE_SIZE;
				if (worldPos.x > wallX - this.WALL_THICK / 2) return true
			}
		}
		return false;
	}
	//used to call to regenerate new map
	rebuild(start = new Vector2(0,0)) {
		//clean map
		this.#walls = [];
		for (let r=0; r < ROW  *2+1; r++) {
			const row = [];
			for (let c=0; c < COLUMN+r%2; c++) {
				row.push(true);
			}
			this.#walls.push(row);
		}
		
		//generate
		this.#mapBuilders[this.gen_type% this.#mapBuilders.length](start)
		console.log("Compelted maze build");
		
		if (!DEBUG) {return}
		console.log(this.#tiles);
		console.log(this.#walls);
	}

	//drawing the map
	drawMap() {
		for (let r = 0; r < this.#walls.length; r++) {
			for (let c = 0; c < this.#walls[r].length; c++) {
				if (this.#walls[r][c] == false) {continue;}
				if (r%2 == 0){ //Horozontal lines
					this.#ctx.fillStyle = this.#WALL_STYLE;
					this.#ctx.fillRect(c * TILE_SIZE, Math.floor(r/2) * TILE_SIZE, TILE_SIZE, this.#WALL_THICK/2);
				}else{ //Vertical lines
					this.#ctx.fillStyle = this.#WALL_STYLE;
					this.#ctx.fillRect(c * TILE_SIZE, Math.floor(r/2) * TILE_SIZE, this.#WALL_THICK/2, TILE_SIZE);
				}
			}
		}
		
		//printing out cordinates on the table when dubugging
		if (!DEBUG){return}
		this.#ctx.font = '12px';
		this.#ctx.textAlign = 'center';
		this.#ctx.textBaseline = 'middle';
		for (let r=0; r<this.#tiles.length; r++){
			for (let c=0; c<this.#tiles[r].length; c++){
				this.#ctx.fillText(`(${c}, ${r})`, c*TILE_SIZE+TILE_SIZE/2, r*TILE_SIZE+TILE_SIZE/2);
			}
		}	
	}
}


// -- tank pbject -- \\
class Tank{
	#ctx = document.getElementById('gameCanvas').getContext('2d');
	#angle = 0;
	#speed = 0;
	#maxSpeed = 200;
	#rotSpeed = 6.5;
	#radius = 12;
	#canShoot = true;
	constructor(map, x, y){
		this.map = map;
		this.pos = new Vector2(x ?? TILE_SIZE/2, y ?? TILE_SIZE/2);
		
		// --- Keybindings Management --- \\
		window.addEventListener('keydown', e => this.#keys[e.code] = true);
		window.addEventListener('keyup', e => this.#keys[e.code] = false);
	}
	
	//controls
	#keys = {};
	#bindings = {
		up: 'KeyW',
		down: 'KeyS',
		left: 'KeyA',
		right: 'KeyD',
		shoot: 'Space'
	};
	
	updateLabel(action, code) {
		document.getElementById(`lbl-${action}`).textContent = code === 'Space' ? 'Space' : code.replace('Key', '');
	}
	
	rebind(action, event) {
		const btn = event.target;
		btn.textContent = "Press any key...";
		const handler = (e) => {
			this.#bindings[action] = e.code;
			this.updateLabel(action, e.code);
			window.removeEventListener('keydown', handler);
		};
		window.addEventListener('keydown', handler, { once: true });
	}

	//image update
	#moveWithSubSteps(targetPos, angle) {
		const subSteps = Math.max(Math.ceil(
		Math.hypot(targetPos.x - this.pos.x, targetPos.y - this.pos.y) / (this.map.WALL_THICKNESS * 0.5)), 4);
	    
		const stepX = (targetPos.x - this.pos.x) / subSteps;
		const stepY = (targetPos.y - this.pos.y) / subSteps;
	    
		for (let i = 1; i <= subSteps; i++) {
			const testPos = new Vector2(
				this.pos.x + stepX * i,
				this.pos.y + stepY * i
			);
			if (this.map.checkWallCollision(testPos, angle, this.width, this.height)) {
				return false; // Blocked - don't move
			}
		}
	    
		// All clear - apply full movement
		this.pos.x = targetPos.x;
		this.pos.y = targetPos.y;
		return true;
	}
	update(delta) {
		// User input management
		if (this.#keys[this.#bindings.left]) this.#angle -= this.#rotSpeed * delta;
		if (this.#keys[this.#bindings.right]) this.#angle += this.#rotSpeed * delta;
	 
		// Speed management
		if (this.#keys[this.#bindings.up]) this.#speed = this.#maxSpeed;
		else if (this.#keys[this.#bindings.down]) this.#speed = -this.#maxSpeed * 0.6;
		else this.#speed = 0;
		 
		// Calculate movement
		const moveX = Math.cos(this.#angle) * this.#speed * delta;
		const moveY = Math.sin(this.#angle) * this.#speed * delta;
		 
		// Try X movement with sub-steps
		const xOnly = new Vector2(this.pos.x + moveX, this.pos.y);
		if (this.#moveWithSubSteps(xOnly, this.#angle)) {
			this.pos.x = xOnly.x;
		}
	 
		// Try Y movement with sub-steps
		const yOnly = new Vector2(this.pos.x, this.pos.y + moveY);
		if (this.#moveWithSubSteps(yOnly, this.#angle)) {
			this.pos.y = yOnly.y;
		}
	 
		// Shooting logic
		if (this.#keys[this.#bindings.shoot] && this.#canShoot) {
			const bulletX = this.pos.x + Math.cos(this.#angle) * 18;
			const bulletY = this.pos.y + Math.sin(this.#angle) * 18;
			bullets.push(new NormalBullet(bulletX, bulletY, this.#angle));
			this.#canShoot = false;
		}
		if (!this.#keys[this.#bindings.shoot]) this.#canShoot = true;
	}
	
	draw() {
		this.#ctx.save();
		this.#ctx.translate(this.pos.x, this.pos.y);
		this.#ctx.rotate(this.#angle);
	
		// Body
 		this.#ctx.fillStyle = '#4CAF50';
		this.#ctx.fillRect(-TANK_LENGTH/2, -TANK_WIDTH/2, TANK_LENGTH, TANK_WIDTH);
	
		// Cannon barrel
		this.#ctx.fillStyle = 'black';
		this.#ctx.fillRect(0, -TANK_WIDTH*0.15, TANK_LENGTH*0.66, TANK_WIDTH*0.3);
	
		this.#ctx.restore();
	}
}
// == main game script == \\
document.addEventListener('DOMContentLoaded', () => {
	const canvas = document.getElementById('gameCanvas');
	const ctx = canvas.getContext('2d');
	
	// --- Game World & Map Data --- \\
	const map = new MapGenerator();
	
	// --- Tank Entity --- \\
	const tank = new Tank(map);
	
	// --- Main Game Loop --- \\
	let lastTime = 0;
	
	//Draw Maze - visuals only
	map.drawMap();

	function gameLoop(currentTime) {
		//Clear screen
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		//Delta Value
		const delta = (currentTime - lastTime) /1000;
		lastTime = currentTime;
		const cappedDelta = Math.min(delta, 0.05);
		
		//Draw map
		map.drawMap();
		
		//Update & Draw Entities
		tank.update(cappedDelta);
		tank.draw();
		
		for (let i = bullets.length - 1; i >= 0; i--) {
			bullets[i].update();
			bullets[i].draw();
			if (!bullets[i].alive) bullets.splice(i, 1);
		}
	
		requestAnimationFrame(gameLoop);
	}
	
	// Start game loop
	//setTimeout(() => requestAnimationFrame(gameLoop), 100);
	requestAnimationFrame(gameLoop);
});
