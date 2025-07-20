
## Setup Instructions

1. Clone the repo and install dependencies:
   
   npm install
   
2. Set up your `.env` file with DB and RabbitMQ credentials.

3. Run migrations:
 
   npm run migrate
   
4. Start the server:

   npm run start:dev



Documentation of endpoints 


task 1 requirement 5

POST  http://localhost:3000/orders/create   endpoint to create order and test rabbitMQ ,when creating an order rabbitMQ recives and logs to the console the order

{
  "id": "5",
  "user_id": "5",
  "completed": true,
  "cancelled": false,
  "kitchen_cancelled": false,
  "kitchen_accepted": true,
  "kitchen_dispatched": true,
  "kitchen_dispatched_time": "2023-05-17T10:38:26.190Z",
  "completed_time": "2023-05-17T11:04:38.450Z",
  "rider_id": "2",
  "kitchen_prepared": true,
  "rider_assigned": true,
  "paid": true,
  "order_code": "backend1001",
  "order_change": null,
  "calculated_order_id": "1",
  "created_at": "2023-05-17T09:47:30.455Z",
  "updated_at": "2023-05-17T11:04:38.454Z",
  "logs": [
    {
      "time": "2023-05-17T09:47:30.455Z",
      "description": "Order received in kitchen"
    }
  ],
  "kitchen_verified_time": "2023-05-17T09:47:30.455+00:00",
  "kitchen_completed_time": "2023-05-17T10:32:32.907+00:00",
  "shop_accepted": true,
  "shop_prepared": true,
  "no_of_mealbags_delivered": 0,
  "no_of_drinks_delivered": 0,
  "rider_started_time": null,
  "rider_started": false,
  "rider_arrived_time": null,
  "rider_arrived": false,
  "is_failed_trip": false,
  "failed_trip_details": {},
  "box_number": "TABLE",
  "shelf_id": null,
  "order_total_amount_history": [
    {
      "time": "2023-05-17T09:47:30.302Z",
      "total_amount": 26785
    }
  ],
  "scheduled": false,
  "confirmed_by_id": null,
  "completed_by_id": null,
  "scheduled_delivery_date": null,
  "scheduled_delivery_time": null,
  "is_hidden": false,
  "calculated_order": {
    "id": "1",
    "total_amount": "26785",
    "free_delivery": false,
    "delivery_fee": "900",
    "service_charge": "0",
    "address_details": {
      "city": "Lekki",
      "name": "Current",
      "address_line": "Lekki, Lagos, Nigeria",
      "building_number": "No."
    },
    "meals": [
      {
        "brand": {
          "id": "1",
          "name": "Jollof & Co."
        },
        "meals": [
          {
            "id": "m1",
            "new": true,
            "name": "Pepper Rice Special",
            "brand": {
              "id": "1",
              "name": "Jollof & Co."
            },
            "active": true,
            "addons": [],
            "amount": "1550",
            "images": [],
            "alcohol": false,
            "item_no": null,
            "summary": null,
            "brand_id": "1",
            "calories": " ",
            "is_addon": false,
            "is_combo": false,
            "position": 7,
            "quantity": 1,
            "home_page": false,
            "item_type": "FOOD",
            "meal_tags": [],
            "created_at": "2023-05-05T02:43:33.963Z",
            "is_deleted": false,
            "order_note": "",
            "updated_at": "2023-05-05T02:43:33.963Z",
            "description": "White rice wrapped in banana leaves served with special pepper stew",
            "minimum_age": "0",
            "posist_data": {},
            "available_no": "INFINITE",
            "meal_keywords": [],
            "internal_profit": 0,
            "meal_category_id": "3dbc3bb6-45ac-4c96-a856-302ef79d1e36"
          }
        ],
        "amount": 7080,
        "internal_profit": 0
      }
    ],
    "lat": "6.453235649711961",
    "lng": "3.542877760780109",
    "cokitchen_polygon_id": "s2",
    "user_id": "2",
    "cokitchen_id": "3",
    "pickup": false,
    "prev_price": "15030"
  },
  "order_type": {
    "id": "s1",
    "name": "CARD",
    "created_at": "2021-07-05T16:39:52.782024+00:00",
    "updated_at": "2021-07-05T16:39:52.782024+00:00"
  }
}

task 1 requirement 3 endpoint to get orders with related data
GET   http://localhost:3000/orders/get-orders


task 1 requirement 4 endpoint to get most bought meal
http://localhost:3000/orders/most-bought-meal



Task 2

task 2 requiremnet 1  endpoint to update drivers long and lat 
PUT   http://localhost:3000/riders/me/location
{
  "riderId": "1",
  "latitude": 6.453235649711961,
  "longitude": 3.542877760780109
}






## Scalability Considerations for Rider Proximity Search

For a small to medium number of riders, the system fetches all available riders and filters them in-memory using the Haversine formula (via the `geolib` library).

**For large-scale deployments (thousands of riders):**
- Use a database with native geospatial support, such as [PostGIS](https://postgis.net/).
- Perform proximity searches directly in SQL using spatial indexes for high performance.
- Example (PostGIS):
  ```sql
  SELECT *, ST_Distance(
    ST_MakePoint(current_longitude, current_latitude)::geography,
    ST_MakePoint(:order_lng, :order_lat)::geography
  ) AS distance
  FROM riders
  WHERE is_available = true
  AND ST_DWithin(
    ST_MakePoint(current_longitude, current_latitude)::geography,
    ST_MakePoint(:order_lng, :order_lat)::geography,
    5000
  )
  ORDER BY distance ASC;
  ```
- This approach is highly efficient and scales to tens of thousands of riders.

