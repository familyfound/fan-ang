
var angular = require('angularjs')
  // , settings = require('settings')
  // , angularSettings = require('angular-settings')
  , copy = require('deep-copy')
  , log = require('domlog')
  , fan = require('fan');

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
  children: null
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
  children: null
};

function MakeGens(base, max) {
  if (max <= 0) return null;
  var person = copy(base);
  person.father = MakeGens(man, max-1);
  person.mother = MakeGens(woman, max-1);
  person.todos = [];
  person.status = 'working';
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
  person.status = ['working', 'clean', 'complete'][parseInt(Math.random()*3)];
  return person;
}

function randStatus() {
  return ['working', 'clean', 'complete'][parseInt(Math.random()*3)]; 
}

function SlowGens(base, max, scope, stati, root) {
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
  if (root) {
    person.children = [];
    for (var i=0; i<10; i++) {
      person.children.push(null);
      setTimeout(function (i) {
        person.children[i] = copy(base);
        person.children[i].status = randStatus();
        scope.$digest();
      }.bind(null, i), Math.random()*300 + 200);
    }
  }
  return person;
}

var one = {
  display: {
    name: "Jared Forsyth",
    gender: "Male",
    lifespan: "1599-1634",
    birthDate: "12 July 1599",
    birthPlace: "Mayfield, Iowa"
  },
  todos: [],
  father: {
    display: {
      name: "George James Forsyth",
      gender: "Male",
      lifespan: "1560-1612",
      birthDate: "Unknown",
      birthPlace: "Unknown"
    },
    todos: ["hello"],
    father: null,
    mother: null
  },
  mother: {
    display: {
      name: "Eliza Jane Forsyth",
      gender: "Female",
      lifespan: "1560-1612",
      birthDate: "Unknown",
      birthPlace: "Unknown"
    },
    todos: [],
    father: null,
    mother: null
  }
};

function Tester($scope) {
  $scope.boxes = RandGens(man, 5);
  $scope.otherBoxes = MakeGens(man, 5);
  $scope.slowBoxes = SlowGens(man, 7, $scope);
  $scope.kidsBoxes = SlowGens(man, 5, $scope, true, true);
  setTimeout(function () {
    console.log('reload');
    $scope.kidsBoxes = null;
    $scope.$digest();
    $scope.kidsBoxes = SlowGens(man, 5, $scope, true, true);
    $scope.$digest();
  }, 5000);
  $scope.kidsConfig = {
    gens: 5,
    tips: true,
    onNode: function (el, person) {
      el.on('click', function () {
        console.log('clicked', person);
        $scope.kidsBoxes = null;
        $scope.$digest();
        $scope.kidsBoxes = SlowGens(man, 5, $scope, true, true);
        $scope.$digest();
      });
    }
  };
  $scope.slowConfig = {
    height: 400,
    gens: 7,
    center: {x: 250, y: 300}
  };
  $scope.otherConfig = {
    gens: 5,
    links: true
  };
}

angular.module('test', ['fan']);
/*
  .factory('ffperson', function () {
    return function (pid, next) {
      log('person api', pid, next);
      setTimeout(function () {
        next({name: 'Edward'});
      }, 1000);
    }
  })
  .factory('ffApi', function () {
    return log;
  });*/
    

