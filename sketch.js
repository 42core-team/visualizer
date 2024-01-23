// let game = {
// 	"status": 0,
// 	"cores": [
// 		{
// 			"id": 3,
// 			"team_id": 1,
// 			"x": 0,
// 			"y": 9,
// 			"hp": 10000
// 		},
// 		{
// 			"id": 4,
// 			"team_id": 2,
// 			"x": 9,
// 			"y": 0,
// 			"hp": 10000
// 		}
// 	],
// 	"resources": [
// 		{
// 			"id": 5,
// 			"value": 100,
// 			"x": 12,
// 			"y": 0,
// 			"hp": 1000
// 		},
// 		{
// 			"id": 6,
// 			"value": 100,
// 			"x": 3,
// 			"y": 3,
// 			"hp": 1000
// 		}
// 	],
// 	"units": [
// 		{
// 			"id": 7,
// 			"type_id": 10,
// 			"hp": 100,
// 			"x": 3,
// 			"y": 4,
// 			"team_id": 1,
// 		},
// 		{
// 			"id": 8,
// 			"type_id": 11,
// 			"hp": 100,
// 			"x": 1,
// 			"y": 3,
// 			"team_id": 1,
// 		},
// 		{
// 			"id": 9,
// 			"type_id": 10,
// 			"hp": 100,
// 			"x": 4,
// 			"y": 1,
// 			"team_id": 2,
// 		},
// 		{
// 			"id": 10,
// 			"type_id": 11,
// 			"hp": 100,
// 			"x": 8,
// 			"y": 3,
// 			"team_id": 2,
// 		}
// 	],
// 	"teams": [
// 		{ 
// 			"id": 1,
// 			"balance": 250
// 		},
// 		{ 
// 			"id": 2,
// 			"balance": 150
// 		}
// 	]
// }

// let config = {
// 	"width": 1000,
// 	"height": 1000,
// 	"idle_income": 20,
// 	"core_hp": 200,
// 	"teams": [
// 		{ 
// 			"id": 1,
// 			"name": "Team 1"
// 		},
// 		{ 
// 			"id": 2,
// 			"name": "Team 2"
// 		}
// 	],
// 	"units": [
// 		{
// 			"name": "Warrior",
// 			"type_id": 1,
// 			"cost": 100,
// 			"hp": 400,
// 			"dmg_core": 100,
// 			"dmg_unit": 50,
// 			"dmg_resouce": 200,
// 			"max_range": 3,
// 			"min_range": 3,
// 			"speed": 50,
// 		},
// 		{
// 			"name": "Worker",
// 			"type_id": 1,
// 			"cost": 100,
// 			"hp": 400,
// 			"dmg_core": 100,
// 			"dmg_unit": 50,
// 			"dmg_resouce": 200,
// 			"max_range": 3,
// 			"min_range": 3,
// 			"speed": 50,
// 		},
// 	]
// }

function preload() {
	coreTexture = loadImage('minecraft_obsidian.jpeg');
	dirtTexture = loadImage('light_gray_concrete-2.png');
	goldTexture = loadImage('minecraft_gold.jpeg');
	unit_miner1Texture = loadImage('miner1.png');
	unit_miner2Texture = loadImage('miner2.png');
	unit_worker1Texture = loadImage('Warrior_bot_red.png');
	unit_worker2Texture = loadImage('Warrior_bot_blue.png');
	soundFormats('mp3', 'ogg');
	susSound = loadSound('among-us.mp3');
	emergencySound = loadSound('emergency-meeting.mp3');
	config = loadJSON('config.json');
	game = loadJSON('State.json');
}

let cols;
let rows;
let boxSize = 20;
let susSound;
let emergencySound;
let textureImage;

function setup() {
	cols = config.width / 1000;
	rows = config.height / 1000;
	frameRate(60);
	createCanvas(windowWidth, windowHeight, WEBGL);
	noStroke();
	let button = createButton('sus');
	button.position(0, 100);
	button.mousePressed(sus);
	let button1 = createButton('emergency');
	button1.position(100, 100);
	button1.mousePressed(emergency);
	background(220);
	// text('tap here to play', 10, 20);
	// setTimeout(() => {
		// 	checkSounds();
		// }, "10");
}

function get_texture(x, y) {
	for (let core of game.cores) {
		if (core.x == x && core.y == y) {
			return coreTexture;
		}
	}

	for (let resource of game.resources) {
		if (resource.x == x && resource.y == y) {
			return goldTexture;
		}
	}

	for (let unit of game.units) {
		if (unit.x == x && unit.y == y) {
			if (unit.team_id == 1) {
				if (unit.type_id == 10) {
					return unit_miner1Texture;
				} else if (unit.type_id == 11) {
					return unit_worker1Texture;
				}
			} else if (unit.team_id == 2) {
				if (unit.type_id == 10) {
					return unit_miner2Texture;
				} else if (unit.type_id == 11) {
					return unit_worker2Texture;
				}
			}
		}
	}

	// return dirtTexture;
	return (0);
}

function sus() {
	susSound.play();
}

function emergency() {
	emergencySound.play();
}

function draw() {

}

function draw() {
	// game.units[0].x = frameCount % rows;
	boxSize = (windowWidth / rows) / 2;
	background(150);
	// rotateX(PI / 4);
	// rotateZ(PI / 4);
	// rotate(PI / 4);
	// rotateY(PI / 4);

  
	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {
			let x = col * (boxSize);
			let y = row * (boxSize);
		
			push();
			translate(x - (cols - 1) * (boxSize) / 2, y - (rows - 1) * (boxSize) / 2, 0);
			// rotateZ(-PI / 2);
			texture(dirtTexture)
			box(boxSize)
			translate(0, 0, (boxSize / 2) + 1);
			if (get_texture(col, row) != 0) {
				texture(get_texture(col, row));
				plane(boxSize);
			}
			pop();
		}
	}
	orbitControl();
}

// function draw() {
// 	// game.units[0].x = frameCount % rows;
// 	boxSize = (windowWidth / rows) / 2;
// 	background(140);
// 	rotateX(PI / 4);
// 	rotateZ(PI / 4);
// 	// rotate(PI / 4);
// 	// rotateX(PI / 4);
// 	// rotateZ(PI / 4);
// 	// rotate(PI / 4);
// 	// rotateY(PI / 1234567876543);
	
// 	for (let col = 0; col < cols; col++) {
// 		for (let row = 0; row < rows; row++) {
// 			let x = col * (boxSize);
// 			let y = row * (boxSize);
			
// 			push();
// 			translate(x - (cols - 1) * (boxSize) / 2, y - (rows - 1) * (boxSize) / 2, 0);
// 			texture(dirtTexture)
// 			box(boxSize)
// 			translate(0, 0, (boxSize / 2) + 1);
// 			texture(get_texture(col, row));
// 			// translate(0, 0, (boxSize / 2) + 1);
// 			if (get_texture(col, row) != dirtTexture && get_texture(col, row) != coreTexture && get_texture(col, row) != goldTexture) {
// 				// translate(0, 0, 1);
// 				// plane();
// 				translate(0, 0, -1);
// 				rotateX(PI / 2);
// 				translate(0, boxSize / 2, 0);
// 				rotateZ(PI);
// 				rotateY(PI / 4);
// 				plane(boxSize);
// 				rotateZ(-PI);
// 				rotateY(PI / 4);
// 				translate(0, -boxSize / 2, 0);
// 				rotateX(-PI / 2);
// 				fill('rgb(0,255,0)');
// 				translate(1, 1, 100);
// 				rotateX(PI / 2);
// 				rotateY(-PI / 4);
// 				rect(-25, -20, 50, 5);
// 				rotateY(PI / 4);
// 				rotateX(-PI / 2);
// 				translate(-1, -1, -100);
// 				fill('rgb(255,0,0)');
// 				translate(0, 0, 100);
// 				rotateX(PI / 2);
// 				rotateY(-PI / 4);
// 				rect(-25, -20, 50, 5);
// 				rotateY(PI / 4);
// 				rotateX(-PI / 2);
// 				translate(0, 0, -100);
// 			}else{
// 				if (get_texture(col, row) != dirtTexture) {
// 					// translate(0, 0, 1);
// 					// plane();
// 					// translate(0, 0, -1);
// 					rotateX(PI / 2);
// 					translate(0, boxSize / 2, 0);
// 					box(boxSize);
// 					translate(0, -boxSize / 2, 0);
// 					rotateX(-PI / 2);
// 					fill('rgb(0,255,0)');
// 					translate(1, 1, 100);
// 					rotateX(PI / 2);
// 					rotateY(-PI / 4);
// 					rect(-25, -5, 50, 5);
// 					rotateY(PI / 4);
// 					rotateX(-PI / 2);
// 					translate(-1, -1, -100);
// 					fill('rgb(255,0,0)');
// 					translate(0, 0, 100);
// 					rotateX(PI / 2);
// 					rotateY(-PI / 4);
// 					rect(-25, -5, 50, 5);
// 					rotateY(PI / 4);
// 					rotateX(-PI / 2);
// 					translate(0, 0, -100);
// 				}
// 			}
// 			texture(dirtTexture)
// 			plane(boxSize);
// 			pop();
// 		}
// 	}

// 	orbitControl();
// }


function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	boxSize = min(width, height) / max(cols, rows) - 10;
}
