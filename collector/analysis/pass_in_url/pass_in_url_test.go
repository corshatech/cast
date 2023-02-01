package pass_in_url_test

import (
	"context"
	"errors"
	"sort"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/corshatech/cast/collector/analysis/pass_in_url"
)

func TestInsertMatches(t *testing.T) {
	t.Run("matches are inserted correctly", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		mock.ExpectBegin()
		mock.ExpectExec("INSERT INTO pass_in_url").
			WithArgs("traffic-id", "pass-1").
			WillReturnResult(sqlmock.NewResult(1, 1))

		mock.ExpectExec("INSERT INTO pass_in_url").
			WithArgs("traffic-id", "pass-2").
			WillReturnResult(sqlmock.NewResult(1, 1))

		mock.ExpectCommit()

		err = pass_in_url.InsertMatches(context.Background(), db, "traffic-id", []string{"pass-1", "pass-2"})
		assert.NoError(t, err, "error with InsertMatches")
		assert.NoError(t, mock.ExpectationsWereMet())
	})
	t.Run("returns an error when a transaction cannot be created", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		mock.ExpectBegin().
			WillReturnError(errors.New("begin error"))

		err = pass_in_url.InsertMatches(context.Background(), db, "traffic-id", []string{"pass-1", "pass-2"})
		assert.Error(t, err)
		assert.Equal(t, err.Error(), "could not begin transaction: begin error")
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("returns an error when a match cannot be inserted", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		mock.ExpectBegin()
		mock.ExpectExec("INSERT INTO pass_in_url").
			WithArgs("traffic-id", "pass-1").
			WillReturnError(errors.New("insert error"))

		err = pass_in_url.InsertMatches(context.Background(), db, "traffic-id", []string{"pass-1", "pass-2"})
		assert.Error(t, err)
		assert.Equal(t, err.Error(), "could not insert into pass_in_url: insert error")
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("returns an error when the transaction cannot be committed", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
		}
		defer db.Close()

		mock.ExpectBegin()
		mock.ExpectExec("INSERT INTO pass_in_url").
			WithArgs("traffic-id", "pass-1").
			WillReturnResult(sqlmock.NewResult(1, 1))

		mock.ExpectExec("INSERT INTO pass_in_url").
			WithArgs("traffic-id", "pass-2").
			WillReturnResult(sqlmock.NewResult(1, 1))

		mock.ExpectCommit().
			WillReturnError(errors.New("commit error"))

		err = pass_in_url.InsertMatches(context.Background(), db, "traffic-id", []string{"pass-1", "pass-2"})
		assert.Error(t, err)
		assert.Equal(t, err.Error(), "could not commit pass_in_url transaction: commit error")
		assert.NoError(t, mock.ExpectationsWereMet())

	})
}

func TestPassInUrl(t *testing.T) {
	t.Run("matches multiple", func(t *testing.T) {
		matches := pass_in_url.Detect(map[string]interface{}{
			"password": "xyzzy",
			"pass":     "abc",
			"foo":      "bar",
		})
		sort.Strings(matches)

		require.Equal(
			t,
			matches,
			[]string{"pass", "password"},
		)
	})
	t.Run("is case-insensitive", func(t *testing.T) {
		require.Equal(
			t,
			pass_in_url.Detect(map[string]interface{}{
				"PaSsWord": "xyzzy",
				"foo":      "bar",
			}),
			[]string{"PaSsWord"},
		)
	})
	t.Run("is empty when not matched", func(t *testing.T) {
		require.Empty(
			t,
			pass_in_url.Detect(map[string]interface{}{
				"foo": "bar",
			}),
		)
	})
}
