help:		## Show this help.
	@sed -ne '/@sed/!s/## //p' $(MAKEFILE_LIST)

check:		## Make sure the OE_USERNAME and OE_PASSWORD environment variables are set
ifndef OE_USERNAME
	$(error OE_USERNAME IS UNDEFINED)
endif
ifndef OE_PASSWORD
	$(error OE_PASSWORD IS UNDEFINED)
endif

install:	## Install the Js dependencies from NPM
	-@npm install

# check the exit status after `make lint` with `echo "Exit status: $?"`
lint:		## Apply the linter to the project (ESLint)
	-@npm run lint

test: check	## Invoke this as `OE_USERNAME=foo OE_PASSWORD=bar make test`
	@npm run test
