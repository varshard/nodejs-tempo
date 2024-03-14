import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
// enable error logging
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

import {NodeSDK} from "@opentelemetry/sdk-node";
import {SpanExporter, BatchSpanProcessor} from "@opentelemetry/sdk-trace-base";
import {
    BasicTracerProvider,
    ConsoleSpanExporter,
    NodeTracerProvider,
    SimpleSpanProcessor
} from "@opentelemetry/sdk-trace-node";
import {OTLPTraceExporter} from "@opentelemetry/exporter-trace-otlp-http";
import {detectResourcesSync, Resource} from "@opentelemetry/resources";
import {SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION} from "@opentelemetry/semantic-conventions";
import {ConsoleMetricExporter, PeriodicExportingMetricReader} from "@opentelemetry/sdk-metrics";
import {HttpInstrumentation} from "@opentelemetry/instrumentation-http";
import {ExpressInstrumentation} from "@opentelemetry/instrumentation-express";
import {KnexInstrumentation} from "@opentelemetry/instrumentation-knex";
import {getInstrumentorConfig, InstrumentorConfig, setInstrumentorConfig} from "./instrumentation";
const { AWSXRayPropagator } = require("@opentelemetry/propagator-aws-xray");
const { AWSXRayIdGenerator } = require("@opentelemetry/id-generator-aws-xray");
const { AwsInstrumentation } = require("@opentelemetry/instrumentation-aws-sdk");
import { awsEcsDetector} from '@opentelemetry/resource-detector-aws'

export class XrayInstrumentor {
    private sdk: NodeSDK | null = null;
    private readonly exporter: SpanExporter;
    private provider : NodeTracerProvider | undefined;
    constructor(config: InstrumentorConfig) {
        setInstrumentorConfig(config)
        this.exporter = new OTLPTraceExporter()
    }

    public init() {
        const resource = detectResourcesSync({
                detectors: [awsEcsDetector],
            })
        this.provider = new NodeTracerProvider({
            // detect ECS metadata
            resource
        })
        this.provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
        this.provider.addSpanProcessor(new SimpleSpanProcessor(this.exporter))
        this.provider.register()
        this.sdk = new NodeSDK({
            resource,
            textMapPropagator: new AWSXRayPropagator(),
            traceExporter: this.exporter,
            spanProcessors: [new BatchSpanProcessor(this.exporter)],
            idGenerator: new AWSXRayIdGenerator(),
            metricReader: new PeriodicExportingMetricReader({
                exporter: new ConsoleMetricExporter(),
            }),
            instrumentations: [
                new HttpInstrumentation(),
                new ExpressInstrumentation(),
                new KnexInstrumentation(),
                new AwsInstrumentation({
                    suppressInternalInstrumentation: true
                })
            ]
        });
        this.sdk.start()
    }
}
