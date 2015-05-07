var express = require('express');
var app = express();



var http = require("http");
var https = require("https");

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



app.use(express.static('public'));

app.get('/', function (req, res) {
  res.send('Hello World!');
});


// resend request to java backend to avoid cross-site request denied


// app.get('/api/map/suggest', function (req, res) {



//     var options = {
//         host: '127.0.0.1',
//         port: 8080,
//         path: req.url,
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json'
//         }
//     };

//     console.log(JSON.stringify(options));
//     getJSON(options,
//         function(statusCode, result)
//         {
//             // I could work with the result html/json here.  I could also just return it
//             console.log("onResult: (" + statusCode + ")" + JSON.stringify(result));
//             res.statusCode = statusCode;
//             res.send(result);
//         });


//     console.log(req.param.queryStr);
// });

app.get('/api/map/nearest/:x/:y', function (req, res) {

	var options = {
	    host: '127.0.0.1',
	    port: 8080,
	    path: '/api/map/nearest/' + req.params.x + '/' + req.params.y,
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


	console.log(req.params.x + " " + req.params.y);
});


app.get('/api/map/routing/:sId/:tId', function (req, res) {

	var options = {
	    host: '127.0.0.1',
	    port: 8080,
	    path: '/api/map/routing/' + req.params.sId + '/' + req.params.tId,
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


	console.log(req.params.sId + " " + req.params.tId);
});

app.get('/api/map/nearest/:x/:y', function (req, res) {

	var options = {
	    host: '127.0.0.1',
	    port: 8080,
	    path: '/api/map/nearest/' + req.params.x + '/' + req.params.y,
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


	console.log(req.params.x + " " + req.params.y);
});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});