-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.bed_products (
  id integer NOT NULL DEFAULT nextval('bed_products_id_seq'::regclass),
  model_name text NOT NULL,
  reference_image_url text,
  measurement_drawing_url text,
  description text,
  bed_size text CHECK (bed_size = ANY (ARRAY['king'::text, 'queen'::text, 'customized'::text])),
  customized_mattress_size text,
  headboard_type text CHECK (headboard_type = ANY (ARRAY['medium_back_4ft'::text, 'high_back_4_5ft'::text])),
  storage_option text CHECK (storage_option = ANY (ARRAY['hydraulic'::text, 'channel'::text, 'motorised'::text, 'without_storage'::text])),
  bed_portion text CHECK (bed_portion = ANY (ARRAY['single'::text, 'double'::text])),
  total_width numeric,
  total_depth numeric,
  total_height numeric,
  upholstery text CHECK (upholstery = ANY (ARRAY['fabric'::text, 'pu'::text, 'leather_bloom'::text, 'leather_floater'::text, 'leather_floater_max'::text, 'leather_platinum_max'::text, 'leather_european_nappa'::text, 'leather_smoothy_nappa'::text, 'pu_leather'::text])),
  upholstery_color text,
  polish_color text,
  polish_finish text CHECK (polish_finish = ANY (ARRAY['matt_finish'::text, 'glossy_finish'::text])),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  customization boolean NOT NULL DEFAULT true,
  purchase_count integer NOT NULL DEFAULT 0,
  CONSTRAINT bed_products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.checks (
  check_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  stage_id smallint NOT NULL,
  name text NOT NULL,
  sequence integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT checks_pkey PRIMARY KEY (check_id),
  CONSTRAINT checks_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.stages(stage_id)
);
CREATE TABLE public.customer_details (
  id integer NOT NULL DEFAULT nextval('customer_details_id_seq'::regclass),
  customer_name text NOT NULL,
  address text NOT NULL,
  mobile_number text NOT NULL,
  pi_number text,
  floor_number text,
  main_door_width numeric,
  main_door_height numeric,
  elevator_width numeric,
  elevator_depth numeric,
  hall_door_width numeric,
  hall_door_depth numeric,
  living_room_door_width numeric,
  living_room_door_depth numeric,
  bedroom_door_width numeric,
  bedroom_door_depth numeric,
  balcony_door_width numeric,
  balcony_door_depth numeric,
  furniture_required_width numeric,
  furniture_required_depth numeric,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  email text NOT NULL,
  company text,
  customer_type USER-DEFINED NOT NULL,
  CONSTRAINT customer_details_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_item_stage_status (
  order_item_id bigint NOT NULL,
  stage_id smallint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status USER-DEFINED NOT NULL DEFAULT 'pending'::stage_status_enum,
  CONSTRAINT order_item_stage_status_pkey PRIMARY KEY (order_item_id, stage_id),
  CONSTRAINT order_item_stage_status_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id),
  CONSTRAINT order_item_stage_status_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.stages(stage_id)
);
CREATE TABLE public.order_items (
  id integer NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id integer,
  product_type text NOT NULL CHECK (product_type = ANY (ARRAY['sofa'::text, 'bed'::text])),
  sofa_product_id integer,
  bed_product_id integer,
  no_of_pillow integer DEFAULT 0,
  quantity integer DEFAULT 1,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_date date,
  priority integer NOT NULL DEFAULT 1,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_bed_product_id_fkey FOREIGN KEY (bed_product_id) REFERENCES public.bed_products(id),
  CONSTRAINT order_items_sofa_product_id_fkey FOREIGN KEY (sofa_product_id) REFERENCES public.sofa_products(id)
);
CREATE TABLE public.orders (
  id integer NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  customer_id integer,
  total_products integer NOT NULL,
  order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer_details(id)
);
CREATE TABLE public.product_checklist_progress (
  order_item_id integer NOT NULL,
  check_id integer NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::check_status,
  failure_report text,
  inspected_by uuid,
  updated_at timestamp with time zone,
  CONSTRAINT product_checklist_progress_pkey PRIMARY KEY (order_item_id, check_id),
  CONSTRAINT product_checklist_progress_check_id_fkey FOREIGN KEY (check_id) REFERENCES public.checks(check_id),
  CONSTRAINT product_checklist_progress_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone,
  full_name text,
  role USER-DEFINED NOT NULL DEFAULT 'production manager'::user_role,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.sofa_products (
  id integer NOT NULL DEFAULT nextval('sofa_products_id_seq'::regclass),
  model_name text NOT NULL UNIQUE,
  reference_image_url text,
  measurement_drawing_url text,
  description text,
  recliner_mechanism_mode text CHECK (recliner_mechanism_mode IS NULL OR (recliner_mechanism_mode = ANY (ARRAY['manual'::text, 'motorized_single'::text, 'motorized_double'::text]))),
  recliner_mechanism_flip text CHECK (recliner_mechanism_flip IS NULL OR (recliner_mechanism_flip = ANY (ARRAY['single_flip'::text, 'double_flip'::text, 'double_motor_with_headrest'::text]))),
  wood_to_floor boolean DEFAULT true,
  headrest_mode text NOT NULL CHECK (headrest_mode = ANY (ARRAY['manual'::text, 'motorized'::text, 'fixed'::text])),
  cup_holder text CHECK (cup_holder = ANY (ARRAY['normal_push_back'::text, 'chiller_cup'::text])),
  snack_swivel_tray boolean DEFAULT false,
  daybed_headrest_mode text CHECK (daybed_headrest_mode IS NULL OR (daybed_headrest_mode = ANY (ARRAY['manual'::text, 'motorized'::text, 'fixed'::text]))),
  daybed_position text CHECK (daybed_position = ANY (ARRAY['rhs'::text, 'lhs'::text])),
  armrest_storage boolean DEFAULT false,
  storage_side text CHECK (storage_side = ANY (ARRAY['rhs_arm'::text, 'lhs_arm'::text, 'both_arm'::text])),
  foam_density_seating numeric,
  foam_density_backrest numeric,
  belt_details text CHECK (belt_details = ANY (ARRAY['elastic_belt'::text, 'zig_zag_spring'::text, 'pocket_spring'::text])),
  leg_type text CHECK (leg_type = ANY (ARRAY['wood'::text, 'pvd'::text, 'ss'::text])),
  pvd_color text,
  chester_option text NOT NULL CHECK (chester_option = ANY (ARRAY['with_button'::text, 'without_button'::text, 'no_chester'::text])),
  armrest_panels text,
  polish_color text,
  polish_finish text CHECK (polish_finish = ANY (ARRAY['matt_finish'::text, 'glossy_finish'::text])),
  total_width numeric,
  total_depth numeric,
  total_height numeric,
  seat_height numeric,
  seat_depth numeric,
  seat_width numeric,
  armrest_width numeric,
  armrest_depth numeric,
  upholstery text CHECK (upholstery = ANY (ARRAY['fabric'::text, 'pu'::text, 'leather_bloom'::text, 'leather_floater'::text, 'leather_floater_max'::text, 'leather_platinum_max'::text, 'leather_european_nappa'::text, 'leather_smoothy_nappa'::text, 'pu_leather'::text])),
  upholstery_color text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  customization boolean NOT NULL DEFAULT true,
  purchase_count integer NOT NULL DEFAULT 0,
  model_family_configuration USER-DEFINED NOT NULL,
  2_seater_length integer,
  1_seater_length integer,
  CONSTRAINT sofa_products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.stage_dependencies (
  stage_id bigint NOT NULL,
  depends_on_stage_id bigint NOT NULL,
  CONSTRAINT stage_dependencies_pkey PRIMARY KEY (stage_id, depends_on_stage_id),
  CONSTRAINT stage_dependencies_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.stages(stage_id),
  CONSTRAINT stage_dependencies_depends_on_stage_id_fkey FOREIGN KEY (depends_on_stage_id) REFERENCES public.stages(stage_id)
);
CREATE TABLE public.stages (
  stage_id smallint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stages_pkey PRIMARY KEY (stage_id)
);