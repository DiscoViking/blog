package filesystem

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"

	"github.com/discoviking/blog/article"
)

// Filesystem is a datastore which just reads articles from files.
type Filesystem struct {
	articlePath string
}

func New(path string) *Filesystem {
	return &Filesystem{path}
}

func (f *Filesystem) getArticle(id string, includeBody bool) (*article.Article, error) {
	name := filepath.Join(f.articlePath, id)

	// Check the file exists, and also gets us its length.
	info, err := os.Stat(name)
	if err != nil {
		return nil, err
	}

	// Open the file.
	file, err := os.Open(name)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// The first line contains the title.
	b := bufio.NewReader(file)
	title, err := b.ReadString('\n')
	if err != nil {
		return nil, err
	}
	title = strings.TrimSpace(title)

	// The rest is the body.
	body := ""
	if includeBody {
		buf := make([]byte, info.Size())
		n, err := b.Read(buf)
		if err != nil {
			return nil, err
		}

		body = string(buf[:n])
	}

	return &article.Article{
		Id:    id,
		Title: title,
		Body:  body,
	}, nil
}

func (f *Filesystem) Article(name string) (*article.Article, error) {
	return f.getArticle(name, true)
}

func (f *Filesystem) List() ([]*article.Article, error) {
	dir, err := os.Open(f.articlePath)
	if err != nil {
		return nil, err
	}
	defer dir.Close()

	names, err := dir.Readdirnames(0)
	if err != nil {
		return nil, err
	}

	articles := make([]*article.Article, 0, len(names))

	for _, name := range names {
		a, err := f.getArticle(name, false)
		if err != nil {
			continue
		}
		articles = append(articles, a)
	}

	return articles, nil
}

func (f *Filesystem) Store(a *article.Article) error {
	return nil
}
