DO $ $
DECLARE
    r record;
BEGIN
    FOR r IN (
        SELECT oid, conname 
        FROM pg_constraint 
        WHERE conrelid = 'quests'::regclass 
        AND contype = 'c'
    ) LOOP
        IF pg_get_constraintdef(r.oid) ILIKE '%frequency%' THEN
            EXECUTE 'ALTER TABLE quests DROP CONSTRAINT ' || quote_ident(r.conname);
        END IF;
    END LOOP;
END $ $;
