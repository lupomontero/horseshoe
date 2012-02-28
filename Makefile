VOWS=./node_modules/vows/bin/vows
JSLINT=./node_modules/jslint/bin/jslint.js
DOCCO=./node_modules/docco/bin/docco

.PHONY: all

all: jslint runtests doc

jslint:
	@echo "Running jslint..."
	@find ./lib -name "*.js" -print0 | xargs -0 ${JSLINT} --indent 2 --nomen \
        --sloppy --plusplus

runtests:
	@echo "Running tests..."
	@find ./test -name "*.js" -print0 | xargs -0 ${VOWS} --spec

docs: clean
	@echo "Running docco..."
	@find ./lib -name "*.js" -print0 | xargs -0 ${DOCCO}

clean:
	@rm -rf docs
