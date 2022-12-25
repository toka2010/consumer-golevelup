import {
  AmqpConnection,
  MessageHandlerErrorBehavior,
  RabbitPayload,
  RabbitRPC,
  RabbitRequest,
} from '@golevelup/nestjs-rabbitmq';
import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagingService } from './messaging.service';

@Controller('messaging')
export class MessagingController {
  constructor(
    private _msgService: MessagingService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  @RabbitRPC({
    routingKey: 'key',
    exchange: 'exchange',
    queue: 'intercepted-rpc-2',
    errorBehavior: MessageHandlerErrorBehavior.ACK,
  })
  async interceptedRpc(@RabbitPayload() message, @RabbitRequest() req) {
    console.log('msg here', req);

    return await this._msgService.reciveMessage(message, req);
  }



}
