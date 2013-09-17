MyApp.LibraryApp.CategorySlider = function(){
	var CategorySlider = {};


	var Category = Backbone.Model.extend();
	var Categorys = Backbone.Collection.extend({
      url:"/api/get_series_list",
  		model: Category
	});

	var CategoryView = Backbone.Marionette.ItemView.extend({
    	template: "#slider-template",
    	tagName: 'li'
  	});

  var CategoryListView = Backbone.Marionette.CompositeView.extend({
  	template: "#category-list-template",
    itemView: CategoryView,
    itemViewContainer:"#categoryContainer",
    initialize: function(){
        this.collection.fetch();
    }

    // appendHtml: function(collectionView, itemView){
    //   collectionView.$(".wrap").append(itemView.el);
    // }
  });


   CategorySlider.showCategory = function(){
     var categorys = new Categorys();
     var categoryListView = new CategoryListView({collection: categorys });
     MyApp.footer.show(categoryListView);
     //console.log($(categoryListView.$el).mySlideShow());

     // $(".JQ-slide").Slide({
     //    effect:"scroolLoop",
     //    autoPlay:false,
     //    speed:"normal",
     //    timer:3000,
     //    steps:1
     //  });

  };

  return CategorySlider;
}();