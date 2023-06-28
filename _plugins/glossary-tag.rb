# This generator implements the glossary tag (<glossary>)

require 'nokogiri'

module Jekyll
  class GlossaryTag
    class << self
      ###
      # Replace '<glossary id="xxx">...</glossary>' tags in document's HTML output with
      # likns to individual glossary items.
      def process(content, site)
        # Glossary items from the YAML file in _data/glossary.yaml.
        glossary = site.data['glossary']

        # Prepare the template for referencing glossary items.
        template_path = File.join(site.source, '_includes', 'glossary.html')
        template = site.liquid_renderer.file(template_path).parse(File.read(template_path))

        # Make sure the settings for rendering the template are the same as across
        # the whole site.
        liquid_options = site.config['liquid']
        template_info = {
          :registers        => { :site => site },
          :strict_filters   => liquid_options['strict_filters'],
          :strict_variables => liquid_options['strict_variables'],
        }

        # Parse the contents as an HTML5 fragment.
        doc = Nokogiri::HTML5.fragment(content)

        # Replace each of the glossary references with the rendered template.
        doc.search('glossary').each do |element|
          id = element['id']
          # Require that each reference specify the ID of the referenced item.
          if id.nil?
            Jekyll.logger.abort_with "glossary-tag: tag has no id attribute"
            next
          end

          # Require that the tag have contents, i.e. disallow <glossary id="xxx" />
          if element.children.empty?
            Jekyll.logger.abort_with "glossary-tag: tag '#{id}' cannot be empty"
            next
          end

          # Find the definition of the corresponding item in the glossary.
          item = glossary.find { |it| it['id'] == id }
          if item.nil?
            Jekyll.logger.abort_with "glossary-tag: item with id '#{id}' does not exist in glossary"
            next
          end

          # Render the template and replace the original element.
          context = { 'item' => item, 'inner' => element.inner_html, 'glossary-slug' => site.config['slugs']['glossary'] }
          new_element = template.render!(context, template_info).strip
          element.replace new_element
        end

        doc.to_html
      end
    end
  end
end

class Jekyll::Converters::Markdown::FaktaOKlimatuProcessor < Jekyll::Converters::Markdown::KramdownParser
  def convert(content)
    content = Jekyll::GlossaryTag.process(content, Jekyll.sites[0])
    super
  end
end
