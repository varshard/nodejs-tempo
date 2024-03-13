import Knex from 'knex'

export interface Action {
    action: string
    active: boolean
    updateAt: Date
    createdAt: Date
}

export interface Tables {
    actions: Action
}

export const pg = Knex({
    client: 'pg',
    connection: process.env.DB_URI
})
