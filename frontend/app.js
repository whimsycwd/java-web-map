var express = require('express');
var busyboy = require('connect-busboy');
var bodyParser = require('body-parser')



var app = express();

var http = require("http");
var https = require("https");
var inspect = require("util").inspect;


var request = require("request");


request.debug = true;


var fs = require("fs");

var CONFIG = {
    BACKEND_ADDRESS : "127.0.0.1",
    BACKEND_PORT : 8080,
    BACKEND_URL : "http://127.0.0.1:8080",
    PORT : 3000,
    UPLOAD_NODE_FILE : "/Users/whimsy/Data/UploadDir/nodeOSM.txt",
    UPLOAD_EDGE_FILE : "/Users/whimsy/Data/UploadDir/edgeOSM.txt",
    UPLOAD_TRAJ_NODE_FILE : "/Users/whimsy/Data/UploadDir/trajNode.txt",
    UPLOAD_TRAJ_EDGE_FILE : "/Users/whimsy/Data/UploadDir/trajEdge.txt"
};

var BASE_FOLDER = "./BeijingMap/Trajectory";

app.use(busyboy());
app.use(express.static('public'));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('Hello World!');
});


// 上传文件 start 

var generateFile = function(outputFile) {
    return function (req, res, next) {

        var fstream;
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            console.log("Uploading: " + filename);


            //Path where image will be uploaded
            fstream = fs.createWriteStream(outputFile);
            file.pipe(fstream);
            fstream.on('close', function () {    
                console.log("Upload Finished of " + filename);              
                res.redirect('back');           //where to go next
            });
        });
    };
};

app.route('/api/upload/node')
    .post(generateFile(CONFIG.UPLOAD_NODE_FILE));

app.route('/api/upload/edge')
    .post(generateFile(CONFIG.UPLOAD_EDGE_FILE));

app.route('/api/upload/trajectory/edge')
    .post(generateFile(CONFIG.UPLOAD_TRAJ_EDGE_FILE));

app.route('/api/upload/trajectory/node')
    .post(generateFile(CONFIG.UPLOAD_TRAJ_NODE_FILE));




//  上传文件结束   

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
reSendReq('/api/map/nearestEdges/:lon/:lat/:k');

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


app.get('/api/map/edgesDict', function (req, res) {
    fs.readFile('./BeijingMap/edgeOSM.txt', { encoding : "utf8" } , function(err, data) {
        if (err) throw err;

        var lines = data.split('\n');

        var result = {};
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

            result[obj.id] = obj;
        }); 


      //  console.log(res.length);
      //  console.log(res[0]);

      res.send(result);
    });
});


function getFile(person, time, suffix) {
    return BASE_FOLDER + "/" + person + "/Trajectory/" + time + ".plt." + suffix;
}

app.get('/api/map/trajectory/origin/:person/:time', function (req, res) {

    var person = req.params.person;
    var time = req.params.time;
    var filename = getFile(person, time, "path");

    console.log(filename);

    fs.readFile(filename, { encoding : "utf8" } , function(err, data) {
        if (err) throw err;

        var lines = data.split('\n');

        var result = [];
        lines.forEach(function(data) {
            if (data == "") {
                return;
            }
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

app.get('/api/map/trajectory/nodeFile', function (req, res) {

    var filename = CONFIG.UPLOAD_TRAJ_NODE_FILE;

    console.log(filename);

    fs.readFile(filename, { encoding : "utf8" } , function(err, data) {
        if (err) throw err;

        var lines = data.split('\n');

        var result = [];
        lines.forEach(function(data) {
            if (data == "") {
                return;
            }
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


app.get('/api/map/trajectory/edge/:person/:time', function(req, res) {

    var person = req.params.person;
    var time = req.params.time;
    var filename = getFile(person, time, "edge");

    console.log(filename);

    fs.readFile(filename, {encoding : "utf8"}, function(err, data) {
        var lines = data.split("\n");

        var results = [];
        lines.forEach(function(data) {
            if (data == "") {
                return;
            }
            results.push(data);
        });

        res.send(results);
    });

});


app.get('/api/map/trajectory/edgeFile', function(req, res) {


    var filename = CONFIG.UPLOAD_TRAJ_EDGE_FILE;

    console.log(filename);

    fs.readFile(filename, {encoding : "utf8"}, function(err, data) {
        var lines = data.split("\n");

        var results = [];
        lines.forEach(function(data) {
            if (data == "") {
                return;
            }
            results.push(data);
        });

        res.send(results);
    });

});



app.get('/api/map/trajectory/proj/:person/:time', function(req, res) {

    var person = req.params.person;
    var time = req.params.time;
    var filename = getFile(person, time, "proj");

    console.log(filename);

    fs.readFile(filename, {encoding : "utf8"}, function(err, data) {
        var lines = data.split("\n");

        var results = [];
        lines.forEach(function(data) {
            if (data == "") {
                return;
            }
            var entries = data.split(' ');

            var obj = {};
            obj.x = entries[1];
            obj.y = entries[0];

            results.push(obj);
        });

        res.send(results);
    });

});


app.post('/api/map/saveCoords', function (req, res) {
    console.log(req.body);


    var filename = "bla";
    var stream = fs.createWriteStream("./MapMatchingDataDir/" + filename +".coord");

    stream.once('open', function(fd) {
        req.body.forEach(function (e) {
           // console.log(e);
            stream.write(JSON.stringify(e.lat));
            stream.write(" ");
            stream.write(JSON.stringify(e.lon));
            stream.write("\n");
        });

        stream.end();
    });

    res.send("sucess");
});

app.post('/api/map/saveNodeIds', function (req, res) {
    console.log(req.body);


    var filename = "bla";
    var stream = fs.createWriteStream("./MapMatchingDataDir/" + filename +".node");

    stream.once('open', function(fd) {
        req.body.forEach(function (e) {
           // console.log(e);
            stream.write(JSON.stringify(e));
            stream.write("\n");
        });

        stream.end();
    });

    res.send("sucess");
});

app.post('/api/map/saveEdgeIds', function(req, res) {
    console.log(req.body);

    // var date = new Date();
    // var filename = date.toISOString();

    var filename = "bla";
    var stream = fs.createWriteStream("./MapMatchingDataDir/" + filename+".edge");

    stream.once('open', function(fd) {
        req.body.forEach(function (e) {
           // console.log(e);
            stream.write(JSON.stringify(e));
            stream.write("\n");
        });

        stream.end();
    });

    res.send("sucess");
});


app.put('/api/map/mapmatching', function(req, res) {
    console.log(req.body);

    request({
        method : "PUT",
        // url : CONFIG.BACKEND_URL + "/api/map/mapmatching",
        uri : "http://127.0.0.1:8080/api/map/mapmatching",
        json : true,
        headers : {
            "content-type" : "application/json"
        }, 
        body : req.body
         // body : {"pointList" : req.body}
    }, function (err, response, body) {
        console.log(err);
        console.log(response.statusCode);
        console.log(body);
        if (!err && response.statusCode == 200) {
            console.log(body) // Show the HTML for the Google homepage. 

            res.send(body);
        }
    });
});




Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};


// 级连下拉框
app.get("/api/map/select", function(req, res){



    var filenames = fs.readdirSync(BASE_FOLDER);

    var results = {};

    var tmp = [];
    filenames.forEach(function (data) {
        if (data != ".DS_Store") {
            tmp.push(data);
        }
    });


    filenames = tmp;

    
    results.personSelect = filenames;

    var dict = {};



    filenames.forEach(function (data) {
        if (data == ".DS_Store") return;
        //console.log(data);
        files = fs.readdirSync(BASE_FOLDER + "/" + data + "/" + "Trajectory" + "/");

        var newFiles = [];
        files.forEach(function (file) {
            newFiles.push(file.substr(0, 14));
        });

        newFiles = newFiles.unique();

        dict[data] = newFiles;

    });


    results.timeSelect = dict;

    console.log(results);

    res.send(results);
});



//   resend part end.

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);

});


