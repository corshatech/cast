package urlpassword_test

import (
	"sort"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/corshatech/cast/collector/analysis/urlpassword"
)

func TestUrlpassword(t *testing.T) {
	t.Run("matches multiple", func(t *testing.T) {
		matches := urlpassword.Detect(map[string]interface{}{
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
			urlpassword.Detect(map[string]interface{}{
				"PaSsWord": "xyzzy",
				"foo":      "bar",
			}),
			[]string{"PaSsWord"},
		)
	})
	t.Run("is empty when not matched", func(t *testing.T) {
		require.Equal(
			t,
			urlpassword.Detect(map[string]interface{}{
				"foo": "bar",
			}),
			[]string{},
		)
	})
}
