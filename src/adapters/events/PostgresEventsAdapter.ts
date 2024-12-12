import EventsAdapter from "./EventsAdapter"
import Postgres from "postgres"

export default class PostgresEventsAdapter extends EventsAdapter {
  #sql: Postgres.Sql

  #initiated = false
  #initPromise: Promise<void>

  constructor(
    sql: Postgres.Sql
  ) {
    super({
      emit: async(event, data) => {
        if (!this.#initiated) {
          await this.#initPromise
        }

        const [{ id }] = await this.#sql`
          INSERT INTO "SSE_events" ("event", "data")
          VALUES (${event}, ${data})

          RETURNING "id";
        ` as { id: number }[]

        const eventKey = PostgresEventsAdapter.getEventKey(event)
        await this.#sql.notify(eventKey, JSON.stringify({ id }))
      },
      on: async(event, fn) => {
        if (!this.#initiated) {
          await this.#initPromise
        }

        const eventKey = PostgresEventsAdapter.getEventKey(event)
        await this.#sql.listen(eventKey, async(dataWithId: string) => {
          const { id } = JSON.parse(dataWithId) as { id: number }

          const [{ data }] = await this.#sql`
            SELECT "data"
            FROM "SSE_events"
            WHERE
              "id" = ${id};
          ` as { data: string }[]

          fn(data, event)
        })

      }
    })

    this.#sql = sql
    this.#initPromise = this.init()
  }

  init = async(): Promise<void> => {
    await this.#sql`
      CREATE TABLE IF NOT EXISTS "SSE_events" (
        "id" SERIAL PRIMARY KEY,
        "timestamp" TIMESTAMPTZ DEFAULT NOW(),
        "event" VARCHAR(255) NOT NULL,
        "data" TEXT NOT NULL
      );
    `

    setInterval(async() => {
      await this.#sql`
        DELETE FROM "SSE_events"
        WHERE "timestamp" < NOW() - INTERVAL '1 hour';
      `
    }, 10000)

    this.#initiated = true
  }

  static getEventKey = (event: string): string => `SSE_${event}`
}
