MyApp.LibraryApp = function(){
  var LibraryApp = {};
  
  var Layout = Backbone.Marionette.Layout.extend({
    template: "#library-layout",
    
    regions: {
      search: "#searchBar",
      books: "#bookContainer"
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
      MyApp.vent.on("search:rank", function(){ self.getRankBooks(); });

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
      if(this.loading) return true;

      this.loading = true;
      
      var self = this;
      var query = (this.page * this.maxResults)+'/' + (this.maxResults - 1);
      
      $.ajax({
        url: 'http://www.deliverkindle.com/get_books_list/' + query,
        dataType: 'json',
        data: '',
        success: function (res) {
          MyApp.vent.trigger("search:stop");
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
                thumbnail: 'cover/' + item.id,
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
      });//fetchbook
    },

    fetchRankBooks: function(callback){
      if(this.loading) return true;

      this.loading = true;
      
      var self = this;
      var query = (this.page * this.maxResults)+'/' + (this.maxResults - 1);
      
      $.ajax({
        url: 'http://www.deliverkindle.com/get_rank_books_list/' + query,
        dataType: 'json',
        data: '',
        success: function (res) {
          MyApp.vent.trigger("search:stop");
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
                thumbnail: 'cover/' + item.id,
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
      });//fetchbook
    },


    searchBooks: function(searchTerm, callback){
      if(this.loading) return true;

      this.loading = true;
      
      var self = this;
      MyApp.vent.trigger("search:start");
      
      var query = encodeURIComponent(searchTerm)+'/'+(this.page * this.maxResults)+'/' + this.maxResults;
      
      $.ajax({
        url: 'http://www.deliverkindle.com/search_book/' + query,
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
                thumbnail: 'cover/' + item.id,
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

  LibraryApp.allBooks = function(term){
    LibraryApp.initializeLayout();
    MyApp.LibraryApp.BookList.showBooks(LibraryApp.Books);
    
    MyApp.vent.trigger("search:allBooks");
  };

  LibraryApp.booksRank = function(){
    LibraryApp.initializeLayout();
    MyApp.LibraryApp.BookList.showBooks(LibraryApp.Books);
    
    MyApp.vent.trigger("search:rank");
  };
  
  LibraryApp.defaultSearch = function(){
    LibraryApp.allBooks();
  };

  LibraryApp.openBook = function(key){
    alert(key);
  };
  
  return LibraryApp;
}();
