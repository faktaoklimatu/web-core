# Facts on climate: Web core

This repository contains the core part of our websites with climate change infographics. The mission of the whole project is to change how people talk and think about climate change and climate policies. The deployed websites can be found on [faktaoklimatu.cz](https://faktaoklimatu.cz) (in Czech, currently the biggest site), [faktyoklime.sk](https://faktyoklime.sk) (in Slovak) and [factsonclimate.org](https://factsonclimate.org) (in English, currently only a titlepage placeholder).

## Local website build

To build the website, a Linux environment is advisable (WSL in Windows 10 is sufficient). Currently tested systems are Ubuntu 20.10+, Fedora 33+ and Windows 10 WSL-1. There are two options to build the website: local installation or container-based installation. Don't mix local and container-based build. If you do, you may need to hard-clean the build using `make clean-build`.

### Local installation

The local installation has the following prerequisites:

* Ruby developer environment (`ruby-dev`)
* GNU Make (`make`, often included in meta-packages such as `build-essential`)
* Jekyll and Bundler (`jekyll`, `bundler`)
* Inkscape of version 1.0 or higher (`inkscape`)
* ImageMagic (`imagemagick`)

In Ubuntu 20.10 or higher, you can install all dependencies with `sudo apt install jekyll ruby bundler inkscape build-essential`. After installation, you can build the website by running `make local -j4`.

### Container-based installation

* For container management, use [Podman](https://podman.io) or [Docker](https://www.docker.com/)
* If your distribution uses SELinux, you may need to adjust the folder's security context with `sudo chcon -Rt svirt_sandbox_file_t .`
* For local website serve and container management, use the Make targets `container`, `build-container` and `delete-container`

## Interaction with the localized repository

TBA Git submodules basics, more details in the [Notion document](https://www.notion.so/faktaoklimatu/Workflow-GitHub-4c5b294731dc4f9a8b2203daefcff432).
