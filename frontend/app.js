var express = require('express');
var app = express();



var http = require("http");
var https = require("https");

var fs = require("fs");

var CONFIG = {
    BACKEND_ADDRESS : "127.0.0.1",
    BACKEND_PORT : 8080,
    PORT : 3000    
};




app.use(express.static('public'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});


//  To sovle cross domain request. We resend it from back to back

/**
 * getJSON:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
var getJSON = function(options, onResult)
{
    console.log("rest::getJSON");

    var prot = options.port == 443 ? https : http;
    var req = prot.request(options, function(res)
    {
        var output = '';
        console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        //res.send('error: ' + err.message);
    });

    req.end();
};



var reSendReq = function (url) {
    app.get(url, 
        function (req, res) {

            console.log(req.url);

            var options = {
                host: CONFIG.BACKEND_ADDRESS,
                port: CONFIG.BACKEND_PORT,
                path: req.url,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };


            getJSON(options,
                function(statusCode, result)
                {
                    // I could work with the result html/json here.  I could also just return it
                    console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
                    res.statusCode = statusCode;
                    res.send(result);
                });
        }
    );
};

// the url have to fully matched, :queryStr & :x/:y & :sId/:tId can't be removed.
reSendReq('/api/map/findNodes/:queryStr');
reSendReq('/api/map/nearest/:x/:y');
reSendReq('/api/map/routing/:sId/:tId');
reSendReq('/api/map/edge/:eId');

app.get('/api/map/edges', function (req, res) {
    fs.readFile('./BeijingMap/edgeOSM.txt', { encoding : "utf8" } , function(err, data) {
        if (err) throw err;

        var lines = data.split('\n');

        var result = [];
        lines.forEach(function(data) {
            var entries = data.split('\t');
            var obj = {}
            obj.id = entries[0];
            obj.sou = entries[1];
            obj.tar = entries[2];
            obj.cnt = entries[3];

            var eNodes = [];
            for (var i = 0; i < obj.cnt; ++i) {
                var eNode = {}
                eNode.x = entries[4 + 2 * i + 1];
                eNode.y = entries[4 + 2 * i];
                eNodes.push(eNode);
            }

            obj.eNodes = eNodes;

            result.push(obj);
        }); 


      //  console.log(res.length);
      //  console.log(res[0]);

      res.send(result);
    });
});


app.get('/api/map/trajectory', function (req, res) {
    fs.readFile('./BeijingMap/Trajectory/20081023025304.path', { encoding : "utf8" } , function(err, data) {
        if (err) throw err;

        var lines = data.split('\n');

        var result = [];
        lines.forEach(function(data) {
            var entries = data.split(' ');
        
            var node = {}
            node.x = entries[1];
            node.y = entries[0];

            result.push(node);
        }); 


      //  console.log(res.length);
      //  console.log(res[0]);

      res.send(result);
    });
});




//   resend part end.

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);

});