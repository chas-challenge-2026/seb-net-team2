#ifndef BENCHMARK_H
#define BENCHMARK_H

#include <time.h>

typedef struct 
{
    struct timespec start;
    struct timespec end;
    double total;
} Benchmark;

void Benchmark_Start(Benchmark* benchmark);
void Benchmark_Stop(Benchmark* benchmark);
void Benchmark_Print(Benchmark* benchmark);

#endif