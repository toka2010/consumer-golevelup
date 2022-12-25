"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmqpConnectionManager = void 0;
class AmqpConnectionManager {
    constructor() {
        this.connections = [];
    }
    addConnection(connection) {
        this.connections.push(connection);
    }
    getConnection(name) {
        return this.connections.find((connection) => connection.configuration.name === name);
    }
    getConnections() {
        return this.connections;
    }
    clearConnections() {
        this.connections = [];
    }
}
exports.AmqpConnectionManager = AmqpConnectionManager;
//# sourceMappingURL=connectionManager.js.map