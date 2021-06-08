require "jekyll"
require "htmlbeautifier"

module Jekyll
  module Beautify
    def self.init(site)
      config = site.config
      @include_paths = (config["html-beautify"] && config["html-beautify"]["include"]) || []
    end

    def self.include?(path)
      return @include_paths.any? { |pattern| File.fnmatch(pattern, path) }
    end

    def self.process(output)
      return HtmlBeautifier.beautify output
    end
  end

  Hooks.register :site, :after_reset do |jekyll|
    Jekyll::Beautify.init(jekyll)
  end

  Hooks.register :documents, :post_render do |doc|
    next if !Jekyll::Beautify::include?(doc.relative_path)
    doc.output = Jekyll::Beautify::process(doc.output)
  end

  Hooks.register :pages, :post_render do |page|
    next if !Jekyll::Beautify::include?(page.relative_path)
    page.output = Jekyll::Beautify::process(page.output)
  end
end
