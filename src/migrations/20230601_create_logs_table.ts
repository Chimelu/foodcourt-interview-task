import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('logs', (table) => {
    table.string('id').primary();
    table.string('order_id').notNullable().references('id').inTable('orders');
    table.timestamp('time').notNullable();
    table.string('description').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('logs');
} 