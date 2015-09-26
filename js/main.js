/*
 * UI Code.
 */

// Object representing one article on the page.
var article = function(id) {
  var panel = $( "<div/>", {
    "class": "panel",
    "id": id
  });

  // Add the right class depending on if this article has been read or not.
  if (has_been_read(id)) {
    panel.addClass("panel-default");
  } else {
    panel.addClass("panel-primary");
  }

  // Heading part of panel.
  var heading = $( "<div/>", {
    "class": "panel-heading",
    "role": "tab",
  });
  heading.appendTo( panel );

  var title = $( "<h3/>", { "class": "panel-title" });
  title.appendTo( heading );

  var button = $( "<a/>", {
    "class": "collapsed",
    "role": "button",
    "data-toggle": "collapse",
    "data-parent": "#articles",
    "href": "#article-" + id,
    "aria-expanded": "false",
    "aria-controls": "article-" + id,
  });
  button.appendTo( title );

  var icon = $( "<span/>", { "class": "glyphicon glyphicon-menu-left article-dropdown-icon" });
  icon.appendTo( button );

  button.append( "<span/>" );

  // Body part of panel.
  var article = $( "<div/>", {
    "class": "panel-collapse collapse",
    "id": "article-" + id,
    "role": "tabpane",
    "aria-labelledby": "heading-" + id,
  });
  article.appendTo( panel );

  article.on('show.bs.collapse', function() {
    var icon = button.find( ".article-dropdown-icon" );
    icon.removeClass( "glyphicon-menu-left" );
    icon.addClass( "glyphicon-menu-down" );
    requestArticle(id)
  });

  article.on('shown.bs.collapse', function() {
    mark_as_read(id);
  });

  article.on('hide.bs.collapse', function() {
    var icon = button.find( ".article-dropdown-icon" );
    icon.removeClass( "glyphicon-menu-down" );
    icon.addClass( "glyphicon-menu-left" );

    // When hiding, update class to reflect read state.
    panel.removeClass("panel-primary");
    panel.addClass("panel-default");
  });

  var body = $( "<div/>", { "class": "panel-body" });
  body.appendTo( article );

  var setTitle = function( text ) {
    button.find( "span" ).last().text( text );
  };
  panel.setTitle = setTitle;

  var setBody = function( html ) {
    body.html( html );
  };
  panel.setBody = setBody;

  return(panel);
}

var newArticle = function( id, title ) {
  var newArticle = article(id);
  newArticle.setTitle(title);
  newArticle.setBody('<div class="throbber-loader"></div>');
  $( "#articles" ).prepend(newArticle);
  newArticle.hide();
  newArticle.fadeIn();
  return newArticle;
}

var createArticleBodies = function( id, bodies ) {
  var body = $( "#" + id ).find( ".panel-body" );
  body.html("");

  var tablist = $( "<ul/>", { "class": "nav nav-tabs", "role": "tablist" });
  var tabcontent = $( "<div/>", { "class": "tab-content" });
  $.each( bodies, function( lang, body ) {
    var li = $( "<li/>", { "role": "presentation" });
    var lang_id = id + "-" + lang;
    li.append($( "<a/>", {
      "href": "#" + lang_id,
      "aria-controls": lang_id,
      "role": "tab",
      "data-toggle": "tab",
    }).text(lang));

    var div = $( "<div/>", {
      "role": "tabpanel",
      "class": "tab-pane",
      "id": lang_id,
    }).html(body);

    tablist.append(li);
    tabcontent.append(div);
  });

  tablist.find( "li" ).first().addClass("active");
  tabcontent.find( "div" ).first().addClass("active");

  body.append(tablist);
  body.append(tabcontent);

  // Add Permalink.
  var permalink = $( "<a/>", {
    "href": "?permalink=" + id,
    "class": "permalink",
  });
  permalink.text("Link to this article.");
  permalink.on("click", function(event) {
    // Use our own click handler so we can do smooth insta-loads if supported.
    event.preventDefault();
    doPermalink(id);
  });

  var linkIcon = $( "<span/>", {
    "class": "glyphicon glyphicon-link",
  });
  permalink.prepend(linkIcon);

  body.append(permalink);
}

var openArticle = function( id ) {
  mark_as_read(id);
  $( "#" + id ).find(".collapse").collapse("show");
}


/*
 * Generic message handling code.
 */
var handleMessage = function(msg) {
  console.log("Received: " + msg);
  var data = JSON.parse(msg);
  $.each(data, function(index, article) {
    console.log("Data for article " + article.id);
    if ( $( "#" + article.id).length == 0) {
      console.log("Article doesn't exist.  Create.");
      var titles = $.map( article.title, function(v) { return v; } );
      newArticle( article.id, titles.join(" | ") );
    }

    if ( article.body ) {
      console.log("Body present.  Fill article contents.");
      createArticleBodies( article.id, article.body );
    }
  });
}

var requestArticle = function(id, doAfter) {
  if ( false ) {
    // Use websockets.

    var query = {
      "id": id,
      "includeBody": true,
    };

    var msg = JSON.stringify(query);
    console.log("Sending: " + msg);
    connection.send(msg);
  } else {
    // Use Ajax
    $.get( "/article/" + id, {}, function( resp ) {
      handleMessage(resp);
      if ( typeof(doAfter) === 'function' ) {
        doAfter();
      }
    });
  }
}


/*
 * Websocket Code.
 */
var connect = function( addr ) {
  var ws = new WebSocket(addr)
  ws.onopen = function() {
    console.log("Data connection open.")
  }

  ws.onmessage = function(msg) {
    handleMessage(msg.data)
  };

  return ws
}


/*
 * Article history handling code.
 */
var load_article_history = function() {
  // Requires HTML 5 Web Storage.
  if (typeof(Storage) !== "undefined") {
    var history = JSON.parse(localStorage.getItem("article-history"));
    if (history) {
      console.log("Loaded article history from localStorage");
      return history;
    }
  } else {
    console.log("HTML5 Web Storage not supported, article history will not persist across sessions");
  }

  return [];
}

var save_article_history = function( history ) {
  // Requires HTML 5 Web Storage.
  if (typeof(Storage) !== "undefined") {
    localStorage.setItem("article-history", JSON.stringify(history));
  }
}

var previously_read_articles = load_article_history();

var has_been_read = function( id ) {
  return (previously_read_articles.indexOf(id) !== -1 );
}

var mark_as_read = function( id ) {
  previously_read_articles.push(id);
  save_article_history(previously_read_articles);
}


/*
 * Page entry points
 */
var mainPageBegin = function() {
  var match = location.search.match(/permalink=[a-zA-Z0-9-_]+/);
  if (match) {
    loadPermalink( match[0].split("=")[1] );
  } else {
    loadMainPage();
  }
}

// These are to be used directly for initial page load.
var loadMainPage = function() {
  if ( window.WebSocket && false ) {
    console.log("Websocket supported, opening connection...");
    if (!connection) {
      connection = connect("ws://localhost:8080/ws");
    }

    var query = {
      "from": 0,
      "to": 0,
      "includeBody": false,
    };

    var msg = JSON.stringify(query);
    console.log("Sending: " + msg);
    ws.send(msg);
  } else {
    console.log("Websocket not supported, make Ajax request for all articles");
    $.get("/article/", {}, function ( resp ) {
      handleMessage(resp);
    });
  }
}

var loadPermalink = function( id ) {
  requestArticle(id, function() {
    // Since this is a permalink, expand the panel and lock it open.
    openArticle(id);
    $( "#" + id ).find("a").first().prop("disabled", true);
  });
}

// These are to be used after initial load for navigation.
var doMainPage = function() {
  $( "#articles" ).fadeOut("fast", function() {
    if (history.pushState) {
      // If we support history manipulation, load new content without reloading the page.
      history.pushState({}, "Home", "/");
      resetPage();
      loadMainPage();
    } else {
      // We don't support history manipulation, so just load the homepage again.
      // This is a shame, but otherwise we would mess up the browser history.
      window.location = "/"
    }
  });
}

var doPermalink = function( id ) {
  $( "#articles" ).fadeOut("fast", function() {
    if (history.pushState) {
      // If we support history manipulation, load new content without reloading the page.
      history.pushState({"article": id}, "Permalink: " + id, "?permalink=" + id);
      resetPage();
      loadPermalink(id);
    } else {
      // We don't support history manipulation, so just load the homepage again.
      // This is a shame, but otherwise we would mess up the browser history.
      window.location = "?permalink=" + id;
    }
  });
}

// Clears everything off the page.
var resetPage = function() {
  $( "#articles" ).empty().show();
  $( ".navbar" ).find(".collapse").collapse("hide");
}


/*
 * Code that actually runs on pageload is kept here.
 */
$(document).ready(function() {
  // Override click handler on home nav button.
  $( "#nav-home" ).on("click", function(event) {
    // Use our own click handler so we can do smooth insta-loads if supported.
    event.preventDefault();
    doMainPage();
  });
});

window.onpopstate = function(event) {
  console.log("Loading previous page with state: ", event.state);
  if (event.state && event.state.article) {
    // Indicates a permalink.
    console.log("Permalink: " + event.state.article);
    resetPage();
    loadPermalink(event.state.article);
  } else {
    // Must be home.
    console.log("Home");
    resetPage();
    loadMainPage();
  }
}
