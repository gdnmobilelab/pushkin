DELIMITER $$
    create procedure p_MarkUserNotRegistered(
        IN p_endpoint VARCHAR(255)
    )

    BEGIN
        declare v_user_id BIGINT;
        declare v_status BIGINT;

        select id from users where endpoint = p_endpoint into v_user_id;

        select id from statuses
            where name = 'Not Registered' into v_status;

        update users
            set status_id = v_status
            where id = v_user_id;

        update user_topics_subscriptions
            set status_id = v_status
            where user_id = v_user_id
            and status_id != v_status;

        select LAST_INSERT_ID() `id`;

    END $$
DELIMITER ;