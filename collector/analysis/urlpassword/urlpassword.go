package urlpassword

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/emirpasic/gods/sets/hashset"
)

var keys = hashset.New(
	"password",
	"pass",
	"pwd",
	"auth",
	"apiKey",
	"api-key",
	"session",
	"sessionKey",
	"session-key",
)

// Handle detects if queryString has a password and inserts the result into the urlpassword table
func Handle(ctx context.Context, db *sql.DB, traffic_id string, queryString map[string]interface{}) ([]string, error) {
	matched := Detect(queryString)
	if len(matched) == 0 {
		return nil, nil
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("could not begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback()
	}()

	for _, match := range matched {
		_, err := tx.ExecContext(ctx, "INSERT INTO urlpassword (traffic_id, field) VALUES ($1, $2)", traffic_id, match)
		if err != nil {
			return nil, fmt.Errorf("could not insert into urlpassword: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("could not commit urlpassword transaction: %w", err)
	}

	return matched, nil
}

// Detect returns an array of queryString keys that look like passwords
func Detect(queryString map[string]interface{}) []string {
	result := []string{}
	for k := range queryString {
		if keys.Contains(strings.ToLower(k)) {
			result = append(result, k)
		}
	}
	return result
}
