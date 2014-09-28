/**
 * Created by zonebond on 13-10-31.
 */


(function(win){

    if(!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g,'');
        };
    }

    var init_handlers = [], handle, current_lang, langURL, languages, reloaded = false, doc = document, UNDEF = "undefined", is_dom_loaded = false;

    function addLoadEvent(fn) {
        if (typeof win.addEventListener != UNDEF) {
            win.addEventListener("load", fn, false);
        }
        else if (typeof doc.addEventListener != UNDEF) {
            doc.addEventListener("load", fn, false);
        }
        else if (typeof win.attachEvent != UNDEF) {
            win.attachEvent("onload", fn);
        }
        else if (typeof win.onload == "function") {
            var fnOld = win.onload;
            win.onload = function() {
                fnOld();
                fn();
            };
        }
        else {
            win.onload = fn;
        }
    }

    //inject dom init handlers
    var on_dom_load = function()
    {
        if((typeof doc.readyState != UNDEF && doc.readyState == "complete") || (typeof doc.readyState == UNDEF && (doc.getElementsByTagName('body')[0] || doc.body)))
        {
            on_dom_loaded_function();
        }
        if(!is_dom_loaded)
        {
            if (typeof doc.addEventListener != UNDEF)
            {
                doc.addEventListener("DOMContentLoaded", on_dom_loaded_function, false);
            }
            else
            {
                doc.attachEvent("onreadystatechange", function()
                {
                    if (doc.readyState == "complete")
                    {
                        doc.detachEvent("onreadystatechange", arguments.callee);
                        on_dom_loaded_function();
                    }
                });
                if (win == top)
                {
                    (function(){
                        if (is_dom_loaded) { return; }
                        try
                        {
                            doc.documentElement.doScroll("left");
                        }
                        catch(e) {
                            setTimeout(arguments.callee, 0);
                            return;
                        }
                        on_dom_loaded_function();
                    })();
                }
            }
            addLoadEvent(on_dom_loaded_function);
        }
    }();

    function on_dom_loaded_function()
    {
        if (is_dom_loaded)
        {
            return;
        }

        is_dom_loaded = true;
        handle = win.onload;
        win.onload = null;

        if(handle)
        {
            init_handlers.push(handle);
        }

        onload_handler();
    }

    function trigger_init_handlers()
    {
        for(var i = 0; i < init_handlers.length; i++)
        {
            init_handlers[i].call(this, null);
        }
    }

	var message_count = 1;
    function loadi18nLanguage()
    {
        if(reloaded && message_count > 0)
        {
			message_count--;
            alert("Load language error or Language file is not exist !");
			return;
        }
        reloaded = true;
        current_lang = 'en-US';
        langURL = get_language_file_url(current_lang);
        load_language_file(langURL, current_lang);
    }

    //ready for load language properties file
    function load_language_file(url, tag, callback_func)
    {
        var loader;
        if (window.XMLHttpRequest) // code for all new browsers
        {
            loader = new XMLHttpRequest();
        }
        else if (window.ActiveXObject) // code for IE5 and IE6
        {
            loader = new ActiveXObject("Microsoft.XMLHTTP");
        }
        if (loader != null)
        {
            loader.onreadystatechange = function(){
                if (loader.readyState == 4) // 4 = "loaded"
                {
                    if (loader.status == 200) // 200 = OK
                    {
                        state_change_handler(tag, loader.responseText);
                        try
                        {
                            callback_func.call(null);
                        }
                        catch (e){}
                        loader = null;
                    }
                    else
                    {
                        loadi18nLanguage();
                    }
                }
            };
            loader.open("GET", url, false);
            loader.setRequestHeader("If-Modified-Since", "0");
            loader.send();
        }
        else
        {
            alert("Your browser does not support XMLHTTP.");
        }
    }

    function state_change_handler(tag, lang_text)
    {
        if(!languages)
        {
            languages = {};
        }
        languages[tag] = file_to_properties(lang_text);
    }

    function transform(be_translate, handle)
    {
        if(!be_translate || be_translate.length == 0)
        {
            return;
        }

        var item, i;
        for(i = 0; i < be_translate.length; i++)
        {
            item = be_translate[i];
            handle.call(this, item);
        }
    }

    function getTranslateObject()
    {
        if(doc.querySelectorAll)
        {
            return doc.querySelectorAll("[i18n]");
        }
        else
        {
            return matchElementsByAttr(doc, 'i18n');
        }
    }

    function matchFilter(node)
    {
        if(!node || node == "")
        {
            return true;
        }

        if(node.nodeName.indexOf('#text') != -1)
        {
            return true;
        }

        if( node.nodeName == 'SCRIPT' ||
            node.nodeName == 'META')
        {
            return true;
        }

        return false;
    }

    function matchElementsByAttr(context, attr)
    {
        if(matchFilter(context))
        {
            return null;
        }

        var matched = [], attrs = context.attributes || [];

        if(attrs.length && attrs.getNamedItem(attr))
        {
            matched.push(context);
        }

        if(context.childNodes.length)
        {
            var children = context.childNodes,
                len = children.length;
            for(var i = 0; i < len; i++)
            {
                var sub_matched = matchElementsByAttr(children[i], attr);
                if(sub_matched && sub_matched.length)
                {
                    matched = matched.concat(sub_matched);
                }
            }
        }

        return matched;
    }

    //language parser
    function language_parser()
    {
        win.$i18n.isparsered = true;

        if(!has_lang_loaded(current_lang))
        {
            return;
        }

        var lang_properties = languages[current_lang];
        var be_translate = getTranslateObject();

        //attribute = i18n;
        transform(be_translate, function(item)
        {
            var opts, opt, tag, key, val, i;
            opts = item.getAttribute("i18n").split(';');
            for(i = 0; i < opts.length; i++)
            {
                opt = opts[i].split(':');
                if(!opt[0]) continue;
                tag = opt.length > 1 ? opt[0] : "text";
                key = opt[1] ? opt[1] : opt[0];
                val = lang_properties[key];

                if(tag == "text")
                {
                    item.innerHTML = val;
                }
                else if(tag == "-")
                {
                    item.outerHTML = val;
                }
                else
                {
                    item.setAttribute(tag, val);
                }
            }
        });
    }

    function get_language_file_url(lang)
    {
        var part = lang.split('-')
        var iso$ = part[0].toLowerCase() + (part[1] ? "-" + part[1].toUpperCase() : "");

        var attr = script.getAttribute('path');
		var href = location.pathname.split("/");
        var path = (!attr || attr == "") ? "/" + (href[1] ? href[1] : "") + "/i18n" : attr;

        return path + "/" + iso$ + ".properties";
    }

    var be_wait = false;
    function onload_handler()
    {
        language_parser();

        //确保在其它目标(exp:onpageshow)事件之前触发
        trigger_init_handlers();
    }

    function has_lang_loaded(lang)
    {
        if(!languages)
        {
            languages = {};
        }
        return languages[lang] ? true : false;
    }

    function get_current_lang()
    {
        var html = doc.all[0];
        var dom_lang = html ? html.lang : null;
        if(dom_lang)
        {
            return dom_lang;
        }
        else
        {
            return navigator.language ? navigator.language : navigator.browserLanguage;
        }
    }

    function file_to_properties(properties)
    {
        var items, i, item, mapset = {}, key, val, sp;
        items = properties.split('\r\n');
        for(i = 0; i < items.length; i++)
        {
            item = items[i];
            if(!item || item.trim() == "")
            {
                continue;
            }
            item = item.trim();
            sp = item[0];
            if(sp == '/' || sp == '#')
            {
                continue;
            }
            sp = item.indexOf("=");
            if(sp == -1)
            {
                continue;
            }
            key = item.substr(0, sp).trim();
            val = item.substr(++sp).trim();
            mapset[key] = val;
        }

        return mapset;
    }

    function getString(key)
    {
        if(!languages || !languages[current_lang])
        {
            return null;
        }

        return languages[current_lang][key];
    }

    function set_language(lang)
    {
        if(lang == current_lang)
        {
            return;
        }
        current_lang = lang;
        if(!languages[current_lang])
        {
            langURL = get_language_file_url(current_lang);
            load_language_file(langURL, current_lang, language_parser);
        }
        else
        {
            language_parser();
        }
    }

    // attachment feature to windwo
    win.$i18n = {
        loc:function(key)
        {
            if(!win.$i18n.isparsered)
            {
                language_parser();
            }
            return getString.call(this, key);
        },
        setLanguage:function(lang)
        {
            set_language.call(this, lang);
        },
        reload:function()
        {
            var url = "";
            for(var lang in languages)
            {
                url = get_language_file_url(lang);
                if(lang == current_lang)
                {
                    load_language_file(url, lang, language_parser);
                }
            }
        },
        render:function()
        {
            language_parser();
        }
    }

    var scripts = doc.scripts;
    for(var i = 0; i < scripts.length; i++)
    {
        var script = scripts[i];
        var src = script.src;
        if(src.indexOf('goi18n.js') != -1 || src.indexOf('goi18n.min.js') != -1)
        {
            $i18n.script = script;
            //load language source
            current_lang = get_current_lang();
            langURL = get_language_file_url(current_lang);
            load_language_file(langURL, current_lang);
            break;
        }
    }

})(window);