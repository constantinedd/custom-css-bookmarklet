/*
 *   Chrome bookmarklet that allows the user to write live CSS styles without using the browser dev tools  *
 *   CDD @ Twisted Rope
 *   Credits to Andrew Childs for DomOutline Web Inspector implementation plugin
 */

(function($, undefined) {

    /* Check if jQuery is loaded. If it is not, stop the program and log to the console. */

    if (!$) {

        console.log("jQuery is not loaded.");
        return;

    }

    /* Firebug/Web Inspector Outline Implementation using jQuery - Andrew Childs <ac@glomerate.com> *
     * https://github.com/andrewchilds/jQuery.DomOutline/blob/master/jquery.dom-outline-1.0.js      */

    var DomOutline = function(options) {
        options = options || {};

        var pub = {};
        var self = {
            opts: {
                namespace: options.namespace || 'DomOutline',
                borderWidth: options.borderWidth || 2,
                onClick: options.onClick || false,
                filter: options.filter || false
            },
            keyCodes: {
                BACKSPACE: 8,
                ESC: 27,
                DELETE: 46
            },
            active: false,
            initialized: false,
            elements: {}
        };

        function writeStylesheet(css) {
            var element = document.createElement('style');
            element.type = 'text/css';
            document.getElementsByTagName('head')[0].appendChild(element);

            if (element.styleSheet) {
                element.styleSheet.cssText = css; // IE
            } else {
                element.innerHTML = css; // Non-IE
            }
        }

        function initStylesheet() {
            if (self.initialized !== true) {
                var css = '' +
                    '.' + self.opts.namespace + ' {' +
                    '    background: #09c;' +
                    '    position: absolute;' +
                    '    z-index: 1000000;' +
                    '}' +
                    '.' + self.opts.namespace + '_label {' +
                    '    background: #09c;' +
                    '    border-radius: 2px;' +
                    '    color: #fff;' +
                    '    font: bold 12px/12px Helvetica, sans-serif;' +
                    '    padding: 4px 6px;' +
                    '    position: absolute;' +
                    '    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);' +
                    '    z-index: 1000001;' +
                    '}';

                writeStylesheet(css);
                self.initialized = true;
            }
        }

        function createOutlineElements() {
            self.elements.label = jQuery('<div></div>').addClass(self.opts.namespace + '_label').appendTo('body');
            self.elements.top = jQuery('<div></div>').addClass(self.opts.namespace).appendTo('body');
            self.elements.bottom = jQuery('<div></div>').addClass(self.opts.namespace).appendTo('body');
            self.elements.left = jQuery('<div></div>').addClass(self.opts.namespace).appendTo('body');
            self.elements.right = jQuery('<div></div>').addClass(self.opts.namespace).appendTo('body');
        }

        function removeOutlineElements() {
            jQuery.each(self.elements, function(name, element) {
                element.remove();
            });
        }

        function compileLabelText(element, width, height) {
            var label = element.tagName.toLowerCase();
            if (element.id) {
                label += '#' + element.id;
            }
            if (element.className) {
                label += ('.' + jQuery.trim(element.className).replace(/ /g, '.')).replace(/\.\.+/g, '.');
            }
            return label + ' (' + Math.round(width) + 'x' + Math.round(height) + ')';
        }

        function getScrollTop() {
            if (!self.elements.window) {
                self.elements.window = jQuery(window);
            }
            return self.elements.window.scrollTop();
        }

        function updateOutlinePosition(e) {
            if (e.target.className.indexOf(self.opts.namespace) !== -1) {
                return;
            }
            if (self.opts.filter) {
                if (!jQuery(e.target).is(self.opts.filter)) {
                    return;
                }
            }
            pub.element = e.target;

            var b = self.opts.borderWidth;
            var scroll_top = getScrollTop();
            var pos = pub.element.getBoundingClientRect();
            var top = pos.top + scroll_top;

            var label_text = compileLabelText(pub.element, pos.width, pos.height);
            var label_top = Math.max(0, top - 20 - b, scroll_top);
            var label_left = Math.max(0, pos.left - b);

            self.elements.label.css({
                top: label_top,
                left: label_left
            }).text(label_text);
            self.elements.top.css({
                top: Math.max(0, top - b),
                left: pos.left - b,
                width: pos.width + b,
                height: b
            });
            self.elements.bottom.css({
                top: top + pos.height,
                left: pos.left - b,
                width: pos.width + b,
                height: b
            });
            self.elements.left.css({
                top: top - b,
                left: Math.max(0, pos.left - b),
                width: b,
                height: pos.height + b
            });
            self.elements.right.css({
                top: top - b,
                left: pos.left + pos.width,
                width: b,
                height: pos.height + (b * 2)
            });
        }

        function stopOnEscape(e) {
            if (e.keyCode === self.keyCodes.ESC || e.keyCode === self.keyCodes.BACKSPACE || e.keyCode === self.keyCodes.DELETE) {
                pub.stop();
            }

            return false;
        }

        function clickHandler(e) {
            pub.stop();
            self.opts.onClick(pub.element);
            e.stopImmediatePropagation(); // Is this in the right place? Seems to work fine for now.
            e.preventDefault();
            return false;
        }

        pub.start = function() {
            initStylesheet();
            if (self.active !== true) {
                self.active = true;
                createOutlineElements();
                jQuery('body').on('mousemove.' + self.opts.namespace, updateOutlinePosition);
                jQuery('body').on('keyup.' + self.opts.namespace, stopOnEscape);
                if (self.opts.onClick) {
                    setTimeout(function() {
                        jQuery('body').on('click.' + self.opts.namespace, function(e) {
                            if (self.opts.filter) {
                                if (!jQuery(e.target).is(self.opts.filter)) {
                                    return false;
                                }
                            }
                            clickHandler.call(this, e);
                            e.stopImmediatePropagation(); // Again, is this in the right place?
                            e.preventDefault();
                        });
                    }, 50);
                }
            }
        };

        pub.stop = function() {
            self.active = false;
            removeOutlineElements();
            jQuery('body').off('mousemove.' + self.opts.namespace)
                .off('keyup.' + self.opts.namespace)
                .off('click.' + self.opts.namespace);
        };

        return pub;
    };

    /* End of DomOutline plugin. */


    /* This function just creates the markup and styles for the custom CSS box and appends it to the DOM. */

    function setupCSSBox() {

        var $addedCSS = $('<div class="added-css"><div class="added-css-content"></div></div>'),
            css = "<style>.css-finder{color:#FFF!important;font-size:20px;display:block;cursor:pointer;position:absolute;right:70px;top:5px}.inner-css-content{color: #000 !important;font-size:16px!important;line-height:120%!important;}.hidden-css-box .css-minimize::before{left:50%;width:30%;margin-left:-15%;height:100%}.css-container h4{position:relative}.css-minimize{cursor:pointer;width:15px;height:15px;display:block;position:absolute;right:40px;bottom:5.5px}.css-minimize::after,.css-minimize::before{content:'';position:absolute;z-index:1;background:#fff}.css-minimize::after{top:50%;height:30%;margin-top:-15%;width:100%}span.clear-styles{display:block!important;margin:0;line-height:100%;background-color:#000!important;color:#fff!important;padding:5px 10px;font-size:14px;width:auto;float:right;cursor:pointer;font-weight:700;text-transform:uppercase}.hidden-css-box .inner-css-content{opacity:0;transition:all .6s ease}.css-close{color:#FFF!important;font-size:20px;display:block;float:right;cursor:pointer}.added-css{width:400px;position:fixed;top:13vh;right:5vh;z-index:1000}.css-container h4{font-weight:bold;background-color:#000;color:#fff;text-transform:uppercase;font-size:16px;line-height:100%;padding:5px;display:block!important;}.box-text{padding-left:4px;padding-right:4px;outline: none !important;display:block;min-height:300px;width:300px;resize:none}.css-container{float:right;position:relative;z-index:5}.css-container h4{margin:0}</style>",
            $addedCSSContent = $addedCSS.find('.added-css-content');

        $('body').append($addedCSS).append(css);
        $addedCSSContent.append('<div class=styles></div><div class=css-container><h4>Custom CSS:<span title="Use the finder: Hover over an element to select it." class="css-finder">&#x1F50D;</span><span class="css-minimize"></span><span title="Close this box and remove custom styles." class="css-close">X</span></h4><div class="inner-css-content"><textarea class=box-text placeholder="Enter custom CSS here. Click the finder icon, hover over an element and click to select it."></textarea><span title="Clear custom styles." class="clear-styles">Clear</span></div></div>');

    }


    /* This function is called multiple times - on each keyup. It gets the user input and adds them as CSS styles to the page. */

    function addCustomCSS() {

        var $stylesContainer = $('.styles'),
            input = getInput();

        $stylesContainer.html('');
        $stylesContainer.prepend('<style>' + input + '</style>');

    }


    /* Get the user input. This is called every time the addCustomCSS function runs. */

    function getInput() {
        return $('.css-container .box-text').val();
    }


    /* This contains all the event handlers such as keyup, minimizing the box, closing the box, and clearing the styles */

    function cssEventHandlers() {

        var $addedCSS = $('.added-css'),
            $boxText = $('.box-text');

        $boxText.keyup(function(e) {
            addCustomCSS();
        });

        $('.css-minimize').click(function() {
            $addedCSS.toggleClass('hidden-css-box');
        });

        $('.css-close').click(function() {
            $addedCSS.remove();
        });

        $('.clear-styles').click(function() {
            $('.styles').html('');
            $boxText.val('');
        });


        /* This event is triggered when the user presses TAB inside the input field. */


        $boxText.keydown(function(event) {

            if (event.keyCode === 9) {

                var v = this.value,
                    s = this.selectionStart,
                    e = this.selectionEnd;

                this.value = v.substring(0, s) + '\t' + v.substring(e);
                this.selectionStart = this.selectionEnd = s + 1;

                return false;
            }

        });


        /* This is triggered when an outlined element is clicked. It sets the appropriate CSS selector in the input field. */

        var outlineClickHandler = function(element) {
            var elementLabel = element.tagName.toLowerCase();
            if (element.id) {
                elementLabel += '#' + element.id;
            }
            if (element.className) {
                elementLabel += ('.' + jQuery.trim(element.className).replace(/ /g, '.')).replace(/\.\.+/g, '.');
            }

            $boxText.val($boxText.val() + elementLabel + ' {\n\n}\n');

            console.log(element);
        };

        /* Initialize DomOutline, and pass it one option for its click handler. */

        var initialDomOutline = DomOutline({
            onClick: outlineClickHandler
        });

        $('.css-finder').click(function() {
            initialDomOutline.start();
        });

    }


    $(document).ready(function() {
        setupCSSBox();
        cssEventHandlers();
    });


})(window.jQuery);