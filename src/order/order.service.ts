import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import * as amqp from 'amqplib';
import { DispatchGateway } from '../dispatch.gateway';
import { getDistance } from 'geolib';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrderService {
 
  private rabbitChannel: amqp.Channel | undefined;

  constructor(
    @Inject('KnexConnection') private readonly knex: Knex,
    private readonly dispatchGateway: DispatchGateway,  
    private readonly configService: ConfigService,
  ) {
    // Initialize RabbitMQ connection when the service is instantiated
    this.initRabbitMQ();
  }

  /**
   * Task 1 Requirement 5
   * Initializes the RabbitMQ connection and sets up a consumer for the 'order_created' queue.
   * This allows the service to listen for new order events and process them as needed.
   */
  private async initRabbitMQ() {
    try {
      const rabbitUrl = this.configService.get('RABBITMQ_URL') || 'amqp://localhost';
      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();
      const queue = 'order_created';
      await channel.assertQueue(queue, { durable: false });
      channel.consume(queue, (msg) => {
        if (msg) {
          console.log('Received message from RabbitMQ:', msg.content.toString());
          channel.ack(msg);
        }
      });
      this.rabbitChannel = channel;
    } catch (err) {
      console.error('RabbitMQ connection error:', err);
    }
  }

  /**
   * Inserts the order and all related data into the database.
   * @param order The order object containing all related data
   */
  async createOrder(order: any) {
    try {
      // Insert calculated_order
      const calculatedOrderId = order.calculated_order?.id || uuidv4();
      if (order.calculated_order) {
        await this.knex('calculated_orders').insert({
          id: calculatedOrderId,
          total_amount: order.calculated_order.total_amount,
          free_delivery: order.calculated_order.free_delivery,
          delivery_fee: order.calculated_order.delivery_fee,
          service_charge: order.calculated_order.service_charge,
          address_details: JSON.stringify(order.calculated_order.address_details),
          meals: JSON.stringify(order.calculated_order.meals),
          lat: order.calculated_order.lat,
          lng: order.calculated_order.lng,
          cokitchen_polygon_id: order.calculated_order.cokitchen_polygon_id,
          user_id: order.calculated_order.user_id,
          cokitchen_id: order.calculated_order.cokitchen_id,
          pickup: order.calculated_order.pickup,
          prev_price: order.calculated_order.prev_price,
        }).onConflict('id').ignore();
      }

      // Insert order_type if present
      let orderTypeId = null;
      if (order.order_type) {
        orderTypeId = order.order_type.id;
        await this.knex('order_type').insert({
          id: orderTypeId,
          name: order.order_type.name,
          created_at: order.order_type.created_at,
          updated_at: order.order_type.updated_at,
        }).onConflict('id').ignore();
      }

  
      const orderFields = [
        'id', 'user_id', 'completed', 'cancelled', 'kitchen_cancelled', 'kitchen_accepted',
        'kitchen_dispatched', 'kitchen_dispatched_time', 'completed_time', 'rider_id',
        'kitchen_prepared', 'rider_assigned', 'paid', 'order_code', 'order_change',
        'calculated_order_id', 'created_at', 'updated_at', 'kitchen_verified_time',
        'kitchen_completed_time', 'shop_accepted', 'shop_prepared', 'no_of_mealbags_delivered',
        'no_of_drinks_delivered', 'rider_started_time', 'rider_started', 'rider_arrived_time',
        'rider_arrived', 'is_failed_trip', 'failed_trip_details', 'box_number', 'shelf_id',
        'scheduled', 'confirmed_by_id', 'completed_by_id', 'scheduled_delivery_date',
        'scheduled_delivery_time', 'is_hidden', 'order_type_id'
      ];
      const orderData = Object.fromEntries(
        orderFields.map(key => [key, key === 'calculated_order_id' ? calculatedOrderId : (key === 'order_type_id' ? orderTypeId : key === 'failed_trip_details' ? JSON.stringify(order[key]) : order[key])])
      );
      await this.knex('orders').insert(orderData);

      // Insert logs
      if (Array.isArray(order.logs)) {
        for (const log of order.logs) {
          await this.knex('logs').insert({
            id: uuidv4(),
            order_id: order.id,
            time: log.time,
            description: log.description,
          });
        }
      }

      // Insert order_total_amount_history
      if (Array.isArray(order.order_total_amount_history)) {
        for (const hist of order.order_total_amount_history) {
          await this.knex('order_total_amount_history').insert({
            id: uuidv4(),
            order_id: order.id,
            time: hist.time,
            total_amount: hist.total_amount,
          });
        }
      }

      // Publish to RabbitMQ and notify riders
      await this.publishOrderCreatedMessage(order);
    } catch (error) {
      // Log and rethrow for controller to handle
      console.error('Error in createOrder:', error);
      throw new Error('Failed to create order: ' + (error.message || error));
    }
  }

  /**
   * Finds all available riders within 5km of the restaurant's location for a given order
   * and sends them a targeted WebSocket notification with the order details.
   * @param order The order object containing calculated_order with lat/lng
   */
  async notifyNearbyRidersForOrder(order: any) {
    const { calculated_order } = order;
    const lat = parseFloat(calculated_order.lat);
    const lng = parseFloat(calculated_order.lng);
    // Query all available riders from the database
    const riders = await this.knex('riders').where({ is_available: true });
    // Filter riders within 5km using geolib
    const nearbyRiders = riders.filter((rider: any) => {
      const distance = getDistance(
        { latitude: lat, longitude: lng },
        { latitude: parseFloat(rider.current_latitude), longitude: parseFloat(rider.current_longitude) }
      );
      return distance <= 5000;
    });
    // Send a targeted WebSocket notification to each nearby rider   
    for (const rider of nearbyRiders) {
      this.dispatchGateway.notifyRider(rider.id, {
        order_code: order.order_code,
        restaurant_name: calculated_order.address_details?.name,
        pickup_address: calculated_order.address_details?.address_line,
      });
    }
    return nearbyRiders;
  }

  /**
   * Publishes a new order event to RabbitMQ and notifies nearby riders.
   * @param order The order object to publish and process
   */
  async publishOrderCreatedMessage(order: any) {
    if (!this.rabbitChannel) return;
    const queue = 'order_created';
    // Publish the order to the RabbitMQ queue
    this.rabbitChannel.sendToQueue(queue, Buffer.from(JSON.stringify(order)));
    // After publishing, notify nearby riders
    await this.notifyNearbyRidersForOrder(order);
  }

  /**
   * Task 1 requirement 3 
   * Retrieves all orders along with their related logs, calculated order, order type,
   * and order total amount history using a raw SQL query with JOINs and aggregations.
   */
  async getAllOrdersWithRelatedData() {
    return this.knex.raw(`
      SELECT o.*, 
        json_agg(DISTINCT l.*) AS logs,
        json_agg(DISTINCT h.*) AS order_total_amount_history,
        to_jsonb(c) AS calculated_order,
        to_jsonb(t) AS order_type
      FROM orders o
      LEFT JOIN logs l ON l.order_id = o.id
      LEFT JOIN order_total_amount_history h ON h.order_id = o.id
      LEFT JOIN calculated_orders c ON c.id = o.calculated_order_id
      LEFT JOIN order_type t ON t.id = o.order_type_id
      GROUP BY o.id, c.id, t.id
    `);
  }

  /**
   * Finds the most bought meal by aggregating meal quantities from all calculated orders.
   * Returns the meal name and the total quantity bought.
   */
  async getMostBoughtMeal() {
    return this.knex.raw(`
      SELECT meal->>'name' AS meal_name, SUM((meal->>'quantity')::int) AS total_quantity
      FROM calculated_orders,
      LATERAL jsonb_array_elements(meals) AS brand,
      LATERAL jsonb_array_elements(brand->'meals') AS meal
      GROUP BY meal->>'name'
      ORDER BY total_quantity DESC
      LIMIT 1
    `);
  }
} 