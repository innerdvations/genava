## Node Js genava

Generate a unique composite avatar image from random source parts (arms, legs, body, etc), based on a seed.

Requires [GraphicsMagick](http://www.graphicsmagick.org/) to be installed.

There are currently two themes: "default" is a port of the monsterid theme from PHP and "lemm" is a port of the hand-drawn monster parts included with the Wordpress monsterid plugin. 

Note that generating images can be processor and memory intensive, so it is highly recommended that all files generated are cached, as seen in the example below.

## Example avatars

### default theme
![default123](/themes/default/examples/default123.png)
![ff213](/themes/default/examples/ff213.png)

### lemm theme
![a232h42h](/themes/lemm/examples/a232h42h.png)
![bododo](/themes/lemm/examples/bododo.png)
![yar](/themes/lemm/examples/yar.png)

## Installation

    $ npm install genava

## How to use
```js
  var genava = require('genava');
  var fs = require('fs');
  
  // create a function that caches your avatar so you're not generating it every time you need it
  function avatar(user_id, options, cb) {
    var filename = './avatarcache/'+user_id+'.w.png'; // filename for our cached image
    fs.exists(filename, function(exists) {
      if(exists) return cb(null, filename);
      else {
        genava.gen(user_id, options, function(err, file) {
          return fs.writeFile(filename, file, {encoding:'binary'}, function(err) {
            return cb(err, filename);
          });
        });
      }
    });
  };
  
  // create an avatar with the included "lemm" theme on a white background
  avatar(some_user_id, {theme:'lemm', bg:'#ffffff'}, function(err, filename) {
    console.log("Saved avatar as: "+filename);
  });
  
  // create an avatar with the included "default" theme on a black background
  avatar(some_user_id, {bg:'#000000'}, function(err, filename) {
    console.log("Saved avatar as: "+filename);
  });
  
  // create an avatar with your own theme. see config.json files in included theme directories for details.
  avatar(some_user_id, {theme:'/path/to/custom/theme'}, function(err, filename) {
    console.log("Saved avatar as: "+filename);
  });
  
```

## TODO

* option to specify size of resultant image
* option to disable any heavy image manipulation and/or tweak theme settings
* function to handle caching of avatars
* more built-in themes (just submit a pull request or email them to me)

## Credits
[Andreas Gohr](http://www.splitbrain.org/personal) for the original PHP monsterid library and concept.
[Gabriele D'arrigo](https://github.com/gabrieledarrigo) for the nodejs conversion this was based on.
[Ketherine Garner] (http://kathgarner.com/) for creating the hand-drawn monster theme "Lemm".
