var redis = require("redis"),
    redisClient = redis.createClient(),
    parseString = require('xml2js').Parser().parseString,
    http = require("http"),
    fs = require("fs"),
    sqlite3 = require("sqlite3"),
    exec = require('child_process').exec;
var ElasticSearchClient = require('elasticsearchclient'),
	serverOptions = {
	    host: 'localhost',
	    port: 9200
	};
	elasticSearchClient = new ElasticSearchClient(serverOptions);

var elastical = require('elastical');
var elasticalclient = new elastical.Client();

var PAGE_PREFIX = 'calibre_page_',
	CALIBRE_LIBRARY_TOTAL = 'calibre_library_total',
	BASE_DATA_URL = 'http://www.deliverkindle.com:8080',
	PAGE_BOOK_NUMBER = 40,
	DISPLAY_CATEGORY = ['Rating','News','Series'],

	CALIBRE_ALL_BOOKS_SET = 'calibre_all_books_sort_set',
	CALIBRE_ALL_BOOKS_HASH = 'calibre_all_books_hash',
	CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash',
	CALIBRE_ALL_BOOKS_LIST = 'calibre_all_books_list',
	CALIBRE_ALL_BOOKS_CLICK_HASH = 'calibre_all_books_click_hash',
	CALIBRE_ALL_BOOKS_CLICK_SORT_SET = 'calibre_all_books_clicksort_set',
	repository = "/root/all_book_library/Calibre/metadata.db",
	watchPath = '/root/all_book_library/Calibre';
	//UNZIP_DIR = '/var/www/html/epub_content/';

exports.getBookList = function(req, res) {
	var page = (req.params.page != undefined || req.params.page != null)?req.params.page: 1;
	console.log('Retrieving page: ' + page);
	var key = PAGE_PREFIX + page;
	redisClient.get(key,function(err, reply){
	 	if(reply == null || err){
	 		http.get(BASE_DATA_URL + "/xml?start=0&num=1", function(res) {
	 			res.setEncoding('utf8');
	 			res.on('data', function(data) {
	 				parseString(data, function (err, result) {
	 					var total = parseInt(result.library.$.total),
	        	    		pages = Math.ceil(total/PAGE_BOOK_NUMBER);
	        	    		p = (page >= pages) ? pages : page,
	        	    		start = (p - 1) * PAGE_BOOK_NUMBER,
	        	    		url = BASE_DATA_URL + '?start=' + start + '&num=' +       PAGE_BOOK_NUMBER;
	        	    	http.get(url, function(res) {
    						res.setEncoding('utf8');
    						res.on('data', function(data) {
    							parseString(data, function (err, result) {
    								books = result.library.book,
    								value = [];
    								for(var j=0; j<books.length; j++){
	    								var item = books[j].$;
	    								item['desc'] = books[j]._;
	    								value.push(item);
	    							}
	    							redisClient.set(key, JSON.stringify(value));
	    							res.send(value);
    							});
    						});
    					});

	 				});
	 			});
	 		});
	 		
	 	}else{
	 		var page_content = JSON.parse(reply);
        	//console.log(page_content);
        	res.send(page_content);
	 	}
        
        //console.log(JSON.parse(reply));
   });
};


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
			path = '/var/www/html/public/cover/' + r.path + '/cover_128_190.jpg';
		fs.exists(path, function(exists) {
			if(exists){
				res.sendfile(path);
			}else{
				res.sendfile('/var/www/html/public/assets/images/cover_128_190.jpg');
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
	
	redisClient.zrange(CALIBRE_ALL_BOOKS_SET, start, endpage, function(err, reply){
		redisClient.zcard(CALIBRE_ALL_BOOKS_SET, function(err, num){
			var output = {};
				json = [];
			for(var i = 0; i < reply.length; i++){
				json.push(JSON.parse(reply[i]));
			}
			output['totalItems'] = num;
			output['items'] = (endpage >num) ? [] : json;
			res.send(output);
		});
	});

};

exports.updateSqliteToHashAndSet = function() {
	fs.exists(repository, function(exists) {
	if (exists) {
			var db = new sqlite3.Database(repository),
			    stmt = "select books.id,title,timestamp,pubdate, isbn ,path,uuid, has_cover, text as desc,\
			            author_sort as author from books left join comments on books.id = comments.book";
			db.each(stmt, function(err, row) {
				//console.log(row);
				redisClient.hset(CALIBRE_ALL_BOOKS_HASH, row.id, JSON.stringify(row));
				redisClient.rpush(CALIBRE_ALL_BOOKS_LIST, row.id);
				redisClient.zadd(CALIBRE_ALL_BOOKS_SET, row.id, JSON.stringify(row));
				elasticSearchClient.index("readream", "books", row, row.id,{})
			    .on('data', function(data) {
			        console.log(data)
			    })
			    .exec();
			});
		};
	});

};


exports.updateSqliteEPubPathToHash = function() {
	fs.exists(repository, function(exists) {
	if (exists) {
			var db = new sqlite3.Database(repository),
			    stmt = "select books.id,books.path,data.name from books left join data on books.id = data.book";
			db.each(stmt, function(err, row) {//watchPath
				//var epub_path = row.path;
				//var real_pub_path = "epub/" + row.path + "/" + row.name + '.epub';
				redisClient.hset(CALIBRE_EPUB_PATH_HASH, row.id, row.path);
			});
		};
	});

};

exports.updateConvertCover = function() {
	redisClient.zrange(CALIBRE_ALL_BOOKS_SET, 0, -1, function(err, reply){
		for(var i = 0; i < reply.length; i++){
				var r = JSON.parse(reply[i]);
				path = '/var/www/html/public/cover/' + r.path + '/cover_128_190.jpg';
				fs.exists(path, function(exists) {
					if(!exists){
						original = '/var/www/html/public/cover/' + r.path + '/cover.jpg';
						var command = 'convert -resize 128X190! "${original}"  "${path}" ';
						console.log(command);
						exec(command, function (error, stdout, stderr) { 
	     					 	console.log(error);
	     					 	console.log(stdout);
	    				});
					}
				});
		}
	});
};






exports.updateAllBooksClickSet = function(req, res) {
	redisClient.get(CALIBRE_LIBRARY_TOTAL,function(err, reply){
		if(!reply || err){
			http.get(BASE_DATA_URL + "/xml?start=0&num=1", function(reply) {
				reply.setEncoding('utf8');
				reply.on('data', function(data) {
					parseString(data, function (err, result) {
						var total = parseInt(result.library.$.total);
						key_value = {"total":total};
						redisClient.set(CALIBRE_LIBRARY_TOTAL, JSON.stringify(key_value));
						res.send(key_value);
					});
				});
			});

		}else{
			var total = JSON.parse(reply);
        	res.send(total);
		}
	});

};

exports.getCategoryList = function(req, res) {
	http.get(BASE_DATA_URL + "/ajax/categories", function(reply) {
		reply.setEncoding('utf8');
		reply.on('data', function(data) {
			var list = JSON.parse(data),
				o = [];
			for(var i = 0; i < list.length; i++){
				var name = list[i].name;
				    url = list[i].url;
				    arr = url.split("/");
				    list[i].url = arr[3];
				if(DISPLAY_CATEGORY.indexOf(name) >= 0){
					o.push(list[i]);
				}
			}
			res.send(o);
		});
	});
};

exports.getCategoryDetail = function(req, res) {
	var id = req.params.id;
	console.log(BASE_DATA_URL + "/ajax/category/"+id);
	http.get(BASE_DATA_URL + "/ajax/category/"+id, function(reply) {
		reply.setEncoding('utf8');
		reply.on('data', function(data) {
			var list = JSON.parse(data);
			res.send(list);
			//res.send('OK');
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

