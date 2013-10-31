# TreeKIT

[TreeKIT](http://treekit.org/) builds tools to help city dwellers measure, map, and collaboratively manage urban ecosystems. This is a mobile webapp for us to collect data about trees and treebeds one block at a time. We'll refer the app as `Treekit` in the docs below.


## Local Setup

`Treekit` is a JavaScript app that does not require any special server-side technology like Rails or Django. As such, it can be hosted on any web server or GitHub Pages. The data is stored on CartoDB.

### Prerequisites

`Treekit` uses the [Yeoman workflow](http://yeoman.io/) for development.

1. Install [Node.js](http://nodejs.org/)
2. Install [Yeoman](http://yeoman.io/)

    `npm install -g yo`
    
3. Install [Grunt Compass](https://github.com/gruntjs/grunt-contrib-compass)

    `gem update --system && gem install compass`

### Installation

From the command line interface, clone the repository from GitHub

    git clone git@github.com:openplans/treekit.git

Navigate to the code

    cd treekit

Install the build tools

    npm install
    bower install

### Configuration

All configuration items are located in `app/config.js`. This is where you can change map and CartoDB settings.

### Development and Testing

To test the app, you can start the development server and it will automatically open app on port 9000

    grunt server

### Making changes

Part of the Yeoman workflow is merging and minifying client assets like JavaScript and CSS for production installs and puts them in the `dist` directory. Run

    grunt

to check for errors and build the files in the `dist` directory.

### Deploy to GitHub Pages

`Treekit` is awesomely hosted on GitHub Pages. To deploy it, run `grunt` to build out the `dist` directory. Commit all of your updated files to `git`, including the `dist directory.` To deploy, simply run:

    git subtree push --prefix dist origin gh-pages

You can learn more about deploying apps with Yeoman [here](http://yeoman.io/deployment.html).

