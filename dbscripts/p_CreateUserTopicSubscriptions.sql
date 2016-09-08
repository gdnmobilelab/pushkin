DELIMITER $$
    create procedure p_CreateUserTopicSubscriptions(
        IN p_user_id BIGINT,
        IN p_topic_id VARCHAR(255),
        IN p_status VARCHAR(500)
    )

    BEGIN
        declare v_user_topic_id BIGINT;
        declare v_user_status_id BIGINT;
        declare v_status_id BIGINT;
        declare v_out_id BIGINT;

        select id, status_id into v_user_topic_id, v_user_status_id from user_topics_subscriptions
            where user_id = p_user_id
            and topic_id = p_topic_id;

        select id from statuses
            where p_status = name
            into v_status_id;

        IF v_user_topic_id IS NULL THEN
            insert into user_topics_subscriptions (user_id, topic_id, status_id)
                values (p_user_id, p_topic_id, v_status_id);

            select LAST_INSERT_ID() INTO v_out_id;
        ELSE
            -- don't update if it's the same status
            IF v_user_status_id != v_status_id THEN
                update user_topics_subscriptions
                    set status_id = v_status_id
                    where id = v_user_topic_id;
            END IF;

            select v_user_topic_id into v_out_id;
        END IF;

        select v_out_id `id`;

    END $$
DELIMITER ;