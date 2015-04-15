/**
 * Created by michal.wadas on 2015-01-28.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        return root.domPlusPlus = factory();
    }
}(this, function () {
    'use strict';
    var global;
    try {
        global = Function('return this')();
    } catch(e) { // CSP
        if (typeof window !== 'undefined')
            global = window;
    }
    var domUtils = {};
    var has = ({}).hasOwnProperty;
    var isValidDefineProperty = !!Object.defineProperty && (function(q) {
        try {
            Object.defineProperty(q, 'wow', {
            value : 3
            });
        } catch (e) {}
        return q.wow === 3;
        }({}));
    function defineProperty(obj, key, value) {
        if (isValidDefineProperty)
            Object.defineProperty(obj,key, {value: value, enumerable: false});
        else
            obj[key]=value;
    }
    function extendOrThrow(obj, key, value) {
        if (has.call(obj, key))
            throw new TypeError('It\'s impossible to extend this object (attempted to extend '+String(obj)+' with key '+String(key)+')');
        defineProperty(obj, key, value);
    }

    function toMethod(func) {
        return function() {
            for(var i = 0, subArgs = [this]; i < arguments.length; i++) {
                subArgs.push(arguments[i]);
            }
            return domUtils.setAttributes.apply(null, subArgs);
        }
    }

    domUtils.$extendNatives = function() {
        if (typeof Element !== 'undefined') {
            extendOrThrow(Element.prototype, 'setAttributes', toMethod(domUtils.setAttributes));
            extendOrThrow(Element.prototype, 'getComments', toMethod(domUtils.getComments));
            extendOrThrow(Element.prototype, 'insertHTMLBeforeBegin', function(){
                for(var i = 0, subArgs = ['beforebegin']; i < arguments.length; i++) {
                    subArgs.push(arguments[i]);
                }
                this.insertAdjacentHTML.apply(this,subArgs )
            });
            extendOrThrow(Element.prototype, 'insertHTMLAfterBegin', function(){
                for(var i = 0, subArgs = ['afterbegin']; i < arguments.length; i++) {
                    subArgs.push(arguments[i]);
                }
                this.insertAdjacentHTML.apply(this,subArgs )
            });
            extendOrThrow(Element.prototype, 'insertHTMLBeforeEnd', function(){
                for(var i = 0, subArgs = ['beforeend']; i < arguments.length; i++) {
                    subArgs.push(arguments[i]);
                }
                this.insertAdjacentHTML.apply(this,subArgs )
            });
            extendOrThrow(Element.prototype, 'insertHTMLAfterEnd', function(){
                for(var i = 0, subArgs = ['afterend']; i < arguments.length; i++) {
                    subArgs.push(arguments[i]);
                }
                this.insertAdjacentHTML.apply(this, subArgs);
            });
        }
        if (typeof document !== 'undefined') {
            extendOrThrow(document, 'createFragmentFromHTML', toMethod(domUtils.createFragmentFromHTML));
        }
        if (typeof Node !== 'undefined') {
            extendOrThrow(Node.prototype, 'appendChilds', toMethod(domUtils.appendChilds));
            extendOrThrow(Node.prototype, 'operateOnDetached', toMethod(domUtils.operateOnDetached));
            extendOrThrow(Node.prototype, 'operateOnDetachedAsync', toMethod(domUtils.operateOnDetachedAsync));
            extendOrThrow(Node.prototype, 'empty', toMethod(domUtils.empty));

        }
    };
    // Extends NodeList
    domUtils.$extendNodeList = function(doc){
        doc = doc || global.document;
        var constructorPrototype = (document.querySelectorAll('*')).constructor.prototype;
        var array = [];
        var methods = ['map', 'filter', 'slice',
                       'forEach', 'reduce', 'reduceRight',
                       'some', 'every', 'find',
                       'findIndex', 'entries', 'keys',
                       'indexOf', 'lastIndexOf', 'join',
                        'copyWithin'
        ];
        var forbidden = ['reverse', 'sort', 'push', 'pop', 'shift', 'splice', 'fill'];
        function forbiddenFunc(name){
            return function(){
                var constructorName = (this.constructor && this.constructor.name) || 'NodeList';
                throw new TypeError(constructorName+' instances doesn\'t support mutating method .' +name+'.');
            };
        }
        for(var i = 0; i < methods.length;i++) {
            if (array[methods[i]])
                extendOrThrow(constructorPrototype, methods[i], array[methods[i]]);
        }
        for(i = 0; i < forbidden.length;i++) {
            if (array[forbidden[i]])
                extendOrThrow(constructorPrototype, forbidden[i], forbiddenFunc(forbidden[i]));
        }

    };

    /**
     * Set attributes based on given object
     * Batch version of native Element::setAttribute
     * @method
     * @param {Element} element - Element to be modified
     * @param {string} params - Object with enumerable properties
     */
    domUtils.setAttributes = function setAttributes(element, params) {
        params = typeof params === 'object' ? params : {};
        for (var key in params) {
            if (has.call(params,key))
                element.setAttribute(key, params[key]);
        }
        return element;
    };

    /**
     * Append multiple childs to element
     * Batch version of native Element::appendChild
     * @method
     * @param {Element} element - Element to be modified
     * @param {...Node} childs - List of Nodes to be appended in order
     */

    domUtils.appendChilds = function appendChilds(element) {
        for(var i = 1, childs = []; i < arguments.length; i++) {
            childs.push(arguments[i]);
        }
        var fragment = (element.ownerDocument ? element.ownerDocument : element).createDocumentFragment();
        for(i = 0; i < childs.length; i++) {
            fragment.appendChild(childs[i]);
        }
        element.appendChild(fragment);
    };

    /**
     * Parses HTML and creates DocumentFragment from it's content
     * @method
     * @param {Document} document - Document to be used as source
     * @param {string} html - String containing HTML
     */

    domUtils.createFragmentFromHTML = function parseHTML(document, html) {
        var q = document.createElement('div');
        q.insertAdjacentHTML('afterbegin', html);
        var fragment = document.createDocumentFragment();
        domUtils.appendChilds.apply(null, [fragment].concat([].slice.call(q.children)));
        return fragment;
    };

    /**
     * Detaches element from DOM, performs given operation, then inserts it in the same position
     * @method
     * @param {element} element - Element to be manipulated
     * @param {function} func - function to be called on element (as this)
     * @params {...any} subArgs - arguments provided to function
     */

    domUtils.operateOnDetached = function operateOnDetached(element, func) {
        for(var i = 2, subArgs = []; i < arguments.length; i++) {
            subArgs.push(arguments[i]);
        }
        var parent = element.parentNode;
        var nextSibling = element.nextSibling;
        if (!parent)
            throw new TypeError('.parentNode doesn\'t exist');
        var reattachMethod = nextSibling ? parent.appendChild : parent.insertBefore;
        parent.removeChild(element);
        func.apply(element, subArgs);
        reattachMethod.call(parent, element, nextSibling);
        return element;
    };

    domUtils.operateOnDetachedAsync = function operateOnDetachedAsync(element, func) {
        var subArgs = [];
        for(var i = 2; i < arguments.length; i++) {
            subArgs.push(arguments[i]);
        }
        var parent = element.parentNode;
        var nextSibling = element.nextSibling;
        if (!parent)
            throw new TypeError('.parentNode doesn\'t exist');
        var reattachMethod = nextSibling ? parent.appendChild : parent.insertBefore;
        parent.removeChild(element);
        function done() {
            reattachMethod.call(parent, element, nextSibling);
        }
        func.apply(element, [done].concat(subArgs));
        return element;
    };

    function nodeIteratorToArray(nodeIterator) {
        var ret = [],r;
        while(r = nodeIterator.next() && ret.push(r));
        return ret;
    }

    function removeChilds(element) {
        while(element.firstChild && element.removeChild(element.firstChild));
    }

    domUtils.empty = function empty(element) {
        return domUtils.operateOnDetached(element, removeChilds)
    };


    /**
     * Creates element with given attributes and content
     * @method
     * @param {Document} document - Child document
     * @param {string} tagName - tag name to create
     * @param {Object} attributes - attributes
     * @param {Element} content - Element to insert (or string to be converted)
     */
    domUtils.createExtendedElement = function createElementExtended(document, tagName, attributes, content) {
        var element = document.createElement(tagName);
        if(attributes) domUtils.setAttributes(element, attributes);
        if (content) element.appendChild(typeof content === 'string' ? document.createTextNode(content) : content);
        return element;
    };

    /**
     * Gets comment nodes inside of root.
     * @method
     * @param {Element} root - Element to be manipulated
     */
    domUtils.getComments = function getComments(root) {
        var document = root.ownerDocument === null ? root : root.ownerDocument;
        return nodeIteratorToArray(document.createNodeIterator(root, 128));
    };

    return domUtils;
}));
