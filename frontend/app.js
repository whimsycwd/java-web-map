var express = require('express');
var app = express();



var http = require("http");
var https = require("https");

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


//   resend part end.

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);

});