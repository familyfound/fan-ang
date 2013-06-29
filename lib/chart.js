
var d3 = require('d3');

function makeGroups(svg) {
  var parent = svg.append('g').attr('class', 'fan-parent')
    , groups = {
        elements: [],
        parent: parent,
        paths: parent.append('g').attr('class', 'fan-paths'),
        lines: parent.append('g').attr('class', 'fan-lines'),
        colors: parent.append('g').attr('class', 'fan-colors'),
        text: parent.append('g').attr('class', 'fan-text'),
        defs: parent.append('g').attr('class', 'fan-defs')
      };
  return groups;
}

function makePath(items) {
  return items.map(function (item) {
    if (item[0].toLowerCase() == 'a') {
      return (item[0] +
              item[1] + ',' + item[2] + ' ' + // radii
              item[3] + ' ' +
              item[4] + ',' + item[5] + ' ' + // large arc, sweep
              item[6] + ',' + item[7]); // final pos
    }
    return item[0] + item[1] + ',' + item[2];
  }).join('');
}

function boxPath(center, gen, pos, width, margin) {
  return [
    ['M', (center.x + pos * (width + margin*2)
                    - (Math.pow(2, gen)/2 * (width + margin*2))),
          (center.y + gen * (width + margin*2))],
    ['l', 0, width],
    ['l', width, 0],
    ['l', 0, -width],
    ['l', -width, 0]
  ];
}

function pointAngle(pos, angle, length) {
  return {
    x: pos.x + Math.cos(angle) * length,
    y: pos.y + Math.sin(angle) * length
  };
}

function pointsAngle(pos, angle, len1, len2) {
  return [pointAngle(pos, angle, len1),
          pointAngle(pos, angle, len2)];
}

function genWidth(width, gen, doubleWidth) {
  if (!doubleWidth || gen <= 3) return width * gen;
  return width * gen + width * (gen - 3);
}

// options:
//  - sweep: total length
//  - offset: 0 - fan points up
//  - width: the width of each ring
//  
function arcPath(center, gen, pos, options) {
  var start = - options.sweep/2 - Math.PI/2 + options.offset
    , segs = options.sweep / (Math.pow(2, gen))
    , innerRadius = genWidth(options.width, gen, options.doubleWidth)
    , outerRadius = genWidth(options.width, gen + 1, options.doubleWidth)
    , left = pointsAngle(center, start + pos * segs, innerRadius, outerRadius)
    , right = pointsAngle(center, start + (pos + 1) * segs, innerRadius, outerRadius);
  return [
    ['M', left[0].x, left[0].y],
    ['L', left[1].x, left[1].y],
    ['A', outerRadius, outerRadius, 0, gen == 0 ? 1 : 0, 1, right[1].x, right[1].y],
    ['L', right[0].x, right[0].y],
    ['A', innerRadius, innerRadius, 0, 0, 0, left[0].x, left[0].y]
  ];
  // return boxPath(center, gen, pos, width, 5);
}

function radialLine(center, gen1, gen2, num, options) {
  var start = - options.sweep/2 - Math.PI/2 + options.offset
  var begin = genWidth(options.width, gen1, options.doubleWidth)
    , end = genWidth(options.width, gen2, options.doubleWidth)
    , segs = options.sweep / Math.pow(2, gen1)
    , line = pointsAngle(center, start + segs * num, begin, end);
  return [
    ['M', line[0].x, line[0].y],
    ['L', line[1].x, line[1].y]
  ];
}

// Options
//  - center: {x: int, y: int}
//  - width: int
//  - height: int
//  - color: str

var Chart = function (config) {
  this.c = config;
  if (config.el) this.attach(config.el);
};

Chart.prototype = {
  clear: function () {
    this.groups.parent.remove();
    this.groups = makeGroups(this.svg);
  },
  attach: function (el) {
    this.svg = d3.select(el)
      .append('svg')
      .attr('width', this.c.width)
      .attr('height', this.c.height);
    this.groups = makeGroups(this.svg);
  },
  makePath: function (node) {
    var path = arcPath(this.c.center, node.gen, node.pos, {
      sweep: Math.PI*5/4,
      offset: 0,
      width: this.c.ringWidth,
      doubleWidth: this.c.doubleWidth
    });
    return makePath(path) + 'z';
  },
  node: function (node, link) {
    var self = this;
    if (!node.el) {
      var parent = this.groups.paths;
      if (this.c.links && link) {
        parent = this.groups.paths.insert('a', 'a');
        parent.attr('xlink:href', link);
        // anything else?
      }
      node.el = parent.insert('path', 'path')
        .attr('class', 'arc person');
      node.el.attr('d', this.makePath(node));
      // node.el.style('fill', person.color || this.c.color);
    }
    if (!node.father) {
      node.father = {
        gen: node.gen + 1,
        pos: node.pos * 2
      };
    }
    if (!node.mother) {
      node.mother = {
        gen: node.gen + 1,
        pos: node.pos * 2 + 1
      };
    }
  },
  addLines: function (gens) {
    var node, num, start, end;
    for (var g=1; g < gens - 1; g++) {
      num = Math.pow(2, g);
      for (var i=1; i < num; i++) {
        node = this.groups.lines.insert('path', 'path')
          .attr('class', 'radial');
        node.attr('d', makePath(radialLine(
          this.c.center,
          g, gens, i, {
            doubleWidth: this.c.doubleWidth,
            width: this.c.ringWidth,
            sweep: Math.PI*5/4,
            offset: 0
          }
        )));
      }
    }
  }
};

module.exports = Chart;
