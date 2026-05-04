CC ?= cc
CFLAGS ?= -Wall -Wextra -pedantic -std=c11 -O2

.PHONY: all clean

all: aura_server

aura_server: server.c
	$(CC) $(CFLAGS) server.c -o aura_server

clean:
	rm -f aura_server
