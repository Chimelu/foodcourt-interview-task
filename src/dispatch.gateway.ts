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

interface RiderLocationUpdate {
  riderId: string;
  latitude: number;
  longitude: number;
}

@WebSocketGateway({ namespace: '/dispatch', cors: true })
export class DispatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map riderId to socketId for targeted notifications
  private riderSocketMap = new Map<string, string>();

  handleConnection(client: Socket) {
//log connection 
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    // Remove from riderSocketMap if present
    for (const [riderId, socketId] of this.riderSocketMap.entries()) {
      if (socketId === client.id) {
        this.riderSocketMap.delete(riderId);
        break;
      }
    }
    console.log('Client disconnected:', client.id);
  }

  
  broadcastRiderLocation(update: RiderLocationUpdate) {
    this.server.emit('rider-location-update', update);
    console.log(update);
    
  }

  // Allow riders to register their socket for targeted notifications
  @SubscribeMessage('register-rider')
  handleRegisterRider(@ConnectedSocket() client: Socket, @MessageBody() data: { riderId: string }) {
    this.riderSocketMap.set(data.riderId, client.id);
    client.join(data.riderId); // Join a room for this rider
    return { message: 'Rider registered for notifications' };
  }

  // Send a targeted message to a specific rider
  notifyRider(riderId: string, payload: any) {
    const socketId = this.riderSocketMap.get(riderId);
    if (socketId) {
      this.server.to(socketId).emit('order-assignment', payload);
    }
  }


  @SubscribeMessage('register-dispatch')
  handleRegisterDispatch(@ConnectedSocket() client: Socket) {
    client.join('dispatch');
    return { message: 'Dispatch registered' };
  }
} 