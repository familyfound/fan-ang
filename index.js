
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

function makeNodes(chart, node, person, name, scope, config) {
  if (!node.el) {
    scope.$watch(name + '.father', function (value) {
      if (!value) return;
      makeNodes(chart, node.father, value, name + '.father', scope, config);
    });
    scope.$watch(name + '.mother', function (value) {
      if (!value) return;
      makeNodes(chart, node.mother, value, name + '.mother', scope, config);
    });
  }
  var link;
  if (config.links) {
    link = 'https://familysearch.org/tree/#view=ancestor&person=' + person.id;
    if (typeof (config.links) === 'function') {
      link = config.links(person);
    }
  }
  chart.node(node, link);
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
  if (person.father) {
    makeNodes(chart, node.father, person.father, name + '.father', scope, config);
  }
  if (person.mother) {
    makeNodes(chart, node.mother, person.mother, name + '.mother', scope, config);
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
          center: {x: 250, y: 150},
          ringWidth: 20,
          doubleWidth: true,
          gens: 0,
          links: false,
          tips: false,
          removeRoot: false
        }, config);
        if (attr.gens) config.gens = parseInt(attr.gens);
        
        element[0].innerHTML = '';
        var chart = new Chart(config);
        var node = {
          gen: 0,
          pos: 0
        };
        scope.$parent.$watch(name, function (value, old) {
          if (!value) return;
          scope.person = value;
          makeNodes(chart, node, value, name, scope.$parent, config);
          chart.addLines(config.gens);
          node.el.attr('class', 'arc person me');
          if (config.removeRoot) {
            node.el.remove();
          }
        });
      }
    };
  });
