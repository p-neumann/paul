/*
 Google Analytics Government Wide Site Usage Measurement Reference:Brian Katz, Cardinal Path
 v1.73min 130827 : Final Katz-CP Version. exts, multiple devuas
 
 GAS - Google Analytics on Steroids
 https://github.com/CardinalPath/gas
 Copyright 2011, Cardinal Path and DigitalInc.

 @author Eduardo Cereto <eduardocereto@gmail.com>
 Licensed under the GPLv3 license.
 

 Begin E-Nor
 v1.74 131022 : Fix for multiple PUA loop

*/
var _gaq=_gaq||[];var _gas=_gas||[];var GSA_CPwrapGA=(function(){var domainHash;var dlh=document.location.hostname;var oCONFIG={VERSION:"v1.74 131022 : Fix for multiple PUA loop",SEARCH_PARAMS:"querytext|nasaInclude|k|QT",HOST_DOMAIN_OR:dlh,LEADING_PERIOD:".",GWT_UAID:["UA-33523145-1"],AGENCY:"",VISITOR_TIMEOUT:-1,CAMPAIGN_TIMEOUT:-1,VISIT_TIMEOUT:-1,ANONYMIZE_IP:true,YOUTUBE:false};var oCVs={agency:{key:"Agency",slot:33,scope:3},sub_agency:{key:"Sub-Agency",slot:34,scope:3},version:{key:"Code Ver",slot:35,scope:3}};var _init=function(){_setParams();oCONFIG.HOST_DOMAIN_OR=oCONFIG.HOST_DOMAIN_OR.replace(/^www\./i,"");var ary=setHashAndPeriod(oCONFIG.HOST_DOMAIN_OR);oCONFIG.LEADING_PERIOD=ary[1];for(var i=0;i<oCONFIG.GWT_UAID.length;i++){_gas.push(["GSA_CP"+(i+1)+"._setAccount",oCONFIG.GWT_UAID[i]])}if(oCONFIG.PARALLEL_UA&&!oCONFIG.DEBUG_MODE){for(i=oCONFIG.GWT_UAID.length;i<oCONFIG.PARALLEL_UA.length+oCONFIG.GWT_UAID.length;i++){_gas.push(["GSA_CP"+(i+1)+"._setAccount",oCONFIG.PARALLEL_UA[i-1]])}}if(oCONFIG.ANONYMIZE_IP){_gaq.push(["_gat._anonymizeIp"])}_gas.push(["_setDomainName",oCONFIG.LEADING_PERIOD+oCONFIG.HOST_DOMAIN_OR]);setGAcookieTimeouts();if(ary[0]){_gas.push(["_setAllowHash",false])}_gas.push(["_gasTrackOutboundLinks"]);if(oCONFIG.EXTS){_gas.push(["_gasTrackDownloads",{extensions:oCONFIG.EXTS.split(",")}])}else{_gas.push(["_gasTrackDownloads"])}_gas.push(["_gasTrackMailto"]);if(oCONFIG.YOUTUBE){_gas.push(["_gasTrackYoutube",{percentages:[33,66,90],force:true}])}_gas.push(["_addHook","_trackEvent",function(cat,act){var linkDomain=act.match(/([^.]+\.(gov|mil)$)/);if(cat==="Outbound"&&typeof act==="string"&&linkDomain){return(document.location.hostname.indexOf(linkDomain[1])===-1)}}]);_gas.push(["_addHook","_trackPageview",function(pageName){var re=new RegExp("([?&])("+oCONFIG.SEARCH_PARAMS+")(=[^&]*)","i");if(re.test(pageName)){pageName=pageName.replace(re,"$1query$3")}return[pageName]}])};var setGAcookieTimeouts=function(){if(oCONFIG.VISIT_TIMEOUT>-1){_gaq.push(["_setSessionCookieTimeout",oCONFIG.VISIT_TIMEOUT*1000*60])}if(oCONFIG.VISITOR_TIMEOUT>-1){_gaq.push(["_setVisitorCookieTimeout",oCONFIG.VISITOR_TIMEOUT*1000*60*60*24*30.416667])}if(oCONFIG.CAMPAIGN_TIMEOUT>-1){_gaq.push(["_setCampaignCookieTimeout",oCONFIG.CAMPAIGN_TIMEOUT*1000*60*60*24*30.416667])}};var getDomainNameGovMil=function(strURL){strURL=strURL||dlh;strURL=strURL.match(/^(?:https?:\/\/)?([^\/:]+)/)[1];if(strURL.match(/(\d+\.){3}(\d+)/)||strURL.search(/\./)==-1){return strURL}try{if(/\.(gov|mil)$/i.test(strURL)){strURL=strURL.match(/\.([^.]+\.(gov|mil)$)/i)[1]}else{strURL=strURL.match(/(([^.\/]+\.[^.\/]{2,3}\.[^.\/]{2})|(([^.\/]+\.)[^.\/]{2,4}))(\/.*)?$/)[1]}}catch(e){}return strURL.toLowerCase()};var getDomainHash=function(strCookieDomain){var fromGaJs_h=function(e){return undefined==e||"-"==e||""==e};var fromGaJs_s=function(e){var k=1,a=0,j,i;if(!fromGaJs_h(e)){k=0;for(j=e.length-1;j>=0;j--){i=e.charCodeAt(j);k=(k<<6&268435455)+i+(i<<14);a=k&266338304;k=a!==0?k^a>>21:k}}return k};return fromGaJs_s(strCookieDomain)};var setHashAndPeriod=function(strCookieDomain){var utmaCookies=document.cookie.match(/__utma=[^.]+/g);var retVals=[false,""];if(!utmaCookies){return retVals}domainHash=getDomainHash(strCookieDomain);for(var elm=0;elm<utmaCookies.length;elm++){utmaCookies[elm]=utmaCookies[elm].substr(7);var hashFound=(domainHash==utmaCookies[elm]);if(hashFound){retVals[0]=false;return retVals}else{hashFound=(getDomainHash("."+strCookieDomain)==utmaCookies[elm]);retVals[1]=hashFound?".":""}retVals[0]=retVals[0]||("1"==utmaCookies[elm])}return retVals};var setAgencyVars=function(){setCustomVar(oCONFIG.AGENCY,oCVs.agency);setCustomVar(oCONFIG.SUB_AGENCY,oCVs.sub_agency)};var setCustomVar=function(value,oCV){if(!value){return}var pageTracker=_gat._getTrackerByName();var visitorCustomVarValue=pageTracker._getVisitorCustomVar(oCV.slot);if(!visitorCustomVarValue){_gas.push(["_setCustomVar",oCV.slot,oCV.key,value,oCV.scope])}};this.onEveryPage=function(){var pageName=document.location.pathname+document.location.search+document.location.hash;if(document.title.search(/404|not found/i)!==-1){var vpv404="/vpv404/"+pageName;pageName=vpv404.replace(/\/\//g,"/")+"/"+document.referrer}setCustomVar(oCONFIG.VERSION,oCVs.version);setAgencyVars();_gas.push(["_trackPageview",pageName])};var _setParams=function _setParams(){var src=document.getElementById("_fed_an_js_tag");var tags;if(!src){tags=document.getElementsByTagName("script")}for(var i=0;tags&&!src&&i<tags.length;i++){var tag=tags[i];if(/federated-analytics.*\.js/i.test(tag.src)){src=tag}}if(src){src=src.src.split(/[?&]/);src.shift();for(var i=0;i<src.length;i++){var param=src[i].split("=");src[0]=src[0].toLowerCase();if("agency"==param[0]){oCONFIG.AGENCY=param[1].toUpperCase()}else{if(/sub(-?agency)?/.test(param[0])){oCONFIG.SUB_AGENCY=param[1].toUpperCase()}else{if("sp"==param[0]){param[1]=param[1].replace(/[,;\/]/g,"|");oCONFIG.SEARCH_PARAMS=oCONFIG.SEARCH_PARAMS+"|"+param[1];oCONFIG.SEARCH_PARAMS=oCONFIG.SEARCH_PARAMS.replace(/\|\|/g,"|")}else{if("vcto"==param[0]){oCONFIG.VISITOR_TIMEOUT=parseInt(param[1])}else{if("camto"==param[0]){oCONFIG.CAMPAIGN_TIMEOUT=parseInt(param[1])}else{if("pua"==param[0]){oCONFIG.PARALLEL_UA=param[1].toUpperCase();oCONFIG.PARALLEL_UA=oCONFIG.PARALLEL_UA.split(",")}else{if("devua"==param[0]){oCONFIG.GWT_UAID=param[1].toUpperCase();oCONFIG.GWT_UAID=oCONFIG.GWT_UAID.split(",");oCONFIG.DEBUG_MODE=true}else{if("exts"==param[0]){oCONFIG.EXTS=param[1].toLowerCase();oCONFIG.EXTS=oCONFIG.EXTS.replace(/ /g,"")}else{if("aip"==param[0]){oCONFIG.ANONYMIZE_IP=("true"==param[1])?true:!("false"==param[1])}else{if("yt"==param[0]){oCONFIG.YOUTUBE=("true"==param[1])?true:!("false"==param[1])}else{if("sdor"==param[0]){if(("true"==param[1])?true:!("false"==param[1])){oCONFIG.HOST_DOMAIN_OR=getDomainNameGovMil()}else{oCONFIG.HOST_DOMAIN_OR=dlh}}}}}}}}}}}}}}oCONFIG.AGENCY=oCONFIG.AGENCY||"unspecified:"+oCONFIG.HOST_DOMAIN_OR;oCONFIG.SUB_AGENCY=oCONFIG.SUB_AGENCY||(""+dlh);oCONFIG.SUB_AGENCY=oCONFIG.AGENCY+" - "+oCONFIG.SUB_AGENCY;oCONFIG.CAMPAIGN_TIMEOUT=Math.min(oCONFIG.CAMPAIGN_TIMEOUT,oCONFIG.VISITOR_TIMEOUT)};_init()});(function(window,undefined){var GasHelper=function(){this._setDummyTracker()};GasHelper.prototype._setDummyTracker=function(){if(!this["tracker"]){var trackers=window._gat["_getTrackers"]();if(trackers.length>0){this["tracker"]=trackers[0]}}};GasHelper.prototype.inArray=function(obj,item){if(obj&&obj.length){for(var i=0;i<obj.length;i++){if(obj[i]===item){return true}}}return false};GasHelper.prototype._sanitizeString=function(str,strict_opt){str=str.toLowerCase().replace(/^\ +/,"").replace(/\ +$/,"").replace(/\s+/g,"_").replace(/[áàâãåäæª]/g,"a").replace(/[éèêëЄ€]/g,"e").replace(/[íìîï]/g,"i").replace(/[óòôõöøº]/g,"o").replace(/[úùûü]/g,"u").replace(/[ç¢©]/g,"c");if(strict_opt){str=str.replace(/[^a-z0-9_\-]/g,"_")}return str.replace(/_+/g,"_")};GasHelper.prototype._addEventListener=function(obj,evt,ofnc,bubble){var fnc=function(event){if(!event||!event.target){event=window.event;event.target=event.srcElement}return ofnc.call(obj,event)};if(obj.addEventListener){obj.addEventListener(evt,fnc,!!bubble);return true}else{if(obj.attachEvent){return obj.attachEvent("on"+evt,fnc)}else{evt="on"+evt;if(typeof obj[evt]==="function"){fnc=(function(f1,f2){return function(){f1.apply(this,arguments);f2.apply(this,arguments)}}(obj[evt],fnc))}obj[evt]=fnc;return true}}};GasHelper.prototype._liveEvent=function(tag,evt,ofunc){var gh=this;tag=tag.toUpperCase();tag=tag.split(",");gh._addEventListener(document,evt,function(me){for(var el=me.target;el.nodeName!=="HTML";el=el.parentNode){if(gh.inArray(tag,el.nodeName)||el.parentNode===null){break}}if(el&&gh.inArray(tag,el.nodeName)){ofunc.call(el,me)}},true)};GasHelper.prototype._DOMReady=function(callback){var scp=this;function cb(){if(cb.done){return}cb.done=true;callback.apply(scp,arguments)}if(/^(interactive|complete)/.test(document.readyState)){return cb()}this._addEventListener(document,"DOMContentLoaded",cb,false);this._addEventListener(window,"load",cb,false)};window._gaq=window._gaq||[];var _prev_gas=window._gas||[];if(_prev_gas._accounts_length>=0){return}var document=window.document,toString=Object.prototype.toString,hasOwn=Object.prototype.hasOwnProperty,push=Array.prototype.push,slice=Array.prototype.slice,trim=String.prototype.trim,sindexOf=String.prototype.indexOf,url=document.location.href,documentElement=document.documentElement;function GAS(){var self=this;self.version="1.10.1";self._accounts={};self._accounts_length=0;self._queue=_prev_gas;self._default_tracker="_gas1";self.gh={};self._hooks={_addHook:[self._addHook]};self.push(function(){self.gh=new GasHelper()})}GAS.prototype._addHook=function(fn,cb){if(typeof fn==="string"&&typeof cb==="function"){if(typeof _gas._hooks[fn]==="undefined"){_gas._hooks[fn]=[]}_gas._hooks[fn].push(cb)}return false};function _build_acct_name(acct){return acct===_gas._default_tracker?"":acct+"."}function _gaq_push(arr){if(_gas.debug_mode){try{console.log(arr)}catch(e){}}return window._gaq.push(arr)}GAS.prototype._execute=function(){var args=slice.call(arguments),self=this,sub=args.shift(),gaq_execute=true,i,foo,hooks,acct_name,repl_sub,return_val=0;if(typeof sub==="function"){return _gaq_push((function(s,gh){return function(){s.call(gh)}}(sub,self.gh)))}else{if(typeof sub==="object"&&sub.length>0){foo=sub.shift();if(sindexOf.call(foo,".")>=0){acct_name=foo.split(".")[0];foo=foo.split(".")[1]}else{acct_name=undefined}hooks=self._hooks[foo];if(hooks&&hooks.length>0){for(i=0;i<hooks.length;i++){try{repl_sub=hooks[i].apply(self.gh,sub);if(repl_sub===false){gaq_execute=false}else{if(repl_sub&&repl_sub.length>0){sub=repl_sub}}}catch(e){if(foo!=="_trackException"){self.push(["_trackException",e])}}}}if(gaq_execute===false){return 1}if(foo==="_setAccount"){for(i in self._accounts){if(self._accounts[i]===sub[0]){if(acct_name===undefined){return 1}}}acct_name=acct_name||"_gas"+String(self._accounts_length+1);if(typeof self._accounts._gas1==="undefined"&&sindexOf.call(acct_name,"_gas")!==-1){acct_name="_gas1"}self._accounts[acct_name]=sub[0];self._accounts_length+=1;acct_name=_build_acct_name(acct_name);return_val=_gaq_push([acct_name+foo,sub[0]]);self.gh._setDummyTracker();return return_val}if(foo==="_link"||foo==="_linkByPost"||foo==="_require"||foo==="_anonymizeIp"){args=slice.call(sub);args.unshift(foo);return _gaq_push(args)}var acc_foo;if(acct_name&&self._accounts[acct_name]){acc_foo=_build_acct_name(acct_name)+foo;args=slice.call(sub);args.unshift(acc_foo);return _gaq_push(args)}if(self._accounts_length>0){for(i in self._accounts){if(hasOwn.call(self._accounts,i)){acc_foo=_build_acct_name(i)+foo;args=slice.call(sub);args.unshift(acc_foo);return_val+=_gaq_push(args)}}}else{args=slice.call(sub);args.unshift(foo);return _gaq_push(args)}return return_val?1:0}}};GAS.prototype.push=function(){var self=this;var args=slice.call(arguments);for(var i=0;i<args.length;i++){(function(arr,self){window._gaq.push(function(){self._execute.call(self,arr)})}(args[i],self))}};window._gas=_gas=new GAS();_gas.push(["_addHook","_trackException",function(exception,message){_gas.push(["_trackEvent","Exception "+(exception.name||"Error"),message||exception.message||exception,url]);return false}]);_gas.push(["_addHook","_setDebug",function(set_debug){_gas.debug_mode=!!set_debug}]);_gas.push(["_addHook","_popHook",function(func){var arr=_gas._hooks[func];if(arr&&arr.pop){arr.pop()}return false}]);_gas.push(["_addHook","_gasSetDefaultTracker",function(tname){_gas._default_tracker=tname;return false}]);_gas.push(["_addHook","_trackEvent",function(){var args=slice.call(arguments);if(args[3]){args[3]=(args[3]<0?0:Math.round(args[3]))||0}return args}]);function _checkFile(src,extensions){if(typeof src!=="string"){return false}var ext=src.split("?")[0];ext=ext.split(".");ext=ext[ext.length-1];if(ext&&this.inArray(extensions,ext)){return ext}return false}var _trackDownloads=function(opts){var gh=this;if(!gh._downloadTracked){gh._downloadTracked=true}else{return}if(!opts){opts={extensions:[]}}else{if(typeof opts==="string"){opts={extensions:opts.split(",")}}else{if(opts.length>=1){opts={extensions:opts}}}}opts.category=opts.category||"Download";var ext="xls,xlsx,doc,docx,ppt,pptx,pdf,txt,zip";ext+=",rar,7z,gz,tgz,exe,wma,mov,avi,wmv,mp3,mp4,csv,tsv,mobi,epub,swf";ext=ext.split(",");opts.extensions=opts.extensions.concat(ext);gh._liveEvent("a","mousedown",function(e){var el=this;if(el.href){var ext=_checkFile.call(gh,el.href,opts.extensions);if(ext){_gas.push(["_trackEvent",opts.category,ext,el.href])}}});return false};_gas.push(["_addHook","_gasTrackDownloads",_trackDownloads]);_gas.push(["_addHook","_trackDownloads",_trackDownloads]);var _gasTrackOutboundLinks=function(opts){if(!this._outboundTracked){this._outboundTracked=true}else{return}var gh=this;if(!opts){opts={}}opts.category=opts.category||"Outbound";gh._liveEvent("a","mousedown",function(e){var l=this;if((l.protocol==="http:"||l.protocol==="https:")&&sindexOf.call(l.hostname,document.location.hostname)===-1){var path=(l.pathname+l.search+""),utm=sindexOf.call(path,"__utm");if(utm!==-1){path=path.substring(0,utm)}_gas.push(["_trackEvent",opts.category,l.hostname,path])}})};_gas.push(["_addHook","_gasTrackOutboundLinks",_gasTrackOutboundLinks]);_gas.push(["_addHook","_trackOutboundLinks",_gasTrackOutboundLinks]);var _gasTrackMailto=function(opts){if(!this._mailtoTracked){this._mailtoTracked=true}else{return}if(!opts){opts={}}opts.category=opts.category||"Mailto";this._liveEvent("a","mousedown",function(e){var el=e.target;if(el&&el.href&&el.href.toLowerCase&&sindexOf.call(el.href.toLowerCase(),"mailto:")===0){_gas.push(["_trackEvent",opts.category,el.href.substr(7)])}});return false};_gas.push(["_addHook","_gasTrackMailto",_gasTrackMailto]);_gas.push(["_addHook","_trackMailto",_gasTrackMailto]);var _ytTimeTriggers=[];var _ytOpts;var _ytPoolMaps={};function _ytPool(target,hash){if(_ytPoolMaps[hash]===undefined||_ytPoolMaps[hash].timeTriggers.length<=0){return false}var p=target.getCurrentTime()/target.getDuration()*100;if(p>=_ytPoolMaps[hash].timeTriggers[0]){var action=_ytPoolMaps[hash].timeTriggers.shift();_gas.push(["_trackEvent",_ytOpts.category,action+"%",target.getVideoUrl()])}_ytPoolMaps[hash].timer=setTimeout(_ytPool,1000,target,hash)}function _ytStopPool(target){var h=target.getVideoUrl();if(_ytPoolMaps[h]&&_ytPoolMaps[h].timer){_ytPool(target,h);clearTimeout(_ytPoolMaps[h].timer)}}function _ytStartPool(target){if(_ytTimeTriggers&&_ytTimeTriggers.length){var h=target.getVideoUrl();if(_ytPoolMaps[h]){_ytStopPool(target)}else{_ytPoolMaps[h]={};_ytPoolMaps[h].timeTriggers=slice.call(_ytTimeTriggers)}_ytPoolMaps[h].timer=setTimeout(_ytPool,1000,target,h)}}function _ytStateChange(event){var action="";switch(event.data){case 0:action="finish";_ytStopPool(event.target);break;case 1:action="play";_ytStartPool(event.target);break;case 2:action="pause";_ytStopPool(event.target);break}if(action){_gas.push(["_trackEvent",_ytOpts.category,action,event.target["getVideoUrl"]()])}}function _ytError(event){_gas.push(["_trackEvent",_ytOpts.category,"error ("+event.data+")",event.target["getVideoUrl"]()])}function _ytMigrateObjectEmbed(){var objs=document.getElementsByTagName("object");var pars,ifr,ytid;var r=/(https?:\/\/www\.youtube(-nocookie)?\.com[^\/]*).*\/v\/([^&?]+)/;for(var i=0;i<objs.length;i++){pars=objs[i].getElementsByTagName("param");for(var j=0;j<pars.length;j++){if(pars[j].name==="movie"&&pars[j].value){ytid=pars[j].value.match(r);if(ytid&&ytid[1]&&ytid[3]){ifr=document.createElement("iframe");ifr.src=ytid[1]+"/embed/"+ytid[3]+"?enablejsapi=1";ifr.width=objs[i].width;ifr.height=objs[i].height;ifr.setAttribute("frameBorder","0");ifr.setAttribute("allowfullscreen","");objs[i].parentNode.insertBefore(ifr,objs[i]);objs[i].parentNode.removeChild(objs[i]);i--}break}}}}function _trackYoutube(opts){var force=opts.force;var opt_timeTriggers=opts.percentages;if(force){try{_ytMigrateObjectEmbed()}catch(e){_gas.push(["_trackException",e,"GAS Error on youtube.js:_ytMigrateObjectEmbed"])}}var youtube_videos=[];var iframes=document.getElementsByTagName("iframe");for(var i=0;i<iframes.length;i++){if(sindexOf.call(iframes[i].src,"//www.youtube.com/embed")>-1){if(sindexOf.call(iframes[i].src,"enablejsapi=1")<0){if(force){if(sindexOf.call(iframes[i].src,"?")<0){iframes[i].src+="?enablejsapi=1"}else{iframes[i].src+="&enablejsapi=1"}}else{continue}}youtube_videos.push(iframes[i])}}if(youtube_videos.length>0){if(opt_timeTriggers&&opt_timeTriggers.length){_ytTimeTriggers=opt_timeTriggers}window.onYouTubePlayerAPIReady=function(){var p;for(var i=0;i<youtube_videos.length;i++){p=new window.YT["Player"](youtube_videos[i]);p.addEventListener("onStateChange",_ytStateChange);p.addEventListener("onError",_ytError)}};var tag=document.createElement("script");var protocol="http:";if(document.location.protocol==="https:"){protocol="https:"}tag.src=protocol+"//www.youtube.com/player_api";tag.type="text/javascript";tag.async=true;var firstScriptTag=document.getElementsByTagName("script")[0];firstScriptTag.parentNode.insertBefore(tag,firstScriptTag)}}var _gasTrackYoutube=function(opts){var args=slice.call(arguments);if(args[0]&&(typeof args[0]==="boolean"||args[0]==="force")){opts={force:!!args[0]};if(args[1]&&args[1].length){opts.percentages=args[1]}}opts=opts||{};opts.force=opts.force||false;opts.category=opts.category||"YouTube Video";opts.percentages=opts.percentages||[];_ytOpts=opts;var gh=this;gh._DOMReady(function(){_trackYoutube.call(gh,opts)});return false};_gas.push(["_addHook","_gasTrackYoutube",_gasTrackYoutube]);_gas.push(["_addHook","_trackYoutube",_gasTrackYoutube]);while(_gas._queue.length>0){_gas.push(_gas._queue.shift())}if(typeof window._gat==="undefined"){(function(){var ga=document.createElement("script");ga.type="text/javascript";ga.async=true;ga.src=("https:"===document.location.protocol?"https://ssl":"http://www")+".google-analytics.com/ga.js";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(ga,s)}())}})(window);_gas.push(function(){this._DOMReady(function(){try{var oGSA_CPwrapGA=new GSA_CPwrapGA();if(!document._gsaDelayGA){oGSA_CPwrapGA.onEveryPage()}}catch(e){try{console.log(e.message);console.log(e.stack.toString())}catch(e){}}})});
