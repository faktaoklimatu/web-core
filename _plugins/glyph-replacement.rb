# This generator creates non-breaking spaces, thin spaces, dashes and similar glyphs

Jekyll::Hooks.register :site, :post_render do |site|
  Jekyll.logger.info  "                  * Replacing special spaces ..."
  
  site.documents.each do |page|
    Jekyll.logger.error "Undefined page.output for '#{page.path}'. Consider excluding this file" if not page.respond_to? :output
    replace!(page.output)
  end

  def replace!(content)
    # Thin spaces before percent sign, permille sign and before groups of digits.
    content.gsub!(/(?<=\d) (%|‰|\d{3})/, '&#8239;\1')
    # Non-breaking spaces before units.
    content.gsub!(/(?<=\d) (°C|ppm|kg|mil\.)/, '&nbsp;\1')
    content.gsub!(/(?<=\d) ([kMGT]?(?:t CO|Wh?))/, '&nbsp;\1')
  end
  
end
