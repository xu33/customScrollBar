(function($) {
    var doc = $(document);
    var defaults = {
        onDrag: function(event, elem) {},
        onMove: function(event, elem) {},
        onDrop: function(event, elem) {}
    }
    var Plugin = function(elem, options) {
        this.elem = elem;
        this.options = $.extend({}, defaults, options);
        this.moveSelf
        this.x
        this.y
        this.pos
        this.offset
        this.range
        this.state = 'inactive'
        this.init()
    }
    Plugin.dragDelayTime = 100 // ms
    Plugin.prototype.init = function() {
        this.moveSelf = true
        this._start = $.proxy(this.start, this);
        this._move = $.proxy(this.move, this);
        this._end = $.proxy(this.end, this);
        this.elem.on("mousedown", this._start);
    }
    Plugin.prototype.start = function(e) {
        var downEl = $(e.target);
        if(downEl.is("input[type=text]")||downEl.is("textarea"))
        {
            return;
        }

        var elemOffset   
        this.state = 'active'            
        this.startMouseX = e.pageX
        this.startMouseY = e.pageY
        this.prevMouseX = e.pageX
        this.prevMouseY = e.pageY
        elemOffset = this.elem.offset()
        this.mouseOffset = {
            x: this.startMouseX - elemOffset.left,
            y: this.startMouseY - elemOffset.top
        }
        doc.on("mousemove", this._move)
        doc.on("mouseup", this._end)
        doc.on('selectstart', this.dontStart)
        doc.on('dragstart', this.dontStart)
        this.options.onDrag && this.options.onDrag.call(this, e)
        this.moved = false
    }
    Plugin.prototype.move = function(e) {
        var deltaX = e.pageX - this.prevMouseX,
            deltaY = e.pageY - this.prevMouseY
        if (deltaX == 0 && deltaY == 0) {
            return 
        }
        if (document.selection && document.selection.empty) {
            document.selection.empty()
        } else if (window.getSelection) {
            window.getSelection().removeAllRanges()
        }
        this.prevMouseX = e.pageX
        this.prevMouseY = e.pageY
        this.lastPageX = e.pageX
        this.lastPageY = e.pageY
        this.options.onMove && this.options.onMove.call(this, deltaX, deltaY, e, e.target)
        this.moved = true
    }
    Plugin.prototype.end = function(e) {
        if (this.moved) {
            this.options.onDrop && this.options.onDrop(e)
        } else {
            this.options.onClick && this.options.onClick(e)
        }
        doc.off("mousemove", this._move)
        doc.off("mouseup", this._end)
        doc.off('selectstart', this.dontStart)
        doc.off('dragstart', this.dontStart)
    }

    Plugin.prototype.dontStart = function(e) {
        e.preventDefault()
        return false
    }
    Plugin.prototype.setRange = function(range) {
        this.range = range
    }

    Plugin.prototype.destroy = function() {
        doc.off('mousemove', this._move)
        doc.off('mouseup', this._end)
        this.elem.off('mousedown')
        this.pos = {}
        this.offset = {}
        this.range = undefined
    }
    $.fn.drag = function(options) {
        return new Plugin(this, options)
    }
})(jQuery);

(function($) {
    var types = ['DOMMouseScroll', 'mousewheel'];
    var handler = function(event) {
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

    var addCss = function(css) {
        var styleNode = document.createElement('style')
        styleNode.innerText = css
        document.head.appendChild(styleNode)
    }

    var css = '.custom_scrollbar_rail {\
        position: absolute;\
        right: 0; \
        width: 8px;\
        top:0;\
        bottom:0;\
        z-index:100;\
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
        width: 8px;\
        background-color: #555;\
        -webkit-border-radius: 4px;\
        -moz-border-radius: 4px;\
        border-radius: 4px;\
        -o-transition: background-color .2s linear;\
        -webkit-transition: background-color.2s linear;\
        -moz-transition: background-color .2s linear;\
        transition: background-color .2s linear;\
        cursor: pointer;\
        opacity: 0;\
    }';
    var cssInsert = false
    var customScrollBar = function(element) {
        if (!cssInsert) {
            addCss(css)
            cssInsert = true
        }
        this.element = element
        this.content = this.element.children(":first")
        this.element.addClass('ui_scrollable')
        if (this.element.css('position') != 'absolute') {
            this.element.css('position', 'relative').css('overflow', 'hidden')
        }
        this.content.css({
            'position' : 'absolute',
            'left' : 0,
            'right' : 0
        })
        this.scrollBarRail = $('<div class="custom_scrollbar_rail"></div>')
        this.scrollBar = $('<div class="custom_scrollbar"></div>')

        this.element.append(this.scrollBarRail)
        this.scrollBarRail.append(this.scrollBar)
        this.containerHeight = parseInt(this.element.css('height'))
        this.contentHeight = parseInt(this.content.outerHeight())
        if (this.contentHeight < this.containerHeight) {
            this.content.css('minHeight', this.containerHeight)    
        }
        this.isMoving = false
        this.isHover = false
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
            var top
            if (self.containerHeight < self.contentHeight) {
                this.element.on('mousewheel', function(event, delta, deltaX, deltaY) {
                    top = self.contentTop + deltaY * 20
                    self.contentTop = top > self.maxTop ? self.maxTop : top < self.minTop ? self.minTop : top
                    self.scrollBarTop = parseInt(
                        Math.abs(self.contentTop) * 
                        (self.containerHeight - self.scrollBarHeight) / 
                        (self.contentHeight - self.containerHeight)
                    )

                    self.doScroll()
                    event.preventDefault()
                })
            }
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

            this.scrollBarRail
            .on('mouseenter', function(e) {
                self.isHover = true
                self.shouldToggleScrollBar()
            })
            .on('mouseleave', function(e) {
                self.isHover = false
                self.shouldToggleScrollBar()
            })
        },
        shouldToggleScrollBar: function() {
            if (this.isHover || this.isMoving) {
                this.showScrollBar()
            } else {
                this.hideScrollBar()
            }
        },
        showScrollBar: function() {
            this.scrollBar.stop().animate({
                opacity: 1
            }, {
                duration: 400
            })
        },
        hideScrollBar: function() {
            //setTimeout($.proxy(function() {
                this.scrollBar.stop().animate({
                    opacity: 0
                }, {
                    duration: 400
                })
            //}, this), 400)
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
        dragHandler: $.noop,
        moveHandler: function(deltaX, deltaY) {
            var self = this
            this.isMoving = true
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
            this.contentTop = -parseInt(this.scrollBarTop * this.contentHeight / this.containerHeight)
            
            this.doScroll()
        },
        dropHandler: function(e) {
            this.isMoving = false
            this.shouldToggleScrollBar()
        },
        doScroll: function() {
            this.isMoving = true
            this.content.css('top', this.contentTop)
            this.scrollBar.css('top', this.scrollBarTop)
            
            if (this.scrollTimer) {
                clearTimeout(this.scrollTimer)
            }
            
            var self = this
            this.scrollTimer = setTimeout(function() {
                self.element.triggerHandler({
                    type:'onScrollEnd',
                    scrollTop: this.contentTop
                })
                self.scrollTimer = null
                self.isMoving = false
                self.shouldToggleScrollBar()
            }, 300)

            this.element.triggerHandler({
                type:'onScroll',
                scrollTop: this.contentTop
            })

            this.shouldToggleScrollBar()
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
    return customScrollBar
})(jQuery)

try {
    makeerror()
} catch(e) {
    console.log(e.stack)
}