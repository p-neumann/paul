/**
 * commonspot.lightbox: lightbox package
 */
if (typeof commonspot == 'undefined')
	commonspot = {};
commonspot.lightbox = {};
// Stack holding the currently opened lightboxes
commonspot.lightbox.stack = [];
// Defaults for size and position
commonspot.lightbox.DEFAULT_TOP = 20;
commonspot.lightbox.DIALOG_DEFAULT_WIDTH = 100;
commonspot.lightbox.DIALOG_DEFAULT_HEIGHT = 100;
commonspot.lightbox.WINDOW_MARGINS = 30;
// Constrains from XHTML/CSS and images
commonspot.lightbox.FURNITURE_HEIGHT = 70;
commonspot.lightbox.FURNITURE_WIDTH = 20;
commonspot.lightbox.CORNERS_WIDTH = 20;
// constant to request no overlay msg
commonspot.lightbox.NO_OVERLAY_MSG = 'NONE';
commonspot.lightbox.helpDlg = null;

var _startX = 0; // mouse starting positions 
var _startY = 0; 
var _offsetX = 0; // current element offset 
var _offsetY = 0; 
var _dragElement; // needs to be passed from OnMouseDown to OnMouseMove 
var _oldZIndex = 0; // we temporarily increase the z-index during drag 
var _debug = top.document.getElementById('debug');

/**
 * Adjust layout. To call if vieport's dimensions changed
 */
commonspot.lightbox.adjustLayout = function()
{
	for(var i = 0; i < commonspot.lightbox.stack.length; i++)
		commonspot.lightbox.stack[i].adjustLayout();
};

commonspot.lightbox.openURL = function(options)
{
	var options = options || {};
	var defaultOptions =
	{
		title: "Custom Dialog",
		subtitle: "",
		helpId: "",
		width: 100,
		name: 'customDlg',
		height: 50,
		hasMaximizeIcon: true,
		hasCloseIcon: true,
		hasHelpIcon: false,
		hasReloadIcon: false,
		url: "/commonspot/dashboard/dialogs/blank-dialog.html",
		dialogType: "dialog"
	};	
	commonspot.util.merge(options, defaultOptions);
	var hideClose = options.hasCloseIcon ? false : true;
	var hideHelp = options.hasHelpIcon ? false : true;
	var hideReload = options.hasReloadIcon ? false : true;
	var dlgObj = commonspot.lightbox.openDialog(defaultOptions.url, hideClose, options.name, commonspot.lightbox.NO_OVERLAY_MSG, options.dialogType, null, hideHelp, hideReload);

	commonspot.lightbox.initCurrent(defaultOptions.width, defaultOptions.height, {title: options.title, subtitle: options.subtitle, reload: options.hasReloadIcon, helpId: options.helpId, maximize: options.hasMaximizeIcon}); 
	dlgObj.iframeNode.src = options.url;
	setTimeout(function() {
		commonspot.lightbox.resizeCurrent(options.width, options.height);
	}, 50);
}

/**
 * Open either a url or a document DOM inside a lightbox
 * @param url  (string). Required
 * @param hideClose  (boolean). Optional. Set it to true to remove the close button from furniture's top right corner
 * @param hideHelp (boolean). Optional. Set it to true for the dialogs that do not need the Help Button and the QAHelp Processing.
 */
commonspot.lightbox.openDialog = function(url, hideClose, name, customOverlayMsg, dialogType, opener, hideHelp, hideReload)
{
	var url = url ? url : null;
	var hideClose = hideClose ? hideClose : null;
	var hideHelp = arguments[6] ? arguments[6] : null;
	var hideReload = arguments[7] ? arguments[7] : null;
	var name = name ? name : null;
	if (name == 'error')
		name = 'dlg_error';
	var customOverlayMsg = customOverlayMsg ? customOverlayMsg : null;
	dialogType = dialogType || 'dialog';
	var dlgOpener = opener ? opener : null;
	var options = {
		url: url,
		hideClose: hideClose,
		name: name,
		customOverlayMsg: customOverlayMsg,
		dialogType: dialogType,
		opener: dlgOpener,
		hideHelp: hideHelp,
		hideReload: hideReload
	}
	commonspot.lightbox.stack.push(commonspot.lightbox.dialogFactory.getInstance(options));
	/*
	commented for 6.0 this should be live in 6.x when we want spellcheck for the spry dialogs.
	code in dashboard\dialogs\pageview\create-work-request.html is left as-is as an example.
	setTimeout(function(){
		if (commonspot.lightbox.stack.length)
			commonspot.lightbox.addSpellCheckButton(commonspot.lightbox.stack.last().getWindow().document);	
	},50);
	*/
	return commonspot.lightbox.stack[commonspot.lightbox.stack.length - 1];
};

/**
 * Changes the URL of the lightbox to a SPRY dialog
 * @param url  (string). Required
 */
commonspot.lightbox.loadSpryURL = function(url)
{
	var win = commonspot.lightbox.stack.last().getWindow();
	win.location.href = url;
};

/**
 * Changes the URL of the lightbox to a Legacy dialog
 * 
 * @param loaderParamsString (string): arguments to pass to loader
 * @param customVarValues (value object, optional): custom dynamic argument values
 * 
 * loaderParamsString is everything after the '?', including csModule=whatever.cfm
 * can include {varName} placeholders to be filled in when this is called
 * there are two kinds of vars:
 * 	- standard ones we do always
 * 		pageID for now, maybe others some day
 * 	- custom ones whose values are passed in customVarValues value object
 * 		customVarValues should be in the form {fldName1: fldValue1, fldName2: fldValue2,...}
 * 		{fldName1} in loaderParamsString will be replaced with fldValue1, etc
 */
commonspot.lightbox.loadLegacyURL = function(loaderParamsString, customVarValues, bNewWindow)
{
	// replace any std var placeholders w real values
	var pageID = commonspot.data.uiState.lview.dsCurrentPage.getCurrentRow().pageid;
	loaderParamsString = loaderParamsString.replace('{pageID}', pageID);
	
	// replace any custom dynamic arguments with passed values
	for(var fld in customVarValues)
		loaderParamsString = loaderParamsString.replace('{' + fld + '}', customVarValues[fld]);
	
	var win = commonspot.lightbox.stack.last().getWindow();
	if( bNewWindow )
		commonspot.dialog.server.show(loaderParamsString);
	else
	{
		// get loader, build url
		var loader = commonspot.clientUI.state.location.getLoaderURL('subsiteurl');
		var url = loader + '?' + loaderParamsString;	
	
		win.location.href = url;
	}
};

/*
 * Loads a full url (url with /{sitename}/loader.cfm?csmodule={template}
 */
commonspot.lightbox.loadLegacyFullURL = function(url)
{
	var win = commonspot.lightbox.stack.last().getWindow();
	win.location.href = url;
};

/*
 * returns the lightbox object representing the topmost window, ignoring alerts if requested
 */
commonspot.lightbox.getCurrent = function(includeAlerts)
{
	if (commonspot.lightbox.stack.length === 0)
		return;
	if (typeof includeAlerts === 'undefined')
		includeAlerts = true;
	if (includeAlerts)
		return commonspot.lightbox.stack.last();
	else
	{
		var endPos = commonspot.lightbox.stack.length - 1;
		for (var i = endPos; i >= 0; i--)
		{
			if (commonspot.lightbox.stack[i].dialogType !== 'alert')
				return commonspot.lightbox.stack[i];
		}
	}
}

/**
 * Get window object of topmost lightbox, ignoring alerts if requested
 */
commonspot.lightbox.getCurrentWindow = function(includeAlerts)
{
	var currentDlg = commonspot.lightbox.getCurrent(includeAlerts);
	if (currentDlg)
		return currentDlg.getWindow();
	else
		return window;	
};

/**
 * Close the topmost lightbox
 */
commonspot.lightbox.closeCurrent = function()
{
	if (commonspot.lightbox.stack.length > 0)
	{
		if (top.commonspot.lightbox.stack.length>1)
			activateFields(top.commonspot.lightbox.stack[top.commonspot.lightbox.stack.length-2].getWindow());	
	
		var currentDialog = commonspot.lightbox.stack.last();

		currentDialog.close(); 
	}
	
	if (commonspot.clientUI && commonspot.clientUI.isURLError)
	{
		commonspot.clientUI.state.mode.urlHash.setHashFromModeAndPage();
		commonspot.clientUI.isURLError = false;
	}
};

// function called when 'X' close btn image is clicked
// tries to do what dlg's own cancel or close btn would do, else just closes
commonspot.lightbox.closeBtnOnClick = function()
{
	try
	{
		var dlgWin = commonspot.lightbox.getCurrentWindow();
		var doc = dlgWin.document;
	}
	catch(e)
	{
		dlgWin = null;
	}
	if(!dlgWin)
	{
		commonspot.lightbox.closeCurrent();
		return;
	}	
	var closeBtn = doc.getElementById('closeButton') || doc.getElementById('Close');
	var cancelBtn = doc.getElementById('cancelButton');
	var btn = cancelBtn ? cancelBtn : closeBtn;
	
	if(!btn)
		commonspot.lightbox.closeCurrent();
	else if(btn.onclick)
		btn.onclick();
	else
		btn.click();
}

/**
 * Close the topmost lightbox and reload the parent Dialog
 */
commonspot.lightbox.closeCurrentWithReload = function()
{
	if (commonspot.lightbox.stack.length > 0)
	{
		var currentDialog = commonspot.lightbox.stack.last();
		currentDialog.close();
		
		// Get next existing dialog and reload it  
		if (commonspot.lightbox.stack.length != 0)
		{
		 	var nextExistingWindow = commonspot.lightbox.stack.last(); 
		 	nextExistingWindow.getWindow().location.reload();
		}
		else
			commonspot.lightbox.reloadPage();
	}
};

/**
 * Close the parent of topmost lightbox
 */
commonspot.lightbox.closeParent = function()
{
	var pos = commonspot.lightbox.stack.length - 2;
	if (pos >= 0)
		commonspot.lightbox.stack[pos].close();
};

/**
 * Close all parent lightboxes
 */
commonspot.lightbox.closeParentDialogs = function()
{
	var endPos = commonspot.lightbox.stack.length - 2;
	for (var i = endPos; i >= 0; i--)
		commonspot.lightbox.stack[i].close();
}

/**
 * Close all lightboxes, and refresh the innermost one
 * @param closeCount  int is the number of child dialogs to close
 */
commonspot.lightbox.closeChildDialogsWithReload = function(closeCount)
{
	var curCount = 0;
	for (var i = commonspot.lightbox.stack.length-1; i >= 0; i--)
	{
		if (curCount <= closeCount)
		{
			commonspot.lightbox.stack[i].close();  
			curCount++;
		}	
		else
			break;
	}
	// Get next existing dialog and reload it  
	if (commonspot.lightbox.stack.length != 0)
	{
	 	var nextExistingWindow = commonspot.lightbox.stack.last(); 
	 	nextExistingWindow.getWindow().location.reload();
	}		
};

/**
 * Close all lightboxes, apart the innermost one
 */
commonspot.lightbox.closeChildDialogs = function()
{
	for(var i = commonspot.lightbox.stack.length-1; i > 0; i--)
	{
		commonspot.lightbox.stack[i].close();  
	}
};

/**
 * Close all child lightboxes from given position
 */
commonspot.lightbox.closeChildDlgsFromPosition = function(currPos)
{
	if (typeof currPos === 'undefined')
		currPos = -1;  //if pass nothing, close all... ??
		
	var endPos = commonspot.lightbox.stack.length - 1;
	
	for (var i=endPos; i > currPos; i--)
		commonspot.lightbox.stack[i].close();
};

/**
 * Close given number of lightboxes 
 */
commonspot.lightbox.closeTopChildDialogs = function(count)
{
	if (!count)
		return;
	start = commonspot.lightbox.stack.length - 1;
	end = ((start - count) > -1) ? (start - count) : -1;

	for(var i = start; i > end; i--)
	{
		commonspot.lightbox.stack[i].close();
	}	
};

/**
 * Close all lightboxes
 */
commonspot.lightbox.closeAllDialogs = function()
{
	var endPos = commonspot.lightbox.stack.length - 1;
	
	for (var i = endPos; i >= 0; i--)
		commonspot.lightbox.stack[i].close();  
};

commonspot.lightbox.reloadPage = function()
{
	var pFrame = top.document.getElementById('page_frame');
	if (pFrame)
		pFrame.contentWindow.location.reload();	
	else if (!commonspot.lview)
		window.location.reload();
};
commonspot.lightbox.reloadAdmin = function()
{
	var pFrame = top.document.getElementById('admin_iframe');
	if (pFrame)
		pFrame.contentWindow.location.reload();	
	else if (!commonspot.lview)
		window.location.reload();
};
/**
 * Resize, setup and show the dialog inside the topmost lightbox
 * @param w			  (int). Required. Width of the dialog
 * @param h			  (int). Required. Height of the dialog
 * @param dialogInfo  (object). Required. Info about required for dialog's furniture 
 * {title (string), subtitle (string), helpId (string), close (boolean), reload (boolean), maximize (boolean)}
 * @param closeCallback (string). Optional. A callback function to be called on dialog's close 
 * @param includeAlerts (boolean). Optional, default false. Affects topmost non-alert lightbox unless this is true.
 */
commonspot.lightbox.initCurrent = function(w, h, dialogInfo, closeCallback, includeAlerts)
{
	var currentDialog = commonspot.lightbox.getCurrent(includeAlerts);
	if(currentDialog)
	{
		if ((typeof closeCallback != 'undefined') && (closeCallback != '') && (currentDialog.hasCloseButton)) 
			currentDialog.closeImg.onclick = function(){ currentDialog.getWindow()[closeCallback]();};
		
		currentDialog.resize(w, h);
		currentDialog.show();
		if(dialogInfo)
		{
			// Populate the furniture
			currentDialog.setUpFurniture(dialogInfo);
		}
		currentDialog.getWindow().focus();
		currentDialog.origWidth = currentDialog.width;
		currentDialog.origHeight = currentDialog.height;

		if(currentDialog.showQAButtons)
			commonspot.lightbox.getQAStatus(currentDialog);
	}
};

/**
 * Dialogs that have a DOM handler (typically server ones) should call this to let the handler do its job
 * Additionally, it extract info from the dialog to populate the furniture
 */
commonspot.lightbox.initCurrentServerDialog = function(index)
{
	if (commonspot.lightbox.stack.length > 0)
	{
		var currentDialog = commonspot.lightbox.stack.last();
		var win = currentDialog.getWindow();
		// Extract info from the dialog	
		var dialogInfo = commonspot.lightbox.extractServerDialogInfo(win, index);
		if (dialogInfo.maximize)
			commonspot.lightbox.stack.last().hasMaxButton = true;
		else
			commonspot.lightbox.stack.last().hasMaxButton = false;
		if(win.onLightboxLoad)
		{
			win.onLightboxLoad();
		}	
		currentDialog.setUpFurniture(dialogInfo);
		commonspot.lightbox.stack.last().origWidth = currentDialog.width;
		commonspot.lightbox.stack.last().origHeight = currentDialog.height;
	}
};

/**
*  function called by maximize / restore button of a lighbox dialog 
*  @param iconObj. Required. A reference to the maximize/restore button object
*/
commonspot.lightbox.callResize = function(iconObj,forceAction)
{
	var currentDialog = commonspot.lightbox.stack.last();
	if (!iconObj)
		iconObj = document.getElementById('restoreImg_' + currentDialog.zIndexCounter);
	var tmpClassName = iconObj.className;
	var curAction = forceAction ? forceAction : null;
	if (!curAction)
		curAction = tmpClassName.indexOf('ico_maximize')>-1 ? 'maximize' : 'minimize';

	if (curAction == 'maximize')
	{
		// resize window to max size
		tmpClassName=tmpClassName.replace('ico_maximize','ico_pop');
		iconObj.title='Restore Down';
		var maxVals = commonspot.lightbox.getMaxSize();
		currentDialog.resize(maxVals.width-60, maxVals.height);
	}
	else if (curAction == 'minimize')
	{
		// restore window to its original size
		tmpClassName=tmpClassName.replace('ico_pop','ico_maximize');
		iconObj.title='Maximize';
		//commonspot.lightbox.recalcLightboxSizeByPos(commonspot.lightbox.stack.length-1);
		currentDialog.resize(currentDialog.origWidth, currentDialog.origHeight);
	}
	iconObj.className = tmpClassName;
	var win = currentDialog.getWindow();

	if (typeof win.HandleOnResize == 'function')
		setTimeout(function(){
			win.HandleOnResize();
		}, 150);
};



commonspot.lightbox.forceResizeWindow = function(forceAction)
{
	var currentDialog = commonspot.lightbox.stack.last();
	if (currentDialog)
	{
		var iconObj = document.getElementById('restoreImg_' + currentDialog.zIndexCounter);
		if (iconObj)
			commonspot.lightbox.callResize(iconObj,forceAction);	
	}
};

/**
 * Extract information from a server dialog that will be used to set up the furniture (title, subtitle etc)
 * @param win			(window). Required. A reference to the dialog's window object
 */
commonspot.lightbox.extractServerDialogInfo = function(win, index)
{
	var doc = win.document;
	// index is defined when coming from page with tabs. without this index we are not updating
	// the lightbox subtitle.
	if (typeof index == 'undefined')
		var index = 0;
	var info = {
		title: '',
		subtitle: '',
		maximize: false,
		reload: true,
		close: true
	};
	var titleCell = '';	
	var subtitleCell = '';
	var errorCells = '';
	
	titleCell = getElementsByClassNameLocal("cs_dlgTitle")[index];

	if(titleCell)
	{
		info.title = titleCell.innerHTML;
		titleCell.style.display = 'none';
	}
	
	subtitleCell = getElementsByClassNameLocal('cs_dlgDesc')[index];
	if(subtitleCell)
	{
		info.subtitle = '<div>' + subtitleCell.innerHTML + '</div>';
		subtitleCell.style.display = 'none';
	}
	
	errorCells = getElementsByClassNameLocal('cs_lightboxServerDlgError');
	for(var i = 0; i < errorCells.length; i++)
	{
		info.subtitle += '<div class="cs_dlgError">' + errorCells[i].innerHTML + '</div>';
		errorCells[i].style.display = 'none';
	}
	
	// Help id should be stored inside a global JavaScript variable in the dialog
	if(win.DIALOG_HELP_ID)
		info.helpId = win.DIALOG_HELP_ID;

	var mainTable = win.document.getElementById('MainTable');
	
	if (mainTable && mainTable.className && (mainTable.className).indexOf('allowMaximize')>-1)
		info.maximize = true;
		
	if (mainTable && mainTable.className && (mainTable.className).indexOf('hideReload')>-1)
		info.reload = false;

	if (mainTable && mainTable.className && (mainTable.className).indexOf('hideClose')>-1)
		info.close = false;
		
	return info;
	
	
	function getElementsByClassNameLocal(className)
	{
		if (typeof win.document.getElementsByClassName == 'function')
			return win.document.getElementsByClassName(className); // call native version of getElementsByClassName
		else
			return document.getElementsByClassName(className,doc); // call prototype version
	}
};

/**
 * Resize the dialog inside the topmost lightbox
 * @param w			(int). Required. Width
 * @param h			(int). Required. Height
 */
commonspot.lightbox.resizeCurrent = function(w, h)
{
	if (commonspot.lightbox.stack.length > 0)
	{
		var currentDialog = commonspot.lightbox.stack.last();
		currentDialog.resize(w, h);
		commonspot.lightbox.stack.last().origWidth = currentDialog.width;
		commonspot.lightbox.stack.last().origHeight = currentDialog.height;
	}
};

/**
 * Resize the dialog inside the topmost lightbox
 * @param w			(int). Required. Width
 * @param h			(int). Required. Height
 */
commonspot.lightbox.recalcLightboxSizeByPos = function(pos)
{
	if (commonspot.lightbox.stack.length > pos && commonspot.lightbox.stack.length > 0)
	{
		var currentDialog = commonspot.lightbox.stack[pos];
		var win = currentDialog.getWindow();
		var maintable = win.document.getElementById('MainTable');
		if(maintable)
			currentDialog.resize(maintable.offsetWidth, maintable.offsetHeight + 65);
		else
		{
			maintable = win.document.getElementById('pagelistContainerDiv');
			if(maintable)
				currentDialog.resize(maintable.offsetWidth - 20, maintable.offsetHeight + 81);
		}
	}
};

/**
 * Return the frame name of the topmost dialog, null if no dialog is opened
 */
commonspot.lightbox.getFrameName = function()
{
	if (commonspot.lightbox.stack.length > 0)
	{
		var currentDialog = commonspot.lightbox.stack.last();
		return currentDialog.getFrameName();
	}
	else
	{
		return null;
	}
};

/**
 * Return the max size currently available for a lightbox
 * @return {width, height}
 */
commonspot.lightbox.getMaxSize = function()
{
	var maxSize = {};
	var winDimensions = commonspot.lightbox.getWinSize();
	maxSize.height = winDimensions.height - commonspot.lightbox.FURNITURE_HEIGHT - commonspot.lightbox.WINDOW_MARGINS;
	maxSize.width = winDimensions.width - commonspot.lightbox.FURNITURE_WIDTH;
	return maxSize;
};


/**
 * Return the opener window of the topmost dialog, null if no opener
 * Actually, we only know top window's real opener if it was passed into dialogFactory.getInstance or openDialog
 * 	mostly nobody does that, except newWindow, in overrides.js, passes the current window as opener
 * If we don't have real opener, or if ignoreOpenerProperty is true, we return window of next-to-top lightbox
 */
commonspot.lightbox.getOpenerWindow = function(ignoreOpenerProperty)
{
		if (commonspot.lightbox.stack.length > 1)
		{
			// Opened by another dialog
			var thisDialog = commonspot.lightbox.stack.last();
			if (thisDialog.opener && !ignoreOpenerProperty)
				return thisDialog.opener;
			var previousDialog = commonspot.lightbox.stack[commonspot.lightbox.stack.length - 2];
			return previousDialog.getWindow();
		}
		else
			return commonspot.lightbox.getVisibleFrameWindow(); // not true in admin modes, but needed to create a pg from there
};

/*
* some cases chrome and safari need this.
*/
commonspot.lightbox.getOpenerLightboxFrame = function()
{
	var iframeNode = null;
	if (commonspot.lightbox.stack.length > 1)
		iframeNode = commonspot.lightbox.stack[commonspot.lightbox.stack.length - 2].iframeNode;
	return iframeNode;
};

/**
* checks who amin-frame or lview-frame who is visible and returns that
**/
commonspot.lightbox.getVisibleFrameWindow = function()
{
	// for now, just returning pageFrame as there are few situations where this logic is not right.
	return commonspot.lightbox.getPageWindow();
	
	var cursection;
	var modes = ['mycs','lview','admin'];
	// not sure here for mycs, returning page_frame is correct or not. when we decide what is correct, we should change the first element of the below array to it.
	var windows = ['page_frame','page_frame','admin_iframe'];
	for (var i=0; i<modes.length; i++)
	{
		cursection = top.document.getElementById(modes[i]);
		curWin = top.document.getElementById(windows[i]).contentWindow;	
			
		try
		{
			curDisplay = cursection.style.display;		
		}
		catch(e)
		{
			curDisplay = 'none';
		}
	
		if (curDisplay != 'none')
			return curWin;
	}
};

/**
*	returns contentWindow of page-frame
*/
commonspot.lightbox.getPageWindow = function()
{
	var pFrame = top.document.getElementById('page_frame');
	var win, href;
	try
	{
		if (pFrame)
		{
			win = pFrame.contentWindow;
			href = win.location.href; // this is only a feeler to check if this is IE9 and has access denied problem
			return win;
		}
		else
			return top;
	}
	catch(e)
	{
		return top;
	}
};

/**
*	returns contentWindow of admin-frame
*/
commonspot.lightbox.getAdminWindow = function()
{
	var win = top.document.getElementById('admin_iframe').contentWindow;
	return (win ? win : null);
};

// returns next-to-top lightbox object (NOT its window)
// DOES NOT honor explicit opener property of lightbox object
commonspot.lightbox.getNextToTopDlg = function(returnOpenerWhenEmpty)
{
	var pos = commonspot.lightbox.stack.length - 2;
	var parentDialog = null;
	if (pos >= 0)
		parentDialog = commonspot.lightbox.stack[pos];
	else
	{
		if (returnOpenerWhenEmpty)
			return commonspot.lightbox.getPageWindow();
	}	
	return parentDialog;
}

// keep closing parent dlgs until we find one with requested callback, then return it
commonspot.lightbox.findCallbackInAncestorWindow = function(callback)
{
	var parentDlg, dlgCallback, pWindow, shouldBreak=0;
	var lightbox = commonspot.lightbox; // local ref, so we don't lose it as dlgs close; calling code should do the same to run callback
	var pageWindow = lightbox.getPageWindow();
	while((parentDlg = lightbox.getNextToTopDlg(true)) && !shouldBreak)
	{
		
		if (typeof parentDlg.getWindow == 'function')
		{
			pWindow = parentDlg.getWindow();
			shouldBreak = pWindow == pageWindow ? 1 : 0;
			dlgCallback = pWindow[callback];
		}	
		else
		{
			shouldBreak = parentDlg == pageWindow ? 1 : 0;
			dlgCallback = parentDlg[callback];
		}	
			
		if(dlgCallback)
			return dlgCallback;
		else
			parentDlg.close();
	}
	return null; // didn't find callback, oops
}

/*
 * Function to handle specific key presses.
 */
commonspot.lightbox.handleDialogKeys = function(e)
{
	if(!commonspot.lightbox.getCurrent().hasCloseButton)
		return;
	var code;
	
	if (!e) 
		var e = window.event; // Get event.

	// Get key code.
	if (e.keyCode) 
		code = e.keyCode;
	else if (e.which) 
		code = e.which;
	
	switch (code) 
	{
		case 27: // Escape key
			commonspot.lightbox.closeBtnOnClick();
			break;
	}
}		
/*
* should this go in a sperate namespace and file ??
*/
var commonspotData = {};
commonspot.lightbox.getQAStatus = function(dlgObj)
{
	if (!e) 
		var e = window.event; // Get event.
	dlgObj.QAStatusUpdated = true;	
	var args = {};	
	var temp = '';
	var obsArr = [];
	var win = dlgObj.getWindow();
	var frName = dlgObj.getFrameName();
	var frObj;
	/* we should have this somewhere common
		these are the titles that multiple dialogs can have. so do not expect them to be unique 
	*/
	var generalDialogTitles = ('CommonSpot Error,Debug Help Status,CommonSpot Message,About CommonSpot,CommonSpot Security Exception').split(",");;
	if (frName == 'error')
		return;
	var formFlds = win.document.getElementsByName("fromlongproc");
	if (formFlds.length)
	{
		//there may be more than 1
		for(var i=0;i<formFlds.length;i++)
		{
			if (formFlds[i].value == 1)
				return;
		}
	}
	obsArr = document.getElementsByName(frName);
	for (var i=0; i<obsArr.length; i++)
	{
		if (obsArr[i].tagName.toLowerCase() == 'iframe')
			frObj = obsArr[i];
	}
	if (!frObj)
		return;
	var hashArgs = commonspot.util.getHashArgs();
	if (!hashArgs)
		return;
	var mode = hashArgs.mode || commonspot.clientUI.state.mode.MYCS;	
	var LOADER_URL;
	// Set loader appropriately (based on Server Admin mode or not).
	if (mode != 'server_admin')
	{
		var url = hashArgs.url;
		if (url.length > 0)
			LOADER_URL = commonspot.clientUI.state.location.getPathFromUrlStr(url) + 'loader.cfm';
	}
	else
		LOADER_URL = '/commonspot/admin/loader.cfm';
	if (!LOADER_URL || commonspot.data.Users_GetUserInfo.getCurrentRow().name == '')
	{	
		commonspot.lightbox.hideQAElements('All');
		return;		
	}
	args.widgetName = dlgObj.headerTitle.innerHTML;
	args.widgetNameSrc = 'Request.params.csModule';
	args.queryString = '';
	args.statusType = "QA";
	args.formParams = '';
	args.helpObjectType = 'CFMDialog';
	args.helpObjectTitle = (args.widgetName != '') ? args.widgetName : win.document.title;
	if (args.widgetName == '')
		args.widgetName = args.helpObjectTitle;
	if ((generalDialogTitles.indexOf(win.document.title) >= 0)
				|| ((win.document.title).indexOf('Debug Help Status') == 0))
	{
		commonspot.lightbox.hideQAElements('All');
		return;	
	}	
	args.moduleName = unescape(frObj.src.toLowerCase());
	if (args.moduleName != '')
	{
		// first remove any protocol (if found) from the module name
		var index = args.moduleName.match(/^\s*https?:\/\/[^\/]*/);
		args.moduleName = args.moduleName.replace(index,''); 
		index = args.moduleName.indexOf('csmodule');
		if (index >= 0) // legacy
		{
			args.widgetNameSrc = "Request.params.csModule";
			temp = args.moduleName.substring(index);
			// look for csmodule=
			var begin = temp.indexOf('csmodule=');
			if (begin >= 0)
				begin = begin+9;
			// remove any query string part after csmodule value
			var end = temp.indexOf('&');
			if (begin>=0 && end>=0 && end>begin) // get just csmodule part if there is querystring
				args.moduleName = temp.substring(begin,end);
			else if (begin>=0) // get csmodule part
				args.moduleName = temp.substring(begin);	
		}	
		else //spry
		{
			index = args.moduleName.indexOf('/commonspot/dashboard/');
			if (index >= 0)
			{
				args.moduleName = args.moduleName.substring(index);
				index = args.moduleName.indexOf('?');
				if (index >= 0)
					args.moduleName = args.moduleName.substring(0,index);
				args.widgetNameSrc = "SPRY Dialog URL";
				args.helpObjectType = "AJAXDialog";
			}	
		}
	}
	if (!args.widgetName.length)
	{
		commonspot.lightbox.hideQAElements('All');
		return;
	}	
	commonspotData.DebugHelp_getHelpObjectStatus = new commonspot.spry.Dataset({ xpath: commonspot.data.ARRAY_XPATH });	
	var collectionOptions = {closeOnError: 0, overlayElementID: '', onCompleteCallback: commonspot.lightbox.onCompleteCallback_GetHelpObjectStatus};
	var cmd = commonspot.ajax.commandEngine.commandCollectionFactory.getInstance(LOADER_URL, collectionOptions);
	cmdOptions = {datasetRoot: commonspotData, datasetName: 'DebugHelp_getHelpObjectStatus'};	
	cmd.add('DebugHelp', 'getHelpObjectStatus', args,  cmdOptions); 
	cmd.send();		

}

commonspot.lightbox.onCompleteCallback_GetHelpObjectStatus = function()
{
	if(this.hasAnyError)
	{
		commonspot.lightbox.hideQAElements('All');
		return;  
	}	
	var data = commonspotData.DebugHelp_getHelpObjectStatus.getData()[0];
	if (!data)
	{
		commonspot.lightbox.hideQAElements('All');
		return;
	}	
	var frName = commonspot.lightbox.stack.last().getFrameName();
	var statusMsg = window.document.getElementById('QAStatusMsg_' + frName);
	var statusIcon = window.document.getElementById('statusIcon_' + frName);
	var qaIcon = window.document.getElementById('qaIcon_' + frName);
	var reportsIcon = window.document.getElementById('reportsIcon_' + frName);
	var mapStatus = data["helpmodulestatus"];
	var intMapStatus;
	var statusText = "";
	var statusColor = 'green';
	switch(mapStatus)
	{
		case "AutoMapped":
			statusText = "AUTO";
			statusColor = 'lightgreen';
			intMapStatus = 1;
			break;
		case "Mapped":
			statusText = "MAP";
			statusColor = 'lightgreen';
			intMapStatus = 2;
			break;
		case "MappedBroken":
			statusText = "MAP-B";
			statusColor = 'tomato';
			intMapStatus = 3;
			break;
		case "MappedCanBeAuto":
			statusText = "MAP-A?";
			statusColor = 'yellow';
			intMapStatus = 4;
			break;
		case "NeedsMapDuplicate":
			statusText = "NO MAP-DUP";
			statusColor = 'tomato';
			intMapStatus = 5;
			break;
		case "NeedsMapNone":
			statusText = "NO MAP-NONE";
			statusColor = 'tomato';
			intMapStatus = 6;
			break;
	}
	if (statusMsg)
	{
		statusMsg.style.backgroundColor = statusColor;
		statusMsg.innerHTML = statusText;
		statusMsg.onclick = function(e) 
		{
			var event = e || window.event;	
		   if(typeof event.stopPropagation!='undefined')
		      event.stopPropagation();
		   else
		      event.cancelBubble=true;			
			commonspot.lightbox.openDialog('/commonspot/dashboard/dialogs/common/map-dialog.html?HelpObjectID=' + data["helpobjectid"],false, null, null, null, null, true);
		};	
	}
	if (intMapStatus >= 5)
	{
		var eleList = 'docIcon_'+frName+',qaIcon_'+frName;
		//commonspot.lightbox.hideQAElements(eleList);
	}

	var color = (data["statuscategorycolor"] == '' ? 'red' : data["statuscategorycolor"]).toLowerCase();
	var type = data["statustype"];
	if (statusIcon)
	{
		statusIcon.onclick = function(e)
		{
			var event = e || window.event;
			if(typeof event.stopPropagation!='undefined')	
				event.stopPropagation();
			else
				event.cancelBubble=true;
			commonspot.lightbox.openDialog('/commonspot/dashboard/dialogs/common/module-mapping-status-report.html',false, null, null, null, null, true);
		}
	}
	if (qaIcon)	
	{
		// if (type == 'QA' || type == '') // check current record type (can be 'QA' or 'Doc'
			qaIcon.src = '/commonspot/private/' + color + '.png';	
		qaIcon.onclick = function(e)
		{
			var event = e || window.event;	
		   if(typeof event.stopPropagation!='undefined')
		      event.stopPropagation();
		   else
		      event.cancelBubble=true;	
			commonspot.lightbox.openDialog('/commonspot/dashboard/dialogs/common/debug-status.html' +
											'?HelpObjectID=' + data["helpobjectid"] +
											'&HelpObjectTitle=' + escape(data["helpobjecttitle"]) +
											'&HelpObjectType=' + data["helpobjecttype"] +
											'&MappingCount=' + data["mappingcount"] +
											'&WidgetName=' + escape(data["widgetname"]) +
											'&StatusType=QA' +
											'&WidgetNameSource=' + escape(data["widgetnamesrc"]),false, null, null, null, null, true);
		}
	}
	if (reportsIcon)
	{
		reportsIcon.onclick = function(e)
		{
			var event = e || window.event;	
		   if(typeof event.stopPropagation!='undefined')
		      event.stopPropagation();
		   else
		      event.cancelBubble=true;			
			commonspot.lightbox.openDialog('/commonspot/dashboard/dialogs/common/help-status-report.html' +
											'?HelpObjectID=' + data["helpobjectid"] +
											'&HelpObjectTitle=' + escape(data["helpobjecttitle"]) +
											'&HelpObjectType=' + data["helpobjecttype"] +
											'&MappingCount=' + data["mappingcount"] +
											'&WidgetName=' + escape(data["widgetname"]) +
											'&WidgetNameSource=' + escape(data["widgetnamesrc"]),false, null, null, null, null, true);
		}
	}

}
/**
 * Singleton, object factory for lightboxed dialogs
 */
commonspot.lightbox.dialogFactory = {};
commonspot.lightbox.dialogFactory.zIndexCounter = 1000;


/**
 * Factory method for lightboxed dialogs
 * @param url			(string). Required
 * @param hideClose  (boolean). Optional. Set it to true to remove the close button from furniture's top right corner
 */
commonspot.lightbox.dialogFactory.getInstance = function(args)
{
	//url, hideClose, name, customOverlayMsg, dialogType, opener, hideHelp, hideReload
	var dialogObj = {dialogType: args.dialogType, opener: args.opener};
	var bodyNode = top.document.getElementsByTagName('body')[0];
	var nextZindex = commonspot.lightbox.dialogFactory.zIndexCounter +1;
	var overlayMsg = 'Loading...';
	var overlayTitle = 'Loading, please wait';
	var cVal = commonspot.util.cookie.readCookie('REGISTERDIALOGS');
	var onClick; 
	if (args.customOverlayMsg)
		overlayMsg = overlayTitle = args.customOverlayMsg;
	if(overlayMsg != commonspot.lightbox.NO_OVERLAY_MSG)
		commonspot.lightbox.loadingMsg.show(overlayMsg, overlayTitle);
	dialogObj.zIndexCounter = nextZindex;
	dialogObj.top = commonspot.lightbox.DEFAULT_TOP;
	dialogObj.boxWidth, dialogObj.width, dialogObj.height, dialogObj.left;
	dialogObj.frameName = args.name ? args.name : 'lightboxFrame_' + nextZindex;
	dialogObj.hasCloseButton = true;
	dialogObj.showQAButtons =  cVal == 'ON' ? true : false;
	if (args.hideHelp)
		dialogObj.showQAButtons = false;
	dialogObj.hasMaxButton = true;
	if(args.hideClose)
	{
		dialogObj.hasCloseButton = false;
		dialogObj.hasMaxButton = false;
	}

	var onclick = function(e) {
	   var event = e || window.event;	 
	   if(typeof event.stopPropagation!='undefined')
	      event.stopPropagation();
	   else
	      event.cancelBubble=true;		
	};
	// Create the overlay layer
	dialogObj.overlayDiv = commonspot.util.dom.addToDom({objType:'DIV', objID: 'lightboxOverlay_' + nextZindex, objClass:'lightboxOverlay', objOnClick: onclick, objParent:bodyNode});
	
	dialogObj.overlayDiv.style.opacity = '.45';
	dialogObj.overlayDiv.style.filter='alpha(opacity=45);';
	dialogObj.overlayDiv.style.zIndex = nextZindex;
	dialogObj.overlayDiv.style.height = commonspot.util.dom.getWinScrollSize().height + 'px';
	
	// Main container
	dialogObj.divNode = top.document.createElement('div');
	dialogObj.divNode.className = 'lightboxContainer drag';
	dialogObj.divNode.onclick = function(e) { 
	   var event = e || window.event;	 
	   if(typeof event.stopPropagation!='undefined')
	      event.stopPropagation();
	   else
	      event.cancelBubble=true;	
	}
	dialogObj.divNode.style.zIndex = nextZindex +1;
	dialogObj.divNode.style.top = '-5000px';
	var thisZIndex = nextZindex+2;
	
	// Top corners
	dialogObj.topCorners = commonspot.util.dom.addToDom({objType:'DIV', objID: 'lightboxTopCorner_' + nextZindex, objClass:'lightboxTopCorner', objHTML:commonspot.lightbox.generateHTMLcorners('t'), objParent:dialogObj.divNode});	
	dialogObj.topCorners.style.zIndex = thisZIndex;
	// Header section
	dialogObj.header = top.document.createElement('div');
	dialogObj.header.className = 'lightboxHeader';
	dialogObj.header.id = 'lightboxHeader_' + nextZindex;
	dialogObj.header.onmousedown = OnMouseDown;
	dialogObj.header.onmouseup = OnMouseUp;
	
	// Title 
	dialogObj.titleContainer = commonspot.util.dom.addToDom({objType:'DIV', objClass:'lightboxTitleContainer', objParent:dialogObj.header});	

	// Header Title
	dialogObj.headerTitle = commonspot.util.dom.addToDom({objType:'H1', objParent:dialogObj.titleContainer});	

	// Top icons
	dialogObj.iconsContainer = top.document.createElement('div');
	dialogObj.iconsContainer.className = 'lightboxIconsContainer';

	// help icon
	if (!args.hideHelp)
	{
		dialogObj.helpImg = commonspot.util.dom.addToDom({objType:'SPAN', objID:'help_img', objClass:'ico_help actionMontageIcon', objTitle:'Help', objParent:dialogObj.iconsContainer});	
	}	

	// qa icons
	if (dialogObj.showQAButtons)
	{
		dialogObj.QAiconsContainer = commonspot.util.dom.addToDom({objType:'DIV', objClass: 'QAIconsContainer', objParent:dialogObj.iconsContainer});

		dom = commonspot.util.dom.addToDom({objType:'SPAN', objID:'QAStatusMsg_'+dialogObj.frameName, objClass:'statusMsg', objParent:dialogObj.QAiconsContainer});

		dom = commonspot.util.dom.addToDom({objType:'IMG', objID:'statusIcon_'+dialogObj.frameName, objClass:'statusIconClass', objTitle:'Mapping Report', objParent:dialogObj.QAiconsContainer});
		dom.src = ('/commonspot/dashboard/icons/application_view_detail.png');

		dom = commonspot.util.dom.addToDom({objType:'IMG', objID:'qaIcon_'+dialogObj.frameName, objClass:'qaIconClass', objTitle:'QA status', objParent:dialogObj.QAiconsContainer});
		dom.src = ('/commonspot/private/white.png');
		
		dom = commonspot.util.dom.addToDom({objType:'IMG', objID:'reportsIcon_'+dialogObj.frameName, objClass:'reportIconClass', objTitle:'Status Report', objParent:dialogObj.QAiconsContainer});
		dom.src = ('/commonspot/dashboard/icons/table_sort.png');
	}
	
	// Reload icon
	if (!args.hideReload)
	{	
		onClick = function()
		{
			var dialogWin = dialogObj.getWindow();
			if(dialogWin)
			{
				var dialogSrc = (dialogObj.iframeNode.src).indexOf('commonspot/dashboard/')>=0 ? 'spry' : 'legacy';
				if ((commonspot.util.browser.chrome || commonspot.util.browser.safari) && dialogSrc == 'legacy')
				{
					if (dialogWin.spanArray)
					{
						var curSpan;
						var forms;
						var i = 0;
						var j = 0;
						var refreshDone = false;
						var curID;
						while (j < dialogWin.spanArray.length) // multi-tab (custome element > render mode dialog)
						{
							curID = dialogWin.spanArray[j];
							curSpan = dialogWin.$(curID);
							if (curSpan && curSpan.style && curSpan.style.display != 'none')
							{
								forms = eval("dialogWin.$$('#" + curID + " form')"); //returns nodelist
								if (forms.length)
								{
									while(i < forms.length)
									{
										forms[i].reset();
										i++;
										refreshDone = true;
									}
								}
							}	
							j++;
						}
					}
					if (dialogWin.document.forms || !refreshDone) // multi-tab or single dialog with top-level form
					{
						var j = 0;
						while (j < dialogWin.document.forms.length)
						{
							dialogWin.document.forms[j].reset();
							refreshDone = true;
							j++;
						}
					}

					if (!refreshDone)
					{
						var iframeNode = commonspot.lightbox.stack.last().iframeNode;
						//debugger;
						if (iframeNode)
							iframeNode.src = iframeNode.src;
						else							
							dialogWin.location.reload();  // catch all
					}	
					else
					{
						var onLoadFunction = dialogWin.document.body.onload;
						if (typeof onLoadFunction == 'function')
							onLoadFunction();
					}
				}
				else
					dialogWin.location.reload();
			}
		}
		dialogObj.reloadImg = commonspot.util.dom.addToDom({objType:'SPAN', objID:'reloadImg_'+nextZindex, objClass:'ico_arrow_refresh_small actionMontageIcon', objTitle:'Refresh', objParent:dialogObj.iconsContainer, objOnClick:onClick});
	}
		
	
	// Maximize / Restore icon
	if(dialogObj.hasMaxButton)
	{
		onClick = function(event){
			var event = event || window.event;	 
			var target = (event && event.target) || (event && event.srcElement);
			commonspot.lightbox.callResize(target);
		};
		dialogObj.maxImg = commonspot.util.dom.addToDom({objType:'SPAN', objID:'restoreImg_' + nextZindex, objClass:'ico_maximize actionMontageIcon', objTitle:'Maximize', objParent:dialogObj.iconsContainer, objOnClick:onClick});

		dialogObj.maxImg.style.display = 'none';
	}
	
	// Close icon
	if(dialogObj.hasCloseButton)
	{
		onClick = commonspot.lightbox.closeBtnOnClick;
		dialogObj.closeImg = commonspot.util.dom.addToDom({objType:'SPAN', objID:'closeImg_'+nextZindex, objClass:'ico_close actionMontageIcon', objTitle:'Close', objParent:dialogObj.iconsContainer, objOnClick:onClick});	
	}

	// blank space to right of right most icon
	dialogObj.blankImg = commonspot.util.dom.addToDom({objType:'SPAN', objClass:'ico_blank noactionMontageIcon', objParent:dialogObj.iconsContainer});	
		
	dialogObj.header.appendChild(dialogObj.iconsContainer);
	if (dialogObj.showQAButtons)
		dialogObj.header.appendChild(dialogObj.QAiconsContainer);
	if (!args.hideHelp)
		dialogObj.helpImg.innerHTML = '&nbsp;';
	if (!args.hideReload)	
		dialogObj.reloadImg.innerHTML = '&nbsp;';
	if(dialogObj.hasMaxButton)
		dialogObj.maxImg.innerHTML = '&nbsp;';
	if(dialogObj.hasCloseButton)	
		dialogObj.closeImg.innerHTML = '&nbsp;';
	dialogObj.blankImg.innerHTML = '&nbsp;';
		
	// subtitle
	dialogObj.subTitleContainer = commonspot.util.dom.addToDom({objType:'DIV', objClass:'lightboxSubTitleContainer', objParent:dialogObj.header});

	// header subtitle
	dialogObj.headerSubtitle = commonspot.util.dom.addToDom({objType:'H2', objParent:dialogObj.subTitleContainer});
	
	dialogObj.divNode.appendChild(dialogObj.header);
	
	onclick = function(e) { 
	   var event = e || window.event;	 
	   if(typeof event.stopPropagation!='undefined')
	      event.stopPropagation();
	   else
	      event.cancelBubble=true;	
	};

	// iframe container
	dialogObj.iframeDiv = commonspot.util.dom.addToDom({objType:'DIV', objOnClick: onclick, objID: 'iframeContainer_' + nextZindex, objClass:'iframeContainer', objParent:dialogObj.divNode});
	dialogObj.divNode.id = 'lightboxContainer_' + nextZindex;
	dialogObj.iframeDiv.style.zIndex = thisZIndex;

	// iframe
	var iframeHTML = '<iframe class="lightboxIframe" scrolling="no" frameborder="0" src="' + args.url + '" name="' + dialogObj.frameName + '" id="' + dialogObj.frameName + '">';
	// Here we use innerHTML instead of DOM to work around a weird IE's bug, where borders are displayed for <iframe> created with DOM methods
	dialogObj.iframeDiv.innerHTML = iframeHTML;
	// We need to store a pointer tothe <iframe> DOM node
	dialogObj.iframeNode = dialogObj.iframeDiv.childNodes[0];

	
	// Bottom corners
	dialogObj.bottomCorners = commonspot.util.dom.addToDom({objType:'DIV', objID: 'lightboxBottomCorner_' + nextZindex, objClass:'lightboxBottomCorner', objHTML:commonspot.lightbox.generateHTMLcorners('b'), objParent:dialogObj.divNode});	
	dialogObj.bottomCorners.style.zIndex = thisZIndex;
	// Append everything to the body
	bodyNode.appendChild(dialogObj.divNode);
	
	// The header act as "handle" for dragging
	//dialogObj.draggable = new Draggable($(dialogObj.divNode), {handle: $(dialogObj.header), starteffect: false, endeffect: false, zindex: 9999999 });
	
	// Adjust the size of the ovelay layer to fill the whole vieport
	dialogObj.adjustLayout = function()
	{
		dialogObj.overlayDiv.style.height = commonspot.lightbox.getWinSize().height + 'px';
	}
	
	dialogObj.close = function()
	{
		commonspot.lightbox.loadingMsg.hide();
		try
		{
			//element.parentNode.removeChild(element);
			dialogObj.divNode.parentNode.removeChild(dialogObj.divNode);
			dialogObj.overlayDiv.parentNode.removeChild(dialogObj.overlayDiv);
			//EventCache.flushLightBoxEvents(nextZindex);
		}
		catch(e){}
		var index = commonspot.lightbox.stack.indexOf(dialogObj);
		commonspot.lightbox.stack.splice(index, 1);
		// fix IE8 "frozen" fields, by focusing topmost lightbox window if there is one
		var curWin = commonspot.lightbox.getCurrentWindow();
		if (!curWin)
			curWin = window;
		
		activateFields(curWin);
			
	}
	
	// This hides the lightbox dialog and overlay
	dialogObj.hideLightbox = function(delay)	
	{
		setTimeout(function(){ 
		$(dialogObj.divNode).hide();
		$(dialogObj.overlayDiv).hide();
		}, delay );
	}
	
	dialogObj.getFrameName = function()
	{
		return dialogObj.frameName;
	}
	dialogObj.getLightboxContainer = function()
	{
		return dialogObj.divNode;
	}
	dialogObj.getWindow = function()
	{
		return dialogObj.iframeNode.contentWindow;
	}
	
	dialogObj.resize = function(w, h)
	{
		var maxHeight = commonspot.lightbox.getMaxSize().height;
		var maxWidth = commonspot.lightbox.getMaxSize().width;
		
		if(h > maxHeight)
			h = maxHeight;
			
		w = w + commonspot.lightbox.FURNITURE_WIDTH;
		dialogObj.boxWidth = w + commonspot.lightbox.FURNITURE_WIDTH;
		dialogObj.width = w;
		if(dialogObj.boxWidth > maxWidth)
		{
			dialogObj.boxWidth = maxWidth;
			dialogObj.width = maxWidth - commonspot.lightbox.FURNITURE_WIDTH;
		}	
		
		dialogObj.height = h;			
		try
		{
			var dialogWin = dialogObj.getWindow();
			doc = dialogWin.doc;
			// If the dialog contains a onResize hook, call it
			if(dialogWin.onLightboxResize)
				dialogWin.onLightboxResize(dialogObj.width, dialogObj.height);
		}
		catch (e){}
		dialogObj.left = (commonspot.lightbox.getWinSize().width / 2) - (dialogObj.boxWidth / 2);
		var topSpacer = dialogObj.topCorners.childNodes[1];
		var bottomSpacer = dialogObj.bottomCorners.childNodes[1];
		topSpacer.style.width = (dialogObj.boxWidth -commonspot.lightbox.CORNERS_WIDTH) + 'px';
		bottomSpacer.style.width = (dialogObj.boxWidth -commonspot.lightbox.CORNERS_WIDTH) + 'px';
		dialogObj.divNode.style.left = dialogObj.left + 'px';
		dialogObj.divNode.style.width = dialogObj.boxWidth + 'px';
		dialogObj.iframeNode.style.width = dialogObj.width + 'px';
		dialogObj.iframeNode.style.height = dialogObj.height-3 + 'px';
		if (dialogObj.showQAButtons)
		{
			var rr = dialogObj.iconsContainer.style.width;
			dialogObj.QAiconsContainer.style.right = rr;
		}
	}
	
	dialogObj.show = function()
	{
		if (window == top) // not in dashboard
		{
			var wnd = commonspot.lightbox.getWinSize();
			if (typeof wnd.scrollY == 'number')
				dialogObj.divNode.style.top = (dialogObj.top + wnd.scrollY) + 'px';
			else
				dialogObj.divNode.style.top = dialogObj.top + 'px';
		}
		else
			dialogObj.divNode.style.top = dialogObj.top + 'px';
		commonspot.lightbox.loadingMsg.hide();
		dialogObj.iframeNode.style.visibility = 'visible';
		// Handle key events at the window level
		var dlgWin = dialogObj.getWindow();
		dlgWin.onkeydown = commonspot.lightbox.handleDialogKeys;
	//	activateFields(dlgWin);
	}
	
	dialogObj.setUpFurniture = function(info)
	{
		if(info.title)
		{
			dialogObj.headerTitle.innerHTML = info.title;
			if (!args.hideHelp)
			{
				dialogObj.helpImg.style.visibility = 'visible';
				dialogObj.helpImg.style.display = 'inline';
				var helpId = info.helpId || info.title;
				if(helpId)
				{
					dialogObj.helpImg.onclick = function()
					{
						var loaderUrl = commonspot.clientUI.state.location.getLoaderURL('subsiteurl');
						var dialogUrl = loaderUrl + '?csModule=help/openhelp&CSHelpID=' + encodeURIComponent(helpId);
						var winSize = top.commonspot.util.dom.getWinSize();			
						var argsStr = "menubar=0,location=0,scrollbars=1,status=0,resizable=1,width=" + (winSize.width-100) + ",height=" + (winSize.height-40);
						if (commonspot.lightbox.helpDlg && !commonspot.lightbox.helpDlg.closed)
							commonspot.lightbox.helpDlg.location.href = dialogUrl;
						else
							commonspot.lightbox.helpDlg = window.open(dialogUrl,'helpDlg',argsStr);
						commonspot.lightbox.helpDlg.focus();
					}
				}
			}
		}
		if(info.subtitle.length)
		{
			(dialogObj.headerSubtitle).innerHTML = info.subtitle;
			(dialogObj.headerSubtitle).style.display = '';
		}	
		else
			(dialogObj.headerSubtitle).style.display = 'none';
		
		if (typeof(info.close) == 'undefined')
			info.close = true;

		if (typeof(info.reload) == 'undefined')
			info.reload = true;
			
		if (args.hideReload)
			info.reload = false;					
		if(info.maximize)
		{
			dialogObj.maxImg.style.visibility = 'visible';
			dialogObj.maxImg.style.display = 'inline';
		}	
		else
		{
			if( dialogObj.maxImg )
			{
				dialogObj.maxImg.style.display = 'none';
				dialogObj.maxImg.style.visibility = '';
			}
			dialogObj.hasMaxButton = false;
		}
				
		if(info.reload)
		{
			dialogObj.reloadImg.style.display = 'inline';
			dialogObj.reloadImg.style.visibility = 'visible';
		}

		if(typeof dialogObj.closeImg == 'undefined'){}
		else if(info.close)
		{
			dialogObj.closeImg.style.visibility = 'visible';
			dialogObj.closeImg.style.display = 'inline';
		}
		else
			dialogObj.closeImg.style.display = 'none';
	}
	
	dialogObj.showCrash = function()
	{
		var maxVals = commonspot.lightbox.getMaxSize();
		dialogObj.resize(maxVals.width-60, maxVals.height);
		dialogObj.iframeNode.style.overflow = "scroll";
		dialogObj.show();
		commonspot.dialog.client.alert("We're sorry, an error has occurred.<br />Close this message to view the available details.<br />Please see your server logs for more information.");
	};
	
	// Set initial size
	dialogObj.resize(commonspot.lightbox.DIALOG_DEFAULT_WIDTH, commonspot.lightbox.DIALOG_DEFAULT_HEIGHT);
	// Update z-index counter
	commonspot.lightbox.dialogFactory.zIndexCounter = commonspot.lightbox.dialogFactory.zIndexCounter +2;
	return dialogObj;
};

commonspot.lightbox.addSpellCheckButton = function(vDoc)
{
	var forms = vDoc.forms;
	var hasSpellcheck = false;
	var allFields = [];
	var noSpellCheckFlds = '';
	if (!forms.length)
		return;
		
	var spellCheckData = commonspot.data.SpellCheck_GetSettings.getData()[0];	
	if(!spellCheckData || !spellCheckData.enablespellcheck)
		return;
		
	var fld = vDoc.getElementById('noSpellCheckFields');
	if (fld && fld.value)
		noSpellCheckFlds = ',' + fld.value + ',';
		
	if (!hasSpellcheck)
	{
		for (var i=0; i<forms[0].elements.length; i++)
		{
			fld = forms[0].elements[i];
			fldStr = ',' + fld.name + ',';
			if ((fld.type == "text" || fld.type == "textarea") && (noSpellCheckFlds.indexOf(fldStr) == -1))
			{
				hasSpellcheck = true;
				break;
			}	
		}
	}	
	if (!hasSpellcheck)
		return;
	footer = vDoc.getElementById('dialogFooter');

	if (footer && hasSpellcheck)
	{
		var isChecked = "";
			isChecked = ' checked="checked"';
		if (spellCheckData.defaultstate == 'Enforce spell check')
			isChecked += ' disabled="disabled"';
		var dom = top.document.createElement('div');
		dom.id = 'spellCheckContainer';
		var label = top.document.createElement('label');
		dom.appendChild(label);
		var input = top.document.createElement('input');
		input.type = 'checkbox';
		input.id = 'SpellCheckOn';
		input.name = 'SpellCheckOn';
		input.value = 1;
		if (spellCheckData.defaultstate == 'Enforce spell check' || spellCheckData.defaultstate == 'Default On')
			input.checked = true;
		if (spellCheckData.defaultstate == 'Enforce spell check')
			input.readonly = true;
		label.appendChild(input);
		var tNode = top.document.createTextNode('Spell check');
		label.appendChild(tNode);						
		footer.appendChild(dom);
	}
};
commonspot.lightbox.loadingMsg =
{
	init: function()
	{
		var dom = top.document.createElement('div');
		dom.id = 'loading_container';
		dom.style.display = 'none';
		var dom2 = top.document.createElement('div');
		dom2.id = 'loading_content';
		dom2.title = 'Loading, please wait';
		img = top.document.createElement('img');
		img.id = 'loading_img';
		img.src = '/commonspot/dashboard/images/dialog/loading.gif';
		img.title = 'Loading, please wait';
		dom3 = top.document.createElement('div');
		dom3.id = 'loading_text';
		dom2.appendChild(img);
		dom2.appendChild(dom3);
		dom.appendChild(dom2);
		return top.document.body.appendChild(dom);
	},
	onDashboardLoaded: function()
	{
		top.document.getElementById('loading_container').style.display = 'none'; // kill initial Loading msg
		// add border, which we don't want against initial plain white, and background
		var loading_content = top.document.getElementById('loading_content');
		loading_content.style.border = '1px solid #7E96AD';
		loading_content.style.background = '#fff';
	},
	show: function(overlayMsg, overlayTitle)
	{
		var loadingDiv = top.document.getElementById('loading_content');
		if (!loadingDiv)
			loadingDiv = commonspot.lightbox.loadingMsg.init();
		var loadingImg = top.document.getElementById('loading_img');
		if (loadingDiv)
		{
			loadingDiv.title = overlayTitle;
			if (loadingImg)
				loadingImg.title = overlayTitle;
			setTimeout(function()
			{
				// attach onclick event to close if this is there even after 3 secs.
				if (top.document.getElementById('loading_container').style.display != 'none')
				{
					loadingDiv.onclick = function(e) {
						var event = e || window.event;	
					   if(typeof event.stopPropagation!='undefined')
					      event.stopPropagation();
					   else
					      event.cancelBubble=true;			
						commonspot.lightbox.closeCurrent();			
					}
					var delayOverlayMsg = "Loading, please wait or click to abort";
					loadingDiv.title = delayOverlayMsg;
					if (loadingImg)
						loadingImg.title = delayOverlayMsg;
				}
			},3000);	
		}
		top.document.getElementById('loading_text').innerHTML = overlayMsg;
		top.document.getElementById('loading_container').style.display = 'block';
	},
	hide: function()
	{
		var loadingContainer = top.document.getElementById('loading_container');
		if (loadingContainer && loadingContainer.style)
			loadingContainer.style.display = 'none';
		var content = top.document.getElementById('loading_content');	
		if (content)
			content.onclick = {};
	}
};

/**
 * Helper method generate XHTML for top and bottom corners
 * @param type	(string). Required. Either 't' for top, or 'b', for bottom
 * @param width  (int). Required. Dimension of the dialog
 * @return XHTML code
 */
commonspot.lightbox.generateHTMLcorners = function(type)
{
	var cornersHTML = '';
	var spacerWidth = commonspot.lightbox.DIALOG_DEFAULT_WIDTH - commonspot.lightbox.CORNERS_WIDTH;
	cornersHTML += '<img width="10" height="10" src="/commonspot/javascript/lightbox/' + type + 'l.gif"/>';
	cornersHTML += '<img width="' + spacerWidth + '" height="10" src="/commonspot/javascript/lightbox/' + type + 'spacer.gif"/>';
	cornersHTML += '<img width="10" height="10" src="/commonspot/javascript/lightbox/' + type + 'r.gif"/>';
	return cornersHTML;
};


commonspot.lightbox.hideQAElements = function(objList)
{
	var frName = commonspot.lightbox.stack.last().getFrameName();
	var elem;
	var allObjects = "QAStatusMsg_,statusIcon_,docIcon_,qaIcon_,reportsIcon_";
	allObjects = allObjects.replace(/_/gi,"_"+frName);
	if (objList == 'All')
	{
		var objList = allObjects;
	}	
	var elems = allObjects.split(",");
	for(var i=0; i<elems.length; i++)
	{
		elem = document.getElementById(elems[i]);
		if(elem)
		{
			if (objList.indexOf(elems[i])>=0)
				elem.style.display='none';
			else
				elem.style.display='';	
		}
	}
}

commonspot.lightbox.getResizeControlState = function(name)
{
	// 1: maximized 2: normal 0: unknown
	if (typeof name == 'undefined')
		return;
	var cState = 0;
	var btnID = name + '_' + parseInt(parseInt(commonspot.lightbox.dialogFactory.zIndexCounter)-1);
	var btnObj = document.getElementById(btnID);
	var cName = (btnObj && btnObj.className) ? (btnObj.className).replace('actionMontageIcon','') : '';
	if (cName.indexOf('ico_maximize') >= 0)
		cState = 2;
	else if (cName.indexOf('ico_pop') >= 0)
		cState = 1;	
	return cState;
}
/**
 * Utility method. Returns inner size of current viewport
 * @return {width, height, scrollX, scrollY}
 */
commonspot.lightbox.getWinSize = function(checkCurrentFrameFirst, wnd)
{
	var width, height, scrollX, scrollY, pgFrame, pgWin, checkAccess;
	if (typeof checkCurrentFrameFirst == 'undefined')
		var checkCurrentFrameFirst = false;
	if (!wnd)
		var wnd = top;	
	if (checkCurrentFrameFirst)
	{
		try // need this try-catch to avoid IE 'access denied' error when there is no page context.
		{
			if (commonspot.lightbox.stack.length)
			{
				pgWin = commonspot.lightbox.stack.last().getWindow();
				checkAccess = commonspot.lightbox.stack.last().getFrameName();
			}	
			else
			{
				pgFrame = top.document.getElementById('page_frame');
				if (pgFrame)
				{
					pgWin = pgFrame.contentWindow;
					checkAccess = pgWin.name;
				}
			}
		}
		catch(e)
		{	
			pgWin = null;
			checkAccess = null;
		}	
		if (checkAccess)
			return commonspot.lightbox.getWinSize(false, pgWin);
	}
	if( typeof( wnd.innerWidth ) == 'number' ) 
	{
		//Non-IE
		width = wnd.innerWidth;
		height = wnd.innerHeight;
	} 
	else if( wnd.document.documentElement && 
				( wnd.document.documentElement.clientWidth || wnd.document.documentElement.clientHeight ) ) 
	{
		//IE 6+ in 'standards compliant mode'
		width = wnd.document.documentElement.clientWidth;
		height = wnd.document.documentElement.clientHeight;
	} 
	else if( wnd.document.body && ( wnd.document.body.clientWidth || wnd.document.body.clientHeight ) ) 
	{
		//IE 4 compatible
		width = wnd.document.body.clientWidth;
		height = wnd.document.body.clientHeight;
	}
	if( typeof( wnd.pageYOffset ) == 'number' ) 
	{
		//Netscape compliant
		scrollY = wnd.pageYOffset;
		scrollX = wnd.pageXOffset;
	} 
	else if( wnd.document.body && ( wnd.document.body.scrollLeft || wnd.document.body.scrollTop ) ) 
	{
		//DOM compliant
		scrollY = wnd.document.body.scrollTop;
		scrollX = wnd.document.body.scrollLeft;
	} 
	else if( wnd.document.documentElement && 
				( wnd.document.documentElement.scrollLeft || wnd.document.documentElement.scrollTop ) ) 
	{
		//IE6 standards compliant mode
		scrollY = wnd.document.documentElement.scrollTop;
		scrollX = wnd.document.documentElement.scrollLeft;
	}
	
	return {width: width, height: height, scrollX: scrollX, scrollY: scrollY};
};


function activateFields(win)
{
	var firstFld = null;
	var cDoc = null;
	if(win.document.forms.length)
	{
		for (var i=0; i<win.document.forms.length; i++)
		{
			commonspot.util.dom.activateAllFields(win.document.forms[i]);
		}
	}
	var iFrames = win.document.getElementsByTagName('iframe');
	// all other
	for (i=0; i<iFrames.length; i++)
	{
		try
		{
			cDoc = (iFrames[i].contentWindow || iFrames[i].contentDocument);
			if (cDoc.document)
				cDoc = cDoc.document;			
		}
		catch(e)
		{
			continue;
		}	
		if (cDoc && cDoc.forms && cDoc.forms.length)
		{
			for (var j=0; j<cDoc.forms.length; j++)
			{
				commonspot.util.dom.activateAllFields(cDoc.forms[j]);
			}
			iFrames[i].contentWindow.focus();
		}
	}

	win.focus();
}

function InitDragDrop() 
{ 
	if( typeof OnMouseDown != 'undefined' ) 
	{
		document.onmousedown = OnMouseDown; 
		document.onmouseup = OnMouseUp; 
	}
	else
		setTimeout( "InitDragDrop()", 100 );
}

InitDragDrop(); 

