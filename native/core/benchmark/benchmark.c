#define _POSIX_C_SOURCE 199309L

#include "benchmark.h"

#include <stdio.h>

void Benchmark_Start(Benchmark* benchmark)
{
    if (benchmark == NULL)
        return;

    clock_gettime(CLOCK_MONOTONIC, &benchmark->start);
}

void Benchmark_Stop(Benchmark* benchmark)
{
    if (benchmark == NULL)
        return;

    clock_gettime(CLOCK_MONOTONIC, &benchmark->end);

    struct timespec *start = &benchmark->start;
    struct timespec *end = &benchmark->end;

    benchmark->total = (end->tv_sec - start->tv_sec) + (end->tv_nsec - start->tv_nsec) / 1e9;
}

void Benchmark_Print(Benchmark* benchmark)
{
    if (benchmark == NULL)
        return;

    printf("[Benchmark] Total Time: %.9f seconds\r\n", benchmark->total);
}