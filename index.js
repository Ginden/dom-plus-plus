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
    var global;
    try {
        global = Function('return this')();
    } catch(e) {
        if (typeof window !== undefined)
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
        if (obj.key)
            throw new TypeError('It\'s impossible to extend this object.');
        defineProperty(obj, key, value);
    }
    domUtils.$extendNatives = function() {
        if (typeof Element !== 'undefined') {
            extendOrThrow(Element.prototype, 'setAttributes', function() {
                var subArgs = [this];
                for(var i = 0; i < arguments.length; i++) {
                    subArgs.push(arguments[i]);
                }
                return domUtils.setAttributes.apply(null, subArgs);
            });
            extendOrThrow(Element.prototype, 'getComments', function() {
                var subArgs = [this];
                for(var i = 0; i < arguments.length; i++) {
                    subArgs.push(arguments[i]);
                }
                return domUtils.getComments.apply(null, subArgs);
            })
        }
        if (typeof document !== 'undefined') {
            extendOrThrow(document, 'createFragmentFromHTML', function() {
                var subArgs = [this];
                for(var i = 0; i < arguments.length; i++) {
                    subArgs.push(arguments[i]);
                }
                return domUtils.createFragmentFromHTML.apply(null, subArgs);
            });
        }
        if (typeof Node !== 'undefined') {
            extendOrThrow(Node.prototype, 'appendChilds', function() {
                var subArgs = [this];
                for(var i = 0; i < arguments.length; i++) {
                    subArgs.push(arguments[i]);
                }
                return domUtils.appendChilds.apply(null, subArgs);
            });
            extendOrThrow(Node.prototype, 'operateOnDetached', function() {
                var subArgs = [this];
                for(var i = 0; i < arguments.length; i++) {
                    subArgs.push(arguments[i]);
                }
                return domUtils.operateOnDetached.apply(null, subArgs);
            });
            extendOrThrow(Node.prototype, 'operateOnDetachedAsync', function() {
                var subArgs = [this];
                for(var i = 0; i < arguments.length; i++) {
                    subArgs.push(arguments[i]);
                }
                return domUtils.operateOnDetachedAsync.apply(null, subArgs);
            });
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
        for (key in params) {
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
        var childs = [];
        for(var i = 1; i < arguments.length; i++) {
            childs.push(arguments[i]);
        }
        var fragment = document.createDocumentFragment();
        for(var i = 0; i < childs.length; i++) {
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

    /**
     * Gets comment nodes inside of root.
     * @method
     * @param {Element} element - Element to be manipulated
     * @param {function} func - function to be called on element (as this)
     * @params {...any} subArgs - arguments provided to function
     */
    domUtils.getComments = function getComments(root) {
        var document = root.ownerDocument === null ? root : root.ownerDocument;
        return nodeIteratorToArray(document.createNodeIterator(root, 128));
    }

    return domUtils;
}));