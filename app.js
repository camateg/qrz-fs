var request = require('request')
   ,express = require('express')
   ,cheerio = require('cheerio')
   ,async = require('async')
   ,fs = require('fs');

var app = express();

var port = process.env.PORT || 5000;

app.get('/', parse_list, shuffle, pretty_out);
app.get('/json', parse_list, shuffle, out);

function parse_list(req, res, next) {
  //var core_url = 'http://forums.qrz.com/forumdisplay.php?7-Ham-Radio-Gear-For-Sale/page';
  var core_url = 'http://forums.qrz.com/index.php?forums/ham-radio-gear-for-sale.7/';
  var core_urls = [];
  res.stash = res.stash || {};

  res.stash.links = [];

  for(ct=1;ct<=5;ct++) {
    core_urls.push(core_url + 'page-' + ct);
  }

  async.map(core_urls, get_page_links, function(err, page_links) {
    res.stash.links = page_links;
    return next();
  });
}

function shuffle(req, res, next) {
  res.stash = res.stash || {};

  res.stash.biglist = [];

  for(page in res.stash.links) {
    one_page = res.stash.links[page];
    for(link in one_page) {
      res.stash.biglist.push(one_page[link]);
    }
  }

  return next();
}

function get_page_links(url, cb) {

  var lnks = [];

  request(url, function(err, resp, html) {
    if(!err && resp.statusCode == 200) {
      $ = cheerio.load(html);
      $('h3.title').each(function() {
        if (!$(this).parent().find('span.sticky').length) {
          var href = 'http://forums.qrz.com/' + $(this).find('a.PreviewTooltip').attr('href');
          var url = href;
          var lnk = {};
   
          lnk.url = url;
          lnk.txt = $(this).text();
	  lnks.push(lnk); 
	}
      });
      cb(null, lnks);
    }
  
  });
}

function out(req, res) {
  res.stash = res.stash || {};

  output = [];
  
  for(li in res.stash.biglist) {
    var txt = res.stash.biglist[li]['txt'];
    var url = res.stash.biglist[li]['url'];

    var tmp = {};
    tmp.txt = txt;
    tmp.url = url;
   
    output.push(tmp); 
  }
  res.send(output);
}

function pretty_out(req, res) {
  res.stash = res.stash || {};

  fs.readFile('views/index.html', function(err, data) {
    if (err) {
      console.log(err);
    }
    res.write(data);
    res.end();
  }); 
}

module.exports = app;
if (!module.parent) {
  app.listen(port, function() {
    console.log("Server listening on port " + port);
  });
}
