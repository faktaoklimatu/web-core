require 'html-proofer'

class CheckBuildErrors < ::HTMLProofer::Check
    def run
        @html.css('div.build-error').each do |node|
            @div = create_element(node)
            add_issue("Build error", line: @div.line, content: node.inner_html)
        end
    end
end

options = {
    :assume_extension => true,
    :check_favicon => true,
    :check_html => true,
    :check_img_http => true,
    :disable_external => true
}

options_external = {
    :assume_extension => true,
    :external_only => true,
    :typhoeus => {
        :connecttimeout => 30,    # default: 10
        :timeout => 60            # default: 30
    },
    :cache => {
        :storage_dir => '.cache/.htmlproofer',
        :timeframe => '7d'
    },
    # :log_level => :debug
}

begin
    if ARGV[0] == "external"
        HTMLProofer.check_directory("./_site", options_external).run
    else
        HTMLProofer.check_directory("./_site", options).run
    end
rescue => msg
    puts "#{msg}"
    exit(false)
end
