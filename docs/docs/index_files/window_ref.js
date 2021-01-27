/*
JavaScript routines to resolve references for windows inside lightbox
*/

getOpener = function(ignoreOpenerProperty)
{
	if ((self != top) && (typeof(top.commonspot)!= 'undefined') && (typeof(top.commonspot.lightbox)!= 'undefined'))
	{
		return top.commonspot.lightbox.getOpenerWindow(ignoreOpenerProperty);
	}
	else
	{
		return self.opener;
	}
}

getOpenerWithIFrame = function(iFrameID)
{
	var wnd = getOpener();
	var obj = wnd.document.getElementById(iFrameID);
	if (obj)
	{
		return obj.contentWindow;
	}
	return getOpener();
}

getRTEopener = function(FrameName)
{
	// Grab the window object out of the RTE's iframe
	if (!FrameName)
		FrameName = 'WebEdit';
	var fr = null;
	var stackLen = 0;
	if ((self != top) && (typeof(top.commonspot)!= 'undefined') && (typeof(top.commonspot.lightbox)!= 'undefined'))
		stackLen = top.commonspot.lightbox.stack.length;
	for (var i=stackLen-1; i>=0; i--)
	{
		if(top.commonspot.lightbox.stack.length == 1)
			fr = top.commonspot.lightbox.getOpenerWindow().document.getElementById(FrameName);
		else
			fr = top.commonspot.lightbox.stack[i].getWindow().document.getElementById(FrameName);
		if (fr)
			return fr.contentWindow;
	}
	return fr;
}

hasLightbox = function()
{
	return ((top != self) && (typeof(top.commonspot)!= 'undefined') && (typeof(top.commonspot.lightbox)!= 'undefined'));
}

var cleanHTMLWnd;
var spellcheckerWnd;
getCleanHTMLTarget = function(dlgLoader)
{
	var url = dlgLoader ? dlgLoader + '?csModule=/commonspot/dhtmledit/clean_dhtml_fields' : '/commonspot/dhtmledit/clean_dhtml_fields.cfm';

	if((top != self) && (typeof(top.commonspot)!= 'undefined') && (typeof(top.commonspot.lightbox)!= 'undefined'))
	{
		var frName;
		for (var i=0; i<top.commonspot.lightbox.stack.length; i++)
		{
			frName = top.commonspot.lightbox.stack[i].getFrameName();
			if (frName == 'cleanHTML')
				return frName;
		}	
		var lightboxTarget = openEmptyLightBox(url, null, 'cleanHTML');
		return top.commonspot.lightbox.getFrameName();
	}
	else
	{
		if (!cleanHTMLWnd || cleanHTMLWnd.closed)
			cleanHTMLWnd = newWindow( 'cleanHTML', url);
		return 'cleanHTML';	
	}
	
}

getSpellCheckTarget = function(dlgLoader)
{
	var url = dlgLoader ? dlgLoader + '?csModule=/commonspot/spellchk/introscreen' : '/commonspot/spellchk/introscreen.cfm';

	if((top != self) && (typeof(top.commonspot)!= 'undefined') && (typeof(top.commonspot.lightbox)!= 'undefined'))
	{
		// Open an empty lightbox
		var frName;
		for (var i=0; i<top.commonspot.lightbox.stack.length; i++)
		{
			frName = top.commonspot.lightbox.stack[i].getFrameName();
			if (frName == 'spellchecker')
				return frName;
		}	
		var lightboxTarget = openEmptyLightBox(url, null, 'spellchecker');
		return top.commonspot.lightbox.getFrameName();
	}
	else
	{
		if (!spellcheckerWnd || spellcheckerWnd.closed)
			spellcheckerWnd = newWindow( 'spellchecker', url);
		return 'spellchecker';	
	}
	
}

closeEmptyChildDialogs = function(frameNameList)
{
	var frameNameList = frameNameList ? frameNameList : 'cleanHTML,spellchecker';
	if ((top != self) && (typeof(top.commonspot)!= 'undefined') && (typeof(top.commonspot.lightbox)!= 'undefined'))
	{
		var win;
		for (var i=top.commonspot.lightbox.stack.length-1; i>=0; i--)
		{
			win = top.commonspot.lightbox.stack[i];
			frName = win.getFrameName();
			if (frameNameList.indexOf(frName) >= 0)
				win.close();
		}
	}	
}

closeCleanHTMLWindows = function()
{
	closeEmptyChildDialogs('cleanHTML');
	/*
	if (self.children)
	{
		for(i=0;i<self.children.length;i++)
			self.children[i].close();
	}
	*/
}

closeSpellCheckWindows = function()
{
	closeEmptyChildDialogs('spellchecker');
}

openEmptyLightBox = function(url, hideClose, name, customOverlayMsg)
{
	var lightboxTarget;	
	var url = url ? url : null;
	var hideClose = hideClose ? hideClose : null;
	var name = name ? name : null;
	var customOverlayMsg = customOverlayMsg ? customOverlayMsg : null;
	// If we are inside a lightbox
	if ((top != self) && (typeof(top.commonspot)!= 'undefined') && (typeof(top.commonspot.lightbox)!= 'undefined'))
	{
		// Open an empty lightbox
		top.commonspot.lightbox.openDialog(url, hideClose, name, customOverlayMsg, null, null, true);
		
		lightboxTarget = top.commonspot.lightbox.getFrameName();
		// Form's target now must be the lightbox, not a new window
		return lightboxTarget;
	}
	else
		return;
}

// returns contentWindow of admin-frame
getAdminWindow = function()
{
	var win = null;
	if ((top != self) && (typeof(top.commonspot)!= 'undefined') && (typeof(top.commonspot.lightbox)!= 'undefined'))
		win = top.commonspot.lightbox.getAdminWindow();
	return win;	
}


	/**
	 * Generic alert to user.
	 * see commonspot.dialog.client.showHTMLDialog for supported options
	 * msg can be text, or can be an array, in which case it'll be rendered as an html list
	 */
if ((top != self) && (typeof(top.commonspot)!== 'undefined') && (typeof(top.commonspot.lightbox)!== 'undefined'))
{
	if (typeof top.commonspot.dialog === 'undefined')
		top.commonspot.dialog = {};
	if (typeof top.commonspot.dialog.client === 'undefined')
	{
		top.commonspot.dialog.client = {};

		top.commonspot.dialog.client.alert = function(msg, options)
		{
			var html;
			if(msg.constructor == String)
				html = msg;
			else // assumed to be an array
			{
				if(msg.length === 1)
					html = msg[0];
				else
				{
					html = "<ul>";
					for(var i = 0; i < msg.length; i++)
						html += "<li>" + msg[i] + "</li>";
					html += "</ul>";
				}
			}
			html = html.replace(/\n/g, '<br />');
			top.commonspot.dialog.client.showHTMLDialog(html, options, 'alert');
		}

		/*
		 * create a lightboxed dlg containing the passed html
		 */
		top.commonspot.dialog.client.showHTMLDialog = function(html, options, dialogType)
		{
			var options = options || {};
			var defaultOptions =
			{
				title: "CommonSpot Message",
				subtitle: "",
				helpId: "",
				width: 500,
				height: 600,
				style: '',
				useDefaultStyles: true,
				maximize: false,
				hideClose: false,
				hideHelp: true,
				hideReload: true
			};
			top.commonspot.util.merge(options, defaultOptions);

			dialogType = dialogType || 'dialog';

			var style = options.style;
			if(options.useDefaultStyles)
				style = top.commonspot.dialog.client.getHTMLDialogDefaultStyles() + style;

			html = top.commonspot.dialog.client.getHTMLDialogHTML(html, style, options.title, options);

			// openDialog(url, hideClose, name, customOverlayMsg, dialogType, opener, hideHelp)
			var dlgObj = top.commonspot.lightbox.openDialog("about:blank", options.hideClose, null, top.commonspot.lightbox.NO_OVERLAY_MSG, dialogType, null, options.hideClose, options.hideReload);
			var lightboxWindow = dlgObj.getWindow();
			lightboxWindow.document.write(html);
			lightboxWindow.document.close();

			top.commonspot.lightbox.initCurrent
			(
				options.width,
				options.height,
				{
					title: options.title, subtitle: options.subtitle, helpId: options.helpId,
					close: options.close, reload: options.reload, maximize: options.maximize
				},
				'',
				true
			);

			var dt = lightboxWindow.document.getElementById("dialogContainer");
			var w = Math.max(dt.clientWidth + 30, 350);
			var h = Math.max(dt.clientHeight, 70) - ((options.hideClose && !options.customButtons) ? 30 : 0);
			top.commonspot.lightbox.resizeCurrent(w, h);
			// first wanted this to autosize, to measure it, but now want it full width so close btn is far right
			lightboxWindow.document.getElementById("dialogContainer").style.width = "100%";
		};

		top.commonspot.dialog.client.getHTMLDialogDefaultStyles = function()
		{
			var style =
	'body {font-family: Verdana,Arial,Helvetica,sans-serif; margin: 0; overflow: scroll; text-decoration: none; font-size: 11px;}\n\
	a:active {text-decoration: underline; color: #1D2661;}\n\
	a:hover {text-decoration: underline;color: #003366;}\n\
	a {color: #1D2661;text-decoration: underline;}\n\
	a:visited {	text-decoration: underline;color: #1D2661;}\n\
	#content {margin: 15px 11px; overflow: auto; font-size: 11px;}\n\
	#innerdialogContainer {background-color:#F0F0F0;border-bottom:1px solid #999999;border-top:1px solid #999999;margin-top:10px;}\n\
	#htmlDlgTableCell h2 {font-size: 11px; margin: 15px 0 8px;}\n\
	#htmlDlgTableCell h2:first-child {margin-top: 0;}\n\
	#htmlDlgTableCell p {margin: 0 0 8px; padding: 0;}\n\
	#htmlDlgTableCell ul {margin: 0 0 1em 1em; padding: 0;}\n\
	#htmlDlgTableCell li {margin: 5px;}\n\
	#htmlDlgTableCell dl {margin: 0 0 1em;}\n\
	#htmlDlgTableCell dt {color: #013466; font-weight: bold; margin: 5px 0 0;}\n\
	#htmlDlgTableCell dd {margin: 0 0 0 1.5em;}\n\
	#dialogContainer #dialogFooter {display: block; font-weight: bold; height: 28px; line-height: 28px; margin: 5px 0 0; padding: 0 1px; text-align: right; font-size: 11px;}\n\
	#htmlDlgTableCell .dumpTable caption {font-size: 8pt; font-weight: bold;}\n\
	#htmlDlgTableCell .dumpTable td {border: 1px solid #ccc; font-size: 8pt; padding: 1px;}\n\
	';
			return style;
		};

		top.commonspot.dialog.client.getHTMLDialogHTML = function(alertHTML, styleHTML, title, options)
		{
			var btnHTML = '';
			var linkID, linkClass, linkOnClick, linkObj, linkAccessKey, linkText, linkObj;
			var accessKeyHTML = '';
			btnHTML += options.hideClose ? '' : '<a id="closeButton" accesskey="C" href="javascript:;" onclick="top.commonspot.lightbox.closeCurrent()">Close</a>';
			if (options.customButtons)
			{
				for (var i=0; i<options.customButtons.length; i++)
				{
					linkObj = options.customButtons[i];
					linkID = linkObj.id ? linkObj.id : 'okButton';
					linkOnClick = linkObj.onclick ? linkObj.onclick : '';
					linkText = linkObj.linkText ? linkObj.linkText : '';
					if (linkObj.accessKey)
						accessKeyHTML = ' accesskey="' + linkObj.accessKey + '"';
					if (linkOnClick != '' && linkID != '' && linkText != '')
						btnHTML += '<a id="' + linkID + '"' + accessKeyHTML + ' href="javascript:;" onclick="' + linkOnClick + '">' + linkText + '</a>';
				}
			}
			var html =
				'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
				'<html>' +
				'<head>' +
					'<link href="/commonspot/dashboard/css/dialog.css" rel="stylesheet" type="text/css" id="dialogcss" />' +
					'<style>' + styleHTML + '</style>' +
					(title ? '<title>' + title + '</title>' : '') +
				'</head>' +
				'<body>' +
					'<table id="dialogContainer">' +
						'<tr><td>' +
							'<table id="innerdialogContainer" width="100%">' +
								'<tr>' +
									'<td id="htmlDlgTableCell">' +
										'<div id="content">' + alertHTML + '</div>' +
									'</td>' +
								'</tr>' +
							'</table>' +
						'</td></tr>' +
						'<tr><td>' +
							'<div id="dialogFooter">' +
								btnHTML +
							'</div>' +
						'</td></tr>'
					'</table>' +
				'</body>' +
				'</html>';
			return html;
		};
	}
}	 
