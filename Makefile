INFOGRAPHICS_FOLDER=assets/generated
INFOGRAPHICS_SRC=$(wildcard _infographics/*/*.pdf _studies/*.pdf)
INFOGRAPHICS_DST=$(addprefix $(INFOGRAPHICS_FOLDER)/,$(notdir $(INFOGRAPHICS_SRC)))
DATASETS_FOLDER=assets/datasets
DATASETS_SRC=$(wildcard _datasets/*.md)
DATASETS_DST=$(addprefix $(DATASETS_FOLDER)/,$(notdir $(DATASETS_SRC:.md=.png)))
STUDIES_FOLDER=assets/studies
STUDIES_SRC=$(wildcard _studies/*.jpg _studies/*.png)
STUDIES_DST=$(addprefix $(STUDIES_FOLDER)/,$(notdir $(STUDIES_SRC)))

PODMAN=podman
CONTAINER_IMAGE=factsonclimate/web
CONTAINER_NAME=factsonclimate
# Get site URL with protocol
URL:=`cat _config.yml | grep -m 1 "^url: " | sed 's/^url: //' | sed 's/[\r\n]//g'`

all: build

# Phony targets for container management.
container:
	if $(PODMAN) inspect $(CONTAINER_NAME) >/dev/null 2>&1 ; \
		then $(PODMAN) start -a $(CONTAINER_NAME) ||: ; \
		else make build-container; fi

build-container:
	$(PODMAN) build --file Dockerfile --tag $(CONTAINER_IMAGE) .
	$(PODMAN) run --interactive --tty --name $(CONTAINER_NAME) \
		--volume $$PWD/..:/srv/jekyll --publish 4000:4000 $(CONTAINER_IMAGE) ||:

delete-container:
	$(PODMAN) rm --force $(CONTAINER_NAME)

bundle-install:
	bundle install

_config.yml: _config.global.yml ../_config.local.yml
	cat $^ >$@

CNAME: ../CNAME
	cp $< $@

humans.txt:
	@echo "Creating humans.txt file ..."
	cp ../CONTRIBUTORS.md humans.txt

.well-known/security.txt: .well-known-templates/security.txt _config.yml
	mkdir -p .well-known
	sed "s|{{ URL }}|$(URL)|" $< >$@

robots.txt: .well-known-templates/robots.txt _config.yml
	sed "s|{{ URL }}|$(URL)|" $< >$@

local: $(INFOGRAPHICS_DST) $(STUDIES_DST) bundle-install _config.yml CNAME humans.txt robots.txt .well-known/security.txt
	bundle exec jekyll serve --trace

build: $(INFOGRAPHICS_DST) $(STUDIES_DST) bundle-install _config.yml CNAME humans.txt robots.txt .well-known/security.txt
	@echo "Building the website using Jekyll ..."
	@if [ "$(TRAVIS_BRANCH)" = "master" ]; then echo "=== Production build ==="; else echo "=== Development build ==="; fi
	if [ "$(TRAVIS_BRANCH)" = "master" ]; then JEKYLL_ENV=production bundle exec jekyll build; else bundle exec jekyll build; fi

check: build
	@echo "Running internal tests on the generated site using html-proofer ..."
	bundle exec ruby utils/test.rb
	@echo "Running tests on the external content using html-proofer ..."
	-bundle exec ruby utils/test.rb external

clean:
	rm -rf $(INFOGRAPHICS_FOLDER)
	rm -rf $(STUDIES_FOLDER)

$(INFOGRAPHICS_FOLDER)/%.pdf: _infographics/*/%.pdf
	@utils/convert-infographic.sh $< $@

$(INFOGRAPHICS_FOLDER)/%.pdf: _studies/%.pdf
	@utils/convert-infographic.sh $< $@

$(STUDIES_FOLDER)/%: _studies/%
	mkdir -p $(@D)
	cp $< $@

dataset-images: $(DATASETS_DST)

$(DATASETS_FOLDER)/%.png: _datasets/%.md
	@bash utils/download-dataset-preview.sh $< $@

.PHONY: all build local clean bundle-install
.PHONY: container build-container delete-container
