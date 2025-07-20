import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('riders', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.boolean('is_available').defaultTo(true);
    table.decimal('current_latitude', 10, 7).notNullable();
    table.decimal('current_longitude', 10, 7).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('riders');
} 