// == Classes == \\
class Vector2{
	constructor(x=0, y=0){
		this.x = x;
		this.y = y;
	}
	isVector2(v){
		if (!v){console.warn("failed Vector2 check");return this;}
	}
	add(v){
		return new Vector2(this.x + v.x, this.y + v.y);
	}
	tileToWall(d){
		return new Vector2(this.x*2 + d.x, this.y + d.y);
	}
}

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
const ROW = 10;
const COLUMN = 15;
class MapGenerator {
	TILE_SIZE = 50;
	#ctx = document.getElementById('gameCanvas').getContext('2d');
	#WALL_STYLE = '#3a3a4a';
	#WALL_THICK = 2;
	gen_type = 0; // 0:Recursive, 1:Eulers
	tiles = Array.from({length:ROW}, () => Array(COLUMN).fill(true));
	walls = [];
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
	#breakWall(location, dir_name) {
		let wall_address = location.tileToWall(this.T2WALL[dir_name]);
		if (!(wall_address instanceof Vector2 || wall_address == null)){
			return false;
		}
		if (wall_address.x == null || wall_address.x < 0 || wall_address.x >= this.walls.length 
				|| wall_address.y == null|| wall_address.y < 0 || wall_address.y >= this.walls[wall_address.x].length) {
			return false;
		}
		this.walls[wall_address.x][wall_address.y] = false;
		return true;
	}
	#recursive(location) {
		//get genearetd randomly generated digging directions
		const direction = [...this.DIRECTION_NAMES];
		direction.sort(() => Math.random() - 0.5);

		//digging and recursive
		for (const dir_name of direction) {
			let targ_pos = location.add(this.DIR[dir_name]);
			if (targ_pos.x == null || targ_pos.x < 0 || targ_pos.x > this.walls.length 
					|| targ_pos.y == null|| targ_pos.y < 0 || targ_pos.y > this.walls[0].length) {continue}
			if (!(this.tiles[targ_pos.x] && this.tiles[targ_pos.x][targ_pos.y])){continue}

			this.tiles[targ_pos.x][targ_pos.y] = false;

			let success = this.#breakWall(location, dir_name);
			if (!success) {continue}
			this.#recursive(targ_pos);
		}
	}
	#eulers(location){
	}
	#mapBuilders = [
		(start) => this.#recursive(start),
		(start) => this.#eulers(start),
	];

	//cordinate manipulation functions
	getWall(x,y,vx, vy, radius=0) {
		
	}
	isWall(x, y, radius=0) {
		// Check collision between a point/circle and wall tiles
		const col1 = Math.floor((x - radius) / this.TILE_SIZE);
		const col2 = Math.floor((x + radius) / this.TILE_SIZE);
		const row1 = Math.floor((y - radius) / this.TILE_SIZE);
		const row2 = Math.floor((y + radius) / this.TILE_SIZE);

		for (let r = row1; r <= row2; r++) {
			for (let c = col1; c <= col2; c++) {
				if (this.walls[r] && this.walls[r][c] == true) {return true;}
			}
		}
		return false;
	}
	
	//used to call to regenerate new map
	rebuild(start = new Vector2(0,0)) {
		//clean map
		this.walls = [];
		for (let r=0; r < ROW  *2+1; r++) {
			const row = [];
			for (let c=0; c < COLUMN+r%2; c++) {
				row.push(true);
			}
			this.walls.push(row);
		}
		
		//generate
		this.#mapBuilders[this.gen_type% this.#mapBuilders.length](start)
	}

	//drawing the map
	drawMap() {
		//this.#ctx = document.getElementById('gameCanvas').getContext('2d')
		for (let r = 0; r < this.walls.length; r++) {
			for (let c = 0; c < this.walls[r].length; c++) {
				if (this.walls[r][c] == false) {continue;}
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

// == main game script == \\
document.addEventListener('DOMContentLoaded', () => {
	const canvas = document.getElementById('gameCanvas');
	const ctx = canvas.getContext('2d');
	
	// --- Keybindings Management --- \\
	const keys = {};
	const bindings = {
		up: 'KeyW',
		down: 'KeyS',
		left: 'KeyA',
		right: 'KeyD',
		shoot: 'Space'
	};
	
	function updateLabel(action, code) {
		document.getElementById(`lbl-${action}`).textContent = code === 'Space' ? 'Space' : code.replace('Key', '');
	}
	
	function rebind(action) {
		const btn = event.target;
		btn.textContent = "Press any key...";
		const handler = (e) => {
			bindings[action] = e.code;
			updateLabel(action, e.code);
			window.removeEventListener('keydown', handler);
		};
		window.addEventListener('keydown', handler, { once: true });
	}
	
	window.addEventListener('keydown', e => keys[e.code] = true);
	window.addEventListener('keyup', e => keys[e.code] = false);
	
	// --- Game World & Map Data --- \\
	let map = new MapGenerator;
	
	// --- Tank Entity --- \\
	const tank = {
		x: 60,
		y: 60,
		angle: 0,
		speed: 0,
		maxSpeed: 2.5,
		rotSpeed: 0.08,
		radius: 12,
		canShoot: true,
	
	update() {
		if (keys[bindings.left]) this.angle -= this.rotSpeed;
	        	if (keys[bindings.right]) this.angle += this.rotSpeed;
		
			if (keys[bindings.up]) this.speed = this.maxSpeed;
	        		else if (keys[bindings.down]) this.speed = -this.maxSpeed * 0.6;
			else this.speed = 0;
	
			// Calculate potential position
			const nextX = this.x + Math.cos(this.angle) * this.speed;
			const nextY = this.y + Math.sin(this.angle) * this.speed;
		
			// Apply movement with basic wall collision blocking
			if (!map.isWall(nextX, this.y, this.radius)) this.x = nextX;
			if (!map.isWall(this.x, nextY, this.radius)) this.y = nextY;
	
			// Shooting logic
			if (keys[bindings.shoot] && this.canShoot) {
				bullets.push(new NormalBullet(
				this.x + Math.cos(this.angle) * 18,
				this.y + Math.sin(this.angle) * 18,
				this.angle));
				this.canShoot = false;
			}
			if (!keys[bindings.shoot]) this.canShoot = true;
		},
	
		draw() {
			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.rotate(this.angle);
	
			// Body
	 		ctx.fillStyle = '#4CAF50';
			ctx.fillRect(-12, -10, 24, 20);
	
			// Cannon barrel
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, -3, 16, 6);
	
			ctx.restore();
		}
	};
	
	// --- Bouncing Bullet Entity --- \\
	const bullets = [];
	
	// --- Main Game Loop --- \\
	let lastTime = 0;
	
	//Draw Maze - visuals only
	map.drawMap();
	console.log(map.tiles);
	console.log(map.walls);

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
