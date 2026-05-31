import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LiveGateway } from './live.gateway.js';

@Module({
  imports: [JwtModule.register({})],
  providers: [LiveGateway],
  exports: [LiveGateway],
})
export class GatewayModule {}
