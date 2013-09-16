MyApp.LibraryApp.CategorySlider = function(){
	var CategorySlider = {};

	var Category = Backbone.Model.extend();
	var Categorys = Backbone.Collection.extend({
  		model: Category
	});

	var CategoryView = Backbone.Marionette.ItemView.extend({
    	template: "#slider-template",
    	tagName: 'li'
  	});

  var CategoryListView = Backbone.Marionette.CompositeView.extend({
  	template: "#category-template",
    id: "mycarousel",
    className:"jcarousel-skin-tango",
    itemView: CategoryView,
    tagName: 'ul'
  });



  MyApp.addInitializer(function(options){
  	 var datas = [ {"cagetoryname":"科幻小说"},
  	 			  {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说111"},
            {"cagetoryname":"科幻小说222"},
            {"cagetoryname":"科幻小说333"},
            {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
             {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
             {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
             {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
             {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
             {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
             {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
             {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
             {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
             {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
             {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"},
            {"cagetoryname":"科幻小说"}
  	 
  
  	            ];
  	 var categorys = new Categorys(datas);
  	 var categoryListView = new CategoryListView({collection: categorys });
  	 MyApp.footer.show(categoryListView);
  	 //console.log($(categoryListView.$el).mySlideShow());
  	 $(categoryListView.$el).mySlideShow({
  	 	autoSlide:false,
  	 	autoSlideInterval:5000
  	 });
  });
  return CategorySlider;
}();