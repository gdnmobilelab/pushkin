DELIMITER $$
    create procedure p_CreateTopic(
        IN p_topic_name VARCHAR(2000)
    )

    BEGIN

        insert ignore into topics (name) values (p_topic_name);

    END $$
DELIMITER ;