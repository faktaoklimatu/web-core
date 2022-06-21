TOPICS_FOLDER=assets/topics
TOPICS_SRC=$(wildcard collections/_topics/*.svg)
TOPICS_DST=$(addprefix $(TOPICS_FOLDER)/,$(notdir $(TOPICS_SRC)))
INFOGRAPHICS_FOLDER=assets/generated
INFOGRAPHICS_SRC=$(wildcard collections/_infographics/*/*.pdf collections/_studies/*.pdf)
INFOGRAPHICS_DST=$(addprefix $(INFOGRAPHICS_FOLDER)/,$(notdir $(INFOGRAPHICS_SRC)))
DATASETS_FOLDER=assets/datasets
DATASETS_SRC=$(wildcard collections/_datasets/*.md)
DATASETS_DST=$(addprefix $(DATASETS_FOLDER)/,$(notdir $(DATASETS_SRC:.md=.png)))
STUDIES_FOLDER=assets/studies
STUDIES_SRC=$(wildcard collections/_studies/*.jpg _studies/*.png)
STUDIES_DST=$(addprefix $(STUDIES_FOLDER)/,$(notdir $(STUDIES_SRC)))
COVERS_FOLDER=assets/covers
COVERS_SRC=$(wildcard collections/_explainers/*.jpg)
COVERS_DST=$(addprefix $(COVERS_FOLDER)/,$(notdir $(COVERS_SRC)))
EPISODES_FOLDER=assets/episodes
EPISODES_SRC=$(wildcard collections/_episodes/*.jpg)
EPISODES_DST=$(addprefix $(EPISODES_FOLDER)/,$(notdir $(EPISODES_SRC)))

PODMAN=podman
CONTAINER_IMAGE=factsonclimate/web
CONTAINER_NAME=factsonclimate
# Set branch name (from Travis or locally)
BRANCH:=$(or $(TRAVIS_BRANCH),`cd .. && git branch --show-current`)
# Load deploy values from configuration
CONFIG_FIREBASE_PROJECT:=`cat _config.yml | ruby -ryaml -e "inventory = YAML::load(STDIN.read); puts inventory['deploy']['firebase-project']"`
CONFIG_CORS_REPORT_URI:=`cat _config.yml | ruby -ryaml -e "inventory = YAML::load(STDIN.read); puts inventory['deploy']['cors-report-uri']"`

all: build

# === Container management targets  ===

container:
	if $(PODMAN) inspect $(CONTAINER_NAME) >/dev/null 2>&1 ; \
		then $(PODMAN) start -a $(CONTAINER_NAME) ||: ; \
		else make build-container; fi

build-container:
	$(PODMAN) build --file Dockerfile --tag $(CONTAINER_IMAGE) .
	$(PODMAN) run --interactive --tty --name $(CONTAINER_NAME) \
		--volume $$PWD/..:/srv/jekyll:z --publish 4000:4000 $(CONTAINER_IMAGE) ||:

delete-container:
	$(PODMAN) rm --force $(CONTAINER_NAME)

# === Core build, test and deploy targets  ===

bundle-install:
	bundle install

build: $(TOPICS_DST) $(INFOGRAPHICS_DST) $(STUDIES_DST) $(COVERS_DST) $(EPISODES_DST) generated-files bundle-install
	@echo "Building the website using Jekyll..."
	@if [ "$(BRANCH)" = "master" ]; then echo "=== Production build ($(BRANCH)) ==="; else echo "=== Development build ($(BRANCH)) ==="; fi
	@if [ "$(BRANCH)" = "master" ]; then JEKYLL_ENV=production bundle exec jekyll build; else bundle exec jekyll build; fi

local: $(TOPICS_DST) $(INFOGRAPHICS_DST) $(STUDIES_DST) $(COVERS_DST) $(EPISODES_DST) generated-files bundle-install
	bundle exec jekyll serve --trace --host 0.0.0.0

check: build
	@echo "Validating generated search index..."
	bundle exec ruby utils/validate-json.rb _site/search.json
	@echo "Validating generated Atom feed..."
	bundle exec ruby utils/validate-xml.rb _site/feed.xml
	@echo "Running internal tests on the generated site using html-proofer..."
	bundle exec ruby utils/test.rb
	@echo "Running tests on the external content using html-proofer..."
	-bundle exec ruby utils/test.rb external

# To run lighthouse, you need Google Chrome and Lighthous CLI (npm install -g @lhci/cli@0.7.x)
lighthouse: build
	lhci autorun

deploy-preview: build
	./firebase hosting:channel:deploy $(BRANCH) --only preview

deploy-production: build
	./firebase deploy --only hosting:production

# === Targets for generating files  ===

generated-files: _config.yml humans.txt firebase.json .firebaserc favicon.ico

_config.yml: _config.global.yml ../_config.local.yml
	@echo "Generating Jekyll cofiguration..."
	cat $^ >$@

humans.txt: ../CONTRIBUTORS.md
	@echo "Creating humans.txt file..."
	cp $^ $@

firebase.json: deploy-templates/firebase.json _config.yml
	sed "s|{{ CORS_REPORT_URI }}|$(CONFIG_CORS_REPORT_URI)|" $< >$@

.firebaserc: deploy-templates/.firebaserc _config.yml
	sed "s|{{ FIREBASE_PROJECT }}|$(CONFIG_FIREBASE_PROJECT)|" $< >$@

favicon.ico: assets-local/favicon.ico
	@echo "Copying favicon..."
	cp $^ $@

$(TOPICS_FOLDER)/%: collections/_topics/%
	mkdir -p $(@D)
	cp $< $@

$(INFOGRAPHICS_FOLDER)/%.pdf: collections/_infographics/*/%.pdf
	@utils/convert-infographic.sh $< $@

$(INFOGRAPHICS_FOLDER)/%.pdf: collections/_studies/%.pdf
	@utils/convert-infographic.sh $< $@

$(STUDIES_FOLDER)/%: collections/_studies/%
	mkdir -p $(@D)
	cp $< $@

$(COVERS_FOLDER)/%: collections/_explainers/%
	@utils/convert-cover.sh $< $@

dataset-images: $(DATASETS_DST)

$(DATASETS_FOLDER)/%.png: collections/_datasets/%.md
	@bash utils/download-dataset-preview.sh $< $@

$(EPISODES_FOLDER)/%: collections/_episodes/%
	mkdir -p $(@D)
	cp $< $@

# === Cleaning targets  ===

clean:
	rm -rf $(TOPICS_FOLDER)
	rm -rf $(INFOGRAPHICS_FOLDER)
	rm -rf $(STUDIES_FOLDER)
	rm -rf $(COVERS_FOLDER)
	rm -rf $(EPISODES_FOLDER)
	rm -f humans.txt _config.yml firebase.json .firebaserc
	rm -rf _site

clean-build: clean
	rm -rf vendor
	rm -rf .cache

# === Target flags  ===

.PHONY: all build local clean clean-build bundle-install generated-files
.PHONY: container build-container delete-container
