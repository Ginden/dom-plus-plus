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
    var domUtils = {};
    var has = ({}).hasOwnProperty;

    domUtils.$extendNatives = function() {
        if (typeof Element !== 'undefined') {
            Element.prototype.setAttributes = function() {
                return domUtils.setAttributes.apply(null, [this].concat([].slice.call(arguments)));
            };
        }
        if (typeof document !== 'undefined') {
            document.createFragmentFromHTML = function() {
                return domUtils.createFragmentFromHTML.apply(null, [this].concat([].slice.call(arguments)));
            };
        }
        if (typeof Node !== 'undefined') {
            Node.prototype.appendChilds = function() {
                return domUtils.appendChilds.apply(null, [this].concat([].slice.call(arguments)));
            };
            Node.prototype.operateOnDetached = function() {
                return domUtils.operateOnDetached.apply(null, [this].concat([].slice.call(arguments)));
            };
            Node.prototype.operateOnDetachedAsync = function() {
                return domUtils.operateOnDetachedAsync.apply(null, [this].concat([].slice.call(arguments)));
            };
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
        var childs = [].slice.call(arguments,1);
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
        var subArgs = [].slice.call(arguments,2);
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
        var subArgs = [].slice.call(arguments,2);
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

    return domUtils;
}));