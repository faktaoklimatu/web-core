INFOGRAPHICS_FOLDER=assets/generated
INFOGRAPHICS_SRC=$(wildcard _infographics/*/*.pdf _studies/*.pdf)
INFOGRAPHICS_DST=$(addprefix $(INFOGRAPHICS_FOLDER)/,$(notdir $(INFOGRAPHICS_SRC)))
DATASETS_FOLDER=assets/datasets
DATASETS_SRC=$(wildcard _datasets/*.md)
DATASETS_DST=$(addprefix $(DATASETS_FOLDER)/,$(notdir $(DATASETS_SRC:.md=.png)))
STUDIES_FOLDER=assets/studies
STUDIES_SRC=$(wildcard _studies/*.jpg _studies/*.png)
STUDIES_DST=$(addprefix $(STUDIES_FOLDER)/,$(notdir $(STUDIES_SRC)))
COVERS_FOLDER=assets/covers
COVERS_SRC=$(wildcard _explainers/*.jpg)
COVERS_DST=$(addprefix $(COVERS_FOLDER)/,$(notdir $(COVERS_SRC)))

PODMAN=podman
CONTAINER_IMAGE=factsonclimate/web
CONTAINER_NAME=factsonclimate
# Get site URL with protocol
URL:=`cat _config.yml | grep -m 1 "^url: " | sed 's/^url: //' | sed 's/[\r\n]//g'`

all: build

# === Container management targets  ===

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

# === Core build, test and deploy targets  ===

bundle-install:
	bundle install

build: $(INFOGRAPHICS_DST) $(STUDIES_DST) $(COVERS_DST) generated-files bundle-install

local: $(INFOGRAPHICS_DST) $(STUDIES_DST) $(COVERS_DST) generated-files bundle-install
	bundle exec jekyll serve --trace

check: build
	@echo "Running internal tests on the generated site using html-proofer ..."
	bundle exec ruby utils/test.rb
	@echo "Running tests on the external content using html-proofer ..."
	-bundle exec ruby utils/test.rb external

# To run lighthouse, you need Google Chrome and Lighthous CLI (npm install -g @lhci/cli@0.7.x)
lighthouse: build
	lhci autorun

deploy-preview: build
	firebase hosting:channel:deploy $(BRANCH)

# === Targets for generating files  ===

generated-files: _config.yml humans.txt .well-known/security.txt robots.txt firebase.json .firebaserc

_config.yml: config-templates/_config.global.yml ../_config.local.yml
	cat $^ >$@

humans.txt: ../CONTRIBUTORS.md
	@echo "Creating humans.txt file ..."
	cp ../CONTRIBUTORS.md humans.txt

.well-known/security.txt: config-templates/security.txt _config.yml
	mkdir -p .well-known
	sed "s|{{ URL }}|$(CONFIG_URL)|" $< >$@

robots.txt: config-templates/robots.txt _config.yml
	sed "s|{{ URL }}|$(CONFIG_URL)|" $< >$@


$(INFOGRAPHICS_FOLDER)/%.pdf: _infographics/*/%.pdf
	@utils/convert-infographic.sh $< $@

$(INFOGRAPHICS_FOLDER)/%.pdf: _studies/%.pdf
	@utils/convert-infographic.sh $< $@

$(STUDIES_FOLDER)/%: _studies/%
	mkdir -p $(@D)
	cp $< $@

$(COVERS_FOLDER)/%: _explainers/%
	@utils/convert-cover.sh $< $@

dataset-images: $(DATASETS_DST)

$(DATASETS_FOLDER)/%.png: _datasets/%.md
	@bash utils/download-dataset-preview.sh $< $@

.PHONY: all build local clean clean-build bundle-install
.PHONY: container build-container delete-container
