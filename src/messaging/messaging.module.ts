import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'exchange',
          type: 'topic',
        },
        {
          name: 'TTL-COMMENTS',
          type: 'direct',
          createExchangeIfNotExists:true
        },
        {
          name: 'DLX-COMMENTS',
          type: 'fanout',
          createExchangeIfNotExists:true
        
        },
      ],
   
      uri: 'amqp://localhost:5672',
      enableControllerDiscovery: true,
   
    }),
  ],
  providers: [MessagingService, MessagingController],
  controllers: [MessagingController],
})
export class MessagingModule {}
