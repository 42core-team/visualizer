let numFields = 35;
let boxSize = 20;
let cols;
let rows;
let slider;
let factor;

let socket;
let configPresent = false
let invalidCharRegex = /[\u0000-\u001F\u007F-\u009F]/g;
let font;

let isGameOver = false;
let lastPacket = {};
let currentPos = [];

let skeletonAnimations = {};
let goblinAnimations = {};
let weapons = {};

// We’ll keep track of each unit’s last position to detect movement.
let lastPositions = {};  // key: unit.id, value: {x, y}

let animationCounter = 0; // global ticker for frames
let animationStates = {}; // key: unit.id, value: { state: 'idle' | 'run', counter: 0 }
const STATE_CHANGE_THRESHOLD = 5;

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
	} else if (type == types.RESOURCE)
		max_health = config.resources[0].hp;

	percent_hp = (100 / max_health * hp) / 100;

	if (type == types.UNIT) {
		fill('green');
		rect(0, boxSize - boxSize / 5, boxSize * percent_hp, boxSize / 5);
		fill('red');
		rect(boxSize * percent_hp, boxSize - boxSize / 5, boxSize - boxSize * percent_hp, boxSize / 5);
		noFill();
	} else {
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
	config = loadJSON('assets/data/config.json');
	game = loadJSON('assets/data/state.json');
	font = loadFont('assets/font/Roboto-Regular.ttf');

	skeletonAnimations["basic"] = {
		idle: [
			loadImage('assets/images/skeleton_basic_idle__0.png'),
			loadImage('assets/images/skeleton_basic_idle__1.png'),
			loadImage('assets/images/skeleton_basic_idle__2.png'),
			loadImage('assets/images/skeleton_basic_idle__3.png')
		],
		run: [
			loadImage('assets/images/skeleton_basic_run__0.png'),
			loadImage('assets/images/skeleton_basic_run__1.png'),
			loadImage('assets/images/skeleton_basic_run__2.png'),
			loadImage('assets/images/skeleton_basic_run__3.png'),
			loadImage('assets/images/skeleton_basic_run__4.png'),
			loadImage('assets/images/skeleton_basic_run__5.png')
		]
	}
	skeletonAnimations["archer"] = {
		idle: [
			loadImage('assets/images/skeleton_archer_idle__0.png'),
			loadImage('assets/images/skeleton_archer_idle__1.png'),
			loadImage('assets/images/skeleton_archer_idle__2.png'),
			loadImage('assets/images/skeleton_archer_idle__3.png')
		],
		run: [
			loadImage('assets/images/skeleton_archer_run__0.png'),
			loadImage('assets/images/skeleton_archer_run__1.png'),
			loadImage('assets/images/skeleton_archer_run__2.png'),
			loadImage('assets/images/skeleton_archer_run__3.png'),
			loadImage('assets/images/skeleton_archer_run__4.png'),
			loadImage('assets/images/skeleton_archer_run__5.png')
		]
	}
	skeletonAnimations["tank"] = {
		idle: [
			loadImage('assets/images/skeleton_tank_idle__0.png'),
			loadImage('assets/images/skeleton_tank_idle__1.png'),
			loadImage('assets/images/skeleton_tank_idle__2.png'),
			loadImage('assets/images/skeleton_tank_idle__3.png')
		],
		run: [
			loadImage('assets/images/skeleton_tank_run__0.png'),
			loadImage('assets/images/skeleton_tank_run__1.png'),
			loadImage('assets/images/skeleton_tank_run__2.png'),
			loadImage('assets/images/skeleton_tank_run__3.png'),
			loadImage('assets/images/skeleton_tank_run__4.png'),
			loadImage('assets/images/skeleton_tank_run__5.png')
		]
	}
	skeletonAnimations["healer"] = {
		idle: [
			loadImage('assets/images/skeleton_healer_idle__0.png'),
			loadImage('assets/images/skeleton_healer_idle__1.png'),
			loadImage('assets/images/skeleton_healer_idle__2.png'),
			loadImage('assets/images/skeleton_healer_idle__3.png')
		],
		run: [
			loadImage('assets/images/skeleton_healer_run__0.png'),
			loadImage('assets/images/skeleton_healer_run__1.png'),
			loadImage('assets/images/skeleton_healer_run__2.png'),
			loadImage('assets/images/skeleton_healer_run__3.png'),
			loadImage('assets/images/skeleton_healer_run__4.png'),
			loadImage('assets/images/skeleton_healer_run__5.png')
		]
	}
	goblinAnimations["basic"] = {
		idle: [
			loadImage('assets/images/goblin_basic_idle__0.png'),
			loadImage('assets/images/goblin_basic_idle__1.png'),
			loadImage('assets/images/goblin_basic_idle__2.png'),
			loadImage('assets/images/goblin_basic_idle__3.png')
		],
		run: [
			loadImage('assets/images/goblin_basic_run__0.png'),
			loadImage('assets/images/goblin_basic_run__1.png'),
			loadImage('assets/images/goblin_basic_run__2.png'),
			loadImage('assets/images/goblin_basic_run__3.png'),
			loadImage('assets/images/goblin_basic_run__4.png'),
			loadImage('assets/images/goblin_basic_run__5.png')
		]
	}
	goblinAnimations["archer"] = {
		idle: [
			loadImage('assets/images/goblin_archer_idle__0.png'),
			loadImage('assets/images/goblin_archer_idle__1.png'),
			loadImage('assets/images/goblin_archer_idle__2.png'),
			loadImage('assets/images/goblin_archer_idle__3.png')
		],
		run: [
			loadImage('assets/images/goblin_archer_run__0.png'),
			loadImage('assets/images/goblin_archer_run__1.png'),
			loadImage('assets/images/goblin_archer_run__2.png'),
			loadImage('assets/images/goblin_archer_run__3.png'),
			loadImage('assets/images/goblin_archer_run__4.png'),
			loadImage('assets/images/goblin_archer_run__5.png')
		]
	}
	goblinAnimations["tank"] = {
		idle: [
			loadImage('assets/images/goblin_tank_idle__0.png'),
			loadImage('assets/images/goblin_tank_idle__1.png'),
			loadImage('assets/images/goblin_tank_idle__2.png'),
			loadImage('assets/images/goblin_tank_idle__3.png')
		],
		run: [
			loadImage('assets/images/goblin_tank_run__0.png'),
			loadImage('assets/images/goblin_tank_run__1.png'),
			loadImage('assets/images/goblin_tank_run__2.png'),
			loadImage('assets/images/goblin_tank_run__3.png'),
			loadImage('assets/images/goblin_tank_run__4.png'),
			loadImage('assets/images/goblin_tank_run__5.png')
		]
	}
	goblinAnimations["healer"] = {
		idle: [
			loadImage('assets/images/goblin_healer_idle__0.png'),
			loadImage('assets/images/goblin_healer_idle__1.png'),
			loadImage('assets/images/goblin_healer_idle__2.png'),
			loadImage('assets/images/goblin_healer_idle__3.png')
		],
		run: [
			loadImage('assets/images/goblin_healer_run__0.png'),
			loadImage('assets/images/goblin_healer_run__1.png'),
			loadImage('assets/images/goblin_healer_run__2.png'),
			loadImage('assets/images/goblin_healer_run__3.png'),
			loadImage('assets/images/goblin_healer_run__4.png'),
			loadImage('assets/images/goblin_healer_run__5.png')
		]
	}
	weapons["sword"] = loadImage('assets/images/sword.png');
	weapons["shield"] = loadImage('assets/images/shield.png');
	weapons["bow"] = loadImage('assets/images/bow.png');
	weapons["pickaxe"] = loadImage('assets/images/pickaxe.png');
	weapons["staff"] = loadImage('assets/images/staff.png');
}

function setupWebSocket() {
	socket = new WebSocket('ws://{{.socket}}/ws');

	// WebSocket event listeners
	socket.onopen = () => {
		console.log('WebSocket connection established');
		if (socket.readyState == WebSocket.OPEN) {
			socket.send('{"id":42}');
		}
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
		} else {
			initialValues();
			let jsonString = event.data;
			let sanitizedJsonString = jsonString.replace(invalidCharRegex, '');
			try {
				config = JSON.parse(sanitizedJsonString);
				if (!config.core_hp) {
					reconnect();
					return;
				}
				configPresent = true;
			} catch (error) {
				console.error('Failed to parse JSON:', sanitizedJsonString);
				console.error('Error:', error);
				reconnect();
			}
		}
	};

	socket.onerror = (error) => {
		console.error('WebSocket error:', error);
		reconnect();
	};

	socket.onclose = () => {
		console.log('WebSocket connection closed');
		reconnect();
	};
}

function getSubTypeAndWeapon(type_id) {
	switch (type_id)
	{
		case 1: // warrior
			return { subType: "basic", weapon: "sword" };
		case 2: // worker
			return { subType: "basic", weapon: "pickaxe" };
		case 3: // tank
			return { subType: "tank", weapon: "shield" };
		case 4: // archer
			return { subType: "archer", weapon: "bow" };
		case 5: // healer
			return { subType: "healer", weapon: "staff" };
		default:
			return { subType: "basic", weapon: "sword" };
	  }
}

function isUnitMoving(unit)
{
	let lastPos = lastPositions[unit.id];
	if (!lastPos) {
		lastPositions[unit.id] = { x: unit.pos.x, y: unit.pos.y };
		return false; 
	}
	let dist = calc_distance(lastPos.x, lastPos.y, unit.pos.x, unit.pos.y);
	lastPositions[unit.id] = { x: unit.pos.x, y: unit.pos.y };
	return dist > 0.5;
}

function setup() {
	setupWebSocket();

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

function reconnect() {
	configPresent = false;
	isGameOver = false;
	setTimeout(setupWebSocket, 1000);
}

function initialValues() {
	configPresent = false;
	isGameOver = false;
	currentPos = [];
	lastPacket = {};
	game = {};
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
	} else {
		if (lastPacket.cores && lastPacket.cores.length >= 2)
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

function drawAnimatedUnit(unit, x, y, stableState, animationCounter)
{
	let raceAnimations = (unit.team_id === 1) ? skeletonAnimations : goblinAnimations;
	let { subType, weapon } = getSubTypeAndWeapon(unit.type_id);
	let state = stableState; // Use the stable state instead of immediate detection

	let frameIndex;
	if (state === 'run') {
		frameIndex = floor((animationCounter / 8) % 6); 
	} else {
		frameIndex = floor((animationCounter / 8) % 4);
	}

	let animSet = raceAnimations[subType];
	if (!animSet) return;

	let unitImage = animSet[state][frameIndex];
	if (unitImage) {
		image(unitImage, 0, 0, boxSize, boxSize);
	}

	if (weapons[weapon])
		image(weapons[weapon], 0, 0, boxSize, boxSize);

	// Draw the health bar
	draw_health_bar(unit.hp, types.UNIT, unit.type_id);
}

function draw_units() {
	factor = (cols * boxSize) / config.width;
	animationCounter++;
	if (!game.units)
		return;
	let unitsInOnePlace = [];
	for (let unit of game.units) {
		if (!unit.pos)
			continue;

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

		// State Management
		let isRunningNow = isUnitMoving(unit);
		if (!animationStates[unit.id]) {
			animationStates[unit.id] = { state: isRunningNow ? 'run' : 'idle', counter: 0 };
		} else {
			let currentState = animationStates[unit.id].state;
			if ((isRunningNow && currentState === 'idle') || (!isRunningNow && currentState === 'run')) {
				animationStates[unit.id].counter += 1;
				if (animationStates[unit.id].counter >= STATE_CHANGE_THRESHOLD) {
					animationStates[unit.id].state = isRunningNow ? 'run' : 'idle';
					animationStates[unit.id].counter = 0;
				}
			} else {
				animationStates[unit.id].counter = 0;
			}
		}
		let stableState = animationStates[unit.id].state;

		push();
		translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50);
		translate(x, y, 0);

		drawAnimatedUnit(unit, x, y, stableState, animationCounter);

		pop();
	}
}

function draw_team_information() {
	if (!game.teams) return;

	let teamIcon = '🔵';
	for (let [index, team] of game.teams.entries()) {
		let translate_height = 45 * index;
		text(teamIcon + " Team: " + config.teams[index].name, ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + translate_height);
		text("Balance: " + team.balance, ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + 15 + translate_height);
		teamIcon = '🔴';
	}
}

function draw_resources_feed() {
	if (!game.resources || !game.teams) return;

	let translate_height = 45 * game.teams.length;
	text("Resources", ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + translate_height);
	text(game.resources.length, ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + 15 + translate_height);
}

function draw_unit_feed() {
	if (!game.units || !game.teams) return;

	let translate_height = 45 * (game.teams.length + 1);
	text("Units", ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + translate_height);
	text(game.units.length, ((-windowWidth / 2) + (windowWidth / 50)), ((-windowHeight / 2) + (windowHeight / 20)) + 15 + translate_height);
}

function draw_game_over() {
	if (game.status == 2) {
		console.log("Game over!");
		push();
		textSize(64);
		textAlign(CENTER, CENTER);
		stroke(0);
		strokeWeight(2);
		text
		if (game.cores[0].team_id == 1) {
			fill('blue');
			text("🔵 Team " + config.teams[0].name + " wins!", 0, 0);
		} else {
			fill('red');
			text("🔴 Team " + config.teams[1].name + " wins!", 0, 0);
		}
		pop();
		isGameOver = true;
		return;
	}
}

function draw() {
	translate(width / 2, height / 2);
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
	draw_game_over();
	lastPacket = game;
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	boxSize = min(width, height) / max(cols, rows) - 10;
}
