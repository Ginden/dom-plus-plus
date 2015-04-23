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
        global = Function('return this')() || (42, eval)('this');
    } catch(e) {
        global = window;
    }
    var domUtils = {};
    var has = {}.hasOwnProperty;
    var isValidDefineProperty = !!Object.defineProperty && (function (q) {
            try {
                Object.defineProperty(q, 'Object', { // Reusing name lowers gzipped size by 5 bytes
                    value: 3
                });
            } catch (e) {
            }
            return q.Object === 3;
        }({}));

    function defineProperty(obj, key, value) {
        if (isValidDefineProperty) {
            Object.defineProperty(obj, key, {value: value, enumerable: false});
        } else {
            obj[key] = value;
        }
    }

    function extendOrThrow(obj, key, value) {
        if (has.call(obj, key)) {
            throw new TypeError('It\'s impossible to extend object (attempted to extend ' + obj + ' with key ' + key + ')');
        }
        defineProperty(obj, key, value);
    }

    function toMethod(func) {
        return function () {
            for (var i = 0, subArgs = [this]; i < arguments.length; i++) {
                subArgs.push(arguments[i]);
            }
            return func.apply(null, subArgs);
        };
    }

    function insertAdjacentCurry(type) {
        return function () {
            for (var i = 0, subArgs = [type]; i < arguments.length; i++) {
                subArgs.push(arguments[i]);
            }
            return this.insertAdjacentHTML.apply(this, subArgs);
        };
    }

    domUtils.$extendNatives = function () {
        if (typeof Element !== 'undefined') {
            extendOrThrow(Element.prototype, 'setAttributes',           toMethod(domUtils.setAttributes));
            extendOrThrow(Element.prototype, 'getComments',             toMethod(domUtils.getComments));
            extendOrThrow(Element.prototype, 'insertHTMLBeforeBegin',   insertAdjacentCurry('beforebegin'));
            extendOrThrow(Element.prototype, 'insertHTMLAfterBegin',    insertAdjacentCurry('afterbegin'));
            extendOrThrow(Element.prototype, 'insertHTMLBeforeEnd',     insertAdjacentCurry('beforeend'));
            extendOrThrow(Element.prototype, 'insertHTMLAfterEnd',      insertAdjacentCurry('afterend'));
        }
        if (typeof document !== 'undefined') {
            extendOrThrow(document, 'createFragmentFromHTML', toMethod(domUtils.createFragmentFromHTML));
        }
        if (typeof Node !== 'undefined') {
            extendOrThrow(Node.prototype, 'appendChilds',           toMethod(domUtils.appendChilds));
            extendOrThrow(Node.prototype, 'prependChild',           toMethod(domUtils.prependChild));
            extendOrThrow(Node.prototype, 'prependChilds',          toMethod(domUtils.prependChilds));
            extendOrThrow(Node.prototype, 'operateOnDetached',      toMethod(domUtils.operateOnDetached));
            extendOrThrow(Node.prototype, 'operateOnDetachedAsync', toMethod(domUtils.operateOnDetachedAsync));
            extendOrThrow(Node.prototype, 'empty',                  toMethod(domUtils.empty));
        }
        if (typeof Text === 'undefined') {
            global.Text = function Text(str) {
                return global.document.createTextNode(str);
            };
        }
    };
    // Extends NodeList
    domUtils.$extendNodeList = function (doc) {
        doc = doc || global.document;
        var constructorPrototype = (doc.querySelectorAll('*')).constructor.prototype;
        var array = [];
        var methods = ['map', 'filter', 'slice',
                       'forEach', 'reduce', 'reduceRight',
                       'some', 'every', 'find',
                       'findIndex', 'entries', 'keys',
                       'indexOf', 'lastIndexOf', 'join',
                       'copyWithin'
        ];
        var forbid = ['reverse', 'sort', 'push', 'pop', 'shift', 'splice', 'fill'];

        function forbidMethod(name) {
            return function () {
                var constructorName = (this.constructor && this.constructor.name) || 'NodeList';
                throw new TypeError(constructorName + ' instances doesn\'t support mutating method .' + name + '.');
            };
        }

        for (var i = 0; i < methods.length; i++) {
            if (array[methods[i]]) {
                extendOrThrow(constructorPrototype, methods[i], array[methods[i]]);
            }
        }
        for (i = 0; i < forbid.length; i++) {
            if (array[forbid[i]]) {
                extendOrThrow(constructorPrototype, forbid[i], forbidMethod(forbid[i]));
            }
        }

    };

    /**
     * Set attributes based on given object
     * Batch version of native Element::setAttribute
     * @method
     * @param {Element} element - Element to be modified
     * @param {Object} params - Object with enumerable properties
     */
    domUtils.setAttributes = function setAttributes(element, params) {
        params = (params && typeof params === 'object') ? params : {};
        for (var key in params) {
            if (has.call(params, key)) {
                element.setAttribute(key, params[key]);
            }
        }
        return element;
    };

    /**
     * Append multiple childs to element
     * Batch version of native Element::appendChild
     * @method
     * @param {Element} element - Element to be modified
     * @params {...Node} childs - List of Nodes to be appended in order
     */

    domUtils.appendChilds = function appendChilds(element) {
        var fragment = (element.ownerDocument ? element.ownerDocument : element).createDocumentFragment();
        for (var i = 1; i < arguments.length; i++) {
            fragment.appendChild(arguments[i]);
        }
        element.appendChild(fragment);
    };

    /**
     * Prepend multiple childs to element
     * Batch version of native Element::appendChild
     * @method
     * @param {Element} element - Element to be modified
     * @params {...Node} childs - List of Nodes to be appended in order
     */

    domUtils.prependChilds = function prependChilds(element) {
        var fragment = (element.ownerDocument ? element.ownerDocument : element).createDocumentFragment();
        for (var i = 1; i < arguments.length; i++) {
            fragment.appendChild(arguments[i]);
        }
        var firstChild = element.firstChild;
        parent.insertBefore(fragment, firstChild);
    };

    domUtils.prependChild = function prependChild(parent, newChild) {
        return parent.insertBefore(newChild, parent.firstChild);
    };


    domUtils.insertAfter = function insertAfter(parent, newChild, refNode) {
        return parent.insertBefore(newChild, refNode.nextSibling);
    };



    /**
     * Parses HTML and creates DocumentFragment from it's content
     * @method
     * @param {Document} document - Document to be used as source
     * @param {string} html - String containing HTML
     */

    domUtils.createFragmentFromHTML = function parseHTML(document, html) {
        var q = document.createElement('div');
        var fragment = document.createDocumentFragment();
        q.insertAdjacentHTML('afterbegin', html);
        domUtils.appendChilds.apply(null, [fragment].concat([].slice.call(q.children)));
        return fragment;
    };

    /**
     * Detaches element from DOM, performs given operation, then inserts it in the same position
     * @method
     * @param {Element} element - Element to be manipulated
     * @param {function} func - function to be called on element (as this)
     * @params {...any} subArgs - arguments provided to function
     */

    domUtils.operateOnDetached = function operateOnDetached(element, func) {
        var parent = element.parentNode;
        var nextSibling = element.nextSibling;
        for (var i = 2, subArgs = []; i < arguments.length; i++) {
            subArgs.push(arguments[i]);
        }
        if (!parent) {
            throw new TypeError('.parentNode does not exist');
        }
        var insertBefore = parent.insertBefore;
        parent.removeChild(element);
        func.apply(element, subArgs);
        insertBefore.call(parent, element, nextSibling);
        return element;
    };

    domUtils.operateOnDetachedAsync = function operateOnDetachedAsync(element, func) {
        var parent = element.parentNode;
        var nextSibling = element.nextSibling;
        for (var i = 2, subArgs = []; i < arguments.length; i++) {
            subArgs.push(arguments[i]);
        }
        if (!parent) {
            throw new TypeError('.parentNode does not exist');
        }
        var insertBefore = parent.insertBefore;
        parent.removeChild(element);
        func.apply(element, [done].concat(subArgs));
        function done() {
            insertBefore.call(parent, element, nextSibling);
        }
        return element;
    };

    function removeChilds(element) {
        while (element.firstChild && element.removeChild(element.firstChild));
    }

    domUtils.empty = function empty(element) {
        return domUtils.operateOnDetached(element, removeChilds);
    };


    /**
     * Creates element with given attributes and content
     * @method
     * @param {Document} document - Child document
     * @param {string} tagName - tag name to create
     * @param {Object} attributes - attributes
     * @param {Element|string} content - Element to insert (or string to be converted to TextNode)
     */
    domUtils.createExtendedElement = function createElementExtended(document, tagName, attributes, content) {
        var element = document.createElement(tagName);
        if (attributes) {
            domUtils.setAttributes(element, attributes);
        }
        if (content) {
            element.appendChild(typeof content === 'string' ? document.createTextNode(content) : content);
        }
        return element;
    };

    domUtils.escapeHTML = function escapeHTML(document, str) {
        var element = document.createElement('div');
        element.appendChild(document.createTextNode(str));
        return element.innerHTML;
    };



    return domUtils;
}));
