let numFields = 35;
let boxSize;
let zoomFactor;
let cols;
let rows;
let susSound;
let emergencySound;
let textureImage;
let slider;
let factor;

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
}

function setup() 
{
	cols = config.width / 1000;
	rows = config.height / 1000;
	frameRate(60);
	createCanvas(windowWidth, windowHeight, WEBGL);
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
	zoomFactor = boxSize/1000;
	// console.log(zoomFactor);
}

function draw() 
{
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

	for (let core of game.cores) 
	{
		factor = (cols * boxSize) / config.width;
		push()
		translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50)
		translatex = core.x * factor;
		translatey = core.y * factor;
		translate(translatex, translatey, 0);
		texture(coreTexture);
		plane(boxSize);
		pop()
	}

	for (let resource of game.resources) 
	{
		factor = (cols * boxSize) / config.width;
		push()
		translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50)
		translatex = resource.x * factor;
		translatey = resource.y * factor;
		translate(translatex, translatey, 0);
		texture(goldTexture);
		plane(boxSize);
		pop()
	}

	for (let unit of game.units) 
	{
		factor = (cols * boxSize) / config.width;
		push()
		translate(-(boxSize * cols / 2 - boxSize / 2), -(boxSize * cols / 2 - boxSize / 2), 50)
		translatex = unit.x * factor;
		translatey = unit.y * factor;
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
			if(unit.type_id == 10)
			{
				texture(unit_miner2Texture);
			}
			else if(unit.type_id == 11)
			{
				texture(unit_worker2Texture);
			}
		}
		plane(boxSize);
		pop()
	}
}

function windowResized()
{
	resizeCanvas(windowWidth, windowHeight);
	boxSize = min(width, height) / max(cols, rows) - 10;
}
