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
var RabbitMQModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQModule = void 0;
const nestjs_discovery_1 = require("@golevelup/nestjs-discovery");
const nestjs_modules_1 = require("@golevelup/nestjs-modules");
const common_1 = require("@nestjs/common");
const external_context_creator_1 = require("@nestjs/core/helpers/external-context-creator");
const lodash_1 = require("lodash");
const connection_1 = require("./amqp/connection");
const connectionManager_1 = require("./amqp/connectionManager");
const rabbitmq_constants_1 = require("./rabbitmq.constants");
const rabbitmq_factory_1 = require("./rabbitmq.factory");
let RabbitMQModule = RabbitMQModule_1 = class RabbitMQModule extends (0, nestjs_modules_1.createConfigurableDynamicRootModule)(rabbitmq_constants_1.RABBIT_CONFIG_TOKEN, {
    providers: [
        {
            provide: connectionManager_1.AmqpConnectionManager,
            useFactory: async (config) => {
                await RabbitMQModule_1.AmqpConnectionFactory(config);
                return RabbitMQModule_1.connectionManager;
            },
            inject: [rabbitmq_constants_1.RABBIT_CONFIG_TOKEN],
        },
        {
            provide: connection_1.AmqpConnection,
            useFactory: async (config, connectionManager) => {
                return connectionManager.getConnection(config.name || 'default');
            },
            inject: [rabbitmq_constants_1.RABBIT_CONFIG_TOKEN, connectionManager_1.AmqpConnectionManager],
        },
        rabbitmq_factory_1.RabbitRpcParamsFactory,
    ],
    exports: [connectionManager_1.AmqpConnectionManager, connection_1.AmqpConnection],
}) {
    constructor(discover, externalContextCreator, rpcParamsFactory, connectionManager) {
        super();
        this.discover = discover;
        this.externalContextCreator = externalContextCreator;
        this.rpcParamsFactory = rpcParamsFactory;
        this.connectionManager = connectionManager;
        this.logger = new common_1.Logger(RabbitMQModule_1.name);
    }
    static async AmqpConnectionFactory(config) {
        const connection = new connection_1.AmqpConnection(config);
        this.connectionManager.addConnection(connection);
        await connection.init();
        const logger = config.logger || new common_1.Logger(RabbitMQModule_1.name);
        logger.log('Successfully connected to RabbitMQ');
        return connection;
    }
    static build(config) {
        const logger = config.logger || new common_1.Logger(RabbitMQModule_1.name);
        logger.warn('build() is deprecated. use forRoot() or forRootAsync() to configure RabbitMQ');
        return {
            module: RabbitMQModule_1,
            providers: [
                {
                    provide: connection_1.AmqpConnection,
                    useFactory: async () => {
                        return RabbitMQModule_1.AmqpConnectionFactory(config);
                    },
                },
                rabbitmq_factory_1.RabbitRpcParamsFactory,
            ],
            exports: [connection_1.AmqpConnection],
        };
    }
    static attach(connection) {
        return {
            module: RabbitMQModule_1,
            providers: [
                {
                    provide: connection_1.AmqpConnection,
                    useValue: connection,
                },
                rabbitmq_factory_1.RabbitRpcParamsFactory,
            ],
            exports: [connection_1.AmqpConnection],
        };
    }
    async onApplicationShutdown() {
        this.logger.verbose('Closing AMQP Connections');
        await Promise.all(this.connectionManager
            .getConnections()
            .map((connection) => connection.managedConnection.close()));
        this.connectionManager.clearConnections();
        RabbitMQModule_1.bootstrapped = false;
    }
    // eslint-disable-next-line sonarjs/cognitive-complexity
    async onApplicationBootstrap() {
        if (RabbitMQModule_1.bootstrapped) {
            return;
        }
        RabbitMQModule_1.bootstrapped = true;
        for (const connection of this.connectionManager.getConnections()) {
            if (!connection.configuration.registerHandlers) {
                this.logger.log('Skipping RabbitMQ Handlers due to configuration. This application instance will not receive messages over RabbitMQ');
                continue;
            }
            this.logger.log('Initializing RabbitMQ Handlers');
            let rabbitMeta = await this.discover.providerMethodsWithMetaAtKey(rabbitmq_constants_1.RABBIT_HANDLER);
            if (connection.configuration.enableControllerDiscovery) {
                this.logger.log('Searching for RabbitMQ Handlers in Controllers. You can not use NestJS HTTP-Requests in these controllers!');
                rabbitMeta = rabbitMeta.concat(await this.discover.controllerMethodsWithMetaAtKey(rabbitmq_constants_1.RABBIT_HANDLER));
            }
            const grouped = (0, lodash_1.groupBy)(rabbitMeta, (x) => x.discoveredMethod.parentClass.name);
            const providerKeys = Object.keys(grouped);
            for (const key of providerKeys) {
                this.logger.log(`Registering rabbitmq handlers from ${key}`);
                await Promise.all(grouped[key].map(async ({ discoveredMethod, meta: config }) => {
                    if (config.connection &&
                        config.connection !== connection.configuration.name) {
                        return;
                    }
                    const handler = this.externalContextCreator.create(discoveredMethod.parentClass.instance, discoveredMethod.handler, discoveredMethod.methodName, rabbitmq_constants_1.RABBIT_ARGS_METADATA, this.rpcParamsFactory, undefined, // contextId
                    undefined, // inquirerId
                    undefined, // options
                    'rmq' // contextType
                    );
                    const mergedConfig = Object.assign(Object.assign({}, config), connection.configuration.handlers[config.name || '']);
                    const { exchange, routingKey, queue, queueOptions } = mergedConfig;
                    const handlerDisplayName = `${discoveredMethod.parentClass.name}.${discoveredMethod.methodName} {${config.type}} -> ${
                    // eslint-disable-next-line sonarjs/no-nested-template-literals
                    (queueOptions === null || queueOptions === void 0 ? void 0 : queueOptions.channel) ? `${queueOptions.channel}::` : ''}${exchange}::${routingKey}::${queue || 'amqpgen'}`;
                    if (config.type === 'rpc' &&
                        !connection.configuration.enableDirectReplyTo) {
                        this.logger.warn(`Direct Reply-To Functionality is disabled. RPC handler ${handlerDisplayName} will not be registered`);
                        return;
                    }
                    this.logger.log(handlerDisplayName);
                    return config.type === 'rpc'
                        ? connection.createRpc(handler, mergedConfig)
                        : connection.createSubscriber(handler, mergedConfig, discoveredMethod.methodName);
                }));
            }
        }
    }
};
RabbitMQModule.connectionManager = new connectionManager_1.AmqpConnectionManager();
RabbitMQModule.bootstrapped = false;
RabbitMQModule = RabbitMQModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [nestjs_discovery_1.DiscoveryModule],
    }),
    __metadata("design:paramtypes", [nestjs_discovery_1.DiscoveryService,
        external_context_creator_1.ExternalContextCreator,
        rabbitmq_factory_1.RabbitRpcParamsFactory,
        connectionManager_1.AmqpConnectionManager])
], RabbitMQModule);
exports.RabbitMQModule = RabbitMQModule;
//# sourceMappingURL=rabbitmq.module.js.map