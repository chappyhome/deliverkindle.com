var CALIBRE_ALL_BOOKS_SET = 'calibre_all_books_sort_set',
	repository = "/data/httpd/data/metadata.db";
var redis = require("redis"),
    redisClient = redis.createClient(),
    fs = require("fs"),
    _=require('underscore'),
    sqlite3 = require("sqlite3").verbose();

exports.updateAllBooksClickToSqlite = function() {
	if(!exists) {
  		console.log("Creating DB file.");
  		fs.openSync(repository, "w");
	}
	var exists = fs.existsSync(repository);
	var db = new sqlite3.Database(repository);
	db.serialize(function() {
		sql = 'create table if not exists calibre_id_click (id INTEGER PRIMARY KEY, click INTEGER)';
	    db.run(sql);
  		var stmt = db.prepare("INSERT OR REPLACE INTO calibre_id_click VALUES (?, ?)");
  		redisClient.zrange(CALIBRE_ALL_BOOKS_SET, 0, -1, 'WITHSCORES', function(err, ids){
  			var lists = _.groupBy(ids, function(a, b){
  				return Math.floor(b/2);
			});
			lists = _.toArray(lists);
			_.each(lists, function(pair){
				//console.log(pair[0] + ":" + pair[1]);
				stmt.run([pair[0], pair[1]]);
			});
  			stmt.finalize();
  		});
	});
	db.close();
};

	/*CALIBRE_ALL_BOOKS_HASH = 'calibre_all_books_hash',
	CALIBRE_EPUB_PATH_HASH = 'calibre_epub_path_hash',
	CALIBRE_ALL_BOOKS_LIST = 'calibre_all_books_list',
	CALIBRE_ALL_BOOKS_CLICK_HASH = 'calibre_all_books_click_hash',
	CALIBRE_ALL_BOOKS_CLICK_SORT_SET = 'calibre_all_books_click_sort_set',
	repository = "/root/all_book_library/Calibre/metadata.db",
	watchPath = '/root/all_book_library/Calibre';
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
				//console.log(r);
				path = watchPath + "/" + r.path + '/cover_128_190.jpg';
				if(!fs.existsSync(path)){
					original = watchPath + "/" + r.path + '/cover.jpg';
					var command = 'convert -resize 128X190! "' + original + '"        "' +  path + '"';
					console.log(path);
					console.log(command);
					exec(command, function (error, stdout, stderr) { 
     					 	//console.log(error);
     					 	//console.log(stdout);
	    			});
				}
		}
	});
};






exports.updateAllBooksClickSet = function() {
	redisClient.hgetall(CALIBRE_ALL_BOOKS_CLICK_HASH, function(err, bookidclicks){
		for(var bookid in bookidclicks){
			console.log(bookid);
			redisClient.hget(CALIBRE_ALL_BOOKS_HASH, bookid, function(err, book){
				if(book){
					//console.log(book);
					var click = bookidclicks[bookid] || 0;
					redisClient.zadd(CALIBRE_ALL_BOOKS_CLICK_SORT_SET, click, book);
				}
			});
		}
	});

};*/

