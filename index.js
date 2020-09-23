//Add the ability to click and drag shapes
// World.add(
// 	world,
// 	MouseConstraint.create(engine, {
// 		mouse: Mouse.create(render.canvas),
// 	})
// );

const { Engine, World, Render, Runner, Bodies, Body, Events } = Matter;

const horizontalCells = 20; //cells in the horizontal direction.
const verticalCells = 18; //cells in the vertical direction.
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / horizontalCells;
const unitLengthY = height / verticalCells;

const engine = Engine.create();
const { world } = engine;
world.gravity.y = 0;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: false,
		width,
		height,
	},
});

Render.run(render);
Runner.run(Runner.create(), engine);

//WALLS
const walls = [
	Bodies.rectangle(width / 2, 0, width, 4, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 4, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 4, height, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 4, height, { isStatic: true }),
];

World.add(world, walls);

//MAZE GENERATION.
const shuffleArr = (arr) => {
	let arrLength = arr.length;
	while (arrLength > 0) {
		const index = Math.floor(Math.random() * arrLength);

		arrLength--;

		const temp = arr[arrLength];
		arr[arrLength] = arr[index];
		arr[index] = temp;
	}
	return arr;
};

const grid = Array(verticalCells) //rows
	.fill(null) //intialize with null
	.map(() => Array(horizontalCells).fill(false)); //override the null with initial value of false as columns of the grid

//array for the vertical lines in the grid
const verticals = Array(verticalCells) // rows
	.fill(null) //to be overriden
	.map(() => Array(horizontalCells - 1).fill(false)); //columns with false as initial values.

//array for the horizontal lines in the grid
const horizontals = Array(verticalCells - 1) // rows
	.fill(null) //to be overriden
	.map(() => Array(horizontalCells).fill(false)); //columns with false as initial values.

const startRow = Math.floor(Math.random() * verticalCells);
const startColumn = Math.floor(Math.random() * horizontalCells);

const stepThroughCells = (row, column) => {
	//If this row and colinms has been visited already, then just return
	if (grid[row][column]) return;

	//Mark this cell as visited.
	grid[row][column] = true;

	//Assemble the randomly order neighboring cells
	const neighboringCells = shuffleArr([
		[row - 1, column, 'up'], //top neighbor
		[row + 1, column, 'down'], //bottom neighbor
		[row, column - 1, 'left'], //left neighbor
		[row, column + 1, 'right'], //right neighbor
	]);

	//for each of the neighbor cells
	for (let neighborCell of neighboringCells) {
		const [nextRow, nextCol, direction] = neighborCell;

		//see if that neighboring cell is out of bounds
		if (nextRow < 0 || nextRow >= verticalCells || nextCol < 0 || nextCol >= horizontalCells) continue;

		//if that neighboring cell has already being visited, then move to the next neighboring cell
		if (grid[nextRow][nextCol]) continue;

		//Remove a horizontal wall or a vertical wall
		if (direction === 'left') verticals[row][column - 1] = true;
		else if (direction === 'right') verticals[row][column] = true;
		else if (direction === 'up') horizontals[row - 1][column] = true;
		else if (direction === 'down') horizontals[row][column] = true;

		stepThroughCells(nextRow, nextCol);
	}
};
stepThroughCells(startRow, startColumn);

//Draw horizontal walls of the maze
horizontals.forEach((row, rowIndex) => {
	row.forEach((open, colIndex) => {
		if (open) return;
		const horizontalWall = Bodies.rectangle(
			colIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			5,
			{
				label: 'walls',
				isStatic: true,
				render: {
					fillStyle: '#ff5568',
				},
			}
		);
		World.add(world, horizontalWall);
	});
});

//Draw the vertical walls of the maze
verticals.forEach((row, rowIndex) => {
	row.forEach((open, colIndex) => {
		if (open) return;
		const verticalWall = Bodies.rectangle(
			colIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			5,
			unitLengthY,
			{
				label: 'walls',
				isStatic: true,
				render: {
					fillStyle: '#ff5568',
				},
			}
		);
		World.add(world, verticalWall);
	});
});

//Finishing point.
const finish = Bodies.rectangle(
	width - unitLengthX / 2,
	height - unitLengthY / 2,
	unitLengthX * 0.7,
	unitLengthY * 0.7,
	{
		isStatic: true,
		label: 'finishingPoint',
		render: {
			fillStyle: '#88ff55',
		},
	}
);
World.add(world, finish);

//The ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
	unitLengthX / 2, //x of the center of the circle
	unitLengthY / 2, //y of the center of the circle
	ballRadius, //radius of the circle
	{
		label: 'ball',
		render: {
			fillStyle: '#3366ff',
		},
	}
);
World.add(world, ball);

document.addEventListener('keydown', (e) => {
	const { x, y } = ball.velocity;
	if (e.keyCode === 87) Body.setVelocity(ball, { x, y: y - 4 }); //w == move up
	if (e.keyCode === 68) Body.setVelocity(ball, { x: x + 4, y }); //d == move right
	if (e.keyCode === 83) Body.setVelocity(ball, { x, y: y + 4 }); //s == move dowm
	if (e.keyCode === 65) Body.setVelocity(ball, { x: x - 4, y }); //a == move right
});

//Win Condition
Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		const labels = ['ball', 'finishingPoint'];
		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			world.gravity.y = 1; //make everything fall to the bottom
			document.querySelector('.winner').classList.remove('hidden');
			world.bodies.forEach((body) => {
				if (body.label === 'walls') {
					Body.setStatic(body, false);
				}
			});
		}
	});
});
