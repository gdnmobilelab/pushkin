DELIMITER $$
    create procedure p_AddUserToTopic(
        IN p_endpoint VARCHAR(255),
        IN p_subscription JSON,
        IN p_topic_name VARCHAR(255)
    )

    BEGIN
        declare v_user_id BIGINT;
        declare v_user_status BIGINT;
        declare v_active_status BIGINT;
        declare v_user_in_topic BIGINT;
        declare v_topic_status BIGINT;

        select id, status_id into v_user_id, v_user_status from users where endpoint = p_endpoint;
        select id from statuses where name = 'Active' into v_active_status;

        -- Create the user if it doesn't exist
        IF v_user_id IS NULL THEN
            select f_CreateUser(p_endpoint, p_subscription) into v_user_id;
        END IF;

        -- If the user exists but is inactive or not registered, reactivate
        -- how often does this occur? -- CJ
        IF v_user_status != v_active_status THEN
            select f_MakeUserActive(p_endpoint);
        END IF;

        select id from user_topics_subscriptions where
            topic_id = p_topic_name
            and user_id = v_user_id into v_user_in_topic;

        -- Create the topic if it doesn't exist, ignore if it does
        call p_CreateTopic(p_topic_name);

        -- Create or update the topic subscription
        call p_CreateUserTopicSubscriptions(v_user_id, p_topic_name, 'Active');

    END $$
DELIMITER ;