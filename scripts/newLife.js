define(['util'], function (util) {
  // Defaults
  var lifeDefaults = {
    cellSize : 10,
    cellFill : '#87AFC7',
    cellBorder : '25383C',
    cellBorderSize : 1,
    controlSelector : 'Life-'
  };

  function Life(options) {
    /* Encapsulate a single Life game */

    options = options || {};
    this.options = util.extend(lifeDefaults, options);

    // Set controls and event listeners
    this._initControls();

    // Save the size of the grid
    this.gridSize = {
      x : Math.floor(this.canvasControl.width / this.options.cellSize),
      y : Math.floor(this.canvasControl.height / this.options.cellSize)
    };

    // Build game grid
    this.gameGrid = this._makeGrid();

  }

  Life.prototype._initControls = function() {
    /* Initialize handlers and etc. */
    var self = this;
    var controls = [
      { id : 'start', handler : this.start, event : 'click' },
      { id : 'stop', handler : this.stop, event : 'click' },
      { id : 'clear', handler : this.clear, event : 'click' },
      { id : 'speed', handler : this.updateSpeed, event : 'change' },
      { id : 'canvas', handler : this.clickLife, event : 'mousedown' }
    ];

    // Create an event handler
    function makeHandler(f) {
      return function(e) { f(); e.preventDefault(); };
    }

    util.each(controls, function(control) {
      var id = self.options.controlSelector + control.id;
      var el = document.getElementById(id);
      // Set control elements
      self[control.id + 'Control'] = el;
      // Set event listener
      el.addEventListener(control.event, makeHandler(control.handler));
    });

    this.ctx = this.canvasControl.getContext('2d');

  };

  Life.prototype.getCoords = function(x, y) {
    /* Get actual canvas coords for a life grid point */
    return {
      x : this.options.cellSize * x,
      y : this.options.cellSize * y
    };
  }

  Life.prototype.click = function(e) {
    var x = e.x - this.canvasControl.offsetLeft;
    var y = e.y - this.canvasControl.offsetTop;

    // Account for the border
    var re = /px$/;
    var canvasStyle = getComputedStyle(this.canvasControl);
    x -= canvasStyle.getPropertyValue('border-left-width').replace(re, '');
    y -= canvasStyle.getPropertyValue('border-top-width').replace(re, '');

    // Invalid click
    if(x < 0 || y < 0) return;

    var coords = this.getCoords(x, y);

    var cell = this.gameGrid[coords.x][coords.y];

    // Flip the alive state
    cell.alive = !cell.alive;

    // Draw or clear as appropriate
    cell.alive ? this.drawCell(x, y) : this.clearCell(x, y);

  };

  Life.prototype._makeGrid = function() {
    /* Generate a new grid of size (x, y) */

    var gameGrid = [];
    for(var i = 0; i < this.gridSize.x; ++i) {
      gameGrid[i] = [];
      for(var j = 0; j < this.gridSize.y; ++j) {
        gameGrid[i][j] = { neighbours : 0, alive : false };
      }
    }
    return gameGrid;
  };

  Life.prototype.clear = function() {
    /* Clear the board */
    for(var i = 0; i < this.gameGrid.length; ++i) {
      for(var j = 0; j < this.gameGrid[i].length; ++j) {
        this.gameGrid[i][j].alive = false;
        this.gameGrid[i][j].neighbours = 0;
      }
    }
    this.ctx.clearRect(0, 0, this.canvasControl.width, this.canvasControl.height);
  };

  Life.prototype.stop = function() {
    /* Stop the game. */
    this.interval && window.clearInterval(this.interval);
    delete this.interval;
  };

  Life.prototype.start = function(fps) {
    /* Start the game. */

    // Already started
    if(this.interval) return;

    var ms = Math.floor(1000 / fps);

    this.interval = setInterval(self._tick, ms);
  };

  Life.prototype.updateFps = function() {
    this.stop();
    var fps = this.fpsSlider.values;
    this.start(fps);
  };

  Life.prototype._tick = function() {
    // Count the neighbours of each
    for(var x = 0; x < this.gridSize.x; ++x) {
      for(var y = 0; y < this.gridSize.y; ++y) {
        sumNeighbours(this.gameGrid, x, y);
      }
    }

    // Check each to see if alive and reset the neighbours count
    for(var x = 0; x < this.gridSize.x; ++x) {
      for(var y = 0; y < this.gridSize.y; ++y) {
        cell = this.gameGrid[x][y];

        if(cell.alive) {
          // Live if neighbours are 2 or 3, die otherwise
          cell.alive = !(cell.neighbours === 2 || cell.neighbours === 3);
        } else {
          // Become alive if exactly 3 neighbours
          cell.alive = cell.neighbours === 3;
        }

        cell.neighbours = 0;

        // Draw or clear the cell
        cell.alive ? drawCell(x, y) : clearCell(x, y);
      }
    }
  }

  Life.prototype.drawCell = function(x, y) {
    /* Draw the cell at position (x, y) */
    var coords = this.getCoords(x, y);
    var cellSize = this.options.cellSize;

    util.drawSquare(this.ctx, coords, cellSize, this.options.cellBorder);

    // Border size
    var bs = this.options.cellBorderSize;
    // Move up+left by border size
    coords.x += bs;
    coords.y += bs;

    // Reduce size by twice border size so border appears on all sides
    cellSize -= 2 * bs;
    util.drawSquare(this.ctx, coords, cellSize, this.options.cellFill);
  };

  Life.prototype.clearCell = function(x, y) {
    /* Undraw cell at position (x, y) */
    var coords = this.getCoords(x, y);
    var cellSize = this.options.cellSize;
    this.ctx.clearRect(coords.x, coords.y, cellSize, cellSize);
  };

  Life.prototype._countNeighbours = function(x, y) {
    /*
     * Add 1 to the number of neighbours of each neighbour
     * of gameGrid[x][y].
     */
    var width = this.gridSize.x;
    var height = this.gridSize.y;

    // Add to neighbours only if alive
    if(!this.gameGrid[x][y].alive) return;

    // Don't go out of bounds
    for(var i = (x && -1); i <= ((width-x-1) && 1); ++i) {
      for(var j = (y && -1); j <= ((height-y-1) && 1); ++j) {
        // Don't do the current block (both 0)
        if(i || j) {
          this.gameGrid[x+i][y+j].neighbours += 1;
        }
      }
    }
  };

  return Life;

});