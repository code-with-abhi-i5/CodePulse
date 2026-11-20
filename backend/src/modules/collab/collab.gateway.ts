import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import {
  CrdtSyncService,
  CrdtOperation,
  CrdtClientAwareness,
} from './crdt-sync.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/collab',
})
export class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollabGateway.name);

  constructor(private readonly crdtSyncService: CrdtSyncService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Collab client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Collab client disconnected: ${client.id}`);
    const docId = client.data?.docId;
    const clientId = client.data?.clientId;
    if (docId && clientId) {
      this.crdtSyncService.removeAwareness(docId, clientId);
      client.to(docId).emit('awareness:remove', { clientId });
    }
  }

  /**
   * Client joins collaborative workspace session
   */
  @SubscribeMessage('crdt:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { docId: string; clientId: number; stateVector?: Record<number, number> },
  ) {
    const { docId, clientId, stateVector = {} } = payload;
    client.data.docId = docId;
    client.data.clientId = clientId;
    client.join(docId);

    const doc = this.crdtSyncService.getOrCreateDocument(docId);
    // Send missing delta updates for offline catch-up
    const missingDeltas = this.crdtSyncService.getMissingDeltas(docId, stateVector);

    return {
      event: 'crdt:sync_step1',
      data: {
        docId,
        content: doc.content,
        stateVector: doc.stateVector,
        deltas: missingDeltas,
      },
    };
  }

  /**
   * Broadcasts low-overhead binary/JSON CRDT update deltas
   */
  @SubscribeMessage('crdt:update')
  handleUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { docId: string; operation: CrdtOperation },
  ) {
    const { docId, operation } = payload;
    const { doc, applied } = this.crdtSyncService.applyUpdate(docId, operation);

    if (applied) {
      // Broadcast update to all other peers in the workspace room
      client.to(docId).emit('crdt:update', {
        docId,
        operation,
        stateVector: doc.stateVector,
      });
    }

    return { status: 'ack', applied };
  }

  /**
   * Synchronizes multi-cursor visual presence & awareness
   */
  @SubscribeMessage('crdt:awareness')
  handleAwareness(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { docId: string; awareness: CrdtClientAwareness },
  ) {
    const { docId, awareness } = payload;
    const peers = this.crdtSyncService.updateAwareness(docId, awareness);

    // Relay cursor position and avatar to peers
    client.to(docId).emit('crdt:awareness', {
      docId,
      awareness,
      peers,
    });

    return { status: 'ok', peersCount: peers.length };
  }
}

