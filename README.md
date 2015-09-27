blog
====

My personal dual-language blog.

![Build Status](https://travis-ci.org/DiscoViking/blog.svg?branch=master)

About
-----

## About me
My name is Ryan, I'm a software engineer, and over the next 6 months I'm relocating to live in Tokyo.
This blog will track my experiences throughout this period and beyond.
The aim is for the blog to be entirely dual-language, and I will make every effort to write every post in both English and Japanese

## About the blog
I'm writing the blog myself from the ground up.  The whole thing is open-source and available on [github](http://github.com/discoviking/blog).
Why am I doing this?

  - No existing blog platform does dual-language in exactly the way I want to.
  - I need practice using Javascript.  This is my first real project using it.
  - Because it's fun!

The back-end server is written in [go](http://golang.org).  It uses the following open-source modules:

  - [russross/blackfriday](http://github.com/russross/blackfriday) - to render the articles from markdown.
  - [gorilla/websocket](http://github.com/gorilla/websocket) - to dynamically serve content via websockets.


The front-end is all html/javascript, using the following open-source libraries:

  - [jQuery](http://jquery.com) - for easy cross-platform scripting.
  - [bootstrap](http://getbootstrap.com) - for easy responsive design and beautiful elements.
  - [css-spinners.com](http://css-spinners.com) - for a fancy loading spinner whilst waiting for articles to load.
  - [glyphicons.com](http://glyphicons.com) - for beautiful icons.


And the whole thing is hosted in [AWS](http://aws.amazon.com).  Currently on a free t2.micro EC2 instance.
