import {Tracer} from './instrumentation'
const tracer = new Tracer()
tracer.init()
import express from 'express';
import {pg, Action} from './pg'

const app = express()

function rollDice(min: number, max: number) {
  return Math.floor(Math.random() * (max-min) + min)
}

app.get('/rolldice', (req, res) => {
  res.send(rollDice(1, 6).toString())
})
app.get('/actions', async (req, res) => {
  res.json(await pg.select('*').from<Action>('action'))
})
app.listen(3001, () => {
  console.log('listenting on 3001')
})

