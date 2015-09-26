// Object representing one article on the page.
var article = function(id) {
  var panel = $( "<div/>", {
    "class": "panel panel-primary",
    "id": id
  });

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

  article.on('hide.bs.collapse', function() {
    var icon = button.find( ".article-dropdown-icon" );
    icon.removeClass( "glyphicon-menu-down" );
    icon.addClass( "glyphicon-menu-left" );
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

// Generic request and response code.
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

  var linkIcon = $( "<span/>", {
    "class": "glyphicon glyphicon-link",
  });
  permalink.prepend(linkIcon);

  body.append(permalink);
}

var openArticle = function( id ) {
  $( "#" + id ).find(".collapse").collapse("show");
}

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

// Websocket code.
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

// Page entry points
var mainPageBegin = function() {
  var match = location.search.match(/permalink=[a-zA-Z0-9-_]+/);
  if (match) {
    loadPermalink( match[0].split("=")[1] );
  } else {
    loadMainPage();
  }
}

var loadMainPage = function() {
  if ( window.WebSocket && false ) {
    console.log("Websocket supported, opening connection...");
    connection = connect("ws://localhost:8080/ws");
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
  requestArticle(id, function() { openArticle(id); });
}
