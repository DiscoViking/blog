package main

import (
	"log"
	"net/http"

	"github.com/discoviking/blog/datastores/filesystem"
)

func main() {
	fs := filesystem.New("articles")
	recv := make(chan request, 5)
	for i := 0; i < 4; i++ {
		go handleRequests(fs, recv)
	}

	// Serve websocket article requests.
	http.HandleFunc("/ws", serveWs(recv))

	// Serve http article requests.
	articleHandler := httpArticleHandler{recv}
	http.Handle("/article/", http.StripPrefix("/article/", &articleHandler))

	// Serve front page.
	http.HandleFunc("/",
		func(w http.ResponseWriter, req *http.Request) {
			http.ServeFile(w, req, "front.html")
		})

	// Serve static content.
	http.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("./css"))))
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("./js"))))
	http.Handle("/fonts/", http.StripPrefix("/fonts/", http.FileServer(http.Dir("./fonts"))))
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
