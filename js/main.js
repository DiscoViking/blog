articles = [
  "Article 4",
  "Article 3",
  "Article 2",
  "Article 1",
];

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

  button.append( "<div/>" );

  // Body part of panel.
  var article = $( "<div/>", {
    "class": "panel-collapse collapse",
    "id": "article-" + id,
    "role": "tabpane",
    "aria-labelledby": "heading-" + id,
  });
  article.appendTo( panel );

  article.on('show.bs.collapse', function() {
    requestArticle(id)
  });

  var body = $( "<div/>", { "class": "panel-body" });
  body.appendTo( article );

  var setTitle = function( text ) {
    button.find( "div" ).text( text );
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
  return newArticle;
}

// Generic request and response code.
var requestArticle = function(id) {
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
      });
    }
}

var handleMessage = function(msg) {
  console.log("Received: " + msg);
  var data = JSON.parse(msg);
  $.each(data, function(index, article) {
    if ( article.body ) {
      a = $( "#" + article.id );
      a.find( ".panel-body" ).html(article.body);
    } else {
      if ( $( "#" + article.id).length == 0) {
        a = newArticle( article.id, article.title );
      }
    }
  });
}

// Websocket code.
var connect = function( addr ) {
  var ws = new WebSocket(addr)
  ws.onopen = function() {
    console.log("Data connection open.")
    var query = {
      "from": 0,
      "to": 0,
      "includeBody": false,
    };

    var msg = JSON.stringify(query);
    console.log("Sending: " + msg);
    ws.send(msg);
  }

  ws.onmessage = function(msg) {
    handleMessage(msg.data)
  };

  return ws
}

$(document).ready(function() {
  if ( window.WebSocket && false ) {
    console.log("Websocket supported, opening connection...");
    connection = connect("ws://localhost:8080/ws");
  } else {
    console.log("Websocket not supported, make Ajax request for all articles");
    $.get("/article/", {}, function ( resp ) {
      handleMessage(resp);
    });
  }
});
