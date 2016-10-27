package filesystem

import (
	"syscall"
	"time"
)

func getCreationTime(stat *syscall.Stat_t) time.Time {
	timespec := stat.Ctim
	return time.Unix(int64(timespec.Sec), int64(timespec.Nsec))
}
