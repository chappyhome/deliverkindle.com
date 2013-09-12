var express = require('express'),
	path = require("path"),
    api = {
    	update: require('./routes/updateData'),
    	data:   require('./routes/getData')
    }

 
var app = express();
 
app.configure(function () {
	app.set('port', process.env.PORT || 80);
	app.engine('.html', require('ejs').__express);
	app.set('views', path.join(__dirname, 'public/reader/view'));
	app.set('view engine', 'html');

    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.static(path.join(__dirname, 'public')));

    /*app.use(function(req, res, next) {
	  res.on('header', function() {
	    console.trace('HEADERS GOING TO BE WRITTEN');
	  });
	  next();
	});*/
});

app.configure('development', function () {
  app.use(express.errorHandler());
});
 

 //get data
//app.get('/get_book_list/:page?', api.getBookList);
//app.get('/get_category_list', api.data.getCategoryList);
//app.get('/get_category_detail/:id', api.data.getCategoryDetail);
app.get('/get_books_list/:startIndex?/:maxResults?', api.data.getRedisBookByIDs);
app.get('/get_rank_books_list/:startIndex?/:maxResults?', api.data.getRedisRankBooks);
app.get('/search_book/:q/:startIndex?/:maxResults?', api.data.searchBook);
app.get('/cover/:id', api.data.getCoverPath);
app.get('/reader/:id', api.data.startReader);


//update data
/*setTimeout(api.update.updateSqliteEPubPathToHash, 60000);
setTimeout(api.update.updateSqliteToHashAndSet, 300000);
setTimeout(api.update.updateConvertCover, 80000);
setTimeout(api.update.updateAllBooksClickSet, 60000);*/
 
app.listen(app.get('port'));
console.log('Listening on port 80...');