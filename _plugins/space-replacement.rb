# This generator creates non-breaking spaces, thin spaces, dashes and similar glyphs

Jekyll::Hooks.register :site, :post_render do |site|
  Jekyll.logger.info  "                  * Replacing special spaces ..."

  def replace!(content)
    # Narrow no-break space between groups of digits.
    content.gsub!(/(?<=\d) (\d{3})\b/, "\u202f\\1")
    # No-break space before units.
    content.gsub!(/(?<=\d) (%|‰|€|$|°C|ppm|kg|k?m|mil\.)/, "\u00a0\\1")
    content.gsub!(/(?<=\d) ([kMGT]?(?:t CO|Wh?))\b/, "\u00a0\\1")
  end

  site.documents.each do |page|
    if not page.respond_to? :output
      Jekyll.logger.error "Undefined page.output for '#{page.path}'. Consider excluding this file"
      next
    end
    replace!(page.output)
  end

end
