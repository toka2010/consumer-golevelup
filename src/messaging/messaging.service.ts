import * as AmqpConnection from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Channel } from 'amqplib';
import * as amqp from 'amqp-connection-manager';
@Injectable()
export class MessagingService {
  private content;

  private _connection: amqp.AmqpConnectionManager;
  private _operationsChannelWrapper: amqp.ChannelWrapper;
  private channel: Channel;
  constructor(private readonly amqpConnection: AmqpConnection.AmqpConnection) {}

  async onModuleInit(): Promise<void> {
    await new Promise<void>(async (resolve, reject) => {
      this._connection = amqp.connect('amqp://localhost:5672');
      this._operationsChannelWrapper = await this._connection.createChannel({
        setup: function (channel: Channel) {
          return Promise.all(
            []
              .concat(
                channel.assertExchange('TTL-COMMENTS', 'direct', {
                  durable: true,
                }),
              )
              .concat(
                channel.assertExchange('DLX-COMMENTS', 'fanout', {
                  durable: true,
                }),
              )
              .concat(
                channel.assertQueue('intercepted-rpc-2', { durable: true }),
              )
              .concat([
                channel.assertQueue('comments-retry-1-30s', {
                  durable: true,
                  deadLetterExchange: 'DLX-COMMENTS',
                  messageTtl: 30000,
                }),
                channel.assertQueue('comments-retry-2-10m', {
                  durable: true,
                  deadLetterExchange: 'DLX-COMMENTS',
                  messageTtl: 60000,
                }),
                channel.assertQueue('comments-retry-3-48h', {
                  durable: true,
                  deadLetterExchange: 'DLX-COMMENTS',
                  messageTtl: 120000,
                }),
              ])

              .concat(channel.bindQueue('intercepted-rpc-2', 'DLX-COMMENTS'))
              .concat(
                channel.bindQueue(
                  'comments-retry-1-30s',
                  'TTL-COMMENTS',
                  'retry-1',
                ),
                channel.bindQueue(
                  'comments-retry-2-10m',
                  'TTL-COMMENTS',
                  'retry-2',
                ),
                channel.bindQueue(
                  'comments-retry-3-48h',
                  'TTL-COMMENTS',
                  'retry-3',
                ),
              ),
          );
        },
      });

      this._connection.on('connect', function () {
        console.log('[!] AMQP Connected: ');
        resolve();
      });

      this._connection.on('disconnect', function (params) {
        console.log('[!] AMQP Disconnected: ', params.err.stack);
      });
    });
  }
  async reciveMessage(payload, context) {
    try {
      if (context.fields.redelivered) {
        Logger.warn(`redliver the msg`);
        this.retrySend(context);
      }

      Logger.log(`Burger for is ready 😋`);

      throw new UnauthorizedException('error');
    } catch (_) {
      Logger.warn(`An error occured while preparing the burger for .`);
      this.retrySend(context);
    }
  }

  retrySend(msg) {
    try {
      const { attempt, content } = this.getAttemptAndUpdatedContent(msg);
      console.log('data', attempt, content);

      if (attempt <= 3) {
        const routingKey = `retry-${attempt}`;

        return this.amqpConnection.publish(
          'TTL-COMMENTS',
          routingKey,
          Buffer.from(
            JSON.stringify({
              ...content,
            }),
          ),
        );
      } else {
        console.log('sended last time');
        return {
          message: 42,
        };
      }
    } catch (err) {
      console.log('err', err);
    }
  }
  getAttemptAndUpdatedContent(msg) {
    this.content = JSON.parse(msg.content);
    this.content.try_attempt = this.content?.try_attempt
      ? ++this.content.try_attempt
      : 1;
    const attempt = this.content.try_attempt;
    return { attempt, content: this.content };
  }
}
