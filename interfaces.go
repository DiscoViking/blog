package main

import (
	"github.com/discoviking/blog/article"
)

// This package holds all the interfaces for this blog.
// Implementations are in their respective files.

// Datastore is a place where articles are stored.
// It could be a database, the filesystem, or even some remote server.
type Datastore interface {
	Article(string) (*article.Article, error)
	List() ([]*article.Article, error)
	Store(*article.Article) error
}
