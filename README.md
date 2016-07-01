# Pushkin

A Node and AWS Lambda/SNS powered system for sending
[web notifications](https://developer.mozilla.org/en-US/docs/Web/API/notification)
with [payloads](https://developers.google.com/web/updates/2016/03/web-push-encryption?hl=en).

## Why?

Amazon SNS is able to send push notifications to both iOS and Android devices,
but not web clients. Sending these notifications is not simple as the payload
requires individual encryption for each client.

## What does it do?

Pushkin listens to SNS topics, receiving push notifications as they are sent
to iOS and Android devices. It then multiplies that message by the number
of web clients subscribed, batches them up (currently into batches of 200) and
fires Lambda instances for each batch, allowing us to send numerous notifications
simultaneously.

It uses Redis to store subscription data and the [web-push](https://github.com/marco-c/web-push)
library to encrypt messages being sent.

## Requirements

- Node 6.0 (5+ may be fine, not tested)
- Redis (or AWS Elasticache)

## Installation

Clone the repo, then run

    npm install
    
to install all dependencies. It uses the [Serverless](https://github.com/serverless/serverless)
framework to simplify deploying lambdas. More installation instructions are needed
but code can be deployed by running:

    sls dash deploy
    
Tests can be run with:

    npm run test
   
## Status

This started off as an experiment and ballooned outwards, so the code is quite
messy and the documentation is currently sparse. Sorry. I intend to fix both of
those issues when I have time to do so.
