DELIMITER $$
    create procedure p_CreateNotificationLog(
        IN p_topic_name VARCHAR(2000),
        IN p_total_sent BIGINT,
        IN p_total_not_registered BIGINT,
        IN p_total_internal_server_error BIGINT
    )

    BEGIN

        -- in case the topic doesn't exist
        call p_CreateTopic(p_topic_name);

        insert into notification_log
            (topic_id, total_sent, total_not_registered, total_internal_server_error)
            values
            (p_topic_name, p_total_sent, p_total_not_registered, p_total_internal_server_error);

        select LAST_INSERT_ID() `id`;

    END $$
DELIMITER ;