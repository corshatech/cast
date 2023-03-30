package main

import "time"

func deadline(t time.Duration) time.Time {
	return time.Now().Add(t)
}
