MyApp.LibraryApp = function(){
  var LibraryApp = {};
  
  var Layout = Backbone.Marionette.Layout.extend({
    template: "#library-layout",
    
    regions: {
      search: "#searchBar",
      books: "#bookContainer",
    }
  });
  
  var Book = Backbone.Model.extend();

  var Books = Backbone.Collection.extend({
    model: Book,
    
    initialize: function(){
      var self = this;
      _.bindAll(this, "search","getAllBooks", "getRankBooks", "moreBooks");
      MyApp.vent.on("search:term", function(term){ self.search(term); });
      MyApp.vent.on("search:more", function(){ self.moreBooks(); });

      MyApp.vent.on("search:allBooks", function(){ self.getAllBooks(); });  //"search:rank"
      MyApp.vent.on("search:rank", function(){ self.getRankBooks(); });//series

      MyApp.vent.on("search:series", function(seriesid){self.getSeriesBooks(seriesid); });

      this.searchType = 'allBooks';
      
      // the number of books we fetch each time
      this.maxResults = 40;
      // the results "page" we last fetched
      this.page = 0;
      
      // flags whether the collection is currently in the process of fetching
      // more results from the API (to avoid multiple simultaneous calls
      this.loading = false;
      
      // remember the previous search
      this.previousSearch = null;

      // the maximum number of results for the previous search
      this.totalItems = null;
    },
    
    search: function(searchTerm){
      this.page = 0;

      this.searchType = 'term';
      
      var self = this;
      this.searchBooks(searchTerm, function(books){
        if(books.length < 1){
          MyApp.vent.trigger("search:noResults");
        }
        else{
          self.reset(books);
        }
      });
      
      this.previousSearch = searchTerm;
    },

    getAllBooks: function(){
      this.page = 0;

      this.searchType = 'allBooks';
      
      var self = this;
      this.fetchBooks(function(books){
        if(books.length < 1){
          MyApp.vent.trigger("search:noResults");
        }
        else{
          //console.log(books);
          self.reset(books);
        }
      });

    },

    getRankBooks: function(){
      this.page = 0;

      this.searchType = 'rank';
      
      var self = this;
      this.fetchRankBooks(function(books){
        if(books.length < 1){
          MyApp.vent.trigger("search:noResults");
        }
        else{
          //console.log(books);
          self.reset(books);
        }
      });

    },

    getSeriesBooks: function(seriesid){
      var self = this;
      this.fetchSeriesBooks(seriesid, function(books){
        if(books.length < 1){
          MyApp.vent.trigger("search:noResults");
        }
        else{
          //console.log(books);
          self.reset(books);
        }
      });

    },
    
    moreBooks: function(){
      // if we've loaded all the books for this search, there are no more to load !
      if(this.length >= this.totalItems){
        return true;
      }
      
      var self = this;
      //this.fetchBooks(this.previousSearch, function(books){ self.add(books); });
      if(this.searchType == 'allBooks'){
          this.fetchBooks(function(books){
        //console.log(books);
            self.add(books);
          });
      }else if(this.searchType == 'term'){
          this.searchBooks(this.previousSearch, function(books){
        //console.log(books);
            self.add(books);
          });
      }else if(this.searchType == 'rank'){
          this.fetchRankBooks(function(books){
        //console.log(books);
            self.add(books);
          });
      }
      
    },
    
    fetchBooks: function(callback){
      var self = this;
      var query = (this.page * this.maxResults)+'/' + (this.maxResults - 1);
      
      $.ajax({
        url: '/api/get_books_list/' + query,
        dataType: 'json',
        data: '',
        success: function (res) {
          if(res.totalItems == 0){
            callback([]);
            return [];
          }
          if(res.totalItems){
            self.page++;
            self.totalItems = res.totalItems;
            var searchResults = [];
            _.each(res.items, function(item){
              var thumbnail = null;
              searchResults[searchResults.length] = new Book({
                thumbnail: 'cover/' + item.path + '/cover_128_190.jpg',
                title: item.title,
                subtitle: item.title,
                description: item.desc,
                googleId: item.id
              });
            });
            callback(searchResults);
            return searchResults;
            self.loading = false;
          }
          else if (res.error) {
            MyApp.vent.trigger("search:error");
            self.loading = false;
          }
        }
      });//fetchbook
    },

    fetchRankBooks: function(callback){
      var self = this;
      var query = (this.page * this.maxResults)+'/' + (this.maxResults - 1);
      var start = this.page * this.maxResults;
      var end = start + this.maxResults;

      if('localStorage' in window && window['localStorage'] !== null){
           var list_key = "CalibreBookIdList";
           var books_data_prefix = "CalibreBookDetailDataList";
           var str = LS.get(list_key);
           var list = (str == null) ? [] :  JSON.parse(str);
           var new_list = _.uniq(list);
           var sub_list = new_list.slice(start, end);
           var totalItems = sub_list.length;

           console.log(sub_list);

          if(totalItems == 0){
            callback([]);
            return [];
          }
          //
          if(totalItems){
            this.page++;
            this.totalItems = totalItems;
            var searchResults = [];
            _.each(sub_list, function(item){
               var thumbnail = null;
               console.log(item);
               var key = books_data_prefix + "_" + item;
               var book_detail = LS.get(key);
               var book_json = JSON.parse(book_detail);
          
              if(book_json != null) {
                  searchResults[searchResults.length] = new Book({
                    //var obj = JSON.parse(item);
                    thumbnail: 'cover/' + book_json.path + '/cover_128_190.jpg',
                    title: book_json.title,
                    subtitle: book_json.title,
                    description: book_json.desc,
                    googleId: book_json.id
                  });
              }
            });
            callback(searchResults);
            return searchResults;
            self.loading = false;
          }
          else if (res.error) {
            MyApp.vent.trigger("search:error");
            self.loading = false;
          }
      }
    },


    searchBooks: function(searchTerm, callback){
      if(this.loading) return true;

      this.loading = true;
      
      var self = this;
      MyApp.vent.trigger("search:start");
      
      var query = encodeURIComponent(searchTerm)+'/'+(this.page * this.maxResults)+'/' + this.maxResults;
      
      $.ajax({
        url: '/api/search_book/' + query,
        dataType: 'json',
        data: '',
        success: function (res) {
          MyApp.vent.trigger("search:stop");
          if(res.totalItems == 0){
            callback([]);
            return [];
          }
          if(res.items){
            self.page++;
            self.totalItems = res.totalItems;
            var searchResults = [];
            _.each(res.items, function(item){
              var thumbnail = null;
              searchResults[searchResults.length] = new Book({
                thumbnail: 'cover/' + item.path + '/cover_128_190.jpg',
                title: item.title,
                subtitle: item.title,
                description: item.desc,
                googleId: item.id
              });
            });
            callback(searchResults);
            self.loading = false;
            return searchResults;
          }
          else if (res.error) {
            MyApp.vent.trigger("search:error");
            self.loading = false;
          }
        }
      });
    },

    fetchSeriesBooks: function(id, callback){      
      var self = this;
      
      $.ajax({
        url: '/api/get_series_books/' + id,
        dataType: 'json',
        data: '',
        success: function (res) {
          MyApp.vent.trigger("search:stop");
          if(res.totalItems == 0){
            callback([]);
            return [];
          }
          if(res.items){
            self.totalItems = res.totalItems;
            var searchResults = [];
            _.each(res.items, function(item){
              var thumbnail = null;

              var path = (item.path == null)?'assets/images/cover_128_190.jpg':'cover/' + item.path + '/cover_128_190.jpg';
              searchResults[searchResults.length] = new Book({
                thumbnail: path,
                title: item.title,
                subtitle: item.title,
                description: item.desc,
                googleId: item.id
              });
            });
            callback(searchResults);
            return searchResults;
          }
          else if (res.error) {
            MyApp.vent.trigger("search:error");
          }
        }
      });
    }
  });




  
  LibraryApp.Books = new Books();
  
  LibraryApp.initializeLayout = function(){
    LibraryApp.layout = new Layout();

    LibraryApp.layout.on("show", function(){
      MyApp.vent.trigger("layout:rendered");
    });
    MyApp.content.show(MyApp.LibraryApp.layout);

  };
  
  LibraryApp.search = function(term){
    LibraryApp.initializeLayout();
    MyApp.LibraryApp.BookList.showBooks(LibraryApp.Books);
    
    MyApp.vent.trigger("search:term", term);
  };

  LibraryApp.allBooks = function(){
    LibraryApp.initializeLayout();
    MyApp.LibraryApp.BookList.showBooks(LibraryApp.Books);
    
    MyApp.vent.trigger("search:allBooks");
  };

  LibraryApp.booksRank = function(){
    LibraryApp.initializeLayout();
    MyApp.LibraryApp.BookList.showBooks(LibraryApp.Books);
    
    MyApp.vent.trigger("search:rank");
  };

  LibraryApp.seriesBooks = function(seriesid){
    LibraryApp.initializeLayout();
    MyApp.LibraryApp.BookList.showBooks(LibraryApp.Books);

    MyApp.vent.trigger("search:series",seriesid);
  };
  
  LibraryApp.defaultSearch = function(){
    LibraryApp.allBooks();
  };

  LibraryApp.openBook = function(key){
    //alert(key);
  };
  
  return LibraryApp;
}();
