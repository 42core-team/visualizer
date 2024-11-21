let numFields = 35;
let boxSize = 20;
let cols;
let rows;
let slider;
let factor;

let socket;
let unauthorized = true
let configPresent = false
let invalidCharRegex = /[\u0000-\u001F\u007F-\u009F]/g;
let font;

let isGameOver = false;
let lastPacket = {};
let currentPos = [];

const types = {
	CORE: 0,
	UNIT: 1,
	RESOURCE: 2
}

function draw_health_bar(hp, type, type_id = 1) {
	let max_health = 0;

	if (type == types.CORE)
		max_health = config.core_hp;
	else if (type == types.UNIT) {
		for (unit of config.units) {
			if (unit.type_id == type_id)
				max_health = unit.hp;
		}
	}
	else if (type == types.RESOURCE)
		max_health = config.resources[0].hp;

	percent_hp = (100 / max_health * hp) / 100;

	if (type == types.UNIT) {
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
	unit_tank1Texture = loadImage('assets/images/tank_1.png');
	unit_tank2Texture = loadImage('assets/images/tank_2.png');
	unit_archer1Texture = loadImage('assets/images/archer_1.png');
	unit_archer2Texture = loadImage('assets/images/archer_2.png');
	config = loadJSON('assets/data/config.json');
	game = loadJSON('assets/data/state.json');
	font = loadFont('assets/font/Roboto-Regular.ttf');
}

function setup() {
	socket = new WebSocket('ws://{{.socket}}/ws');

	// WebSocket event listeners
	socket.onopen = () => {
		console.log('WebSocket connection established');
		socket.send('{"id":42}');
	};

	socket.onmessage = (event) => {
		if (configPresent) {
			let jsonString = event.data;
			let sanitizedJsonString = jsonString.replace(invalidCharRegex, '');
			try {
				game = JSON.parse(sanitizedJsonString);
			} catch (error) {
				console.error('Failed to parse JSON:', sanitizedJsonString);
				console.error('Error:', error);
			}
			game.units.sort((a, b) => a.hp + b.hp);
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
	// frameRate(30);
	createCanvas(windowWidth, windowHeight);
	noStroke();
	background(220);

	slider = createSlider(10, 60);
	slider.position(10, 10);
	slider.size(190);
	slider.value(20);
}

function custom_scale() {
	cols = slider.value();
	rows = slider.value();
	numFields = slider.value() + 3;
	let smallerDimension = min(width, height);
	boxSize = smallerDimension / numFields - 1;
}

function draw_grid() {
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
}

function draw_cores() {
	if (game.status == 2) {
		console.log("Game over!");
		if (game.cores[0].team_id == 1)
			alert("blue team wins!");
		else
			alert("red team wins!");
		isGameOver = true;
		return;
	}

	if (game.cores) {
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
	else {
		if (lastPacket.game.cores.length >= 2)
			alert("No cores left! The game is a draw!");
		isGameOver = true;
	}
}

function draw_resources() {
	if (game.resources) {
		for (let resource of game.resources) {
			if (resource.pos) {
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
}

function calc_distance(x1, y1, x2, y2) {
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function draw_units() {
	factor = (cols * boxSize) / config.width;
	if (game.units) {
		let unitsInOnePlace = [];
		for (let unit of game.units) {
			if (unit.pos) {

				x = unit.pos.x * factor;
				y = unit.pos.y * factor;

				exists = false;
				for (let unitInOnePlace of unitsInOnePlace) {
					distance = calc_distance(unitInOnePlace.x, unitInOnePlace.y, unit.pos.x, unit.pos.y);
					if (distance < 50 && unitInOnePlace.units[0].team_id == unit.team_id) {
						unitInOnePlace.units.push(unit);
						unitInOnePlace.count++;
						exists = true;
						break;
					}
				}
				if (!exists) {
					unitsInOnePlace.push({ x: unit.pos.x, y: unit.pos.y, count: 1, units: [unit] });
				}

				exists = false;
				for (let pos of currentPos) {
					if (pos.id == unit.id) {
						x = lerp(pos.x, x, 0.3);
						y = lerp(pos.y, y, 0.3);
						pos.x = x;
						pos.y = y;

						exists = true;
						break;
					}
				}
				if (!exists) {
					currentPos.push({ id: unit.id, x: x, y: y });
				}

				push();
				translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50);
				translate(x, y, 0);

				if (unit.team_id == 1) {
					if (unit.type_id == 1) {
						image(unit_warrior1Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 1);
					}
					else if (unit.type_id == 2) {
						image(unit_miner1Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 2);
					}
					else if (unit.type_id == 3) {
						image(unit_tank1Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 3);
					}
					else if (unit.type_id == 4) {
						image(unit_archer1Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 4);
					}
				} else if (unit.team_id == 2) {
					if (unit.type_id == 1) {
						image(unit_warrior2Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 1);
					}
					else if (unit.type_id == 2) {
						image(unit_miner2Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 2);
					}
					else if (unit.type_id == 3) {
						image(unit_tank2Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 3);
					}
					else if (unit.type_id == 4) {
						image(unit_archer2Texture, 0, 0, boxSize, boxSize);
						draw_health_bar(unit.hp, types.UNIT, 4);
					}
				}
				pop();
			}
		}

		for (let unitInOnePlace of unitsInOnePlace) {
			if (unitInOnePlace.count > 1) {
				for (let pos of currentPos) {
					if (pos.id == unitInOnePlace.units[0].id) {
						if (unitInOnePlace.units[0].team_id == 1) {
							push();
							translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50);
							translate(pos.x, pos.y + boxSize / 4, 0);
							fill('blue');
							circle(0, 0, boxSize / 2);
							fill('white');
							textAlign(CENTER, CENTER);
							textSize(boxSize / 3);
							text(unitInOnePlace.count, 0, 0);
							pop();
						} else if (unitInOnePlace.units[0].team_id == 2) {
							push();
							translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50);
							translate(pos.x + boxSize, pos.y + boxSize / 4, 0);
							fill('red');
							circle(0, 0, boxSize / 2);
							fill('white');
							textAlign(CENTER, CENTER);
							textSize(boxSize / 3);
							text(unitInOnePlace.count, 0, 0);
							pop();
						}
						break;
					}
				}
			}
		}
	}
}

function draw_team_information() {
	for (let [index, team] of game.teams.entries()) {
		let translate_height = 45 * index;
		text("Team: " + config.teams[index].name, ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + translate_height);
		text("Balance: " + team.balance, ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + 15 + translate_height);
	}
}

function draw_resources_feed() {
	let translate_height = 45 * game.teams.length;
	text("Resources", ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + translate_height);
	text(game.resources.length, ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + 15 + translate_height);
}

function draw_unit_feed() {
	let translate_height = 45 * (game.teams.length + 1);
	text("Units", ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + translate_height);
	text(game.units.length, ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + 15 + translate_height);
}

function draw() {
	if (isGameOver) {
		return;
	}

	translate(width / 2, height / 2);
	// if (socket.readyState === WebSocket.OPEN && unauthorized) {
	//	socket.send('{"id":42}');
	//	unauthorized = false;
	// }
	custom_scale();
	background(150);

	// draw playing field and its elements
	draw_grid();
	draw_cores();
	draw_resources();
	draw_units();


	// draw team information
	draw_team_information();
	draw_unit_feed();
	draw_resources_feed();

	lastPacket = game;
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	boxSize = min(width, height) / max(cols, rows) - 10;
}
