MyApp.LibraryApp.CategorySlider = function(){
	var CategorySlider = {};


	var Category = Backbone.Model.extend();
	var Categorys = Backbone.Collection.extend({
      url:"/api/get_series_list",
  		model: Category
	});

	var CategoryView = Backbone.Marionette.ItemView.extend({
    	template: "#slider-template",
    	tagName: 'span',
      className: 'item'
  	});

  var CategoryListView = Backbone.Marionette.CompositeView.extend({
  	template: "#category-list-template",
    itemView: CategoryView,

    initialize: function(){
        this.collection.fetch();
        this.count = 0;
        this.c = 0;
    },

    appendHtml: function(collectionView, itemView){
      //collectionView.$(".items-wrapper").append(itemView.el);
      this.count++;
      var fz = parseInt(this.collection.length/3) + 1;
      if(this.count==1){
          collectionView.$(".items-wrapper").append('<span class="group" id="flying_machines"></span>');
      }
      if(this.count>=1 && this.count < fz){
          //collectionView.$(".items-wrapper").append(itemView.el);
          collectionView.$("#flying_machines").append(itemView.el);
      }
      if(this.count == fz){
          collectionView.$("#flying_machines").after('<span class="group" id="hydraulic_machines"></span>');
      }
      if(this.count>=fz && this.count < 2*fz){
          //collectionView.$(".items-wrapper").append(itemView.el);
          collectionView.$("#hydraulic_machines").append(itemView.el);
      }

      if(this.count == 2*fz){
          collectionView.$("#hydraulic_machines").after('<span class="group" id="weapons"></span>');
      }

      if(this.count>=2*fz && this.count < 3*fz){
          //collectionView.$(".items-wrapper").append(itemView.el);
          collectionView.$("#weapons").append(itemView.el);
      }


    },
    onRender: function(){
        //this.$('.books')
        var leonardo_da_vinci_machines = this.$('#leonardo_da_vinci_machines');
        var items_wrapper = leonardo_da_vinci_machines.find(".items-wrapper");
        var da_slider = items_wrapper.horizontalBoxSlider("img");
        var left_button = leonardo_da_vinci_machines.find(".left");
        var right_button = leonardo_da_vinci_machines.find(".right");


        left_button.on('click', function(){
            
            da_slider.previous();
        });

        right_button.on('click',function(){
            da_slider.next();
        });
        

        leonardo_da_vinci_machines.find(".scroll-links a").on('click', function(e){
          var anchor = this.getAttribute("href").slice(1);
          da_slider.scrollTo(document.getElementById(anchor));
          return false;
        });

        function checkButtons(){
            var left = da_slider.element.scrollLeft;
            if (left === 0) {
              left_button.addClass("disabled");
            } else {
              left_button.removeClass("disabled");
            }

            if (left >= da_slider.element.scrollWidth - da_slider.element.offsetWidth - 5) {
              right_button.addClass("disabled");
            } else {
              right_button.removeClass("disabled");
            }
        };

        items_wrapper.on('scroll', function(){
          // Throttle
          this._needsInvoke = true;
          if (!this._scroll_timeout) {
            this._needsInvoke = false;
            var that = this;
            this._scroll_timeout = setTimeout(function(){
              if (that._needsInvoke) {
                checkButtons();
                that._needsInvoke = false;
              }
              that._scroll_timeout = null;
            }, 300);
          }
        });

        checkButtons();

    }
  });


   CategorySlider.showCategory = function(){
     var categorys = new Categorys();
     var categoryListView = new CategoryListView({collection: categorys });
     MyApp.footer.show(categoryListView);
     //console.log($(categoryListView.$el).mySlideShow());
     //categoryListView.ui.slider.bxSlider();

  };

  // MyApp.addInitializer(function(){
  //   CategorySlider.showCategory();
  // });

  return CategorySlider;
}();