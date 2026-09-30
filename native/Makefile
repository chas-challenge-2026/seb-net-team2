CC = gcc
CFLAGS = -O2 -Wall -fPIC
LDFLAGS = -shared

.PHONY: test test-csv test-audit audit-test audit-test-asan clean

all: libcsvparser.so libiban.so libauditsigner.so

libcsvparser.so: csv/csv.c
	$(CC) $(CFLAGS) -fopenmp $(LDFLAGS) -o $@ $<

libiban.so: iban/iban.c
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $<

libauditsigner.so: audit/audit.c
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $< -lssl -lcrypto

test: test-csv test-audit

test-csv:
	$(CC) csv/test.c csv/csv.c -o csv-test -lcmocka
	./csv-test
	rm csv-test

test-audit:
	$(CC) audit/test_audit.c audit/audit.c -o audit-test -lcmocka -lssl -lcrypto
	./audit-test
	rm audit-test

audit-test:
	AUDIT_SIGNING_KEY=test-secret $(MAKE) test-audit

audit-test-asan:
	$(CC) -g -fsanitize=address -fno-omit-frame-pointer \
	audit/test_audit.c audit/audit.c \
	-o audit-test-asan -lcmocka -lssl -lcrypto
	AUDIT_SIGNING_KEY=test-secret ./audit-test-asan
	rm audit-test-asan

clean:
	rm -f *.so
