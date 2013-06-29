
var expect = require('chai').expect
  , angular = require('angularjs');

var bootstrap = function (templateId, mainModule) {
  var src = document.getElementById(templateId).innerHTML;
  var parent = document.createElement('div');
  parent.innerHTML = src;
  var node = parent.firstElementChild;
  document.body.appendChild(node);
  angular.bootstrap(node, [mainModule]);
  return node;
};

after(function(){
  // bootstrap('template', 'test');
});

describe('note guy', function(){
  var node, injector;
  beforeEach(function(){
    node = bootstrap('template', 'test');
    injector = angular.element(node).injector();
  });
  afterEach(function(){
    node.parentNode.removeChild(node);
    injector = undefined;
  });

  it('should be gorgeous', function () {});
});

