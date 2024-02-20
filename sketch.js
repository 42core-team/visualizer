let numFields = 35;
let boxSize;
let cols;
let rows;
let slider;
let factor;

let socket;
let unauthorized = true
let configPresent = false
let invalidCharRegex = /[\u0000-\u001F\u007F-\u009F]/g;
let font;


function preload()  
{
	coreTexture = loadImage('assets/images/core.png');
	dirtTexture = loadImage('assets/images/dirt.png');
	goldTexture = loadImage('assets/images/resource.png');
	unit_miner1Texture = loadImage('assets/images/miner_1.png');
	unit_miner2Texture = loadImage('assets/images/miner_2.png');
	unit_worker1Texture = loadImage('assets/images/warrior_1.png');
	unit_worker2Texture = loadImage('assets/images/warrior_2.png');
	config = loadJSON('assets/data/config.json');
	game = loadJSON('assets/data/state.json');
	font = loadFont('assets/font/Roboto-Regular.ttf');
}

function setup() 
{
	socket = new WebSocket('ws://localhost:3000/ws');

	// WebSocket event listeners
	socket.onopen = () => {
		console.log('WebSocket connection established');
	};

	socket.onmessage = (event) => {
		if(configPresent)
		{
			// console.log('State from server:', event.data);
			let jsonString = event.data
			let sanitizedJsonString = jsonString.replace(invalidCharRegex, '');
			game = JSON.parse(sanitizedJsonString);
		}
		else
		{
			// console.log('Config from server:', event.data);
			// config = event.data;
			let jsonString = event.data
			let sanitizedJsonString = jsonString.replace(invalidCharRegex, '');
			config = JSON.parse(sanitizedJsonString)
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
	frameRate(60);
	createCanvas(windowWidth, windowHeight, WEBGL);
	textFont(font);
	noStroke();
	background(220);

	slider = createSlider(10, 60);
	slider.position(10, 10);
	slider.size(190);
	slider.value(35);
}

function custom_scale() 
{
	cols = slider.value();
	rows = slider.value();
	numFields = slider.value() + 3;
	let smallerDimension = min(width, height);
	boxSize = smallerDimension / numFields;
}

function draw() 
{
	if (socket.readyState === WebSocket.OPEN && unauthorized) {
		socket.send('{"id":42}');
		unauthorized = false;
	}
	custom_scale();
	background(150);

  
	for (let col = 0; col < cols; col++) 
	{
		for (let row = 0; row < rows; row++) 
		{
			let x = col * (boxSize);
			let y = row * (boxSize);
			push();
			translate(x - (cols - 1) * (boxSize) / 2, y - (rows - 1) * (boxSize) / 2, 0);
			texture(dirtTexture)
			box(boxSize)
			translate(0, 0, (boxSize / 2) + 1);
			pop();
		}
	}

	if(game.cores)
	{
		for (let core of game.cores) 
		{
			if (core.pos) {
				factor = (cols * boxSize) / config.width;
				push()
				translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50)
				translatex = core.pos.x * factor;
				translatey = core.pos.y * factor;
				translate(translatex, translatey, 0);
				texture(coreTexture);
				plane(boxSize);
				pop()
			}
		}
	}
	if(game.resources)
	{
		for (let resource of game.resources) 
		{
			if(resource.pos) {
				factor = (cols * boxSize) / config.width;
				push()
				translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50)
				translatex = resource.pos.x * factor;
				translatey = resource.pos.y * factor;
				translate(translatex, translatey, 0);
				texture(goldTexture);
				plane(boxSize);
				pop()
			}
		}
	}

	if(game.units)
	{
		for (let unit of game.units) 
		{
			if(unit.pos){
				factor = (cols * boxSize) / config.width;
				push()
				translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50)
				translatex = unit.pos.x * factor;
				translatey = unit.pos.y * factor;
				translate(translatex, translatey, 0);
				if(unit.team_id == 1)
				{
					if(unit.type_id == 10)
					{
						texture(unit_miner1Texture);
					}
					else if(unit.type_id == 11)
					{
						texture(unit_worker1Texture);
					}
				}
				else if(unit.team_id == 2)
				{
					if(unit.type_id == 2)
					{
						texture(unit_miner2Texture);
					}
					else if(unit.type_id == 1)
					{
						texture(unit_worker2Texture);
					}
				}
				plane(boxSize);
				pop()
			}
		}
	}
	for (let team of game.teams)
	{
		textSize(36);
		// fill("black")
		text("Test", 1000, 1000)
		// console.log(team);
	}
}

function windowResized()
{
	resizeCanvas(windowWidth, windowHeight);
	boxSize = min(width, height) / max(cols, rows) - 10;
}
