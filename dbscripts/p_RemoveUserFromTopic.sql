DELIMITER $$
    create procedure p_RemoveUserFromTopic(
        IN p_endpoint VARCHAR(255),
        IN p_topic_name VARCHAR(255)
    )

    BEGIN
        declare v_user_id BIGINT;

        select id from users where endpoint = p_endpoint into v_user_id;

        call p_CreateUserTopicSubscriptions(v_user_id, p_topic_name, 'Inactive');

    END $$
DELIMITER ;