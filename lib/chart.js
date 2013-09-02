
var d3 = require('d3');

function makeGroups(svg) {
  var parent = svg.append('g').attr('class', 'fan-parent')
    , groups = {
        elements: [],
        parent: parent,
        defs: parent.append('defs').attr('class', 'fan-defs'),
        paths: parent.append('g').attr('class', 'fan-paths'),
        lines: parent.append('g').attr('class', 'fan-lines'),
        colors: parent.append('g').attr('class', 'fan-colors'),
        photos: parent.append('g').attr('class', 'fan-photos'),
        text: parent.append('g').attr('class', 'fan-text')
      };
  return groups;
}

function movePos(pos, center) {
  return [pos[0] - center.x, pos[1] - center.y];
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
    ['M', (center.x + pos * (width + margin*2) -
          (Math.pow(2, gen)/2 * (width + margin*2))),
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
  if (!doubleWidth || gen <= 4) return width * gen;
  return width * gen + width * (gen - 4);
}

function arcCenter(center, gen, pos, options) {
  var start = - options.sweep/2 - Math.PI/2 + options.offset
    , segs = options.sweep / (Math.pow(2, gen))
    , innerRadius = genWidth(options.width, gen, options.doubleWidth)
    , outerRadius = genWidth(options.width, gen + 1, options.doubleWidth)
    , middleRadius = (outerRadius + innerRadius) / 2
    , angle = start + (pos + .5) * segs
    , point = pointAngle(center, start + (pos + .5) * segs, middleRadius);
  if (pos < Math.pow(2, gen) / 2) {
    angle += Math.PI;
    if (gen < 4) {
      angle -= Math.PI / 2;
    }
  } else if (gen < 4) {
    angle += Math.PI / 2;
  }
    
  if (gen === 0) point = center;
  return {
    pos: point,
    angle: angle
  };
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
  if (options.centerCircle && gen === 0) { // circle me
    return [
      ['M', center.x, center.y],
      ['m', -outerRadius, 0],
      ['a', outerRadius, outerRadius, 0, 1, 0, outerRadius * 2, 0],
      ['a', outerRadius, outerRadius, 0, 1, 0, - outerRadius * 2, 0]
    ];
  }
  return [
    ['M', left[0].x, left[0].y],
    ['L', left[1].x, left[1].y],
    ['A', outerRadius, outerRadius, 0, gen === 0 ? 1 : 0, 1, right[1].x, right[1].y],
    ['L', right[0].x, right[0].y],
    ['A', innerRadius, innerRadius, 0, 0, 0, left[0].x, left[0].y]
  ];
  // return boxPath(center, gen, pos, width, 5);
}

function radialLine(center, gen1, gen2, num, options) {
  var start = - options.sweep/2 - Math.PI/2 + options.offset
    , begin = genWidth(options.width, gen1, options.doubleWidth)
    , end = genWidth(options.width, gen2, options.doubleWidth)
    , segs = options.sweep / Math.pow(2, gen1)
    , line = pointsAngle(center, start + segs * num, begin, end);
  return [
    ['M', line[0].x, line[0].y],
    ['L', line[1].x, line[1].y]
  ];
}

function childTop(ccounts, i, width, horiz) {
  var top = 0;
  for (var j = 0; j < ccounts.length; j++) {
    top += width * Math.ceil(ccounts[j] / horiz);
    top += width / 4;
  }
  return Math.floor(i / horiz) * width + top + width * 3 / 2;
}

// Options
//  - center: {x: int, y: int}
//  - width: int
//  - height: int
//  - color: str
//  - childHoriz: 4
//  - sweep: PI*5/4

var Chart = function (config) {
  this.c = config;
  this.nid = 0;
  if (config.el) this.attach(config.el);
};

Chart.prototype = {
  clear: function () {
    this.groups.parent.remove();
    this.groups = makeGroups(this.svg);
    var mask = this.groups.defs.insert('mask')
      .attr('id', 'circle');
    mask.insert('circle', 'circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('fill', 'white')
      .attr('r', this.c.ringWidth / 2);
  },
  attach: function (el) {
    this.svg = d3.select(el)
      .append('svg')
      .attr('width', this.c.width)
      .attr('height', this.c.height);
    if (this.c.printable) this.svg.classed('printable', true);
    this.groups = makeGroups(this.svg);
    var mask = this.groups.defs.insert('mask')
      .attr('id', 'circle');
    mask.insert('circle', 'circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('fill', 'white')
      .attr('r', this.c.ringWidth / 2);
  },
  makeClipPath: function (node) {
    var path = arcPath(this.c.center, node.gen, node.pos, {
      sweep: this.c.sweep,
      offset: 0,
      width: this.c.ringWidth,
      doubleWidth: this.c.doubleWidth,
      centerCircle: this.c.printable || this.c.centerCircle
    })
    , center = arcCenter(this.c.center, node.gen, node.pos, {
      sweep: this.c.sweep,
      offset: 0,
      width: this.c.ringWidth,
      doubleWidth: this.c.doubleWidth
    });
    for (var i=0; i<path.length; i++) {
      if (path[i].length < 3) continue;
      path[i] = path[i].slice(0, -2).concat(movePos(path[i].slice(-2), center.pos));
    }
    var circle = [
      ['M', -this.c.ringWidth/2, 0],
      ['a', this.c.ringWidth/2, this.c.ringWidth/2, 0, 1, 1, this.c.ringWidth, 0],
      ['a', this.c.ringWidth/2, this.c.ringWidth/2, 0, 1, 1, -this.c.ringWidth, 0]
    ];
    return makePath(path) + 'z';
  },
  makePath: function (node) {
    var path = arcPath(this.c.center, node.gen, node.pos, {
      sweep: this.c.sweep,
      offset: 0,
      width: this.c.ringWidth,
      doubleWidth: this.c.doubleWidth,
      centerCircle: this.c.printable || this.c.centerCircle
    });
    return makePath(path) + 'z';
  },
  familyHeight: function (ccounts) {
    var top = childTop(ccounts, 0, this.c.ringWidth, this.c.childHoriz);
    top -= this.c.ringWidth * 3 / 2;
    console.log('familyHeight', top, this.c.height, ccounts);
    this.svg.attr('height', this.c.height + top);
    return this.c.height + top
  },
  getChildPos: function (ccounts, i) {
    var pos = this.c.center
      , left = i % this.c.childHoriz - this.c.childHoriz / 2 + .5
      , top = childTop(ccounts, i, this.c.ringWidth, this.c.childHoriz);
    return [pos.x + left * this.c.ringWidth,
            pos.y + top];
  },
  getMotherPos: function (ccounts) {
    var pos = this.c.center
      , left = - this.c.childHoriz / 2
      , top = childTop(ccounts, 0, this.c.ringWidth, this.c.childHoriz);;
    return [pos.x + left * this.c.ringWidth,
            pos.y + top + this.c.ringWidth/2];
  },
  mother: function (ccounts, link) {
    var parent = this.groups.paths;
    if (this.c.links && link) {
      parent = this.groups.paths.insert('a', 'a');
      parent.attr('xlink:href', link);
      // anything else?
    }
    var node = parent.insert('circle', 'circle')
      .attr('class', 'circle mother person');
    node.attr('r', this.c.ringWidth * .4 );
    var pos = this.getMotherPos(ccounts);
    node.attr('cx', pos[0]);
    node.attr('cy', pos[1]);
    return node;
  },
  child: function (ccounts, i, link) {
    var parent = this.groups.paths;
    if (this.c.links && link) {
      parent = this.groups.paths.insert('a', 'a');
      parent.attr('xlink:href', link);
    }
    var node = parent.insert('rect', 'rect')
      .attr('class', 'rect person');
    node.attr('width', this.c.ringWidth);
    node.attr('height', this.c.ringWidth);
    var pos = this.getChildPos(ccounts, i);
    node.attr('x', pos[0]);
    node.attr('y', pos[1]);
    return node;
  },
  makePhoto: function (node, url) {
    var center = arcCenter(this.c.center, node.gen, node.pos, {
      sweep: this.c.sweep,
      offset: 0,
      width: this.c.ringWidth,
      doubleWidth: this.c.doubleWidth
    })
      , photo = this.groups.photos.insert('image');
    photo.attr('xlink:href', url)
      .attr('class', 'person-photo')
      .attr('width', this.c.ringWidth)
      .attr('mask', 'url(#mask-' + node.id + ')')
      .attr('height', this.c.ringWidth)
      .attr('x', -this.c.ringWidth/2)
      .attr('y', -this.c.ringWidth/2)
      .attr('transform', 'translate(' + center.pos.x + ',' + center.pos.y + ')');
    return photo;
  },
  makeText: function (node, lines) {
    var center = arcCenter(this.c.center, node.gen, node.pos, {
      sweep: this.c.sweep,
      offset: 0,
      width: this.c.ringWidth,
      doubleWidth: this.c.doubleWidth
    })
      , text = this.groups.text.insert('text');
    text.attr('transform', 'translate(' + center.pos.x + ',' + center.pos.y + ')' + 'rotate(' + (center.angle * 180 / Math.PI) + ')');
    text.selectAll('tspan').data(lines).enter()
      .append('tspan')
      .attr('text-anchor', 'middle')
      .attr('style', 'font-size: ' + (this.c.ringWidth / 7) + 'px')
      .attr('y', function (d, i) {
        return (i + 1 - lines.length / 2) + 'em';
      })
      .attr('x', 0)
      .text(function (d) { return d; });
    return text;
  },
  node: function (node, link, text, photo) {
    var self = this;
    if (!node.el) {
      var parent = this.groups.paths;
      node.id = ++this.nid;
      if (this.c.links && link) {
        parent = this.groups.paths.insert('a', 'a');
        parent.attr('xlink:href', link);
      }
      node.el = parent.insert('path', 'path')
        .attr('class', 'arc person');
      node.el.attr('d', this.makePath(node));
      if (this.c.printable) {
        node.text = this.makeText(node, text);
      }
      if (this.c.photos && photo) {
        this.photoMask(node);
        node.photo = this.makePhoto(node, photo);
      }
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
  photoMask: function (node) {
    if (node.gen === 0) {
      var mask = this.groups.defs.insert('mask')
        .attr('id', 'mask-' + node.id);
      mask.insert('circle', 'circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', 'white')
        .attr('r', this.c.ringWidth / 2);
      return;
    }
    var clip = this.groups.defs.insert('clipPath')
      .attr('id', 'clip-' + node.id);
    clip.insert('circle', 'circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', this.c.ringWidth / 2);
    var mask = this.groups.defs.insert('mask')
      .attr('id', 'mask-' + node.id);
    mask.insert('path', 'path')
      .attr('fill', 'white')
      .attr('stroke', 'black')
      .attr('stroke-width', 5)
      .attr('d', this.makeClipPath(node))
      .attr('clip-path', 'url(#clip-' + node.id + ')');
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
            sweep: this.c.sweep,
            offset: 0
          }
        )));
      }
    }
  }
};

module.exports = Chart;
