package pass_in_url_test

import (
	"sort"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/corshatech/cast/collector/analysis/pass_in_url"
)

func TestPassInUrl(t *testing.T) {

	t.Run("matches multiple", func(t *testing.T) {
		result, err := pass_in_url.Detect("http://example.com?password=xyzzy&pass=xyzzy&foo=bar")

		require.NoError(t, err)
		require.NotNil(t, result)

		sort.Strings(result.QueryParams)

		require.Equal(
			t,
			*result,
			pass_in_url.PassInUrl{
				AbsoluteUri: "http://example.com",
				QueryParams: []string{"pass", "password"},
			},
		)
	})

	t.Run("nil when no passwords are found", func(t *testing.T) {
		result, err := pass_in_url.Detect("http://example.com?foo=bar")

		require.NoError(t, err)
		require.Nil(t, result)
	})

	t.Run("does not error when the query string is missing", func(t *testing.T) {
		result, err := pass_in_url.Detect("http://example.com")

		require.NoError(t, err)
		require.Nil(t, result)
	})

	t.Run("does not error if the url is empty", func(t *testing.T) {
		result, err := pass_in_url.Detect("")

		require.NoError(t, err)
		require.Nil(t, result)
	})

	t.Run("returns an error when passed a malformed URL", func(t *testing.T) {
		result, err := pass_in_url.Detect("\x7f")

		assert.EqualError(t, err, "error parsing absoluteUri: parse \"\\x7f\": net/url: invalid control character in URL")
		assert.Nil(t, result)
	})

	t.Run("returns an error when passed a malformed query", func(t *testing.T) {
		result, err := pass_in_url.Detect("http://example.com/?foo;bar=1")

		assert.EqualError(t, err, "error parsing absoluteUri query: invalid semicolon separator in query")
		assert.Nil(t, result)
	})
}
