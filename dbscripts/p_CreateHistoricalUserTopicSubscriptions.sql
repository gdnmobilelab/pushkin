DELIMITER $$
    create procedure p_CreateHistoricalUserTopicSubscriptions(
        IN p_user_id BIGINT,
        IN p_topic_id VARCHAR(255),
        IN p_status BIGINT
    )

    BEGIN

        insert into historical_user_topics_subscriptions(user_id, topic_id, status_id)
            values (p_user_id, p_topic_id, p_status);

    END $$
DELIMITER ;