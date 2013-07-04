
# fan

  A Fan angular directive for displaying a family tree

## Installation

    $ component install familyfound/fan

## Features:

- variable sweep fan
- double-width past the second generation
- family line separators
- tooltips
- person links
- person onclick
- multiple spouses and associated children listed below the fan
- angular $watches on parents, children, and status to update the fan as data
  is loaded
- color-coded status

  - inactive
  - active
  - clean
  - complete

## Config (passed in to data-config as raw JSON or a variable name in the parent scope)
Note: config is not currently $watched.

- el: element to attach to (defaults to the current element)
- width: num (500); of SVG
- height: num (200); of SVG
- childHoriz: num (6); how many children per line
- center: `{x: 250, y: 150}` for the center of the fan
- ringWidth: num (20); base width of each ring
- doubleWidth: bool (true); rings past 2nd gen have double width
- gens: num (0); number of gens for which to draw lines
- links: (false) bool or fn(person) -> str; if true, then the link is generator for the given person.id
- tips: bool (false); show tooltip on hover "{name} {lifespan}"
- removeRoot: bool (false); delete the central node

## Possibly upcoming features

- display text in each ring
- todo count displayed as badge
- $watch config? Is it useful?
- Separate this into two components, one that's a generic fan, and the other
  that adds on familyfound stuff.

## rootPerson

The `data-fan` attribute contains the name of a variable in the parent scope,
which should look something like the following. Any person, mother, or child
can also be `null`.

    Person:
    {
      display: { name, gender, lifespan, birthDate, birthPlace }
      id: str
      status: inactive | active | clean | complete
      todos: [{}, ...]
      father: person
      mother: person
      families: {
        motherId: [mother, child[, child...]]
        ...
      }
    }

### $Watches

#### For all people
- status
- father
- mother

#### For the root person
- families[motherId][i]

## License

  MIT
