var redis = require("redis"),
    redisClient = redis.createClient(),
    p = require("path"),
    fs = require("fs");

var elastical = require('elastical'),
	elasticalclient = new elastical.Client();



var	CALIBRE_ALL_BOOKS_SET = 'calibre_all_books_sort_set',
	CALIBRE_ALL_BOOKS_HASH = 'calibre_all_books_hash',
	CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash',
	CALIBRE_ALL_BOOKS_LIST = 'calibre_all_books_list',
	CALIBRE_ALL_BOOKS_CLICK_HASH = 'calibre_all_books_click_hash',
	CALIBRE_ALL_BOOKS_CLICK_SORT_SET = 'calibre_all_books_click_sort_set',
	//repository = "/root/all_book_library/Calibre/metadata.db",
	watchPath = '/tmp/book';
	root = '/data/httpd/htdocs/public/';

exports.searchBook = function(req, res) {
	var term = req.params.q,
	    start = (req.params.startIndex != undefined || req.params.startIndex != null)?req.params.startIndex: 0,
	    maxpage = (req.params.maxResults != undefined || req.params.maxResults != null)?req.params.maxResults: 40;

	var q = {
	    "from" : start, 
	    "size" : maxpage,
	    "query" : term
	};
	elasticalclient.search(q, function (err, results, data) {
		var list = data.hits.hits ||[],
			total = data.hits.total || 0,
			output = {},
			temp = [];
		for(var i=0; i < list.length; i++){
			temp.push(list[i]._source);
		}
		output['totalItems'] = total;
		output['items'] = temp;
	    res.send(output);
	});
};

exports.getCoverPath = function(req, res){
	var id = req.params.id;
	if(!id) return res.send(404);
	redisClient.hget(CALIBRE_ALL_BOOKS_HASH, id, function(err, reply){
		var r = JSON.parse(reply);

		path = (r != null)?p.join(root,'cover/' + r.path + '/cover_128_190.jpg'):p.join(root,'assets/images/cover_128_190.jpg');
		console.log(path);
		fs.exists(path, function(exists) {
			if(exists){
				res.sendfile(path);
			}else{
				res.sendfile(p.join(root,'assets/images/cover_128_190.jpg'));
			}
				
		});
	});


};


exports.getRedisBookByIDs = function(req, res) {
	var start = (req.params.startIndex != undefined || req.params.startIndex != null)?parseInt(req.params.startIndex): 0;;
	    maxpage = (req.params.maxResults != undefined || req.params.maxResults != null)?parseInt(req.params.maxResults): 40;
	    endpage = start + maxpage;

	    console.log(start);
		console.log(endpage);
	
	redisClient.zrevrange(CALIBRE_ALL_BOOKS_SET, start, endpage, function(err, reply){//ZREVRANGE
		redisClient.zcard(CALIBRE_ALL_BOOKS_SET, function(err, num){
			var output = {};
				json = [];
			for(var i = 0; i < reply.length; i++){
				json.push(JSON.parse(reply[i]));
			}
			output['totalItems'] = num;
			output['items'] = json;
			res.send(output);
		});
	});

};

exports.getRedisRankBooks = function(req, res) {
	var start = (req.params.startIndex != undefined || req.params.startIndex != null)?parseInt(req.params.startIndex): 0;;
	    maxpage = (req.params.maxResults != undefined || req.params.maxResults != null)?parseInt(req.params.maxResults): 40;
	    endpage = start + maxpage;

	    console.log(start);
		console.log(endpage);
	
	redisClient.ZREVRANGE(CALIBRE_ALL_BOOKS_CLICK_SORT_SET, start, endpage, function(err, reply){
		redisClient.zcard(CALIBRE_ALL_BOOKS_CLICK_SORT_SET, function(err, num){
			//console.log(reply);
			var output = {};
				json = [];
			for(var i = 0; i < reply.length; i++){
				json.push(JSON.parse(reply[i]));
			}
			output['totalItems'] = num;
			output['items'] = json;
			res.send(output);
		});
	});

};


exports.startReader = function(req, res) {
	var bookid = req.params.id;
	if(!bookid) return res.send(404);
	redisClient.hget(CALIBRE_EPUB_PATH_HASH, bookid, function(err, path){
		var real_epub_path = watchPath + "/" + path;
		console.log(real_epub_path);
		fs.exists(real_epub_path, function(exists) {
			if(exists){
				var unzip_dir = "epub_content/" + path + "/";//CALIBRE_ALL_BOOKS_CLICK_HASH
				redisClient.hincrby(CALIBRE_ALL_BOOKS_CLICK_HASH, bookid, 1);
				res.render('index', { epub_path: unzip_dir });
			}else{
				res.send(404);
			}
				
		});
	});
};

