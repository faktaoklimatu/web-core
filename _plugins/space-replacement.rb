# This generator creates non-breaking spaces, thin spaces, dashes and similar glyphs

Jekyll::Hooks.register :site, :post_render do |site|
  Jekyll.logger.info  "                  * Replacing special spaces ..."

  def replace!(content)
    return if content.nil?
    # Narrow no-break space between groups of digits.
    content.gsub!(/(?<=\d) (\d{3})\b/, "\u202f\\1")
    # No-break space before physical units.
    content.gsub!(/(?<=\d) (°C|K|ppm|k?g|[kc]?m|[kMGT]?(?:t CO|Wh?))\b/, "\u00a0\\1")
    # Note that we do not use the word boundary (\b) here as all the final
    # matching characters are non-word characters.
    content.gsub!(/(?<=\d) (%|‰|€|\$|mil\.|mld\.)/, "\u00a0\\1")
  end

  site.documents.each do |page|
    if not page.respond_to? :output
      Jekyll.logger.error "Undefined page.output for '#{page.path}'. Consider excluding this file"
      next
    end
    replace!(page.output)
  end
end
