
var angular = require('angularjs')
  // , query = require('query')
  , tip = require('tip')
  , d3 = require('d3')
  , extend = require('extend')

  , Chart = require('./lib/chart')
  , template = require('./template');

function makeNodes(chart, node, person, name, scope) {
  if (!node.el) {
    scope.$watch(name + '.father', function (value) {
      if (!value) return;
      makeNodes(chart, node.father, value, name + '.father', scope);
    });
    scope.$watch(name + '.mother', function (value) {
      if (!value) return;
      makeNodes(chart, node.mother, value, name + '.mother', scope);
    });
  }
  chart.node(node);
  if (person.father) {
    makeNodes(chart, node.father, person.father, name + '.father', scope);
  }
  if (person.mother) {
    makeNodes(chart, node.mother, person.mother, name + '.mother', scope);
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
          links: false
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
          makeNodes(chart, node, value, name, scope.$parent);
          chart.addLines(config.gens);
          node.el.attr('class', 'arc person me');
        });
      }
    };
  });
