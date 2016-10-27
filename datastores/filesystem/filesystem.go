package filesystem

import (
	"bufio"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"syscall"
	"time"

	"github.com/discoviking/blog/article"
	"github.com/russross/blackfriday"
)

var (
	languages = map[string]article.Language{
		".eng": article.English,
		".jap": article.Japanese,
	}
)

// Filesystem is a datastore which just reads articles from files.
type Filesystem struct {
	articlePath string
}

func New(path string) *Filesystem {
	return &Filesystem{path}
}

func (f *Filesystem) getArticle(id string, includeBody bool) (*article.Article, error) {
	glob := filepath.Join(f.articlePath, id+"*")
	files, err := filepath.Glob(glob)
	if err != nil {
		return nil, err
	}

	last_create_time := time.Unix(0, 0)
	last_mod_time := time.Unix(0, 0)

	titles := make(map[article.Language]string, len(files))
	bodies := make(map[article.Language]string, len(files))

	log.Print("Loading files %v", files)

	for _, name := range files {
		// Check the file exists, and also gets us its length.
		info, err := os.Stat(name)
		if err != nil {
			return nil, err
		}

		stat, ok := info.Sys().(*syscall.Stat_t)
		if !ok {
			return nil, err
		}

		create_time := getCreationTime(stat)
		if create_time.After(last_create_time) {
			last_create_time = create_time
		}
		mod_time := info.ModTime()
		if mod_time.After(last_mod_time) {
			last_mod_time = mod_time
		}

		// Work out the language from the file extension.
		ext := filepath.Ext(name)
		log.Print("File extension:", ext)
		lang, ok := languages[ext]
		if !ok {
			log.Print("Defaulting language to ENG")
			lang = article.English
		} else {
			log.Print("Found language:", lang)
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
		titles[lang] = strings.TrimSpace(title)

		// The rest is the body.
		if includeBody {
			buf := make([]byte, info.Size())
			n, err := b.Read(buf)
			if err != nil {
				return nil, err
			}

			bodies[lang] = string(blackfriday.MarkdownCommon(buf[:n]))
		}
	}

	return &article.Article{
		Id:         id,
		Title:      titles,
		Body:       bodies,
		DatePosted: last_create_time,
		DateEdited: last_mod_time,
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

	files, err := dir.Readdirnames(0)
	if err != nil {
		return nil, err
	}

	names := make(map[string]struct{}, len(files))
	for _, f := range files {
		ext := filepath.Ext(f)
		name := f[:len(f)-len(ext)]
		names[name] = struct{}{}
	}

	articles := make(article.ArticleList, 0, len(names))

	for name, _ := range names {
		a, err := f.getArticle(name, false)
		if err != nil {
			continue
		}
		articles = append(articles, a)
	}

	// Sort by creation time.
	sort.Sort(articles)

	return articles, nil
}

func (f *Filesystem) Store(a *article.Article) error {
	return nil
}
