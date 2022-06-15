module Jekyll
  module PodcastRedirectFilter
    def get_url(input)
      if input["layout"] == @context.registers[:site].config["podcast-redirect"]["layout"]
        @context.registers[:site].config["podcast-redirect"]["site"] + input.url
      else
        input.url
      end
    end
  end
end

Liquid::Template.register_filter(Jekyll::PodcastRedirectFilter)