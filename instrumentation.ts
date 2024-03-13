import { NodeSDK } from '@opentelemetry/sdk-node';
import {BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor} from '@opentelemetry/sdk-trace-node';
import {
    PeriodicExportingMetricReader,
    ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import {
    SEMRESATTRS_SERVICE_NAME,
    SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import {HttpInstrumentation} from "@opentelemetry/instrumentation-http";
import {ExpressInstrumentation} from "@opentelemetry/instrumentation-express";
import {KnexInstrumentation} from "@opentelemetry/instrumentation-knex";
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
export class Tracer {
    private sdk: NodeSDK | null = null;
    private exporter = new OTLPTraceExporter({url: 'http://localhost:4318/v1/traces'});
    private provider = new BasicTracerProvider({
        resource: new Resource({
            [SEMRESATTRS_SERVICE_NAME]: 'dice-roll'
        })
    })

    public init() {
        this.provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
        this.provider.addSpanProcessor(new SimpleSpanProcessor(this.exporter))
        this.provider.register()
        this.sdk = new NodeSDK({
            resource: new Resource({
                [SEMRESATTRS_SERVICE_NAME]: 'yourServiceName',
                [SEMRESATTRS_SERVICE_VERSION]: '1.0',
            }),
            traceExporter: this.exporter,
            metricReader: new PeriodicExportingMetricReader({
                exporter: new ConsoleMetricExporter(),
            }),
            instrumentations: [
                new HttpInstrumentation(),
                new ExpressInstrumentation(),
                new KnexInstrumentation()
            ]
        });
        this.sdk.start()
    }
}
