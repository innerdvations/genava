var gm = require('gm');
var temp = require('temp');
var fs = require('fs');
var srand = require('srand');
var crypto = require('crypto');
var async = require('async');

// Private vars and functions
var config = {_paths:{}};
var themedir = "themes";

function isThemePath(str) {
  return str.indexOf('/') !== -1 || str.indexOf('\\') !== -1;
}

function loadConfig(theme, cb) {
  // if it's already loaded, just return it
  if(isThemePath(theme) && config._paths[theme]) return cb(null, config[config._paths[theme]])
  if(config[theme]) return cb(null, config[theme]);
  
  if(isThemePath(theme)) {
    fs.readFile(theme + '/config.json', function(err, data) {
      var themedata = JSON.parse(data);
      config[themedata.name] = themedata;
      config._paths[theme] = themedata.name; // map path to name so we don't have to load it each time
      return cb(null, config[config._paths[theme]]);
    });
  }
  else {
    fs.readFile( [__dirname, themedir, theme, 'config.json'].join('/'), function(err, data) {
      config[theme] = JSON.parse(data);
      return cb(null, config[theme]);
    });
  }
}

// Public exports
module.exports = {
  default_theme: 'default',
  default_bg: '#ffffff',
  
  gen: function(string, options, cb) {
    var colors, seed, avatar, part_name, part_data, part_num, image, images = [], flush, prefix, color, colors, path;

    if(!string && string !== "") return cb("string is required to generate seed");
    seed = parseInt(crypto.createHash('md5').update(string).digest('hex').substr(0, 6), 16);
    
    if(!options.bg) options.bg = default_bg;
    if(!options.theme) options.theme = default_theme;
    
    if(isThemePath(options.theme)) options.theme_path = options.theme;
    else options.theme_path = [__dirname, themedir, options.theme].join('/');
    
    loadConfig(options.theme, function(err, theme) {
      avatar = gm(theme.width, theme.height, options.bg);
      
      // generate any colors needed. since generating nice looking random colors is hard, we'll eventually offer some presets, but for now we'll just allow 'random'
      // eventually we will add more after reading http://tools.medialab.sciences-po.fr/iwanthue/theory.php and learning about mathematical color theory :)
      if(theme.colors) {
        srand.seed(seed);
        colors = JSON.parse(JSON.stringify(theme.colors)); // clone theme.colors so we can generate our own for just this seed
        for(color in colors) {
          // [r, g, b, brightness, saturation, hue]
          if(colors[color] === "random") colors[color] = [srand.random() * 50, srand.random() * 50, srand.random() * 50, 100, 100, srand.random() * 200];
        }
      }
      
      // select all the parts and modify them as needed
      srand.seed(seed); // seed again so we don't let color changes modify the monster shapes
      for(part in theme.parts) {
        part_data = theme.parts[part];
        if(typeof part_data.parts === "number") part_num = Math.floor(srand.random() * part_data.parts) + 1;
        else part_num = part_data.parts[Math.floor(srand.random() * part_data.parts.length)];
        path = options.theme_path + '/' + part + '_' + part_num + '.png';
        image = gm(path);
        flush = false; // gm doesn't support .in() with a buffer, so if we made changes we need to flag this to be dumped to file first
        if(colors && part_data.color) {
          flush = true;
          if(typeof part_data.color === "string") { // if a specific color, use that color for all parts_nums
            image.colorize(colors[part_data.color][0], colors[part_data.color][1], colors[part_data.color][2]);
            if(typeof colors[part_data.color][5] !== 'undefined') {
              image.modulate(colors[part_data.color][3], colors[part_data.color][4], colors[part_data.color][5]);
            }
          }
          else { // else we'll assume part_data.color is an object listing which color this specific part_num should be
            for(color in part_data.color) {
              if(part_data.color[color].indexOf(part_num) !== -1) {
                image.colorize(colors[color][0], colors[color][1], colors[color][2]);
                if(typeof colors[color][5] !== 'undefined') {
                  image.modulate(colors[color][3], colors[color][4], colors[color][5]);
                }
                break;
              }
            }
          }
        }
        if(flush) prefix = [theme, part, part_num, color].join('_') + '.png';
        images.push({img:image, path:path, flush:flush, prefix:prefix});
      }
      
      // put all the selected pieces together
      async.eachSeries(images, function(img, next) {
         // if we don't need to flush this buffer to file, just add it to avatar
        if(!img.flush) {
          avatar.in(img.path);
          return next();
        }
        // if we made changes to the part (like colorizing it) we have to write it to a temp file since gm.in() doesn't support buffers
        temp.open(img.prefix, function(err, info) {
          img.img.toBuffer('png', function(err, buffer) {
            fs.write(info.fd, buffer, 0, buffer.length, 0, function(err, res) {
              avatar.in(info.path);
              return next();
            });
          });
        });
      },
      // when eachSeries is finished adding layers, flatten and call callback
      function(err, res) {
        avatar.flatten().toBuffer('png', function(err, buffer) {
          cb(err, buffer);
        });
      });
    });
  }
};