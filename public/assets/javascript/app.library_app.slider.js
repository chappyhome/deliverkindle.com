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
  	 var datas = [ {"cagetoryname":"11111"},
  	 			  {"cagetoryname":"22222"},
  	 			  {"cagetoryname":"33333"},
  	 			  {"cagetoryname":"44444"},
  	 			  {"cagetoryname":"55555"}
  	            ];
  	 var categorys = new Categorys(datas);
  	 var categoryListView = new CategoryListView({collection: categorys });
  	 MyApp.footer.show(categoryListView);
  	 //console.log($(categoryListView.$el).mySlideShow());
  	 $(categoryListView.$el).mySlideShow({
  	 	autoSlide:true,
  	 	autoSlideInterval:3000
  	 });
  });
  return CategorySlider;
}();