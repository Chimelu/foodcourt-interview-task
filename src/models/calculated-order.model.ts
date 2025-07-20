export interface AddressDetails {
  city: string;
  name: string;
  address_line: string;
  building_number: string;
}

export interface CalculatedOrderMealAddon {
  id: string;
  amount: number;
  meal_id: string;
  meal_data: object;
  created_at: Date;
  updated_at: Date;
  meal_addon_id: string;
  internal_profit: number;
  min_selection_no: string;
  meal_addon_category_id: string;
}

export interface CalculatedOrderMeal {
  id: string;
  name: string;
  brand: object;
  active: boolean;
  addons: CalculatedOrderMealAddon[];
  amount: number;
  images: string[];
  alcohol: boolean;
  item_no: string | null;
  summary: string | null;
  brand_id: string;
  calories: string;
  is_addon: boolean;
  is_combo: boolean;
  position: number;
  quantity: number;
  home_page: boolean;
  item_type: string;
  meal_tags: string[];
  created_at: Date;
  is_deleted: boolean;
  order_note: string;
  updated_at: Date;
  description: string;
  minimum_age: string;
  posist_data: object;
  available_no: string;
  meal_keywords: string[];
  internal_profit: number;
  meal_category_id: string;
}

export interface CalculatedOrderBrand {
  brand: object;
  meals: CalculatedOrderMeal[];
  amount: number;
  internal_profit: number;
}

export interface CalculatedOrder {
  id: string;
  total_amount: number;
  free_delivery: boolean;
  delivery_fee: number;
  service_charge: number;
  address_details: AddressDetails;
  meals: CalculatedOrderBrand[];
  lat: string;
  lng: string;
  cokitchen_polygon_id: string;
  user_id: string;
  cokitchen_id: string;
  pickup: boolean;
  prev_price: number;
} 