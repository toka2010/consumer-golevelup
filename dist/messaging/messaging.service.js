"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const AmqpConnection = require("@golevelup/nestjs-rabbitmq");
const common_1 = require("@nestjs/common");
const amqp = require("amqp-connection-manager");
let MessagingService = class MessagingService {
    constructor(amqpConnection) {
        this.amqpConnection = amqpConnection;
    }
    async onModuleInit() {
        await new Promise(async (resolve, reject) => {
            this._connection = amqp.connect('amqp://localhost:5672');
            this._operationsChannelWrapper = await this._connection.createChannel({
                setup: function (channel) {
                    return Promise.all([]
                        .concat(channel.assertExchange('TTL-COMMENTS', 'direct', {
                        durable: true,
                    }))
                        .concat(channel.assertExchange('DLX-COMMENTS', 'fanout', {
                        durable: true,
                    }))
                        .concat(channel.assertQueue('intercepted-rpc-2', { durable: true }))
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
                        .concat(channel.bindQueue('comments-retry-1-30s', 'TTL-COMMENTS', 'retry-1'), channel.bindQueue('comments-retry-2-10m', 'TTL-COMMENTS', 'retry-2'), channel.bindQueue('comments-retry-3-48h', 'TTL-COMMENTS', 'retry-3')));
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
                common_1.Logger.warn(`redliver the msg`);
                this.retrySend(context);
            }
            common_1.Logger.log(`Burger for is ready 😋`);
            throw new common_1.UnauthorizedException('error');
        }
        catch (_) {
            common_1.Logger.warn(`An error occured while preparing the burger for .`);
            this.retrySend(context);
        }
    }
    retrySend(msg) {
        try {
            const { attempt, content } = this.getAttemptAndUpdatedContent(msg);
            console.log('data', attempt, content);
            if (attempt <= 3) {
                const routingKey = `retry-${attempt}`;
                return this.amqpConnection.publish('TTL-COMMENTS', routingKey, Buffer.from(JSON.stringify(Object.assign({}, content))));
            }
            else {
                console.log('sended last time');
                return {
                    message: 42,
                };
            }
        }
        catch (err) {
            console.log('err', err);
        }
    }
    getAttemptAndUpdatedContent(msg) {
        var _a;
        this.content = JSON.parse(msg.content);
        this.content.try_attempt = ((_a = this.content) === null || _a === void 0 ? void 0 : _a.try_attempt)
            ? ++this.content.try_attempt
            : 1;
        const attempt = this.content.try_attempt;
        return { attempt, content: this.content };
    }
};
MessagingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AmqpConnection.AmqpConnection])
], MessagingService);
exports.MessagingService = MessagingService;
//# sourceMappingURL=messaging.service.js.map