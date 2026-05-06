package services

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"digital-bookshelf/backend/internal/config"
	"digital-bookshelf/backend/internal/models"

	"gorm.io/gorm"
)

type BookService struct {
	cfg config.Config
	db  *gorm.DB
}

type CreateBookInput struct {
	Title     string `json:"title" binding:"required"`
	CoverPath string `json:"coverPath"`
	FilePath  string `json:"filePath" binding:"required"`
}

type UpdateBookInput struct {
	Title     *string `json:"title"`
	CoverPath *string `json:"coverPath"`
}

func NewBookService(cfg config.Config, db *gorm.DB) *BookService {
	return &BookService{cfg: cfg, db: db}
}

func (s *BookService) List() ([]models.Book, error) {
	var books []models.Book
	err := s.db.Order("created_at desc").Find(&books).Error
	return books, err
}

func (s *BookService) Get(id uint) (*models.Book, error) {
	var book models.Book
	if err := s.db.First(&book, id).Error; err != nil {
		return nil, err
	}
	return &book, nil
}

func (s *BookService) Create(input CreateBookInput) (*models.Book, error) {
	book := models.Book{
		Title:     strings.TrimSpace(input.Title),
		CoverPath: strings.TrimSpace(input.CoverPath),
		FilePath:  strings.TrimSpace(input.FilePath),
	}
	if book.Title == "" || book.FilePath == "" {
		return nil, errors.New("title and filePath are required")
	}
	if err := s.db.Create(&book).Error; err != nil {
		return nil, err
	}
	return &book, nil
}

func (s *BookService) Update(id uint, input UpdateBookInput) (*models.Book, error) {
	book, err := s.Get(id)
	if err != nil {
		return nil, err
	}

	if input.Title != nil {
		title := strings.TrimSpace(*input.Title)
		if title == "" {
			return nil, errors.New("title is required")
		}
		book.Title = title
	}
	if input.CoverPath != nil {
		book.CoverPath = strings.TrimSpace(*input.CoverPath)
	}

	if err := s.db.Save(book).Error; err != nil {
		return nil, err
	}
	return book, nil
}

func (s *BookService) Delete(id uint) error {
	result := s.db.Delete(&models.Book{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (s *BookService) Upload(title string, file *multipart.FileHeader) (*models.Book, error) {
	if file == nil {
		return nil, errors.New("pdf file is required")
	}
	if !strings.EqualFold(filepath.Ext(file.Filename), ".pdf") {
		return nil, errors.New("only pdf files are allowed")
	}

	if err := os.MkdirAll(s.cfg.UploadDir, 0755); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(s.cfg.CoverDir, 0755); err != nil {
		return nil, err
	}

	safeTitle := strings.TrimSpace(title)
	if safeTitle == "" {
		safeTitle = strings.TrimSuffix(file.Filename, filepath.Ext(file.Filename))
	}

	stamp := time.Now().UTC().Format("20060102150405")
	baseName := slugify(safeTitle)
	if baseName == "" {
		baseName = "book"
	}

	fileName := fmt.Sprintf("%s-%s.pdf", stamp, baseName)
	filePath := filepath.Join(s.cfg.UploadDir, fileName)
	if err := saveUploadedFile(file, filePath); err != nil {
		return nil, err
	}

	coverPath, err := s.extractFirstPageCover(filePath, stamp, baseName)
	if err != nil {
		return nil, err
	}

	book := models.Book{
		Title:     safeTitle,
		CoverPath: coverPath,
		FilePath:  publicPath(filePath),
	}
	if err := s.db.Create(&book).Error; err != nil {
		return nil, err
	}
	return &book, nil
}

func (s *BookService) UploadCover(id uint, file *multipart.FileHeader) (*models.Book, error) {
	if file == nil {
		return nil, errors.New("cover file is required")
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" && ext != ".webp" {
		return nil, errors.New("only png, jpg, jpeg, or webp covers are allowed")
	}

	book, err := s.Get(id)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(s.cfg.CoverDir, 0755); err != nil {
		return nil, err
	}

	baseName := slugify(book.Title)
	if baseName == "" {
		baseName = "book"
	}
	coverName := fmt.Sprintf("%s-%s%s", time.Now().UTC().Format("20060102150405"), baseName, ext)
	coverPath := filepath.Join(s.cfg.CoverDir, coverName)
	if err := saveUploadedFile(file, coverPath); err != nil {
		return nil, err
	}

	book.CoverPath = publicPath(coverPath)
	if err := s.db.Save(book).Error; err != nil {
		return nil, err
	}
	return book, nil
}

func (s *BookService) extractFirstPageCover(pdfPath string, stamp string, baseName string) (string, error) {
	coverName := fmt.Sprintf("%s-%s.png", stamp, baseName)
	coverPath := filepath.Join(s.cfg.CoverDir, coverName)
	prefix := strings.TrimSuffix(coverPath, filepath.Ext(coverPath))

	cmd := exec.Command(
		"pdftoppm",
		"-png",
		"-singlefile",
		"-f", "1",
		"-l", "1",
		"-scale-to-x", "600",
		"-scale-to-y", "-1",
		pdfPath,
		prefix,
	)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("extract pdf cover: %w: %s", err, strings.TrimSpace(string(output)))
	}
	if _, err := os.Stat(coverPath); err != nil {
		return "", fmt.Errorf("extract pdf cover: %w", err)
	}

	return publicPath(coverPath), nil
}

func saveUploadedFile(header *multipart.FileHeader, destination string) error {
	src, err := header.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	dst, err := os.Create(destination)
	if err != nil {
		return err
	}
	defer dst.Close()

	_, err = io.Copy(dst, src)
	return err
}

func slugify(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	var builder strings.Builder
	lastDash := false
	for _, r := range value {
		switch {
		case r >= 'a' && r <= 'z':
			builder.WriteRune(r)
			lastDash = false
		case r >= '0' && r <= '9':
			builder.WriteRune(r)
			lastDash = false
		case r > 127:
			builder.WriteRune(r)
			lastDash = false
		default:
			if !lastDash {
				builder.WriteRune('-')
				lastDash = true
			}
		}
	}
	return strings.Trim(builder.String(), "-")
}

func publicPath(path string) string {
	clean := filepath.ToSlash(filepath.Clean(path))
	if strings.HasPrefix(clean, "storage/") {
		return "/" + clean
	}
	return clean
}
