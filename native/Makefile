CC = gcc
CFLAGS = -O2 -Wall -fPIC
LDFLAGS = -shared

all: libcsvparser.so libiban.so libauditsigner.so

libcsvparser.so: csv/csv.c
	$(CC) $(CFLAGS) -fopenmp $(LDFLAGS) -o $@ $<

libiban.so: iban/iban.c
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $<

libauditsigner.so: audit/audit.c
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $< -lssl -lcrypto

clean:
	rm -f *.so