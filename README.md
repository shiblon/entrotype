# Entrotype Typing Tutor

To try this out: http://bouncingchairs.net/entrotype

This is a *static site*, so all data, including users, is kept in your browser.
I felt this was important, since so many typing tutors are out there to show
you a ton of ads and get information, potentially about your kids. This one
doesn't do that, and it's open source.

It is a simple, single-page web app that aids in teaching touch-typing. Among its basic characteristics are

- No server login required, no data leaves the client.
- Can be downloaded and run locally.
- Everything is plain old Javascript to aid in hacking and teaching the language, should that be of interest (with the exception of the internal navigation, which is AngularJS).
- Statistics are kept on each key so that it's easy to find and test trouble spots.

You can pull this repository and run it locally using serve.sh (on a Unix-style
machine, e.g., Mac or Linux). It requires Python to run the local server. I'm
open to patches that add simpler support under Windows.

To use, just start it up and navigate to the given URL.
