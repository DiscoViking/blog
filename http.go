package main

import (
	"fmt"
	"log"
	"net/http"
)

type httpArticleHandler struct {
	reqChan chan request
}

func (a *httpArticleHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var msg []byte

	article_id := r.URL.Path
	if len(article_id) > 0 {
		msg = []byte(fmt.Sprintf(`{"id":"%s","includeBody":true}`, article_id))
	} else {
		msg = []byte(`{}`)
	}

	c := make(chan []byte)
	a.reqChan <- request{msg, c}
	resp := <-c

	_, err := w.Write(resp)
	if err != nil {
		log.Print(err)
	}
}
