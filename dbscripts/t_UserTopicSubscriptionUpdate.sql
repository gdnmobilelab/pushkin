DELIMITER $$
   create trigger update_historical_user_topic after update on user_topics_subscriptions
   for each row

    BEGIN

        call p_CreateHistoricalUserTopicSubscriptions(NEW.user_id, NEW.topic_id, NEW.status_id);

    END $$
DELIMITER ;