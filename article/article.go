package article

import "time"

const (
	English  Language = "ENG"
	Japanese Language = "JAP"
)

type Language string

type Article struct {
	Id         string              `json:"id"`
	Title      map[Language]string `json:"title"`
	Body       map[Language]string `json:"body,omitempty"`
	DatePosted time.Time           `json:"posted"`
	DateEdited time.Time           `json:"edited,omitempty"`
}

type ArticleList []*Article

// Make slices of article pointers sortable by posting time.
func (l ArticleList) Len() int {
	return len(l)
}

func (l ArticleList) Less(i, j int) bool {
	return l[i].DatePosted.Unix() < l[j].DatePosted.Unix()
}

func (l ArticleList) Swap(i, j int) {
	l[i], l[j] = l[j], l[i]
}
