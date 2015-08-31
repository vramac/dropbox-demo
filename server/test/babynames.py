#!/usr/bin/python
# Copyright 2010 Google Inc.
# Licensed under the Apache License, Version 2.0
# http://www.apache.org/licenses/LICENSE-2.0

# Google's Python Class
# http://code.google.com/edu/languages/google-python-class/

import sys
import re

"""Baby Names exercise

Define the extract_names() function below and change main()
to call it.

For writing regex, it's nice to include a copy of the target
text for inspiration.

Here's what the html looks like in the baby.html files:
...
<h3 align="center">Popularity in 1990</h3>
....
<tr align="right"><td>1</td><td>Michael</td><td>Jessica</td>
<tr align="right"><td>2</td><td>Christopher</td><td>Ashley</td>
<tr align="right"><td>3</td><td>Matthew</td><td>Brittany</td>
...

Suggested milestones for incremental development:
 -Extract the year and print it
 -Extract the names and rank numbers and just print them
 -Get the names data into a dict and print it
 -Build the [year, 'name rank', ... ] list and print it
 -Fix main() to use the extract_names list
"""

def extract_names(filename):
  """
  Given a file name for baby.html, returns a list starting with the year string
  followed by the name-rank strings in alphabetical order.
  ['2006', 'Aaliyah 91', Aaron 57', 'Abagail 895', ' ...]
  """
  # +++your code here+++
  f = open(filename, 'r')
  REGEX = "Popularity in"
  print "Opening file..."
  year = 0
  ranking = 0
  name_ranking_dict = {}
  output_list = list()
  for line in f:
  	match_obj = re.search(r'Popularity in', line)
  	if match_obj:
  		year = line[match_obj.end()+1:match_obj.end()+5]
  	match_obj2 = re.search(r'tr align',line)
  	if match_obj2:
  		match_obj3 = re.search(r'<td>.*</td>',line)
  		if match_obj3:
  			start_off = 4
  			end_off = 5
  			end_tag = "</td>"
  			ranking = match_obj3.group(0)[start_off:re.search(end_tag,match_obj3.group()).end()-end_off]
  			#print "End Tag: " + str(re.search(end_tag,match_obj3.group()).end())
  			#print "Ranking: " + ranking
  			name_substr = match_obj3.group(0)[re.search(end_tag,match_obj3.group()).end():]
  			male_baby_name = name_substr[start_off:re.search(end_tag,name_substr).end()-end_off]
  			name_substr2 = name_substr[re.search(end_tag,name_substr).end():]
  			female_baby_name = name_substr2[start_off:re.search(end_tag,name_substr2).end()-end_off]
  			#print "Rank: %s, Names: %s, %s " %(ranking, male_baby_name, female_baby_name)
  			name_ranking_dict[male_baby_name]= ranking
  			name_ranking_dict[female_baby_name]= ranking
  output_list.append(year)
  key_set = name_ranking_dict.keys()
  key_set.sort()
  for key in key_set:
  	#print "dict values %s, %s" %(key,name_ranking_dict[key])
  	output_list.append(key + " " + name_ranking_dict[key] )
  f.close()
  print "Closed file..."
  return output_list


def main():
  # This command-line parsing code is provided.
  # Make a list of command line arguments, omitting the [0] element
  # which is the script itself.
  args = sys.argv[1:]

  if not args:
    print 'usage: [--summaryfile] file [file ...]'
    sys.exit(1)

  # Notice the summary flag and remove it from args if it is present.
  summary = False
  if args[0] == '--summaryfile':
	summary = True
	del args[0]

  # +++your code here+++
  # For each filename, get the names, then either print the text output
  # or write it to a summary file
  for filename in args:
	r_list = extract_names(filename)	
	text = '\n'.join(r_list) + '\n'
	print text
  	
if __name__ == '__main__':
  main()
