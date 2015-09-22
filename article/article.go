package article

import "time"

type Article struct {
	Id         string    `json:"id"`
	Title      string    `json:"title"`
	Body       string    `json:"body,omitempty"`
	DatePosted time.Time `json:"posted"`
	DateEdited time.Time `json:"edited,omitempty"`
}
