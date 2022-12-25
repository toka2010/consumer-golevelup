import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MessagingService } from './messaging.service';
export declare class MessagingController {
    private _msgService;
    private readonly amqpConnection;
    constructor(_msgService: MessagingService, amqpConnection: AmqpConnection);
    interceptedRpc(message: any, req: any): Promise<void>;
}
