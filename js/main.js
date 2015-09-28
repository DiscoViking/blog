"use strict";

/**
 * Generic message handling module.
 * Will either use websockets or Ajax to contact the server.  This choice
 * is transparent to the calling code.
 */
var serverConnection = function serverConnection() {
  var obj = {};
  var ws = null;
  var wsFailures = 0;
  var wsMaxFailures = 5;
  var cbStack = [];

  var createWebsocket = function createWebsocket() {
    var url = "ws://" + window.location.host + "/ws";
    ws = new WebSocket(url);
    ws.onopen = function wsOpen() {
      console.log("Data connection open.");
      wsFailures = 0;
    };

    ws.onmessage = function wsMessage(msg) {
      var cb = cbStack.pop();
      cb(msg.data);
    };

    ws.onclose = function wsClose() {
      if (wsFailures < wsMaxFailures) {
        console.log("Websocket connection lost.  Retry in 1s.");
        setTimeout(createWebsocket, 1000);
        wsFailures += 1;
      } else {
        console.log("Websocket connection failed " + wsFailures +
                    "times. Giving up.");
      }
    };
  };

  var loadArticleList = function loadArticleList(cb) {
    if ((ws) && (ws.readyState === window.WebSocket.OPEN)) {
      console.log("Websocket ready and open.");
      cbStack.push(cb);
      ws.send("{}");
    } else {
      $.get("/article", {}, function loadListCb(resp) {
        cb(resp);
      });
    }
  };
  obj.loadArticleList = loadArticleList;

  var loadArticle = function loadArticle(id, cb) {
    if ((ws) && (ws.readyState === window.WebSocket.OPEN)) {
      console.log("Websocket ready and open.");
      var query = {
        "id": id,
        "includeBody": true,
      };
      cbStack.push(cb);
      ws.send(JSON.stringify(query));
    } else {
      $.get("/article/" + id, {}, function loadListCb(resp) {
        cb(resp);
      });
    }
  };
  obj.loadArticle = loadArticle;

  if (typeof window.WebSocket === "function") {
    console.log("Websockets supported.");
    createWebsocket();
  }

  return obj;
};

/**
 * Browser History Handler.
 */
var browserHistory = function browserHistory() {
  var obj = {};

  var replaceHistory = function replaceHistory(state, name, url) {
    if (history.pushState) {
      state.popstate = true;
      console.log("Replacing current history state: ", state);
      history.replaceState(state, name, url);
    } else {
      console.log("History manipulation not supported.");
    }
  };
  obj.replace = replaceHistory;

  var pushHistory = function pushHistory(state, name, url) {
    if (history.pushState) {
      state.popstate = true;
      console.log("Pushing history state: ", state);
      history.pushState(state, name, url);
    } else {
      console.log("History manipulation not supported.");
    }
  };
  obj.push = pushHistory;

  var loadHistory = function loadHistory(state) {
    console.log("Loading previous page with state: ", state);

    // If this state wasn't created by us, ignore it.
    // Sometimes chrome throws random blank popstate events for no reason.
    if ((state === null) ||
        (typeof state.popstate === "undefined")) {
      console.log("Not defined by us. Ignore.");
      return;
    }

    if (state.article) {
      // Indicates a permalink.
      console.log("Permalink: " + state.article);
      resetPage();
      loadPermalink(state.article);
    } else {
      // Must be home.
      console.log("Home");
      resetPage();
      loadMainPage();
    }
  };
  obj.load = loadHistory;

  return obj;
};

/**
 * Article history handling module.
 */
var articleHistory = function articleHistory() {
  var obj = {};
  var myHistory = [];

  var loadArticleHistory = function loadArticleHistory() {
    // Requires HTML 5 Web Storage.
    if (typeof Storage !== "undefined") {
      myHistory = JSON.parse(localStorage.getItem("article-history"));
      if (myHistory) {
        console.log("Loaded article history from localStorage");
      } else {
        console.log("No saved history.");
        myHistory = [];
      }
    } else {
      console.log("HTML5 Web Storage not supported, article history will not persist across sessions");
    }
  };

  var saveArticleHistory = function saveArticleHistory() {
    // Requires HTML 5 Web Storage.
    if (typeof Storage !== "undefined") {
      localStorage.setItem("article-history", JSON.stringify(myHistory));
    }
  };

  var clearHistory = function clearHistory() {
    myHistory = [];
    saveArticleHistory();
  };
  obj.clear = clearHistory;

  var hasBeenRead = function hasBeenRead(id) {
    return (myHistory.indexOf(id) !== -1);
  };
  obj.hasBeenRead = hasBeenRead;

  var markAsRead = function markAsRead(id) {
    myHistory.push(id);
    saveArticleHistory();
  };
  obj.markAsRead = markAsRead;

  loadArticleHistory();
  return obj;
};

// Function to get the value of a URI query parameter.
var queryParam = function queryParam(name) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var ix = 0; ix < vars.length; ix++) {
    var pair = vars[ix].split("=");
    if (decodeURIComponent(pair[0]) === name) {
      return decodeURIComponent(pair[1]);
    }
  }
  return null;
};

/*
 * UI Code.
 */

// Object representing one article on the page.
var article = function article(id) {
  var panel = $("<div/>", {
    "class": "panel",
    "id": id,
  });

  // Add the right class depending on if this article has been read or not.
  if (userHistory.hasBeenRead(id)) {
    panel.addClass("panel-default");
  } else {
    panel.addClass("panel-primary");
  }

  // Heading part of panel.
  var heading = $("<div/>", {
    "class": "panel-heading",
    "role": "tab",
  });
  heading.appendTo(panel);

  var title = $("<h3/>", { "class": "panel-title" });
  title.appendTo(heading);

  var button = $("<a/>", {
    "class": "collapsed",
    "role": "button",
    "data-toggle": "collapse",
    "data-parent": "#articles",
    "href": "#article-" + id,
    "aria-expanded": "false",
    "aria-controls": "article-" + id,
  });
  button.appendTo(title);

  var icon = $("<span/>", { "class": "glyphicon glyphicon-menu-left article-dropdown-icon" });
  icon.appendTo(button);

  button.append("<span/>");

  // Body part of panel.
  var articleDiv = $("<div/>", {
    "class": "panel-collapse collapse",
    "id": "article-" + id,
    "role": "tabpane",
    "aria-labelledby": "heading-" + id,
  });
  articleDiv.appendTo(panel);

  articleDiv.on("show.bs.collapse", function articleShow() {
    var glyphicon = button.find(".article-dropdown-icon");
    glyphicon.removeClass("glyphicon-menu-left");
    glyphicon.addClass("glyphicon-menu-down");
    serverHandler.loadArticle(id, function loadArticleCb(data) {
      handleMessage(data);
    });
  });

  articleDiv.on("shown.bs.collapse", function articleShown() {
    userHistory.markAsRead(id);
  });

  articleDiv.on("hide.bs.collapse", function articleHide() {
    var glyphicon = button.find(".article-dropdown-icon");
    glyphicon.removeClass("glyphicon-menu-down");
    glyphicon.addClass("glyphicon-menu-left");

    // When hiding, update class to reflect read state.
    panel.removeClass("panel-primary");
    panel.addClass("panel-default");
  });

  var body = $("<div/>", { "class": "panel-body" });
  body.appendTo(articleDiv);

  var setTitle = function setTitle(text) {
    button.find("span").last().text(text);
  };
  panel.setTitle = setTitle;

  var setBody = function setBody(html) {
    body.html(html);
  };
  panel.setBody = setBody;

  return panel;
};

// Creates a new article panel and attaches it to the articles list.
// Does not make it visible.  The caller must make it visible.
var newArticle = function newArticle(id, title) {
  var thisArticle = article(id);
  thisArticle.setTitle(title);
  thisArticle.setBody("<div class=\"throbber-loader\"></div>");
  thisArticle.hide();
  $("#articles").prepend(thisArticle);
  return thisArticle;
};

var createArticleBodies = function createArticleBodies(id, bodies) {
  var body = $("#" + id).find(".panel-body");
  body.html("");

  var tablist = $("<ul/>", { "class": "nav nav-tabs", "role": "tablist" });
  var tabcontent = $("<div/>", { "class": "tab-content" });
  $.each(bodies, function createBody(lang, html) {
    var li = $("<li/>", { "role": "presentation" });
    var langId = id + "-" + lang;
    li.append($("<a/>", {
      "href": "#" + langId,
      "aria-controls": langId,
      "role": "tab",
      "data-toggle": "tab",
    }).text(lang));

    var div = $("<div/>", {
      "role": "tabpanel",
      "class": "tab-pane",
      "id": langId,
    }).html(html);

    tablist.append(li);
    tabcontent.append(div);
  });

  tablist.find("li").first().addClass("active");
  tabcontent.find("div").first().addClass("active");

  body.append(tablist);
  body.append(tabcontent);

  // Add Permalink.
  var permalink = $("<a/>", {
    "href": "?permalink=" + id,
    "class": "permalink",
  });
  permalink.text("Link to this article.");
  permalink.on("click", function permalinkClick(event) {
    // Use our own click handler so we can do smooth insta-loads if supported.
    event.preventDefault();
    doPermalink(id);
  });

  var linkIcon = $("<span/>", {
    "class": "glyphicon glyphicon-link",
  });
  permalink.prepend(linkIcon);

  body.append(permalink);
};

var openArticle = function openArticle(id) {
  userHistory.markAsRead(id);
  $("#" + id).find(".collapse").collapse("show");
};

var handleMessage = function handleMessage(msg) {
  console.log("Received: " + msg);
  var data = JSON.parse(msg);
  $.each(data, function handleOneArticle(index, articleData) {
    console.log("Data for articleData " + articleData.id);
    if ($("#" + articleData.id).length === 0) {
      console.log("articleData doesn't exist.  Create.");
      var titles = $.map(articleData.title, function identity(val) { return val; });

      // Fade new articleDatas in from the top down.
      var fadeDelay = Math.min(20, (data.length - (index + 1))) * 50;
      newArticle(articleData.id, titles.join(" | ")).delay(fadeDelay).fadeIn();
    }

    if (articleData.body) {
      console.log("Body present.  Fill articleData contents.");
      createArticleBodies(articleData.id, articleData.body);
    }
  });
};

/*
 * Page entry points
 */
var mainPageBegin = function mainPageBegin() {
  var permalink = queryParam("permalink");
  if (permalink) {
    historyHandler.replace({ "article": permalink },
                           "Permalink: " + permalink,
                           "?permalink=" + permalink);
    loadPermalink(permalink);
  } else {
    historyHandler.replace({}, "Home", "/");
    loadMainPage();
  }
};

// These are to be used directly for initial page load.
var loadMainPage = function loadMainPage() {
  serverHandler.loadArticleList(function loadListCb(data) {
    handleMessage(data);
  });
};

var loadPermalink = function loadPermalink(id) {
  serverHandler.loadArticle(id, function permalinkCb(data) {
    // Since this is a permalink, expand the panel and lock it open.
    handleMessage(data);
    openArticle(id);
    var link = $("#" + id).find("a").first();
    var text = link.text();
    $("<span/>").text(text).insertBefore(link);
    link.remove();
  });
};

// These are to be used after initial load for navigation.
var doMainPage = function doMainPage() {
  $("#articles").fadeOut("fast", function mainPostFade() {
    if (history.pushState) {
      // If we support history manipulation, load new content without reloading the page.
      resetPage();
      historyHandler.push({}, "Home", "/");
      loadMainPage();
    } else {
      // We don"t support history manipulation, so just load the homepage again.
      // This is a shame, but otherwise we would mess up the browser history.
      window.location = "/";
    }
  });
};

var doPermalink = function doPermalink(id) {
  $("#articles").fadeOut("fast", function permaPostFade() {
    if (history.pushState) {
      // If we support history manipulation, load new content without reloading the page.
      resetPage();
      historyHandler.push({ "article": id }, "Permalink: " + id, "?permalink=" + id);
      loadPermalink(id);
    } else {
      // We don"t support history manipulation, so just load the homepage again.
      // This is a shame, but otherwise we would mess up the browser history.
      window.location = "?permalink=" + id;
    }
  });
};

// Clears everything off the page.
var resetPage = function resetPage() {
  $("#articles").empty().show();
  $(".navbar").find(".collapse").collapse("hide");
};


/*
 * Code that actually runs on pageload is kept here.
 */
$(document).ready(function documentReady() {
  // Override click handler on home nav button.
  $("#nav-home").on("click", function navHomeClick(event) {
    // Use our own click handler so we can do smooth insta-loads if supported.
    event.preventDefault();
    doMainPage();
  });

  $("#nav-about").on("click", function navHomeClick(event) {
    // Use our own click handler so we can do smooth insta-loads if supported.
    event.preventDefault();
    doPermalink("about");
  });

  mainPageBegin();
});

var historyHandler = browserHistory();
window.onpopstate = function historyPopState(event) {
  if (event.state) {
    historyHandler.load(event.state);
  }
};

var userHistory = articleHistory();

var serverHandler = serverConnection();
