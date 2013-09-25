var redis = require("redis"),
    redisClient = redis.createClient(),
    p = require("path"),
    fs = require("fs");

var elastical = require('elastical'),
	elasticalclient = new elastical.Client();

var nsp = require('nspclient'),
    nspclient = new nsp.NSPClient({
	    appid: '5707429',
	    appsecret: 'glubca8udwzk4t6w790bu4mpy3xkcr65',
	    log: '/data/httpd/log/log.txt'
	});



var	CALIBRE_ALL_BOOKS_SET = 'calibre_all_books_sort_set',
	CALIBRE_ALL_BOOKS_HASH = 'calibre_all_books_hash',
	CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash',
	CALIBRE_ALL_BOOKS_LIST = 'calibre_all_books_list',
	CALIBRE_ALL_BOOKS_CLICK_HASH = 'calibre_all_books_click_hash',
	CALIBRE_ALL_BOOKS_CLICK_SORT_SET = 'calibre_all_books_click_sort_set',

	CALIBRE_ALL_SERIES_SET = 'calibre_all_series_set',
	CALIBRE_SERIES_BOOKS_HASH = 'calibre_series_books_hash',
	//repository = "/root/all_book_library/Calibre/metadata.db",
	watchPath = '/root/new_Calibre',
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

		//path = (r != null)?p.join(root,'cover/' + r.path + '/cover_128_190.jpg'):p.join(root,'assets/images/cover_128_190.jpg');
		var  p = r.path || '';
		var path = watchPath + "/" + p + '/cover_128_190.jpg';
		console.log(path);
		//res.send(path);//
		console.log(path);
		//console.log("dddddddddddddddddddd")
		fs.exists(path, function(exists) {
			if(exists){
				res.send('cover/' + p + '/cover_128_190.jpg');
			}else{
				res.send('assets/images/cover_128_190.jpg');
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
			if(reply != null){
				for(var i = 0; i < reply.length; i++){
					json.push(JSON.parse(reply[i]));
				}
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

	    //console.log(start);
		//console.log(endpage);
	
	redisClient.ZREVRANGE(CALIBRE_ALL_BOOKS_CLICK_SORT_SET, start, endpage, function(err, reply){
		redisClient.zcard(CALIBRE_ALL_BOOKS_CLICK_SORT_SET, function(err, num){
			//console.log(reply);
			var output = {},
				json = [];
			if(reply != null){
				for(var i = 0; i < reply.length; i++){
					json.push(JSON.parse(reply[i]));
				}
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
	redisClient.hget(CALIBRE_ALL_BOOKS_HASH, bookid, function(err, data){
		var row = JSON.parse(data);
		var real_epub_path = watchPath + "/" + row.path;
		console.log(real_epub_path);
		fs.exists(real_epub_path, function(exists) {
			if(exists){
				var unzip_dir = "epub_content/" + row.path + "/";//CALIBRE_ALL_BOOKS_CLICK_HASH
				//redisClient.hincrby(CALIBRE_ALL_BOOKS_CLICK_HASH, bookid, 1);
				//var list_key = "CalibreBookDetailDataList";
				//var id_key = "CalibreBookIdList";
				var dict ={
					epub_path: unzip_dir
					//books_id_list: id_key,
					//books_data_prefix: list_key,
					//row: data,
					//bookid: bookid
				};
				res.render('index', dict);
			}else{
				res.send(404);
			}
				
		});
	});
};

exports.getSeriesList = function(req, res) {
	redisClient.ZRANGE(CALIBRE_ALL_SERIES_SET, 0, -1, function(err, reply){
		redisClient.zcard(CALIBRE_ALL_SERIES_SET, function(err, num){
			var output = {},
				json = [];
			if(reply != null){
				for(var i = 0; i < reply.length; i++){
					json.push(JSON.parse(reply[i]));
				}
			}
			//output['totalItems'] = num;
			//output['items'] = json;
			res.send(json);
		});
	});
};

exports.getSeriesBooksByID = function(req, res) {
	var seriesid = req.params.id;
	if(!seriesid) return res.send(404);
	var start = (req.params.startIndex != undefined || req.params.startIndex != null)?parseInt(req.params.startIndex): 0;;
	    maxpage = (req.params.maxResults != undefined || req.params.maxResults != null)?parseInt(req.params.maxResults): 40;
	    endpage = start + maxpage;
	redisClient.hget(CALIBRE_SERIES_BOOKS_HASH, seriesid, function(err, data){
		var book_ids = JSON.parse(data);
		//console.log(book_ids);
		var new_book_ids = book_ids.slice(start, endpage);
		//console.log(start);
		//console.log(endpage);
		//console.log(new_book_ids);
		redisClient.hmget(CALIBRE_ALL_BOOKS_HASH, new_book_ids, function(err, reply){
			var output = {},
				json = [];
			//console.log(reply);
			if(reply != null){
				for(var i = 0; i < reply.length; i++){
					json.push(JSON.parse(reply[i]));
				}
			}
			output['totalItems'] = json.length;
			output['items'] = json;
			res.send(output);
	});
	});
};


exports.getDownloadLink = function(req, res) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	var param = {'path':'/PublicFiles/nsp.zip', 'clientIp':ip};
	nspclient.service('nsp.vfs.link.getDirectUrl',param,function(data){
		//var json = JSON.parse(data);
		if(data.retcode == '0000'){
			
			res.redirect(data.url);
		}
    	console.log(data);
    	console.log(ip);
	});
};

