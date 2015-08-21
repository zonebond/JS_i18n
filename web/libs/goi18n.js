/**
 * Created by zonebond on 13-10-31.
 */


(function()
{
    // String Trim Function Hack!
    if (!String.prototype.trim) {
        String.prototype.trim = function ()
        {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    try
    {
        if (!HTMLElement.prototype.__nativeAppendChild__) {
            HTMLElement.prototype.__nativeAppendChild__ = HTMLElement.prototype.appendChild;
            HTMLElement.prototype.appendChild = function ()
            {
                var beFiltered = this.nodeName == 'HEAD' ? true : false;

                if (!beFiltered && $i18n && (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9)) {
                    try {
                        $i18n.parseDom(arguments[0]);
                    } catch (ex) {
                    }
                }

                return this.__nativeAppendChild__.apply(this, arguments);
            };
        }
    }catch(ex)
    {
        if (!Element.prototype.__nativeAppendChild__) {
            Element.prototype.__nativeAppendChild__ = Element.prototype.appendChild;
            Element.prototype.appendChild = function ()
            {
                var beFiltered = this.nodeName == 'HEAD' ? true : false;

                if (!beFiltered && $i18n && (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9)) {
                    try {
                        $i18n.parseDom(arguments[0]);
                    } catch (ex) {
                    }
                }

                return this.__nativeAppendChild__.apply(this, arguments);
            };
        }
    }

    // International Tool
    var i18n = function ()
        {
            this.defaultI18n = "EN-US";
            this.tryDefaultI18n = false;
        },
        i18n_P = i18n.prototype;
    i18n_P.i18nTo = function (to)
    {
        if (to == undefined)
            return this.__i18nTo__;

        this.__i18nTo__ = to;

        if (!this.hasLanguage(to)) {
            this.fetchFile(to, this.languageSRC(to));
            // In case: target file is fault to loaded;
            if (!this.hasLanguage(to) && !this.tryDefaultI18n) {
                this.tryDefaultI18n = true;
                this.i18nTo(this.defaultI18n);
                if (!this.hasLanguage(this.defaultI18n)) {
                    alert("Load language error or Language file is not exist !");
                    return;
                }
            }
        }

        this.parseDOMContent();
    };
    i18n_P.fetchFile = function (to, src, reload, ready)
    {
        if (this.LANGUAGES(to) && !(reload == undefined ? false : reload)) return;

        var that = this, async = ready ? true : false;
        that.load(src, function ()
        {
            that.LANGUAGES(to, that.streamToProperties(this.result, that.LANGUAGES(to)));
            if (ready) { ready.call(that); }
        }, null, async);
    };
    i18n_P.streamToProperties = function (stream, mergeSet)
    {
        var items, i, item, key, val, sp,
            mapset = mergeSet == undefined ? {} : mergeSet;

        items = stream.split('\r\n');
        for (i = 0; i < items.length; i++) {
            item = items[i];
            if (!item || item.trim() == "") {
                continue;
            }
            item = item.trim();
            sp = item[0];
            if (sp == '/' || sp == '#') {
                continue;
            }
            sp = item.indexOf("=");
            if (sp == -1) {
                continue;
            }
            key = item.substr(0, sp).trim();
            val = item.substr(++sp).trim();
            mapset[key] = val;
        }

        return mapset;
    };
    i18n_P.LANGUAGES = function (lang, properties)
    {
        if (!lang)
            return null;

        if (!this.__langs_store__) {
            this.__langs_store__ = {};
        }

        if (properties == undefined) return this.__langs_store__[lang];

        this.__langs_store__[lang] = properties;
    };
    i18n_P.hasLanguage = function (lang)
    {
        return this.LANGUAGES(lang) ? true : false;
    };
    i18n_P.LocalStorage = function (uri, anything)
    {
        if(window.sessionStorage)
        {
            if (anything == undefined) {
                return window.sessionStorage.getItem(uri);
            }
            window.sessionStorage.setItem(uri, anything);
        }
        else
        {
            if (!window.top.__CacheCode__) {
                window.top.__CacheCode__ = {};
            }

            if (anything == undefined) {
                return window.top.__CacheCode__[uri];
            }

            window.top.__CacheCode__[uri] = anything;
        }
    };
    i18n_P.load = function (src, loaded, error, async)
    {
        var loader = {src: src, loaded: loaded, error: error}, xhr, that = this;

        var result = that.LocalStorage(src);
        if (result) {
            loader.result = result;
            if (loader.loaded) loader.loaded.call(loader);
            loader = null;
            return;
        }

        if (window.XMLHttpRequest) {
            xhr = new window.XMLHttpRequest();
        }
        else if (window.ActiveXObject) {
            try {
                xhr = new window.ActiveXObject("Msxml2.XMLHTTP");
            }
            catch (ex) {
                try {
                    xhr = new window.ActiveXObject("Microsoft.XMLHTTP");
                }
                catch (ex) {
                }
            }
        }

        if (xhr) {
            loader.xhr = xhr;

            xhr.onload = xhr.onreadystatechange = function (event)
            {
                if (xhr.readyState == 4)
                {
                    if (xhr.status == 200)
                    {
                        // Handle memory leak in IE
                        xhr.onload = xhr.onreadystatechange = null;

                        loader.result = xhr.responseText;
                        if (loader.loaded) loader.loaded.call(loader);
                        that.LocalStorage(loader.src, loader.result);
                        loader = null;
                    }
                    else
                    {
                        loader.xhr.error(event);
                    }
                }
            };

            xhr.error = function (event)
            {
                xhr.error = null;
                if (loader.error) {
                    loader.error.call(loader);
                }
                else {
                    if (console) console.error(" :: Load language error or Language file is not exist! :: " + event.toString());
                }
                loader = null;
            };

            xhr.open("POST", src, (async == undefined ? false : async));
            xhr.setRequestHeader("If-Modified-Since", "0");
            xhr.send();
        }
        else {
            alert("Your browser does not support XMLHTTP.");
        }
    };
    i18n_P.reload = function ()
    {
        for (var lang in this.__langs_store__) {
            this.fetchFile(lang, this.languageSRC(lang), true);
        }
        this.i18nTo(this.i18nTo());
    };
    i18n_P.languageSRC = function (lang, dir)
    {
        if (!this.script) {
            var that = this;
            var scripts = window.document.scripts;
            for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
                var src = script.src;
                if (src.indexOf('goi18n.js') != -1 || src.indexOf('goi18n.min.js') != -1) {
                    that.script = script;
                    break;
                }
            }
        }

        var attr = this.script == undefined ? null : this.script.getAttribute('path');

        var part = lang.split('-');
        var iso$ = part[0].toLowerCase() + (part[1] ? "-" + part[1].toUpperCase() : "");

        var href = window.location.pathname.split("/");
        var path = dir ? dir : ((!attr || attr == "") ? "/" + (href[1] ? href[1] : "") + "/i18n" : attr);

        return path + "/" + iso$ + ".properties";
    };
    i18n_P.detectLanguage = function ()
    {
        var html = window.document.all[0],
            navigator = window.navigator,
            dom_lang = html ? html.lang : null;

        return (dom_lang ? dom_lang : navigator.language ? navigator.language : navigator.browserLanguage).toUpperCase();
    };
    i18n_P.matchFilter = function (node)
    {
        if (!node || node == "") {
            return true;
        }

        if (node.nodeName.indexOf('#text') != -1) {
            return true;
        }

        if (node.nodeName == 'SCRIPT' ||
            node.nodeName == 'META') {
            return true;
        }

        return false;
    };
    i18n_P.matchElementsByAttr = function (context, attr)
    {
        if (this.matchFilter(context)) {
            return null;
        }

        var matched = [], attrs = context.attributes || [];

        if (attrs.length && attrs.getNamedItem(attr)) {
            matched.push(context);
        }

        if (context.childNodes.length) {
            var children = context.childNodes,
                len = children.length;
            for (var i = 0; i < len; i++) {
                var sub_matched = this.matchElementsByAttr(children[i], attr);
                if (sub_matched && sub_matched.length) {
                    matched = matched.concat(sub_matched);
                }
            }
        }

        return matched;
    };
    i18n_P.queryElements = function (node)
    {
        if (node.nodeType == 1 && node.getAttribute('i18n')) {
            return [node];
        }
        else if (node.querySelectorAll) {
            return node.querySelectorAll("[i18n]");
        }
        else {
            return this.matchElementsByAttr(node, 'i18n');
        }
    };
    i18n_P.translate = function (be_translate, properties, everyFunc)
    {
        if (!be_translate || be_translate.length == 0) {
            return;
        }

        var item, i;
        for (i = 0; i < be_translate.length; i++) {
            item = be_translate[i];
            everyFunc.call(null, item, properties);
        }
    };
    i18n_P.elementsTransFunc = function (item, properties)
    {
        var opts, opt, tag, key, val, i;
        opts = item.getAttribute("i18n").split(';');
        for (i = 0; i < opts.length; i++) {
            opt = opts[i].split(':');
            if (!opt[0]) continue;
            tag = opt.length > 1 ? opt[0] : "text";
            key = opt[1] ? opt[1] : opt[0];
            val = properties[key];

            if (tag == "text") {
                item.innerHTML = val;
            }
            else if (tag == "-") {
                item.outerHTML = val;
            }
            else {
                item.setAttribute(tag, val);
            }
        }
    };
    i18n_P.parseDOMContent = function (node)
    {
        var langProp = this.LANGUAGES(this.i18nTo());
        if (!langProp) return;

        this.translate(this.queryElements(node == undefined ? window.document : node), langProp, this.elementsTransFunc);
    };
    i18n_P.loc = function (key, lang)
    {
        var props = this.LANGUAGES(lang == undefined ? this.i18nTo() : lang);
        if (!props) {
            return null;
        }

        return props[key];
    };
    i18n_P.AutoLaunch = function ()
    {
        var WhenContentLoaded = function (callback)
            {
                var WIN = window, DOC = window.document, UND = undefined, fn = function ()
                {
                    if (WhenContentLoaded.called)
                        return;
                    WhenContentLoaded.called = true;
                    callback.call();
                };

                WhenContentLoaded.called = false;

                if ((DOC.readyState != UND && DOC.readyState == "complete") || (DOC.readyState == UND && (DOC.getElementsByTagName('body')[0] || DOC.body))) {
                    fn();
                }

                if (!WhenContentLoaded.called) {
                    if (DOC.addEventListener != UND) {
                        DOC.addEventListener("DOMContentLoaded", fn, false);
                    }
                    else if (attachEvent != UND) {
                        DOC.attachEvent("onreadystatechange", function ()
                        {
                            if (DOC.readyState == "complete") {
                                DOC.detachEvent("onreadystatechange", arguments.callee);
                                fn();
                            }
                        });
                    }
                    else {
                        DOC.onreadystatechange = function ()
                        {
                            DOC.onreadystatechange = null;
                            fn();
                        };
                    }

                    //win loaded
                    if (WIN.addEventListener != UND) {
                        WIN.addEventListener("load", fn, false);
                    }
                    else if (DOC.addEventListener != UND) {
                        DOC.addEventListener("load", fn, false);
                    }
                    else if (WIN.attachEvent != UND) {
                        WIN.attachEvent("onload", fn);
                    }
                    else if (WIN.onload == "function") {
                        var fnOld = WIN.onload;
                        WIN.onload = function ()
                        {
                            fn();
                            //确保在其它目标(exp:onpageshow)事件之前触发
                            fnOld();
                        };
                    }
                    else {
                        WIN.onload = fn;
                    }
                }

            },
            instance = this,
            lang = this.detectLanguage(),
            src = this.languageSRC(lang),
            launcher = function ()
            {
                if (!instance.canAutoLaunching) {
                    instance.canAutoLaunching = true;
                    return;
                }
                instance.i18nTo(lang);
            };

        WhenContentLoaded(launcher);

        this.fetchFile(lang, src, true, launcher);

        return {
            __i18n__: instance,
            loc: function (key, lang)
            {
                return instance.loc(key, lang);
            },
            setLanguage: function (lang)
            {
                if (lang == instance.i18nTo())
                    return;

                instance.i18nTo(lang);
            },
            parseDom: function (node)
            {
                instance.parseDOMContent(node);
            },
            reload: function ()
            {
                instance.reload();
            },
            render: function ()
            {
                if (console) console.log('render - deprecated');
                //instance.parseDOMContent();
            },
            mergeExtSource: function (src, lang)
            {
                lang = lang == undefined ? instance.i18nTo() : lang;
                if (!lang) lang = instance.detectLanguage();
                instance.fetchFile(lang, instance.languageSRC(lang, src), true);
            }
        }
    };

    window.$i18n = (new i18n()).AutoLaunch();

})();