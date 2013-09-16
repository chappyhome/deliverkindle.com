

(function($){

    var themes={
        "default":function(){
            var _this=this;
            var ui=this.ui;
            var $this=ui.$this;
            var opts=this.opts;
            var str="<div class='my-slide-show-default-nav'>";
            for (var i = 0; i < opts.pageCount; i++) {
                str+="<li>"+(i+1)+"</li>";
            }
            str+="</div>";
            ui.defaultNav=$(str).appendTo($this);
            ui.defaultNavItems=ui.defaultNav.find(">*").click(function(){
                effect[opts.effect] && effect[opts.effect].call(_this,$(this).index());
            });
            $this.bind("my-slide-show-event-change",function(event,index){
                ui.defaultNavItems.removeClass("current").eq(index).addClass("current");
            });
        },
        "button":function(){
            var _this=this;
            var ui=this.ui;
            var $this=ui.$this;
            var opts=this.opts;
            ui.prevButton=$("<div class='my-slide-show-prev-button'></div>").appendTo($this).click(function(){
                effect[opts.effect] && effect[opts.effect].call(_this,opts.index-1);
            });
            ui.nextButton=$("<div class='my-slide-show-next-button'></div>").appendTo($this).click(function(){
                effect[opts.effect] && effect[opts.effect].call(_this,opts.index+1);
            });
            $this.bind("my-slide-show-event-change",function(event,index){
                if(index>0){
                    ui.prevButton.show();
                }else{
                    ui.prevButton.hide();
                }
                if(index>=opts.pageCount-1){
                    ui.nextButton.hide();
                }else{
                    ui.nextButton.show();
                }
            });
        }
    };

    var initHTML=function(){
        var ui=this.ui;
        var opts=this.opts;
        var $this=ui.$this;
        ui.$this.css({overflow:"hidden"});
        ui.items=$this.find(">*").css({float:"left"});
        opts.containerWidth=ui.items.innerWidth()*ui.items.length;
        opts.pageCount=Math.ceil(opts.containerWidth/$this.innerWidth());
        ui.container=$("<div class='my-slide-show-container'></div>").appendTo($this).css({width:opts.containerWidth+50}).append(ui.items);
    };

    var effect={
        "slide":function(index){
            var _this=this;
            var args=arguments;
            var ui=this.ui;
            var opts=this.opts;
            clearTimeout(_this.timer);
            if(index>=opts.pageCount){
                index=0;
            }
            if(index<0){
                index=opts.pageCount-1;
            }
            ui.$this.trigger("my-slide-show-event-change",[index]);
            ui.container.stop().animate({
                marginLeft:-opts.slideWidth*index
            },opts.slideSpeed,function(){
                opts.index=index;
                if(opts.autoSlide){
                    _this.timer=setTimeout(function(){
                        args.callee.call(_this,index+1);
                    },opts.autoSlideInterval);
                }
            });
        }
    };

    var methods={
        init:function(params){
            return this.each(function(){
                var $this=$(this).addClass("my-slide-show");
                var settings={
                    slideWidth:$this.innerWidth(),
                    themes:"default,button",
                    effect:"slide",
                    autoSlide:true,
                    autoSlideInterval:3000,
                    slideSpeed:"normal",
                    index:0
                };
                var opts= $.extend({},settings,params);
                var cache={};
                cache.ui={};
                cache.ui.$this=$this;
                cache.opts=opts;
                initHTML.call(cache);
                var _themes=opts.themes.split(",");
                for (var i = 0; i < _themes.length; i++) {
                    var obj = _themes[i];
                    themes[obj] && themes[obj].call(cache);
                }
                effect[opts.effect] && effect[opts.effect].call(cache,0);
                $this.data("opts",opts);
                //console.log(opts);
            });
        }
    };

    // 2013-08-27 update by bright
    $.fn.mySlideShow = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.tooltip');
        }
    };

    $(function($){
        //$(".my-slide-show").mySlideShow({
            //themes:"button",
            //autoSlide:false
        //});
    });

})(jQuery);