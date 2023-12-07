let game = {
	"status": 0,
	"cores": [
		{
			"id": 3,
			"team_id": 1,
			"x": 0,
			"y": 0,
			"hp": 10000
		},
		{
			"id": 4,
			"team_id": 2,
			"x": 4,
			"y": 4,
			"hp": 10000
		}
	],
	"resources": [
		{
			"id": 5,
			"value": 100,
			"x": 1,
			"y": 2,
			"hp": 1000
		},
		{
			"id": 6,
			"value": 100,
			"x": 3,
			"y": 3,
			"hp": 1000
		}
	],
	"units": [
		{
			"id": 7,
			"type_id": 10,
			"hp": 100,
			"x": 3,
			"y": 4,
			"team_id": 1,
		},
		{
			"id": 8,
			"type_id": 11,
			"hp": 100,
			"x": 1,
			"y": 3,
			"team_id": 1,
		},
		{
			"id": 9,
			"type_id": 10,
			"hp": 100,
			"x": 4,
			"y": 1,
			"team_id": 2,
		}
	],
	"teams": [
		{ 
			"id": 1,
			"balance": 250
		},
		{ 
			"id": 2,
			"balance": 150
		}
	]
}


let cols = 20;
let rows = 20;
let boxSize = 20;

let textureImage;

function preload() {
	coreTexture = loadImage('core.png');
	dirtTexture = loadImage('dirt.png');
	goldTexture = loadImage('gold.png');
	unit1Texture = loadImage('unit1.png');
	unit2Texture = loadImage('unit2.png');
}

function setup() {
	frameRate(2);
	createCanvas(windowWidth, windowHeight, WEBGL);
	noStroke();
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
			if (unit.type_id == 10) {
				return unit1Texture;
			} else if (unit.type_id == 11) {
				return unit2Texture;
			}
		}
	}

	return dirtTexture;
}

function draw() {
	game.units[0].x = frameCount % rows;
	boxSize = (windowWidth / rows) / 2;
	background(150);
	rotateX(PI / 5);
	rotateZ(PI / 2.5);

  
	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {
			let x = col * (boxSize);
			let y = row * (boxSize);
		
			push();
			translate(x - (cols - 1) * (boxSize) / 2, y - (rows - 1) * (boxSize) / 2, 0);
			// box(boxSize)
			// translate(0, 0, (boxSize / 2) + 1);
			texture(get_texture(col, row));
			plane(boxSize);
			pop();
		}
	}

	orbitControl();
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	boxSize = min(width, height) / max(cols, rows) - 10;
}
