import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { prisma } from '@terraflow/database';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000' },
  namespace: '/terraflow-live',
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Active Connections Map: UserId -> SocketId
  private activeConnections = new Map<string, string>();
  declare private jwtService: JwtService;

  constructor(@Inject(JwtService) jwtService: JwtService) {
    this.jwtService = jwtService;
  }

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers['authorization'];
      const queryToken = client.handshake.query['token'] as string;
      
      let token = queryToken;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }

      if (!token) {
        client.disconnect(true);
        return;
      }

      // Validate JWT token and extract userId
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('JWT_SECRET not configured');
        client.disconnect(true);
        return;
      }

      let decoded: any;
      try {
        decoded = this.jwtService.verify(token, { secret });
      } catch (e) {
        console.error('JWT verification failed:', e);
        client.disconnect(true);
        return;
      }

      const userId = decoded.sub;
      if (!userId) {
        console.error('JWT token missing user ID (sub)');
        client.disconnect(true);
        return;
      }

      this.activeConnections.set(userId, client.id);
      console.log(`Socket Client Connected: ${client.id} associated to User ${userId}`);
    } catch (e) {
      console.error('Connection handler error:', e);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.activeConnections.entries()) {
      if (socketId === client.id) {
        this.activeConnections.delete(userId);
        console.log(`Socket Client Disconnected: ${client.id} (User ${userId})`);
        break;
      }
    }
  }

  @SubscribeMessage('chat:send')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { recipientId: string; content: string; senderId: string }
  ) {
    const sender = await prisma.user.findUnique({ where: { id: payload.senderId } });
    if (!sender) return;

    const message = await prisma.message.create({
      data: {
        senderId: payload.senderId,
        recipientId: payload.recipientId,
        content: payload.content,
      }
    });

    const recipientSocketId = this.activeConnections.get(payload.recipientId);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('chat:message', {
        id: message.id,
        senderId: sender.id,
        senderUsername: sender.username,
        senderName: sender.name,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      });
    }
  }

  @SubscribeMessage('location:share')
  async handleLocationSharing(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string; latitude: number; longitude: number }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        followers: {
          select: { followerId: true }
        }
      }
    });

    if (!user) return;

    // Broadcast position update to all active online followers
    for (const follower of user.followers) {
      const followerSocketId = this.activeConnections.get(follower.followerId);
      if (followerSocketId) {
        this.server.to(followerSocketId).emit('friend:location', {
          userId: user.id,
          username: user.username,
          latitude: payload.latitude,
          longitude: payload.longitude,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Push Alert Broker used by other parts of NestJS modules (e.g. Likes, Comments controller)
  sendLiveNotification(userId: string, notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    referenceId?: string;
  }) {
    const targetSocketId = this.activeConnections.get(userId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('notification:new', {
        ...notification,
        createdAt: new Date().toISOString(),
      });
    }
  }
}
