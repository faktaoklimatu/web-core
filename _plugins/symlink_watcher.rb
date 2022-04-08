# Loosely based on https://github.com/willnorris/willnorris.com/blob/jekyll/src/_plugins/symlink_watcher.rb

require "find"
require "jekyll-watch"

module Jekyll
  module Watcher
    def build_listener_with_symlinks(site, options)
      src = options["source"]
      dirs = [src]
      # Quite a hack: add explicitly symlink dirs that have no directories themselves. This assures content of such dirs
      # is watched for changes but that content of subdirs of such dirs is not watched twice for changes.
      Find.find(src).each do |f|
        if File.directory?(f) and File.symlink?(f)
          has_subdirs = false
          Dir.entries(f).each do |item|
            has_subdirs = true if !item.start_with?('.') and File.directory?(f + "/" + item)
          end
          dirs << f if !subdirs
        end
      end

      require "listen"
      Listen.to(
        *dirs,
        :ignore => listen_ignore_paths(options),
        :force_polling => options['force_polling'],
        &listen_handler_with_symlinks(site)
      )
    end

    def listen_handler_with_symlinks(site)
      proc do |modified, added, removed|
        t = Time.now
        c = modified + added + removed
        n = c.length

        Jekyll.logger.info "Regenerating:",
                            "#{n} file(s) changed at #{t.strftime("%Y-%m-%d %H:%M:%S")}"

        c.each do |path| 
          if path[site.source]
            Jekyll.logger.info "", path["#{site.source}/".length..-1]
          else
            Jekyll.logger.info "", path
          end
        end
        process(site, t)
      end
    end

    alias_method :build_listener_without_symlinks, :build_listener
    alias_method :build_listener, :build_listener_with_symlinks
  end
end
