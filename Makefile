
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

example: build
	open test/example.html

.PHONY: clean
