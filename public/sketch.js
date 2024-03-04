let numFields = 35;
let boxSize = 35;
let cols;
let rows;
let slider;
let factor;

let socket;
let unauthorized = true
let configPresent = false
let invalidCharRegex = /[\u0000-\u001F\u007F-\u009F]/g;
let font;

const types = {
	CORE: 0,
	UNIT: 1,
	RESOURCE: 2
}

function draw_health_bar(hp, type, type_id = 1) {
	let max_health = 0;
	if(type == types.CORE)
		max_health = config.core_hp;
	else if (type == types.UNIT) {
		for (unit of config.units) {
			if (unit.type_id == type_id)
				max_health = unit.hp;
		}
	}
	else if(type == types.RESOURCE)
		max_health = config.resources[0].hp;
	percent_hp = (100 / max_health * hp) / 100;

	if(type == types.UNIT) {
		fill('green');
		rect(0, boxSize - boxSize / 5, boxSize * percent_hp, boxSize / 5);
		fill('red');
		rect(boxSize * percent_hp, boxSize - boxSize / 5, boxSize - boxSize * percent_hp, boxSize / 5);
		noFill();
	}
	else {
		fill('green');
		rect(0, - boxSize / 5, boxSize * percent_hp, boxSize / 5);
		fill('red');
		rect(boxSize * percent_hp, - boxSize / 5, boxSize - boxSize * percent_hp, boxSize / 5);
		noFill();
	}
}

function preload() {
	coreTexture = loadImage('assets/images/core.png');
	dirtTexture = loadImage('assets/images/dirt.png');
	goldTexture = loadImage('assets/images/resource.png');
	unit_miner1Texture = loadImage('assets/images/miner_1.png');
	unit_miner2Texture = loadImage('assets/images/miner_2.png');
	unit_warrior1Texture = loadImage('assets/images/warrior_1.png');
	unit_warrior2Texture = loadImage('assets/images/warrior_2.png');
	config = loadJSON('assets/data/config.json');
	game = loadJSON('assets/data/state.json');
	font = loadFont('assets/font/Roboto-Regular.ttf');
}

function setup() {
	socket = new WebSocket('ws://{{.socket}}/ws');

	// WebSocket event listeners
	socket.onopen = () => {
		console.log('WebSocket connection established');
	};

	socket.onmessage = (event) => {
		if(configPresent) {
			let jsonString = event.data;
			let sanitizedJsonString = jsonString.replace(invalidCharRegex, '');
			try {
				game = JSON.parse(sanitizedJsonString);
			} catch (error) {
				console.error('Failed to parse JSON:', sanitizedJsonString);
				console.error('Error:', error);
			}
		}
		else {
			let jsonString = event.data;
			let sanitizedJsonString = jsonString.replace(invalidCharRegex, '');
			config = JSON.parse(sanitizedJsonString);
			configPresent = true;
		}
	};

	socket.onerror = (error) => {
		console.error('WebSocket error:', error);
	};

	socket.onclose = () => {
		console.log('WebSocket connection closed');
	};

	cols = config.width / 1000;
	rows = config.height / 1000;
	frameRate(30);
	createCanvas(windowWidth, windowHeight);
	noStroke();
	background(220);

	slider = createSlider(10, 60);
	slider.position(10, 10);
	slider.size(190);
	slider.value(35);
}

function custom_scale() {
	cols = slider.value();
	rows = slider.value();
	numFields = slider.value() + 3;
	let smallerDimension = min(width, height);
	boxSize = smallerDimension / numFields - 1;
}

function draw() {
	translate(width/2, height/2);
	if (socket.readyState === WebSocket.OPEN && unauthorized) {
		socket.send('{"id":42}');
		unauthorized = false;
	}
	custom_scale();
	background(150);

	for (let col = 0; col <= cols; col++) {
		for (let row = 0; row <= rows; row++) {
			let x = col * (boxSize);
			let y = row * (boxSize);
			push();
			translate(x - (cols - 1) * (boxSize) / 2, y - (rows - 1) * (boxSize) / 2, 0);
			image(dirtTexture, 0, 0, boxSize, boxSize);
			translate(0, 0, (boxSize / 2) + 1);
			pop();
		}
	}

	if(game.cores) {
		for (let core of game.cores) {
			if (core.pos) {
				factor = (cols * boxSize) / config.width;
				push();
				translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50);
				translatex = core.pos.x * factor;
				translatey = core.pos.y * factor;
				translate(translatex, translatey, 0);
				image(coreTexture, 0, 0, boxSize, boxSize);
				draw_health_bar(core.hp, types.CORE, 1);
				pop();
			}
		}
	}

	if(game.resources) {
		for (let resource of game.resources) {
			if(resource.pos) {
				factor = (cols * boxSize) / config.width;
				push()
				translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50);
				translatex = resource.pos.x * factor;
				translatey = resource.pos.y * factor;
				translate(translatex, translatey, 0);
				image(goldTexture, 0, 0, boxSize, boxSize);
				draw_health_bar(resource.hp, types.RESOURCE, 1);
				pop();
			}
		}
	}

	if(game.units) {
		for (let unit of game.units) {
			if(unit.pos){
				factor = (cols * boxSize) / config.width;
				push();
				translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50);
				translatex = unit.pos.x * factor;
				translatey = unit.pos.y * factor;
				translate(translatex, translatey, 0);

				if(unit.team_id == 1) {
					if(unit.type_id == 1) {
						image(unit_warrior1Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 1);
					}
					else if(unit.type_id == 2) {
						image(unit_miner1Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 2);
					}
				}

				else if(unit.team_id == 2) {
					if(unit.type_id == 1) {
						image(unit_warrior2Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 1);
					}
					else if(unit.type_id == 2) {
						image(unit_miner2Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 2);
					}
				}
				pop();
			}
		}
	}

	for (let [index, team] of game.teams.entries()) {
		let translate_height =  45 * index;
		text(config.teams[index].name, ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + translate_height);
		text(team.balance, ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + 15 + translate_height);
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	boxSize = min(width, height) / max(cols, rows) - 10;
}
