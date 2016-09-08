DELIMITER $$
    create function f_MakeUserActive(
        p_endpoint VARCHAR(255)
    )
    returns BIGINT
    DETERMINISTIC

    BEGIN
        declare v_status BIGINT;

        select id from statuses
            where name = 'Active' into v_status;

        update users
            set status_id = v_status
            where endpoint = p_endpoint;

        return LAST_INSERT_ID();

    END $$
DELIMITER ;