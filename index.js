
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
    if (typeof (config.links) === 'function') {
      return config.links(person);
    }
    return 'https://familysearch.org/tree/#view=ancestor&person=' + person.id;
  }
}

function tipNode(node, person) {
  node.on('mouseover', function (d) {
    tip.message(person.display.name + ' ' + person.display.lifespan);
    tip.show(d3.event.pageX, d3.event.pageY - 10);
  });
  node.on('mouseout', function (d) {
    tip.hide();
  });
}

// ccounts: list of the counts of children in the preceeding families. This
// is required to properly position the child.
function makeChild(chart, ccounts, i, nodes, family, config) {
  var child = family[i];
  nodes[i] = chart.child(ccounts, i - 1, child, getLink(family[i], config));
  if (config.onNode) {
    config.onNode(nodes[i], child);
  }
  if (child.status) {
    nodes[i].classed(child.status, true);
  }
  if (config.tips) {
    tipNode(nodes[i], child);
  }
}

function makeMother(chart, ccounts, nodes, family, config) {
  if (!family || !family[0]) return;
  var mother = family[0];
  if (nodes[0]) return;
  nodes[0] = chart.mother(ccounts, mother, getLink(mother, config));
  if (config.onNode) {
    config.onNode(nodes[0], mother);
  }
  if (config.tips) {
    tipNode(nodes[0], mother);
  }
  if (mother.status) {
    nodes[0].classed(mother.status, true);
  }
}

function makeFamilies(chart, node, person, config, scope, name) {
  if (!person.families) return [];
  if (!node.families) node.families = {};
  var i = 0
    , ccounts = []
    , watches = []
    , family;
  for (var motherId in person.families) {
    if (!node.families[motherId]) node.families[motherId] = {};
    family = person.families[motherId];
    makeMother(chart, ccounts, node.families[motherId], family, config);

    watches.push(scope.$watch(name + '.families["' + motherId + '"][0]',
                 function (motherId, ccounts, value) {
      makeMother(chart, ccounts, node.families[motherId],
                 person.families[motherId], config);
    }.bind(null, motherId, ccounts.slice())));
    
    for (var j=1; j<family.length; j++) {
      if (family[j] && !node.families[motherId][j]) {
        makeChild(chart, ccounts, j, node.families[motherId], family, config);
      }
      watches.push(scope.$watch(name + '.families["' + motherId + '"][' + j + ']',
                   function (motherId, j, family, ccounts, value) {
        if (family[j] && !node.families[motherId][j]) {
          makeChild(chart, ccounts, j, node.families[motherId], family, config);
        }
      }.bind(null, motherId, j, family, ccounts.slice())));
    }
    ccounts.push(family.length - 1);
    i++;
  }
  var nheight = chart.familyHeight(ccounts);
  if (config.heightChange) {
    config.heightChange(nheight);
  }
  return watches;
}

function makeNodes(chart, node, person, name, scope, config) {
  var watches = [];
  watches.push(scope.$watch(name + '.status', function (value, old) {
    if (old) node.el.classed(old, false);
    if (value) node.el.classed(value, true);
  }));
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
      watches.push(makeNodes(chart, node.father, person.father,
                                         name + '.father', scope, config));
    }
    if (!node.fatherWatch) {
      node.fatherWatch = scope.$watch(name + '.father', function (value) {
        if (value) {
          watches.push(makeNodes(chart, node.father, person.father, name + '.father', scope, config));
        }
      });
      watches.push(node.fatherWatch);
    }
    if (person.mother) {
      watches.push(makeNodes(chart, node.mother, person.mother,
                                         name + '.mother', scope, config));
    }
    if (!node.motherWatch) {
      node.motherWatch = scope.$watch(name + '.mother', function (value) {
        if (value) {
          watches.push(makeNodes(chart, node.mother, person.mother, name + '.mother', scope, config));
        }
      });
      watches.push(node.motherWatch);
    }
  }
  return watches;
}

function killWatches(watches) {
  var num = 0;
  for (var i=0; i<watches.length; i++) {
    if (typeof(watches[i]) !== 'function') {
      num += killWatches(watches[i]);
      continue;
    }
    watches[i]();
    num++;
  }
  return num;
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
        var node, watches;
        scope.$parent.$watch(name, function (value, old) {
          if (!value) return;
          node = {
            gen: 0,
            pos: 0,
            families: {}
          };
          chart.clear();
          chart.addLines(config.gens);

          scope.person = value;
          if (watches) {
            setTimeout(function (watches) {
              console.log('removing watches', killWatches(watches));
            }.bind(null, watches.slice()), 0);
          }
          watches = makeNodes(chart, node, value, name, scope.$parent, config);
          watches.push(makeFamilies(chart, node, value, config, scope.$parent, name));
          node.el.attr('class', 'arc person me');
          if (config.removeRoot) {
            node.el.remove();
          }
        });
      }
    };
  });
