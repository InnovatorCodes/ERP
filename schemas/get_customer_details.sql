CREATE OR REPLACE FUNCTION get_customer_details(
    p_customer_id INTEGER
)
RETURNS TABLE(
    id TEXT,
    name TEXT,
    company TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    avatar TEXT,
    status TEXT,
    dateAdded TEXT,
    totalOrders INTEGER,
    totalSpend NUMERIC,
    lastOrder TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cd.id::TEXT,
        cd.customer_name AS name,
        cd.company,
        cd.email,
        cd.mobile_number AS phone,
        cd.address,
        '' AS avatar, -- Placeholder for avatar
        cd.customer_type::TEXT AS status,
        cd.created_at::TEXT AS dateAdded,
        COUNT(o.id)::INTEGER AS totalOrders,
        0::NUMERIC AS totalSpend, -- Placeholder for totalSpend, as price info is missing
        MAX(o.order_date)::TEXT AS lastOrder
    FROM
        public.customer_details cd
    LEFT JOIN
        public.orders o ON cd.id = o.customer_id
    WHERE
        cd.id = p_customer_id
    GROUP BY
        cd.id, cd.customer_name, cd.company, cd.email, cd.mobile_number, cd.address, cd.customer_type, cd.created_at;
END;
$$ LANGUAGE plpgsql;
