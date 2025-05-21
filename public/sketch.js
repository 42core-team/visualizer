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
let tileSets = {};

let forcePercent = 0.33;

let TEXT_OFFSET_X;
let TEXT_OFFSET_Y;
const LINE_HEIGHT = 50;
const TEXT_SPACING = 30;
const UI_PADDING = 20;

const WEAPON_ANIM_TOTAL_FRAMES = 10;
const WEAPON_FORWARD_FRAMES = 3;
const MAX_SLASH_OFFSET = boxSize * 0.5;

const waveLen = 200;
const waveAmp = 0.1;

var eps     = 1e-4;
var falloff = 1.5;

let gridTextures = [];
let lastCols = 0, lastRows = 0;

const UNIT_DIRECTION_CHANGE_THRESHOLD = 5;
let directionStates = {}; // key: unit.id, value: { state: 'left' | 'right', counter: 0 }

let lastPositions = {};  // key: unit.id, value: {x, y, direction}

let animationCounter = 0;
let animationStates = {}; // key: unit.id, value: { state: 'idle' | 'run', counter: 0, weaponCounter: 0 }
const STATE_CHANGE_THRESHOLD = 5;

let winRatioDisplay = 0.5;
const BAR_WIDTH       = 20;         // bar thickness
const BAR_ROUNDING    = 10;         // px corner radius
const RATIO_EASE      = 0.05;       // lerp factor

const types = {
	CORE: 0,
	UNIT: 1,
	RESOURCE: 2
}

function updateWinRatio() {
	if (!game.units || game.units.length === 0) return;
	if (!game.teams || game.teams.length < 2) return;
	if (!game.cores || game.cores.length < 2) return;

	let skHP = 0, gbHP = 0;
	for (let u of game.units) {
		let unitWorth = u.hp;
		if (u.type_id === 2) unitWorth *= 0.35; // worker
		if (u.type_id === 3) unitWorth *= 0.6; // tank

		// calculate distance to opponent core from unit position
		let distToCore = 0;
		if (u.team_id === 1) {
			distToCore = dist(u.pos.x, u.pos.y, 0, 0);
		} else {
			distToCore = dist(u.pos.x, u.pos.y, 10000, 10000);
		}
		let maxDist = dist(0, 0, config.width, config.height);
		let distFactor = 1 - (distToCore / maxDist);
		if (distFactor < 0) distFactor = 0;
		if (distFactor > 1) distFactor = 1;

		distFactor = 0.3 + (distFactor * 0.7);

		unitWorth *= distFactor;

		if (u.team_id === 1) skHP += unitWorth;
		else                  gbHP += unitWorth;
	}
	
	skHP += game.teams[0].balance;
	gbHP += game.teams[1].balance;

	skHP += game.cores[0].hp / 15;
	skHP *= game.cores[0].hp / config.core_hp;
	gbHP += game.cores[1].hp / 15;
	gbHP *= game.cores[1].hp / config.core_hp;

	const total = skHP + gbHP;
	if (total === 0) return;

	const actualRatio = skHP / total;
	winRatioDisplay = lerp(winRatioDisplay, actualRatio, RATIO_EASE);
}

function drawWinRatioBar() {
	const gridW = (cols + 1) * boxSize;
	const gridH = (rows + 1) * boxSize;

	const xOff = -cols * boxSize / 2;
	const yOff = -rows * boxSize / 2;

	const x = xOff - UI_PADDING - BAR_WIDTH;

	const y = yOff;
	const h = gridH;

	push();
		noStroke();
		fill(50);
		rect(x, y, BAR_WIDTH, h, BAR_ROUNDING);

		const whiteH = winRatioDisplay * h;
		fill('lightgrey');
		rect(x, y, BAR_WIDTH, whiteH, BAR_ROUNDING, BAR_ROUNDING, 0, 0);

		const greenH = (1 - winRatioDisplay) * h;
		fill('green');
		rect(x, y + h - greenH, BAR_WIDTH, greenH, 0, 0, BAR_ROUNDING, BAR_ROUNDING);

		stroke(0);
		strokeWeight(2);
		const midY = y + h/2;
		line(x, midY, x + BAR_WIDTH, midY);
	pop();
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

	if (type == types.UNIT)
	{
		fill(0, 255, 0, 100);
		rect(0, boxSize - boxSize / 5, boxSize * percent_hp, boxSize / 5);
		
		fill(255, 0, 0, 100);
		rect(boxSize * percent_hp, boxSize - boxSize / 5, boxSize - boxSize * percent_hp, boxSize / 5);
		
		noFill();
	}
	else
	{
		fill(0, 255, 0, 100);
		rect(0, -boxSize / 5, boxSize * percent_hp, boxSize / 5);
		
		fill(255, 0, 0, 100);
		rect(boxSize * percent_hp, -boxSize / 5, boxSize - boxSize * percent_hp, boxSize / 5);
		
		noFill();
	}
}

function preload() {
	goblinCoreTexture = loadImage('assets/images/goblin_core.png');
	skeletonCoreTexture = loadImage('assets/images/skeleton_core.png');

	stone1 = loadImage('assets/images/stone.png');
	stone2 = loadImage('assets/images/stone_mossy.png');
	stone3 = loadImage('assets/images/stone_cracked.png');

	tileSets[0] = [ stone1, stone2, stone3 ];

	grass1 = loadImage('assets/images/deepslate_bricks.png');
	grass2 = loadImage('assets/images/cracked_deepslate_bricks.png');
	grass3 = loadImage('assets/images/polished_deepslate.png');

	tileSets[1] = [ grass1, grass2, grass3 ];

	goldTexture = loadImage('assets/images/resource.png');
	config = loadJSON('assets/data/config.json');
	game = loadJSON('assets/data/state.json');
	font = loadFont('assets/font/Quantico-Regular.ttf');

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
		lastPositions[unit.id] = { x: unit.pos.x, y: unit.pos.y, direction: 'right' };
		return { moving: false, direction: 'right' };
	}

	let dx = unit.pos.x - lastPos.x;
	let dy = unit.pos.y - lastPos.y;
	let dist = calc_distance(lastPos.x, lastPos.y, unit.pos.x, unit.pos.y);
	let isMoving = dist > 0.5;

	let direction = lastPos.direction;
	if (isMoving) {
		direction = dx > 0 ? 'right' : 'left';
	}

	lastPositions[unit.id] = { x: unit.pos.x, y: unit.pos.y, direction: direction };
	return { moving: isMoving, direction: direction };
}

function setup() {
	setupWebSocket();

	cols = config.width / 1000;
	rows = config.height / 1000;
	// frameRate(30);
	createCanvas(windowWidth, windowHeight);
	noStroke();
	background(0);

	slider = createSlider(10, 60);
	slider.position(windowWidth - slider.width - UI_PADDING - 30, UI_PADDING);
	slider.size(190);
	slider.value(20);
	slider.changed(() => {
		lastCols = -1;
		lastRows = -1;
	});

	textFont(font);
	textSize(30);
	textAlign(LEFT, TOP);
	textFont(font);

	TEXT_OFFSET_X = (-width / 2) + (width / 50);
	TEXT_OFFSET_Y = (-height / 2) + (height / 20);
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
	const xOff = -cols * boxSize / 2, yOff = -rows * boxSize / 2;
	if (cols !== lastCols || rows !== lastRows) {
		gridTextures = [];

		const fp = forcePercent;

		for (let col = 0; col < cols + 1; col++) {
			gridTextures[col] = [];
			for (let row = 0; row < rows + 1; row++) {
				let wx = (col + 0.5) * (config.width / cols);
				let wy = (row + 0.5) * (config.height / rows);

				let d1 = dist(wx, wy, 0, 0);
				let d2 = dist(wx, wy, 10000, 10000);
				let r  = d1 / (d1 + d2);

				let groupIdx;
				if (r < fp) {
					groupIdx = 0;
				} 
				else if (r > 1 - fp) {
					groupIdx = 1;
				} 
				else {
					let zoomFactor     = slider.value() / 20;
					let dynamicWaveLen = waveLen * zoomFactor;
					let wiggle         = sin((wx + wy) / dynamicWaveLen * TWO_PI) * waveAmp;

					let mixR = (r - fp) / (1 - 2 * fp);
					let r2   = constrain(mixR + wiggle, 0, 1);

					groupIdx = (random() < r2) ? 1 : 0;
				}

				let palette = tileSets[groupIdx] || tileSets[0];
				let index = 0;
				if (random() < 0.1)
					index = 1;
				if (random() < 0.05)
					index = 2
				gridTextures[col][row] = palette[index];
			}
		}

		lastCols = cols;
		lastRows = rows;
	}

	for (let c = 0; c < cols + 1; c++) {
		for (let r = 0; r < rows + 1; r++) {
			image(gridTextures[c][r],
				  c * boxSize + xOff,
				  r * boxSize + yOff,
				  boxSize, boxSize);
		}
	}
}

function draw_cores() {
	const xOff = -cols * boxSize / 2, yOff = -rows * boxSize / 2;
	factor = (cols * boxSize) / config.width;
	if (!game.cores) return;
	for (let core of game.cores) {
		if (!core.pos) continue;
		push();
			translate(xOff, yOff, 0);
			translate(core.pos.x * factor, core.pos.y * factor, 0);
			image(core.team_id === 1 ? skeletonCoreTexture : goblinCoreTexture,
				  0, 0, boxSize, boxSize);
			draw_health_bar(core.hp, types.CORE);
		pop();
	}
}

function draw_resources() {
	const xOff = -cols * boxSize / 2, yOff = -rows * boxSize / 2;
	factor = (cols * boxSize) / config.width;
	if (!game.resources) return;
	for (let res of game.resources) {
		if (!res.pos) continue;
		push();
			translate(xOff, yOff, 0);
			translate(res.pos.x * factor, res.pos.y * factor, 0);
			image(goldTexture, 0, 0, boxSize, boxSize);
			draw_health_bar(res.hp, types.RESOURCE);
		pop();
	}
}

function calc_distance(x1, y1, x2, y2) {
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function drawDirectionalTriangle(x1, y1, x2, y2, healer)
{
	let angle = atan2(y2 - y1, x2 - x1);

	let dist = calc_distance(x1, y1, x2, y2);

	const baseWidth = 20;

	push();
	translate(x1, y1);
	rotate(angle);
	noStroke();
	
	beginShape(TRIANGLES);

	if (!healer)
	{
		fill(255, 0, 0, 200);
		vertex(0, -baseWidth / 2);
		fill(255, 0, 0, 120);
		vertex(0, baseWidth / 2);
		fill(255, 0, 0, 50);
		vertex(dist, 0);
	}
	else
	{
		// yellow
		fill(255, 255, 0, 200);
		vertex(0, -baseWidth / 2);
		fill(255, 255, 0, 120);
		vertex(0, baseWidth / 2);
		fill(255, 255, 0, 50);
		vertex(dist, 0);
	}

	endShape(CLOSE);
	pop();
}

function draw_target_lines() {
	if (!game.units) return;

	push(); 
	strokeWeight(3);

	for (let unit of game.units) {
		if (!unit.pos || !unit.target_id) continue;
		if (unit.type_id === 1) continue; // warrior
		if (unit.type_id === 2) continue; // worker
		if (unit.type_id === 3) continue; // tank

		const targetEntity = findTargetEntity(unit.target_id);
		if (!targetEntity || !targetEntity.pos) continue;

		const unitConfig = config.units.find(u => u.type_id === unit.type_id);
		if (!unitConfig) continue;
		
		const distance = calc_distance(unit.pos.x, unit.pos.y, targetEntity.pos.x, targetEntity.pos.y);

		if (distance < unitConfig.min_range) continue;
		if (distance > unitConfig.max_range) continue;

		const x1 = unit.pos.x * factor 
				- (boxSize * cols / 2 - boxSize / 2) 
				+ boxSize / 2;

		const y1 = unit.pos.y * factor 
				- (boxSize * rows / 2 - boxSize / 2) 
				+ boxSize / 2;

		const x2 = targetEntity.pos.x * factor
				- (boxSize * cols / 2 - boxSize / 2) 
				+ boxSize / 2;
		
		const y2 = targetEntity.pos.y * factor
				- (boxSize * rows / 2 - boxSize / 2) 
				+ boxSize / 2;

		if (unit.type_id === 5) {
			drawDirectionalTriangle(x1, y1, x2, y2, true);
		} else {
			drawDirectionalTriangle(x1, y1, x2, y2, false);
		}

	}

	pop();
}

function findTargetEntity(targetId) {
	if (!targetId) return null;

	// unit
	let target = game.units && game.units.find(u => u.id === targetId);
	if (target) return target;

	// core
	target = game.cores && game.cores.find(c => c.id === targetId);
	if (target) return target;

	// resource
	target = game.resources && game.resources.find(r => r.id === targetId);
	return target || null;
}

function drawWeaponSlash(unit, weaponTex, weaponCounter) {
	const target = findTargetEntity(unit.target_id);
	if (!target) return;

	const dx = (target.pos.x - unit.pos.x) * factor;
	const dy = (target.pos.y - unit.pos.y) * factor;

	const angle = atan2(dy, dx) + HALF_PI;

	const t    = weaponCounter / WEAPON_ANIM_TOTAL_FRAMES;
	const ease = t < 0.5
		? map(t, 0, 0.5, 0, MAX_SLASH_OFFSET)
		: map(t, 0.5, 1, MAX_SLASH_OFFSET, 0);

	let dist = sqrt(dx*dx + dy*dy) || 1;
	const ux  = dx / dist;
	const uy  = dy / dist;

	const ox = ux * ease;
	const oy = uy * ease;

	push();
		translate(boxSize/2 + ox, boxSize/2 + oy);
		rotate(angle);
		imageMode(CENTER);
		image(weaponTex, 0, 0, boxSize, boxSize);
		imageMode(CORNER);
	pop();
}

function drawAnimatedUnit(unit, x, y, stableState, animationCounter, renderDirection)
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
		if (renderDirection === 'left') {
			push();
			scale(-1, 1);
			image(unitImage, -boxSize, 0, boxSize, boxSize);
			pop();
		} else {
			image(unitImage, 0, 0, boxSize, boxSize);
		}
	}

	if (unit.enableWeaponAnimation && weapons[weapon]) {
		let as = animationStates[unit.id];
		as.weaponCounter = (as.weaponCounter + 1) % WEAPON_ANIM_TOTAL_FRAMES;
		drawWeaponSlash(unit, weapons[weapon], as.weaponCounter);
	} else {
		if (renderDirection === 'left') {
			push(); scale(-1,1);
			image(weapons[weapon], -boxSize, 0, boxSize, boxSize);
			pop();
		} else {
			image(weapons[weapon], 0, 0, boxSize, boxSize);
		}
	}

	draw_health_bar(unit.hp, types.UNIT, unit.type_id);
}

function draw_units() {
	const xOff = -cols * boxSize / 2, yOff = -rows * boxSize / 2;
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

		let exists = false;
		for (let unitInOnePlace of unitsInOnePlace) {
			let distance = calc_distance(unitInOnePlace.x, unitInOnePlace.y, unit.pos.x, unit.pos.y);
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

		// Get movement and direction
		let movement = isUnitMoving(unit);
		let isRunningNow = movement.moving;

		let desiredDir = movement.direction;
		if (!directionStates[unit.id]) {
			directionStates[unit.id] = { direction: desiredDir, counter: 0 };
		}
		let ds = directionStates[unit.id];
		if (desiredDir !== ds.direction) {
			ds.counter++;
			if (ds.counter >= UNIT_DIRECTION_CHANGE_THRESHOLD) {
				ds.direction = desiredDir;
				ds.counter = 0;
			}
		} else {
			ds.counter = 0;
		}
		let direction = ds.direction;


		if (!animationStates[unit.id]) {
			animationStates[unit.id] = { state: isRunningNow ? 'run' : 'idle', counter: 0, weaponCounter: 0 };
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

		// Get current position with interpolation
		let pos = currentPos.find(p => p.id === unit.id);
		if (pos) {
			x = lerp(pos.x, x, 0.3);
			y = lerp(pos.y, y, 0.3);
			pos.x = x;
			pos.y = y;
		} else {
			currentPos.push({ id: unit.id, x: x, y: y });
		}

		push();
		translate(xOff, yOff, 0);
		translate(x, y, 0);

		const unitCfg = config.units.find(u => u.type_id === unit.type_id);
		const tgt = unit.target_id ? findTargetEntity(unit.target_id) : null;
		const hasMeleeTarget =
			unit.target_id
			&& unitCfg
			&& tgt
			&& tgt.pos
			&& (() => {
					const d = calc_distance(
						unit.pos.x, unit.pos.y,
						tgt.pos.x,  tgt.pos.y
					);
					return d >= unitCfg.min_range && d <= unitCfg.max_range;
				})();

		unit.enableWeaponAnimation = [1,2,3].includes(unit.type_id) && hasMeleeTarget;
		drawAnimatedUnit(unit, x, y, stableState, animationCounter, direction);

		pop();
	}
}

function draw_team_information() {
	if (!game.teams || !config.teams) return;

	textFont(font);
	textSize(30);
	textAlign(LEFT, TOP);
	fill('white');

	const team0 = game.teams[0];
	fill('lightgray');
	text(`Skeletons: ${config.teams[0].name}`, UI_PADDING, UI_PADDING);
	text(`Balance: ${team0.balance}`, UI_PADDING, UI_PADDING + TEXT_SPACING);
}

function draw_second_team_information() {
	if (!game.teams || !config.teams || game.teams.length < 2) return;

	textFont(font);
	textSize(30);
	textAlign(RIGHT, BOTTOM);
	fill('white');

	const team1 = game.teams[1];
	const x = width  - UI_PADDING;
	const y = height - UI_PADDING;
	fill('greenyellow')
	text(`Goblins: ${config.teams[1].name}`, x, y - TEXT_SPACING);
	text(`Balance: ${team1.balance}`, x, y);
}

function draw_game_over() {
	if (game.status == 2) {
		console.log("Game over!");
		push();
		textSize(75);
		textAlign(CENTER, CENTER);
		stroke(0);
		strokeWeight(2);
		text
		if (game.cores[0].team_id == 1) {
			fill('lightgray');
			text("Skeleton Team " + config.teams[0].name + " wins!", 0, 0);
		} else {
			fill('greenyellow');
			text("Goblin Team " + config.teams[1].name + " wins!", 0, 0);
		}
		pop();
		isGameOver = true;
		return;
	}
}

function draw() {
	translate(width / 2, height / 2);
	custom_scale();
	background(0);

	// draw playing field and its elements
	draw_grid();
	draw_target_lines();
	draw_cores();
	draw_resources();
	draw_units();

	updateWinRatio();
	drawWinRatioBar();

	// draw team information
	push();
		resetMatrix();
		draw_team_information();
		draw_second_team_information();
	pop();

	draw_game_over();
	lastPacket = game;
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	boxSize = min(width, height) / max(cols, rows) - 10;
}
