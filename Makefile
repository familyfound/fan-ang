
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

example: build
	@${open} test/example.html

docme: build
	mv build _build
	mv test _test
	git checkout gh-pages
	mv _build build
	mv _test test

.PHONY: clean example docme