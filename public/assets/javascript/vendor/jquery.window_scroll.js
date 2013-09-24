$.fn.windowScroll=function(){
    var $body = window.$body || (window.$body = (window.opera) ? (document.compatMode == "CSS1Compat" ? $('html'): $('body')) : $('html,body'));
    $body.animate({
        scrollTop:this.offset().top
    }, "slow");
    window.$body = $body;
}