document.addEventListener('DOMContentLoaded', () => {

	const canvas = document.getElementById('gameCanvas');
	const ctx = canvas.getContext('2d');
	
	// --- Keybindings Management ---
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
	
	// --- Game World & Map Data ---
	// Simple 0/1 Grid Maze (1 = Wall, 0 = Empty)
	const TILE_SIZE = 50;
	const ROW = 10 *2+1;
	const COLUMN = 15;
	const map = {
		tiles:Array.from({length:ROW}, () => Array({length:COLUMN}).fill(true)),
		walls:[],
		
		//cordinate manipulation functions
		tile2wall(x1,y1,x2,y2) {
		},
		breakWall(x, y, direction) {
			
		},
		
		init() {
			for (let r=0; r < ROW; r++) {
				const row = [];
				for (let c=0; c < COLUMN+r%2; c++) {
					row.push(true);
				}
				this.walls.push(row);
			}
		}
	};
	map.init();
	console.log("map data");
	console.log(map.walls.length);
	console.log(map.walls[0].length);
	console.log(map.walls.length);
	console.log(map.walls[0].length);
	
	// Check collision between a point/circle and wall tiles
	function isWall(x, y, radius = 0) {
		const col1 = Math.floor((x - radius) / TILE_SIZE);
		const col2 = Math.floor((x + radius) / TILE_SIZE);
		const row1 = Math.floor((y - radius) / TILE_SIZE);
		const row2 = Math.floor((y + radius) / TILE_SIZE);
	
		for (let r = row1; r <= row2; r++) {
			for (let c = col1; c <= col2; c++) {
				if (map.walls[r] && map.walls[r][c] == true) return true;
			}
		}
		return false;
	}
	
	// --- Tank Entity ---
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
			if (!isWall(nextX, this.y, this.radius)) this.x = nextX;
			if (!isWall(this.x, nextY, this.radius)) this.y = nextY;
	
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
	
	// --- Bouncing Bullet Entity ---
	const bullets = [];
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
	
	// --- Main Game Loop ---
	let lastTime = 0;

	function gameLoop(currentTime) {
		// Clear screen
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Delta Value
		const delta = (currentTime - lastTime) /1000;
		lastTime = currentTime;
		const cappedDelta = Math.min(delta, 0.05);

		// Draw Maze - visuals only
		const WALL_STYLE = '#3a3a4a';
		const WALL_THICK = 2;
		for (let r = 0; r < map.walls.length; r++) {
			for (let c = 0; c < map.walls[r].length; c++) {
				if (map.walls[r][c] == false) {continue;}
				if (r%2 == 0){ //Horozontal lines
					ctx.fillStyle = WALL_STYLE;
					ctx.fillRect(c * TILE_SIZE, Math.floor(r/2) * TILE_SIZE, TILE_SIZE, WALL_THICK/2);
				}else{ //Vertical lines
					ctx.fillStyle = WALL_STYLE;
					ctx.fillRect(c * TILE_SIZE, Math.floor(r/2) * TILE_SIZE, WALL_THICK/2, TILE_SIZE);
				}
			}
		}
	
		// Update & Draw Entities
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
	requestAnimationFrame(gameLoop);
});
