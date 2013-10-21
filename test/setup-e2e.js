
var angular = require('angularjs')
  // , settings = require('settings')
  // , angularSettings = require('angular-settings')
  , copy = require('deep-copy')
  , log = require('domlog')
  , fan = require('fan')

  , svgDownload = require('svg-download');

log.init();

var man = {
  display: {
    name: "Jared Forsyth",
    gender: "Male",
    lifespan: "1599-1634",
    birthDate: "12 July 1599",
    birthPlace: "Mayfield, Iowa"
  },
  todos: [],
  father: null,
  fatherId: 'ABC-EF',
  mother: null,
  motherId: 'XYZ',
  childIds: [],
  children: null,
  id: 'MA-XN'
};

var woman = {
  display: {
    name: "Eliza Jane Harris",
    gender: "Female",
    lifespan: "1599-1650",
    birthDate: "12 May 1599",
    birthPlace: "Mayfield, Iowa"
  },
  todos: [],
  father: null,
  fatherId: 'ABC-EF',
  mother: null,
  motherId: 'XYZ',
  childIds: [],
  children: null,
  id: 'WOM-AN'
};

function MakeGens(base, max, photo) {
  if (max <= 0) return null;
  var person = copy(base);
  person.father = MakeGens(man, max-1, photo);
  person.mother = MakeGens(woman, max-1, photo);
  person.photo = photo;
  person.photolink = 'http://google.com';
  person.todos = [];
  person.status = 'inactive';
  return person;
}

function RandGens(base, max) {
  if (max <= 0) return null;
  else if (max < 4 && Math.random() > 0.8) return null;
  var person = copy(base);
  person.todos = [];
  var num = parseInt(Math.random() * 3);
  for (var i=0; i<num; i++) {
    person.todos.push({});
  }

  person.father = RandGens(man, max-1);
  person.mother = RandGens(woman, max-1);
  person.status = randStatus();
  return person;
}

function randStatus() {
  return pick(['inactive', 'active', 'clean', 'complete']);
}

function pick(from) {
  return from[parseInt(Math.random() * from.length)];
}

function SlowGens(base, max, scope, stati) {
  if (max <= 0) return null;
  var person = copy(base);
  if (stati) {
    person.status = randStatus();
  }
  setTimeout(function () {
    person.father = SlowGens(man, max-1, scope, stati);
    scope.$digest();
  }, Math.random() * 300 + 200);
  setTimeout(function () {
    person.mother = SlowGens(woman, max-1, scope, stati);
  }, Math.random() * 300 + 200);
  return person;
}

function rc(){
  var chars = 'WERTYUIOPASDFGHJKLZXCVBNM';
  return chars[parseInt(Math.random() * chars.length)];
}

function randId() {
  var id = '';
  for (var i=0; i<7; i++) {
    if (i===4) id += '-';
    id += rc();
  }
  return id;
}

function makeFamilies(spousebase, spouses, maxChildren, scope) {
  var families = {}, family, kids, id;
  for (var i=0; i<spouses; i++) {
    family = [null];
    id = randId();
    setTimeout(function (family, id) {
      family[0] = copy(spousebase);
      family[0].id = id;
      family[0].status = randStatus();
      scope.$digest();
    }.bind(null, family, id), 200 + Math.random() * 300);

    kids = parseInt(Math.random() * (maxChildren - 2) + 2);
    for (var j=0; j<kids; j++) {
      family.push(null)
      setTimeout(function (family, j) {
        family[j + 1] = copy([man, woman][parseInt(2 * Math.random())]);
        family[j + 1].status = randStatus();
        scope.$digest();
      }.bind(null, family, j), 200 + Math.random() * 300);
    }
    families[id] = family;
    console.log(kids);
  }
  return families;
}

function Tester($scope) {
  $scope.boxes = RandGens(man, 5);
  $scope.otherBoxes = MakeGens(man, 5);
  $scope.printableBoxes = MakeGens(man, 9);
  $scope.slowBoxes = SlowGens(man, 7, $scope);

  $scope.photosBoxes = MakeGens(man, 7, 'thumb.jpg');
  $scope.photosConfig = {
    gens: 7,
    height: 1220,
    width: 1220,
    sweep: Math.PI*2,
    photos: true,
    center: {x: 610, y: 610},
    svgtips: true,
    printable: true,
    doubleWidth: false,
    ringWidth: 85
  };
  // With Kids
  $scope.kidsBoxes = SlowGens(man, 5, $scope, true, true);
  $scope.kidsBoxes.families = makeFamilies(woman, 1 + parseInt(Math.random() * 5), 15, $scope);
  setTimeout(function () {
    console.log('reload 2');
    $scope.kidsBoxes = null;
    $scope.$digest();
    $scope.kidsBoxes = SlowGens(man, 5, $scope, true, true);
    $scope.kidsBoxes.families = makeFamilies(woman, 1 + parseInt(Math.random() * 5), 15, $scope);
    $scope.$digest();
  }, 10000);
  setTimeout(function () {
    console.log('reload');
    $scope.kidsBoxes = null;
    $scope.$digest();
    $scope.kidsBoxes = SlowGens(man, 5, $scope, true, true);
    $scope.kidsBoxes.families = makeFamilies(woman, 1 + parseInt(Math.random() * 5), 15, $scope);
    $scope.$digest();
  }, 5000);
  $scope.indConfig = {
    gens: 5,
    height: 370,
    width: 420,
    // ringWidth: 40,
    center: {x: 210, y: 230},
    tips: true,
    doubleWidth: false,
    indicators: [true, true],
    onParent: function (el, person, node) {
      node.indicators[0].classed(pick('ok danger warning awesome'.split(' ')), true);
      node.indicators[1].classed(pick('ok danger warning awesome'.split(' ')), true);
    }
  };
  $scope.kidsConfig = {
    gens: 5,
    height: 170,
    width: 220,
    center: {x: 110, y: 130},
    tips: true,
    doubleWidth: false,
    onSpouse: function (el, person) {
      el.on('click', function () {
        console.log('clicked spouse', person);
        $scope.kidsBoxes = null;
        $scope.$digest();
        $scope.kidsBoxes = SlowGens(man, 5, $scope, true, true);
        $scope.$digest();
      });
    },
    onChild: function (el, person) {
      el.on('click', function () {
        console.log('clicked child', person);
        $scope.kidsBoxes = null;
        $scope.$digest();
        $scope.kidsBoxes = SlowGens(man, 5, $scope, true, true);
        $scope.$digest();
      });
    },
    onParent: function (el, person, node) {
      el.on('click', function () {
        console.log('clicked parent', person);
        $scope.kidsBoxes = null;
        $scope.$digest();
        $scope.kidsBoxes = SlowGens(man, 5, $scope, true, true);
        $scope.$digest();
      });
    }
  };
  $scope.slowConfig = {
    height: 400,
    radials: true,
    gens: 7,
    center: {x: 250, y: 300}
  };
  $scope.printableConfig = {
    height: 900,
    width: 1200,
    ringWidth: 40,
    radials: true,
    gens: 9,
    center: {x:600, y:600},
    printable: true
  };
  $scope.otherConfig = {
    gens: 4,
    radials: true,
    links: true
  };
  $scope.dl_printable = function () {
    var svg = document.getElementById('printable').firstChild
      , data = svgDownload('Example Printable', svg, fan.stylesheet);
    document.location = data;
  };
}

angular.module('test', ['fan']);

