"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingModule = void 0;
const common_1 = require("@nestjs/common");
const messaging_service_1 = require("./messaging.service");
const messaging_controller_1 = require("./messaging.controller");
const nestjs_rabbitmq_1 = require("@golevelup/nestjs-rabbitmq");
let MessagingModule = class MessagingModule {
};
MessagingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_rabbitmq_1.RabbitMQModule.forRoot(nestjs_rabbitmq_1.RabbitMQModule, {
                exchanges: [
                    {
                        name: 'exchange',
                        type: 'topic',
                    },
                    {
                        name: 'TTL-COMMENTS',
                        type: 'direct',
                        createExchangeIfNotExists: true
                    },
                    {
                        name: 'DLX-COMMENTS',
                        type: 'fanout',
                        createExchangeIfNotExists: true
                    },
                ],
                uri: 'amqp://localhost:5672',
                enableControllerDiscovery: true,
            }),
        ],
        providers: [messaging_service_1.MessagingService, messaging_controller_1.MessagingController],
        controllers: [messaging_controller_1.MessagingController],
    })
], MessagingModule);
exports.MessagingModule = MessagingModule;
//# sourceMappingURL=messaging.module.js.map