/**
 * Created by zonebond on 13-10-31.
 */


(function(win){

    var handle, current_lang, langURL, languages;

    //inject dom init handlers
    handle = win.onload;
    if(handle)
    {
        init_handlers.push(handle);
    }
    win.onload = onload_handler;

    var init_handlers = [];
    function trigger_init_handlers()
    {
        for(var i = 0; i < init_handlers.length; i++)
        {
            init_handlers[i].call(this, null);
        }
    }

    //ready for load language properties file
    var loader;

    function load_language_file(url)
    {
        loader = null;
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
            loader.onreadystatechange = state_change_handler;
            loader.open("GET", url, false);
            loader.setRequestHeader("If-Modified-Since", "0");
            loader.send();
        }
        else
        {
            alert("Your browser does not support XMLHTTP.");
        }
    }

    function state_change_handler()
    {
        if (loader.readyState == 4) // 4 = "loaded"
        {
            if (loader.status == 200) // 200 = OK
            {
                if(!languages)
                {
                    languages = {};
                }
                languages[current_lang] = file_to_properties(loader.responseText);
                language_parser();
            }
            else
            {
                alert("Problem retrieving XML data");
            }
        }
    }

    //language parser
    function language_parser()
    {
        if(!has_lang_loaded(current_lang))
        {
            return;
        }

        var lang_properties = languages[current_lang];
        var be_translate = $("[i18n]");

        //attribute = i18n;
        transform(be_translate, function(item){
            var opts, opt, tag, key, val, i;
            opts = item.attr("i18n").split(';');
            for(i = 0; i < opts.length; i++)
            {
                opt = opts[i].split(':');
                if(!opt[0]) continue;
                tag = opt.length > 1 ? opt[0] : "text";
                key = opt[1] ? opt[1] : opt[0];
                val = lang_properties[key];

                if(tag == "text")
                {
                    item.text(val);
                }
                else if(tag == "-")
                {
                    item.parent().text(val);
                }
                else
                {
                    item.attr(tag, val);
                }
            }
        });
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
            item = $(be_translate[i]);
            handle.call(this, item);
        }
    }

    function get_language_file_url(lang)
    {
        var part = lang.split('-')
        var iso$ = part[0].toLowerCase() + "-" + part[1].toUpperCase();
        return "../i18n/" + iso$ + ".properties";
    }

    function onload_handler()
    {
        current_lang = get_current_lang();
        langURL = get_language_file_url(current_lang);
        load_language_file(langURL);

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
        var dom_lang = document.body.getAttribute("language");
        if(dom_lang)
        {
            return dom_lang;
        }
        else
        {
            return navigator.language;
        }
    }

    function file_to_properties(properties)
    {
        var items, i, item, mapset = {}, key, val;
        items = properties.split('\n');
        for(i = 0; i < items.length; i++)
        {
            item = items[i].split('=');
            key = item[0];
            val = item[1];
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
            load_language_file(langURL)
        }
        else
        {
            language_parser();
        }
    }

    win.$i18n = {
        loc:function(key)
        {
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
                load_language_file(url);
            }
        }
    }

})(window);