(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }
    
    deltaY = delta;
    
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    args.unshift(event, delta, deltaX, deltaY);
    return ($.event.dispatch || $.event.handle).apply(this, args);
}
})(jQuery);
(function($) {
    var css = '.custom_scrollbar_rail {\
        position: absolute;\
        right: 0; \
        width: 6px;\
        top:0;\
        bottom:0;\
        -webkit-border-radius: 4px;\
        -moz-border-radius: 4px;\
        border-radius: 4px;\
        -o-transition: background-color .2s linear, opacity .2s linear;\
        -webkit-transition: background-color.2s linear, opacity .2s linear;\
        -moz-transition: background-color .2s linear, opacity .2s linear;\
        transition: background-color .2s linear, opacity .2s linear;\
    }\
    .custom_scrollbar {\
        position: absolute;\
        right: 0px;\
        width: 4px;\
        background-color:  #aaabac;\
        -webkit-border-radius: 4px;\
        -moz-border-radius: 4px;\
        border-radius: 4px;\
        -o-transition: background-color .2s linear;\
        -webkit-transition: background-color.2s linear;\
        -moz-transition: background-color .2s linear;\
        transition: background-color .2s linear;\
        cursor: pointer;\
    }';
    
    Utils.addCss(css)
    
    var customScrollBar = function(element) {
        this.element = element
        this.content = this.element.children(":first")
        this.element.addClass('ui_scrollable')
        this.element.css('position', 'relative').css('overflow', 'hidden')
        this.content.css('position', 'absolute')
        this.scrollBarRail = $('<div class="custom_scrollbar_rail"></div>')
        this.scrollBar = $('<div class="custom_scrollbar"></div>')

        this.element.append(this.scrollBarRail)
        this.scrollBarRail.append(this.scrollBar)
        this.containerHeight = parseInt(this.element.css('height'))
        this.contentHeight = parseInt(this.content.outerHeight())
        this.init()
    }
    
    customScrollBar.prototype = {
        onScroll: function(fn) {
            this.element.bind('onScroll', fn)
            
            return this
        },
        onScrollEnd: function(fn) {
            this.element.bind('onScrollEnd', fn)
            
            return this
        },
        removeScrollHandler: function() {
            this.element.unbind('onScroll')  
        },
        removeScrollEndHandler: function() {
            this.element.unbind('onScrollEnd')  
        },
        initMouseWheel: function() {
            var self = this
            this.element.on('mousewheel', function(event, delta, deltaX, deltaY) {
                event.preventDefault()
                if (self.containerHeight > self.contentHeight) {
                    return
                }
                
                var top = self.contentTop + deltaY * 40
                if (top > self.maxTop) {
                    top = self.maxTop
                }
                
                if (top < self.minTop) {
                    top = self.minTop
                }
                
                self.contentTop = top
                self.content.css('top', self.contentTop)
            
                self.scrollBarTop = parseInt(Math.abs(self.contentTop) * (self.containerHeight - self.scrollBarHeight) / (self.contentHeight - self.containerHeight), 10)
                
                self.scrollBar.css({
                    top: self.scrollBarTop
                })
                
                self.element.trigger({
                    type:'onScroll',
                    scrollTop: self.contentTop
                })
                    
                if (self.scrollTimer) {
                    clearTimeout(self.scrollTimer)
                }
            
                self.scrollTimer = setTimeout(function() {
                    self.element.trigger({
                        type:'onScrollEnd',
                        scrollTop: self.contentTop
                    })
                    
                    self.scrollTimer = null
                }, 300)
            })
        },
        initDrag: function() {
            this.scrollBar.drag({
                onDrag: $.proxy(this.dragHandler, this),
                onMove: $.proxy(this.moveHandler, this),
                onDrop: $.proxy(this.dropHandler, this)
            })
        },
        initEvent: function() {
            var self = this
            this.scrollBar.on('mouseover', function() {
                $(this).css('width', 8).css('background', '#646464')
            })
            
            this.scrollBar.on('mouseout', function() {
                if (!self.isDragging) {
                    $(this).css('width', '').css('background', ' #aaabac')   
                }
            })
        },
        init: function() {
            this.scrollBarHeight = 0
            this.scrollBarTop = 0
            this.contentTop = 0
            
            if (this.containerHeight < this.contentHeight) {
                this.scrollBarHeight = parseInt(this.containerHeight * this.containerHeight / this.contentHeight, 10)
                this.scrollBarTop = parseInt(this.contentTop * (this.containerHeight - this.scrollBarHeight) / (this.contentHeight - this.containerHeight), 10)
                this.maxTop = 0
                this.minTop = -(this.contentHeight - this.containerHeight)
                
                if (this.scrollBarHeight < 60) {
                    this.scrollBarHeight = 60
                }
                
                this.scrollBarRail.css('opacity', 1)
            } else {
                this.scrollBarHeight = 0
                this.scrollBarTop = 0
                this.maxTop = this.minTop = 0
                this.scrollBarRail.css('opacity', 0)
            }
            
            this.scrollBarMaxTop = this.containerHeight - this.scrollBarHeight
            this.scrollBarMinTop = 0
            
            this.scrollBar.css({
                height: this.scrollBarHeight,
                top: this.scrollBarTop
            })
            
            this.initMouseWheel()
            this.initDrag()
            this.initEvent()
        },
        update: function(containerHeight, contentHeight) {
            this.containerHeight = containerHeight || parseInt(this.element.css('height'))
            this.contentHeight = contentHeight || parseInt(this.content.outerHeight())
            this.scrollBarMaxTop = this.containerHeight - this.scrollBarHeight
            this.scrollBarMinTop = 0

            if (this.containerHeight < this.contentHeight) {
                this.scrollBarHeight = parseInt(this.containerHeight * this.containerHeight / this.contentHeight, 10)
                this.scrollBarTop = parseInt(Math.abs(this.contentTop) * (this.containerHeight - this.scrollBarHeight) / (this.contentHeight - this.containerHeight), 10)
                this.maxTop = 0
                this.minTop = -(this.contentHeight - this.containerHeight)
                if (this.scrollBarHeight < 60) {
                    this.scrollBarHeight = 60
                }
                
                this.scrollBarRail.css('opacity', 1)
            } else {
                this.scrollBarHeight = 0
                this.scrollBarTop = 0
                this.maxTop = this.minTop = 0
                
                this.scrollBarRail.css('opacity', 0)
            }
            
            this.scrollBar.css({
                height: this.scrollBarHeight,
                top: this.scrollBarTop
            })
        },
        dragHandler: function() {},
        moveHandler: function(deltaX, deltaY) {
            var self = this
            this.isDragging = true
            // move scrollbar
            this.scrollBarMaxTop = this.containerHeight - this.scrollBarHeight
            this.scrollBarMinTop = 0
            var top = this.scrollBarTop + deltaY
            if (top < this.scrollBarMinTop) {
                top = 0
            } else if (top > this.scrollBarMaxTop) {
                top = this.scrollBarMaxTop
            } else {
                top = top
            }
            
            this.scrollBarTop = top
            this.scrollBar.css({
                top: this.scrollBarTop
            })
            
            // move content
            var contentTop = parseInt(this.scrollBarTop * this.contentHeight / this.containerHeight)
            this.contentTop = -contentTop
            this.content.css({
                top: this.contentTop
            })

            self.element.trigger({
                type:'onScroll',
                scrollTop: self.contentTop
            })
                
            if (self.scrollTimer) {
                clearTimeout(self.scrollTimer)
            }
        
            self.scrollTimer = setTimeout(function() {
                self.element.trigger({
                    type:'onScrollEnd',
                    scrollTop: self.contentTop
                })
                
                self.scrollTimer = null
            }, 300)
        },
        dropHandler: function(e) {
            if (!$(e.target).hasClass('custom_scrollbar')) {
                this.scrollBar.css('width', '').css('background', ' #aaabac')   
            }
            
            this.isDragging = false
        },
        scrollTo: function(x) {
            if (x > this.maxTop) {
                x = this.maxTop
            }
            
            if (x < this.minTop) {
                x = this.minTop
            }
            
            this.contentTop = x
            this.content.css({
                top: this.contentTop
            })
            
            this.scrollBarTop = parseInt(Math.abs(this.contentTop) * (this.containerHeight - this.scrollBarHeight) / (this.contentHeight - this.containerHeight), 10)
            this.scrollBar.css({
                top: this.scrollBarTop
            })
        }
    }
    
    $.fn.customScrollBar = function() {
        return new customScrollBar(this)
    }
    
    window.customScrollBar = customScrollBar
}(jQuery))
