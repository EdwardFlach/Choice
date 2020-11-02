/* @pjs pauseOnBlur="true"; */
/**
 * Each run is a simulation of an individual with cancer
 * The model shows the phenotype distribution of the cancer population
 * The normal, viable landscape is green; the background is non-viable
 * The patient's cancer cells are blue
 * Under drug treatment the viable landscape is reduced, and coloured as the chosen drug
 */
var CHOOSE = 0;
var GROW = 1;
var TREAT = 2;
var SUCCESS = 3;
var FAIL = 4;
var state = CHOOSE;

var space;

function setup() {
  var canvas = createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  ellipseMode(RADIUS);
  noStroke();

  space = new Space();
  frameRate(10);
}

function draw() {
  background(255);
  translate(width / 2.0, height / 2.0)
  scale(space.scale);

  switch (state) {
    case CHOOSE:
      space.drawChoose();
      fill(90, 175, 225);
      text("choose a treatment", -50, -20, 100);
      break;
    case GROW:
      space.drawWild();
      space.grow();
      space.kill();
      if (space.cell.length > 500) state = TREAT;
      break;
    case TREAT:
      space.drugRegion[space.drug].draw();
      space.grow();
      space.kill();
      space.treat();
      if (space.cell.length === 0) state = SUCCESS;
      if (space.cell.length > 600) state = FAIL;
      break;
    case SUCCESS:
      space.drugRegion[space.drug].draw();
      fill(90, 175, 225);
      text("success", 0, 0);
      break;
    case FAIL:
      space.drugRegion[space.drug].draw();
      fill(90, 175, 225);
      text("fail", 0, 0);
      break;
  }
  space.draw();
}

function touchEnded() {
  switch (state) {
    case CHOOSE:
      var c = get(mouseX, mouseY);
      for (var i = 0; i < space.chooseRegion.length; i++) {
        if (green(c) === green(space.chooseRegion[i].col)) {
          space.choose(i);
          state = GROW;
          break;
        }
      }
      break;
    case GROW:
      break;
    case TREAT:
      break;
    case SUCCESS:
      space = new Space();
      state = CHOOSE;
      break;
    case FAIL:
      space = new Space();
      state = CHOOSE;
      break;
  }
  return false;
}

function Space() {
  this.cell = [];
  this.wildRegion = [];
  this.drugRegion = [];
  this.chooseRegion = [];
  this.drug = 0;

  // e.g. 1200 x 700 (1200/100 = 12, 700/70 = 10)
  this.scale = min(width / 100.0, height / 70.0); // 10
  this.regionSize = min(width / this.scale / 3.0, height / this.scale / 2.0); // 120/3 = 40, 70/2 = 35 -> 35

  var xRegions = floor(width / this.scale / this.regionSize); // 120/35 = 3
  var yRegions = floor(height / this.scale / this.regionSize); // 70/35 = 2

  for (var i = 0; i < xRegions; i++) {
    for (var j = 0; j < yRegions; j++) {
      this.wildRegion.push(new Region((i + 0.5 - xRegions / 2.0) * this.regionSize, (j + 0.5 - yRegions / 2.0) * this.regionSize, 15, color(130, 200, 120)));
    }
  }

  var drug = floor((this.wildRegion.length) * 0.35);
  this.drugRegion.push(new Region(this.wildRegion[drug].x - 1, this.wildRegion[drug].y - 2, 15 / 2, color(255, 205, 90)));
  drug = floor((this.wildRegion.length) * 0.7);
  this.drugRegion.push(new Region(this.wildRegion[drug].x - 1, this.wildRegion[drug].y - 2, 15 / 2, color(250, 165, 85)));

  for (i = 0; i < this.drugRegion.length; i++) {
    this.chooseRegion.push(new Region((2 * i - 1) * 10, 15, 15 / 2, this.drugRegion[i].col))
  }

  this.choose = function(d) {
    this.drug = d;
    for (var i = 0; i < floor(this.wildRegion.length * 0.7); i++) {
      var seed = random(this.wildRegion);
      for (var j = 0; j < 5; j++) {
        this.cell.push(new Cell(seed.x, seed.y));
      }
    }
  };

  this.grow = function() {
    for (var i = this.cell.length - 1; i >= 0; i--) {
      this.cell[i].mature();
      if (this.cell[i].age > 5) {
        this.cell.push(new Cell(this.cell[i].x, this.cell[i].y));
        this.cell[i].age = 0;
      }
    }
  };

  this.kill = function() {
    var deathRate = log(this.cell.length);
    for (i = this.cell.length - 1; i >= 0; i--) {
      if (random(5) > 4) {
        if (!this.cell[i].inside || deathRate > random(80)) {
          this.cell.splice(i, 1);
        }
      }
    }
  };

  this.treat = function() {
    for (var i = this.cell.length - 1; i >= 0; i--) {
      if (random(5) > 4) {
        if (!this.drugRegion[this.drug].inside(this.cell[i])) {
          this.cell.splice(i, 1);
        }
      }
    }
  };

  this.drawWild = function() {
    for (var i = 0; i < this.wildRegion.length; i++) {
      this.wildRegion[i].draw();
    }
  };

  this.drawChoose = function() {
    for (var i = 0; i < this.chooseRegion.length; i++) {
      this.chooseRegion[i].draw();
    }
  };

  this.draw = function() {
    fill(90, 175, 225);
    for (var i = 0; i < this.cell.length; i++) {
      this.cell[i].draw();
    }
  };
}

function Region(x, y, r, c) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.col = c;

  this.draw = function() {
    fill(this.col);
    ellipse(this.x, this.y, this.r);
  };

  this.inside = function(cell) {
    return sq(cell.x - this.x) + sq(cell.y - this.y) < sq(this.r);
  };
}

function Cell(x, y) {
  this.x = x + random(-7, 7) / 2;
  this.y = y + random(-7, 7) / 2;
  this.age = 0;
  this.inside = false;
  for (var j = 0; j < space.wildRegion.length; j++) {
    this.inside += space.wildRegion[j].inside(this);
  }

  this.mature = function() {
    this.age += random(1);
  };

  this.draw = function() {
    ellipse(this.x, this.y, 1);
  };
}
