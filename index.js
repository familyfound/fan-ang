
var angular = require('angularjs')
  // , query = require('query')
  , Tip = require('tip')
  , d3 = require('d3')
  , extend = require('extend')

  , Chart = require('./lib/chart')
  , template = require('./template')
  , tip = new Tip('name');
tip.el.addClass('fan-tip');

function rectCenter(rect) {
  return {
    x: rect.left + rect.width/2,
    y: rect.top + rect.height/2
  };
}

function getLink(person, config) {
  if (config.links) {
    return 'https://familysearch.org/tree/#view=ancestor&person=' + person.id;
    if (typeof (config.links) === 'function') {
      return config.links(person);
    }
  }
}

function makeChild(chart, i, nodes, person, config) {
  var child = person.children[i];
  nodes[i] = chart.child(i, child, getLink(person.children[i], config));
  if (config.onNode) {
    config.onNode(nodes[i], child);
  }
  if (child.status) {
    nodes[i].classed(child.status, true);
  }
  if (config.tips) {
    nodes[i].on('mouseover', function (d) {
      tip.message(child.display.name + ' ' + child.display.lifespan);
      tip.show(d3.event.pageX, d3.event.pageY - 10);
    });
    nodes[i].on('mouseout', function (d) {
      tip.hide();
    });
  }
}

function makeChildren(chart, node, value, config) {
  if (!value.children) return;
  for (var i=0; i<value.children.length; i++) {
    if (value.children[i] && !node.children[i]) {
      makeChild(chart, i, node.children, value, config);
    }
  }
}

function makeNodes(chart, node, person, name, scope, config) {
  chart.node(node, getLink(person, config));
  if (config.onNode) {
    config.onNode(node.el, person);
  }
  if (config.tips) {
    node.el.on('mouseover', function (d) {
      tip.message(person.display.name + ' ' + person.display.lifespan);
      tip.show(d3.event.pageX, d3.event.pageY - 10);
    });
    node.el.on('mouseout', function (d) {
      tip.hide();
    });
  }
  if (person.status) {
    node.el.classed(person.status, true);
  }
  if (!person.hideParents) {
    if (person.father) {
      makeNodes(chart, node.father, person.father, name + '.father', scope, config);
    }
    if (person.mother) {
      makeNodes(chart, node.mother, person.mother, name + '.mother', scope, config);
    }
  }
}

angular.module('fan', [])
  .directive('fan', function () {
    return {
      scope: {},
      replace: false,
      restrict: 'A',
      link: function (scope, element, attr) {
        var name = attr.fan
          , config = {};
        if (attr.config) {
          if (attr.config[0] === '{') { // eval raw
            config = JSON.parse(attr.config);
          } else {
            config = scope.$parent[attr.config];
          }
        }
        config = extend({
          el: element[0],
          width: 500,
          height: 200,
          childHoriz: 6,
          center: {x: 250, y: 150},
          ringWidth: 20,
          doubleWidth: true,
          gens: 0,
          links: false,
          tips: false,
          removeRoot: false
        }, config);
        if (attr.gens) config.gens = parseInt(attr.gens, 10);
        
        element[0].innerHTML = '';
        var chart = new Chart(config);
        var node;
        scope.$parent.$watch(name, function (value, old) {
          if (!value) return;
          node = {
            gen: 0,
            pos: 0,
            children: {},
          };
          chart.clear();
          chart.addLines(config.gens);

          scope.person = value;
          makeNodes(chart, node, value, name, scope.$parent, config);
          makeChildren(chart, node, value, config);
          node.el.attr('class', 'arc person me');
          if (config.removeRoot) {
            node.el.remove();
          }
        });
        scope.$parent.$watch(name, function (value) {
          if (!value) return;
          makeNodes(chart, node, value, name, scope.$parent, config);
          makeChildren(chart, node, value, config);
        }, true);
      }
    };
  });
