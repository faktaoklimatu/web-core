require 'html-proofer'

class CheckBuildErrors < ::HTMLProofer::Check
    def run
        @html.css('div.build-error').each do |node|
            @div = create_element(node)
            add_issue('Build error', line: @div.line, content: node.inner_html)
        end
    end
end

options = {
    :allow_missing_href => true,
    :checks => ['Favicon', 'Images', 'Links', 'Scripts'],
    :disable_external => true,
    :enforce_https => false,
}

options_external = {
    :allow_missing_href => true,
    :typhoeus => {
        :connecttimeout => 30,    # default: 10
        :timeout => 60,           # default: 30
    },
    :cache => {
        :storage_dir => '.cache/.htmlproofer',
        :timeframe => {
            :external => '1w',
            :internal => '1w',
        },
    },
}

begin
    if ARGV[0] == 'external'
        HTMLProofer.check_directory('./_site', options_external).run
    else
        HTMLProofer.check_directory('./_site', options).run
    end
rescue => msg
    puts "#{msg}"
    exit(false)
end
