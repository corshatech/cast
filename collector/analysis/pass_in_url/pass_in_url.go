package pass_in_url

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

// InsertMatches inserts the matches from Detect into the pass_in_url table
func InsertMatches(ctx context.Context, db *sql.DB, traffic_id string, matched []string) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("could not begin transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback()
	}()

	for _, match := range matched {
		_, err := tx.ExecContext(ctx, "INSERT INTO pass_in_url (traffic_id, field) VALUES ($1, $2)", traffic_id, match)
		if err != nil {
			return fmt.Errorf("could not insert into pass_in_url: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("could not commit pass_in_url transaction: %w", err)
	}

	return nil
}

// Detect returns an array of queryString keys that look like passwords
func Detect(queryString map[string]interface{}) []string {
	var result []string

	for k := range queryString {
		if keys.Contains(strings.ToLower(k)) {
			result = append(result, k)
		}
	}
	return result
}
