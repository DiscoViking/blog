package main

import (
	"encoding/json"
	"github.com/discoviking/blog/article"
	"log"
)

type request struct {
	// The request message itself.
	msg []byte

	// Channel to send response down.
	c chan []byte
}

// query represents a query for one or more articles.
// Will be unmarshalled from JSON over the wire.
type Query struct {
	// Used to request a specific article.
	// If this is included, date range is ignored.
	ArticleId string `json:"id"`

	// Date range to get articles from.
	// As Unix timestamps.
	From  int64 `json:"from"`
	Until int64 `json:"until"`

	// Whether to include the body of articles with the response or not.
	IncludeBody bool `json:"includeBody"`
}

// results represents the result of a query.
// Will be marshalled to JSON and sent over the wire.
type results []*article.Article

func handleRequests(ds Datastore, c chan request) {
	for r := range c {
		handleRequest(ds, r)
	}
}

func handleRequest(ds Datastore, r request) {
	q := Query{}
	var res results

	log.Print("Received: ", string(r.msg))
	err := json.Unmarshal(r.msg, &q)
	if err != nil {
		log.Print(err)
		return
	}

	log.Printf("Unmarshalled request: %v", q)
	if q.ArticleId != "" {
		log.Print("Retrieving article: ", q.ArticleId)
		a, err := ds.Article(q.ArticleId)
		if err != nil {
			log.Print(err)
			return
		}
		res = []*article.Article{a}
	} else {
		log.Print("Retrieving article list.")
		res, err = ds.List()
		if err != nil {
			log.Print(err)
			return
		}
	}

	resp, err := json.Marshal(res)
	if err != nil {
		log.Print(err)
		return
	}

	r.c <- resp
}
