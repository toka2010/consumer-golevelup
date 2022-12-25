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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingController = void 0;
const nestjs_rabbitmq_1 = require("@golevelup/nestjs-rabbitmq");
const common_1 = require("@nestjs/common");
const messaging_service_1 = require("./messaging.service");
let MessagingController = class MessagingController {
    constructor(_msgService, amqpConnection) {
        this._msgService = _msgService;
        this.amqpConnection = amqpConnection;
    }
    async interceptedRpc(message, req) {
        console.log('msg here', req);
        return await this._msgService.reciveMessage(message, req);
    }
};
__decorate([
    (0, nestjs_rabbitmq_1.RabbitRPC)({
        routingKey: 'key',
        exchange: 'exchange',
        queue: 'intercepted-rpc-2',
        errorBehavior: nestjs_rabbitmq_1.MessageHandlerErrorBehavior.ACK,
    }),
    __param(0, (0, nestjs_rabbitmq_1.RabbitPayload)()),
    __param(1, (0, nestjs_rabbitmq_1.RabbitRequest)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagingController.prototype, "interceptedRpc", null);
MessagingController = __decorate([
    (0, common_1.Controller)('messaging'),
    __metadata("design:paramtypes", [messaging_service_1.MessagingService,
        nestjs_rabbitmq_1.AmqpConnection])
], MessagingController);
exports.MessagingController = MessagingController;
//# sourceMappingURL=messaging.controller.js.map