
default: build
	@:

build: index.js fan.css template.js stylesheet.js
	@component build --dev

stylesheet.js: fan.css
	@component convert $<
	@mv fan.css.js stylesheet.js

template.js: template.html
	@component convert $<

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

# open browser correctly in mac or linux
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
		open := google-chrome
endif
ifeq ($(UNAME_S),Darwin)
		open := open
endif

test: build
	@${open} test/index.html

example: build
	@${open} test/example.html

testci: build
	@./node_modules/.bin/testem test/testem.json

docme: components build
	mv build _build
	mv test _test
	mv components/visionmedia-mocha _vm
	git checkout gh-pages
	rm -rf build test components/visionmedia-mocha
	mv _build build
	mv _test test
	mv _vm components/visionmedia-mocha

.PHONY: clean example docme test testci
