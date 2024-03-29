import {AppSpan, Instrumentor} from './instrumentation'
const tracer = new Instrumentor({
  appName: 'dice-roll',
  version: '1.0',
})
tracer.init()
import {XrayInstrumentor} from './xray'
import express from 'express';
import {Action, pg} from './pg'
import {SpanKind} from "@opentelemetry/api";


const app = express()

function rollDice(min: number, max: number) {
  return Math.floor(Math.random() * (max-min) + min)
}

app.get('/rolldice', (req, res) => {
  const dice = rollDice(1, 6)
  const span = new AppSpan('rolldice', {kind: SpanKind.SERVER})
  span.setAttribute({'dice': dice})
  res.status(200)
  res.send(dice.toString())
  span.endSpan()
})
app.get('/actions', async (req, res) => {
  res.json(await pg.select('*').from<Action>('action'))
})
app.listen(3001, () => {
  console.log('listenting on 3001')
})

