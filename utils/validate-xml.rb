require 'nokogiri'

if ARGV.length != 1
  puts "Usage: #{$0} <input_file.xml>"
  exit 1
end

filename = ARGV.first

begin
  doc = Nokogiri::XML(File.read(filename))
rescue Errno::ENOENT
  puts "### File '#{filename}' does not exist"
  exit 1
end

if doc.errors.length > 0
  puts "### File '#{filename}' is not valid XML"
  doc.errors.each { |x| puts "Reason: #{x}" }
  exit 1
end

puts "### File '#{filename}' is valid XML"
