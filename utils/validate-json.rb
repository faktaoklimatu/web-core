require 'json'

if ARGV.length != 1
  puts "Usage: #{$0} <input_file.json>"
  exit 1
end

filename = ARGV.first

begin
  JSON.parse(File.read(filename))
rescue Errno::ENOENT
  puts "File '#{filename}' does not exist"
  exit 1
rescue JSON::ParserError => error
  puts "File '#{filename}' is not valid JSON"
  puts "Exception: #{error}"
  exit 1
end

puts "File '#{filename}' is valid JSON"
