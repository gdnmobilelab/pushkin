create database if not exists pushkin;

use pushkin;

create table if not exists statuses (
    id BIGINT PRIMARY KEY,
    name VARCHAR(500)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

insert into statuses (id, name)
values (0, 'Active'),
(1, 'Inactive'),
(2, 'Not Registered');

create table if not exists users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(255) UNIQUE NOT NULL,
    subscription JSON NOT NULL,
    status_id BIGINT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY FK_status_id (status_id) REFERENCES statuses(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

create table if not exists topics (
    name VARCHAR(255) UNIQUE NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

create table if not exists user_topics_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    topic_id VARCHAR(255) NOT NULL,
    status_id BIGINT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY FK_status_id (status_id) REFERENCES statuses (id),
    FOREIGN KEY FK_user_id (user_id) REFERENCES users (id),
    FOREIGN KEY FK_topic_id (topic_id) REFERENCES topics (name)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

create table if not exists historical_user_topics_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    topic_id VARCHAR(255) NOT NULL,
    status_id BIGINT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY FK_status_id (status_id) REFERENCES statuses (id),
    FOREIGN KEY FK_user_id (user_id) REFERENCES users (id),
    FOREIGN KEY FK_topic_id (topic_id) REFERENCES topics (name)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

create table notification_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    topic_id VARCHAR(255) NOT NULL,
    total_sent BIGINT,
    total_not_registered BIGINT DEFAULT 0,
    total_internal_server_error BIGINT DEFAULT 0,
    FOREIGN KEY FK_topic_id (topic_id) REFERENCES topics (name)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;