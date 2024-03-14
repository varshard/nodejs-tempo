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
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {HttpInstrumentation} from "@opentelemetry/instrumentation-http";
import {ExpressInstrumentation} from "@opentelemetry/instrumentation-express";
import {KnexInstrumentation} from "@opentelemetry/instrumentation-knex";
import {trace, Span, Attributes, Context, SpanOptions} from '@opentelemetry/api';
import {SpanExporter} from "@opentelemetry/sdk-trace-base";

export interface InstrumentorConfig {
    appName: string
    version: string
}

let instrumentorConfig: InstrumentorConfig;
export function setInstrumentorConfig(config: InstrumentorConfig) {
    instrumentorConfig = config
}
export function getInstrumentorConfig(): InstrumentorConfig {
    return instrumentorConfig
}

export class Instrumentor {
    private sdk: NodeSDK | null = null;
    private readonly exporter: SpanExporter;
    private provider : BasicTracerProvider | undefined;
    constructor(config: InstrumentorConfig) {
        setInstrumentorConfig(config)
        this.exporter = new OTLPTraceExporter({url: 'http://localhost:4318/v1/traces'})
    }

    public init() {
        const resource = Resource.default().merge(new Resource({
            [SEMRESATTRS_SERVICE_NAME]: getInstrumentorConfig().appName,
            [SEMRESATTRS_SERVICE_VERSION]: getInstrumentorConfig().version,
        }))
        this.provider = new BasicTracerProvider({
            resource
        })
        this.provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
        this.provider.addSpanProcessor(new SimpleSpanProcessor(this.exporter))
        this.provider.register()
        this.sdk = new NodeSDK({
            resource: resource,
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

export class AppSpan {
    private span: Span;
    constructor(name: string, options?: SpanOptions, context?: Context) {
        const tracer = trace.getTracer(instrumentorConfig.appName, instrumentorConfig.version)
        this.span = tracer.startSpan(name, options, context)
    }

    setAttribute(attributes: Attributes) {
        this.span.setAttributes(attributes)
    }

    public endSpan() {
        this.span.end()
    }
}

export function startSpan() {
    const tracer = trace.getTracer(instrumentorConfig.appName, instrumentorConfig.version)

}
