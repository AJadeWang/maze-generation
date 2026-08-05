// == Global Values == \\
//Bouncing bullets
const bullets = [];

// constants \\
const ROW = 10; 		// total rows in maze
const COLUMN = 15;		// total columns in maze
const MAX_BULLETS = 3;		// total active bullets cap for normal bullets

// == Classes == \\
class Vector2{
	constructor(x=0, y=0){
		this.x = x;
		this.y = y;
	}
	isValid(){
		if (this.x==null || this.y==null){console.warn("failed Vector2 check");return false;}
		return true;
	}
	add(v){
		return new Vector2(this.x + v.x, this.y + v.y);
	}
	tileToWall(d){
		return new Vector2(this.x + d.x, this.y*2 + d.y);
	}
}


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
		this.dtx = this.x*delta
		this.dty = this.y*delta
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
	TILE_SIZE = 50;
	#ctx = document.getElementById('gameCanvas').getContext('2d');
	#WALL_STYLE = '#3a3a4a';
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
	T2WALL = {
		UP: new Vector2(0,0), 
		DOWN: new Vector2(0,1), 
		LEFT: new Vector2(0,0), 
		RIGHT: new Vector2(1,0), 
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
	#getWall(location){
		if (location instanceof Vector2){return this.#tiles[location.y][location.x]}
	}
	#setWall(location, value){
		if (location instanceof Vector2){
			if (!this.#walls[location.y]) {return}
			this.#walls[location.y][location.x] = value
		}
	}
	#breakWall(location, dir_name) {
		let wall_address = location.tileToWall(this.T2WALL[dir_name]);
		if (!(wall_address instanceof Vector2 || wall_address == null)){return false}
		if (!wall_address.isValid()){return false}
		if (wall_address.y < 0 || wall_address.y > this.#walls.length){return false}
		if (wall_address.x < 0 || wall_address.x > this.#walls[wall_address.y].length) {
			console.log( wall_address.x , this.#walls[wall_address.y].length);
			return false;
		}
		this.#setWall(wall_address, false);
		return true;
	}

	//maze generation algorythms
	#recursive(location) {
		//get genearetd randomly generated digging directions
		const direction = [...this.DIRECTION_NAMES];
		direction.sort(() => Math.random() - 0.5);

		//digging and recursive
		this.#setTile(0,0,false);
		for (const dir_name of direction) {
			//target tile for tunneling
			let targ_pos = location.add(this.DIR[dir_name]);
			
			//console.log(targ_pos,targ_pos.y == null,targ_pos.y < 0,targ_pos.y > this.walls.length 
			//		,targ_pos.x == null,targ_pos.x < 0, targ_pos.x > this.walls[0].length);
			//clamping restrictions of target tile to break the walls to
			if (!targ_pos.isValid()){continue}
			if (targ_pos.y < 0 || targ_pos.y >= this.#tiles.length
					|| targ_pos.x < 0 || targ_pos.x >= this.#tiles[targ_pos.y].length) {continue}
			if (this.#tiles[targ_pos.y] == null || this.#getTile(targ_pos)==null){continue}
			if (!this.#getTile(targ_pos)){continue}
			
			//digging
			this.#setTile(targ_pos, false);

			let success = this.#breakWall(location, dir_name);
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

	//cordinate manipulation functions
	getWall(x,y,vx, vy, radius=0) {
		
	}

	//wall collision check
	isWall(x, y, radius=0) {
		// Check collision between a point/circle and wall tiles
		const col1 = Math.floor((x - radius) / this.TILE_SIZE);
		const col2 = Math.floor((x + radius) / this.TILE_SIZE);
		const row1 = Math.floor((y - radius) / this.TILE_SIZE);
		const row2 = Math.floor((y + radius) / this.TILE_SIZE);

		for (let r = row1; r <= row2; r++) {
			for (let c = col1; c <= col2; c++) {
				if (this.#walls[r] && this.#walls[r][c] == true) {return true;}
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
					this.#ctx.fillRect(c * this.TILE_SIZE, Math.floor(r/2) * this.TILE_SIZE, this.TILE_SIZE, this.#WALL_THICK/2);
				}else{ //Vertical lines
					this.#ctx.fillStyle = this.#WALL_STYLE;
					this.#ctx.fillRect(c * this.TILE_SIZE, Math.floor(r/2) * this.TILE_SIZE, this.#WALL_THICK/2, this.TILE_SIZE);
				}
			}
		}
			
	}
}


// -- tank pbject -- \\
class Tank{
	#ctx = document.getElementById('gameCanvas').getContext('2d');
	#angle = 0;
	#speed = 0;
	#maxSpeed = 2.5;
	#rotSpeed = 0.08;
	#radius = 12;
	#canShoot = true;
	constructor(map, x, y){
		this.map = map;
		this.x = x ?? map.TILE_SIZE;
		this.y = y ?? map.TILE_SIZE;
	}
	
	//controls
	keys = {};
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
	
	rebind(action) {
		const btn = event.target;
		btn.textContent = "Press any key...";
		const handler = (e) => {
			bindings[action] = e.code;
			updateLabel(action, e.code);
			window.removeEventListener('keydown', handler);
		};
		window.addEventListener('keydown', handler, { once: true });
	}
		

	//image update
	update() {
		if (this.keys[this.#bindings.left]) this.#angle -= this.#rotSpeed;
	        	if (this.keys[this.#bindings.right]) this.#angle += this.#rotSpeed;
		
			if (this.keys[this.#bindings.up]) this.#speed = this.#maxSpeed;
	        		else if (this.keys[this.#bindings.down]) this.#speed = -this.#maxSpeed * 0.6;
			else this.#speed = 0;
	
			// Calculate potential position
			const nextX = this.x + Math.cos(this.#angle) * this.#speed;
			const nextY = this.y + Math.sin(this.#angle) * this.#speed;
		
			// Apply movement with basic wall collision blocking
			if (!this.map.isWall(nextX, this.y, this.#radius)) this.x = nextX;
			if (!this.map.isWall(this.x, nextY, this.#radius)) this.y = nextY;
	
			// Shooting logic
			if (this.keys[this.#bindings.shoot] && this.#canShoot) {
				bullets.push(new NormalBullet(
				this.x + Math.cos(this.#angle) * 18,
				this.y + Math.sin(this.#angle) * 18,
				this.#angle));
				this.#canShoot = false;
		}
		if (!this.keys[this.#bindings.shoot]) this.#canShoot = true;
	}
	
	draw() {
		this.#ctx.save();
		this.#ctx.translate(this.x, this.y);
		this.#ctx.rotate(this.angle);
	
		// Body
 		this.#ctx.fillStyle = '#4CAF50';
		this.#ctx.fillRect(-12, -10, 24, 20);
	
		// Cannon barrel
		this.#ctx.fillStyle = '#fff';
		this.#ctx.fillRect(0, -3, 16, 6);
	
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

	// --- Keybindings Management --- \\
	window.addEventListener('keydown', e => tank.keys[e.code] = true);
	window.addEventListener('keyup', e => tank.keys[e.code] = false);
	
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
