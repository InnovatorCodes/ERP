CREATE OR REPLACE FUNCTION submit_full_order(
    p_customer_id INT4,
    p_products JSONB
)
RETURNS INT -- Returns the new order ID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id INT;
    v_product JSONB;
    v_new_product_id INT;
    v_order_item_id INT;
    v_existing_product_id INT;
BEGIN
    -- 1. Create the main order record
    INSERT INTO orders (customer_id, total_products)
    VALUES (p_customer_id, jsonb_array_length(p_products))
    RETURNING id INTO v_order_id;

    -- 2. Loop through each product in the JSONB array
    FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
    LOOP
        v_new_product_id := NULL; -- Reset for each loop

        -- Case 1: New or customized product
        IF NOT (v_product->>'is_existing_model')::BOOLEAN OR (v_product->>'is_customization')::BOOLEAN THEN
            IF v_product->>'product_type' = 'sofa' THEN
                INSERT INTO sofa_products (
                    customization, model_name, model_family_configuration, "2_seater_length", "1_seater_length",
                    reference_image_url, measurement_drawing_url, description, recliner_mechanism_mode,
                    recliner_mechanism_flip, wood_to_floor, headrest_mode, cup_holder, snack_swivel_tray,
                    daybed_headrest_mode, daybed_position, armrest_storage, storage_side, foam_density_seating,
                    foam_density_backrest, belt_details, leg_type, pvd_color, chester_option, armrest_panels,
                    polish_color, polish_finish, upholstery, upholstery_color, total_width, total_depth,
                    total_height, seat_width, seat_depth, seat_height, armrest_width, armrest_depth, purchase_count
                )
                VALUES (
                    (v_product->>'is_customization')::BOOLEAN, v_product->>'model_name', v_product->>'model_family_configuration', (v_product->>'2_seater_length')::NUMERIC, (v_product->>'1_seater_length')::NUMERIC,
                    v_product->>'reference_image_url', v_product->>'measurement_drawing_url', v_product->>'description', v_product->>'recliner_mechanism_mode',
                    v_product->>'recliner_mechanism_flip', (v_product->>'wood_to_floor')::BOOLEAN, v_product->>'headrest_mode', v_product->>'cup_holder', (v_product->>'snack_swivel_tray')::BOOLEAN,
                    v_product->>'daybed_headrest_mode', v_product->>'daybed_position', (v_product->>'armrest_storage')::BOOLEAN, v_product->>'storage_side', (v_product->>'foam_density_seating')::NUMERIC,
                    (v_product->>'foam_density_backrest')::NUMERIC, v_product->>'belt_details', v_product->>'leg_type', v_product->>'pvd_color', v_product->>'chester_option', v_product->>'armrest_panels',
                    v_product->>'polish_color', v_product->>'polish_finish', v_product->>'upholstery', v_product->>'upholstery_color', (v_product->>'total_width')::NUMERIC, (v_product->>'total_depth')::NUMERIC,
                    (v_product->>'total_height')::NUMERIC, (v_product->>'seat_width')::NUMERIC, (v_product->>'seat_depth')::NUMERIC, (v_product->>'seat_height')::NUMERIC, (v_product->>'armrest_width')::NUMERIC, (v_product->>'armrest_depth')::NUMERIC, 1
                )
                RETURNING id INTO v_new_product_id;
            ELSE -- 'bed'
                INSERT INTO bed_products (
                    customization, model_name, reference_image_url, measurement_drawing_url, description,
                    bed_size, customized_mattress_size, headboard_type, storage_option, bed_portion,
                    upholstery, upholstery_color, polish_color, polish_finish, total_width, total_depth,
                    total_height, purchase_count
                )
                VALUES (
                    (v_product->>'is_customization')::BOOLEAN, v_product->>'model_name', v_product->>'reference_image_url', v_product->>'measurement_drawing_url', v_product->>'description',
                    v_product->>'bed_size', v_product->>'customized_mattress_size', v_product->>'headboard_type', v_product->>'storage_option', v_product->>'bed_portion',
                    v_product->>'upholstery', v_product->>'upholstery_color', v_product->>'polish_color', v_product->>'polish_finish', (v_product->>'total_width')::NUMERIC, (v_product->>'total_depth')::NUMERIC,
                    (v_product->>'total_height')::NUMERIC, 1
                )
                RETURNING id INTO v_new_product_id;
            END IF;

            -- Link the new product to the order
            INSERT INTO order_items (order_id, product_type, sofa_product_id, bed_product_id, quantity, due_date)
            VALUES (
                v_order_id,
                v_product->>'product_type',
                CASE WHEN v_product->>'product_type' = 'sofa' THEN v_new_product_id ELSE NULL END,
                CASE WHEN v_product->>'product_type' = 'bed' THEN v_new_product_id ELSE NULL END,
                (v_product->>'quantity')::INT,
                (v_product->>'due_date')::DATE
            )
            RETURNING id INTO v_order_item_id;

        -- Case 2: Existing, non-customized product
        ELSE
            v_existing_product_id := (CASE
                WHEN v_product->>'product_type' = 'sofa' THEN v_product->>'sofa_product_id'
                ELSE v_product->>'bed_product_id'
            END)::INT;

            INSERT INTO order_items (order_id, product_type, sofa_product_id, bed_product_id, quantity, due_date)
            VALUES (
                v_order_id,
                v_product->>'product_type',
                (v_product->>'sofa_product_id')::INT,
                (v_product->>'bed_product_id')::INT,
                (v_product->>'quantity')::INT,
                (v_product->>'due_date')::DATE
            )
            RETURNING id INTO v_order_item_id;

            -- Increment purchase count for the existing product
            PERFORM increment_purchase_count(
                v_existing_product_id,
                v_product->>'product_type'
            );
        END IF;

        -- 3. Initialize QC checklist for the new order item
        PERFORM start_order_item_qc(v_order_item_id);

    END LOOP;

    -- 4. Return the new order ID
    RETURN v_order_id;
END;
$$;
