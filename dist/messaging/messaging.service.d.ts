import * as AmqpConnection from '@golevelup/nestjs-rabbitmq';
export declare class MessagingService {
    private readonly amqpConnection;
    private content;
    private _connection;
    private _operationsChannelWrapper;
    private channel;
    constructor(amqpConnection: AmqpConnection.AmqpConnection);
    onModuleInit(): Promise<void>;
    reciveMessage(payload: any, context: any): Promise<void>;
    retrySend(msg: any): void | {
        message: number;
    };
    getAttemptAndUpdatedContent(msg: any): {
        attempt: any;
        content: any;
    };
}
