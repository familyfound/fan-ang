
default: build
	@:

build: index.js fan.css template.js
	@component build --dev

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

docme: build
	mv build _build
	mv test _test
	mv components/visionmedia-mocha _vm
	git checkout gh-pages
	mv _build build
	mv _test test
	mv _vm components/visionmedia-mocha

.PHONY: clean example docme test testci
