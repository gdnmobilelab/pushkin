DELIMITER $$
    create function f_CreateUser(
        p_endpoint VARCHAR(255),
        p_subscription JSON
    )
    returns BIGINT
    DETERMINISTIC

    BEGIN
        declare v_status BIGINT;

        select id from statuses
            where name = 'Active' into v_status;

        insert into users(endpoint, subscription, status_id) values (p_endpoint, p_subscription, v_status);

        return LAST_INSERT_ID();

    END $$
DELIMITER ;