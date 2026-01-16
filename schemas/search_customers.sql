CREATE OR REPLACE FUNCTION search_customers(
    p_search_term TEXT,
    p_status TEXT,
    p_address TEXT
)
RETURNS TABLE(
    id TEXT,
    name TEXT,
    company TEXT,
    address TEXT,
    avatar TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cd.id::TEXT,
        cd.customer_name AS name,
        cd.company,
        cd.address,
        '' AS avatar, -- Placeholder for avatar
        cd.customer_type::TEXT AS status
    FROM
        public.customer_details cd
    WHERE
        (p_search_term IS NULL OR cd.customer_name ILIKE '%' || p_search_term || '%' OR cd.email ILIKE '%' || p_search_term || '%')
    AND
        (p_status IS NULL OR cd.customer_type::text = p_status)
    AND
        (p_address IS NULL OR cd.address ILIKE '%' || p_address || '%')
    ORDER BY
        cd.created_at DESC;
END;
$$ LANGUAGE plpgsql;
