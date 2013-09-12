MyApp.LibraryRouting = function(){
  var LibraryRouting = {};

  LibraryRouting.Router = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
      "": "defaultSearch",
      "search/:searchTerm": "search",
      "viewer.html?book=:key": "openBook"
    }
  });

  MyApp.vent.on("search:term", function(searchTerm){
    Backbone.history.navigate("search/" + searchTerm);
  });

  MyApp.addInitializer(function(){
    LibraryRouting.router = new LibraryRouting.Router({
      controller: MyApp.LibraryApp
    });
    
    MyApp.vent.trigger("routing:started");
  });

  return LibraryRouting;
}();
