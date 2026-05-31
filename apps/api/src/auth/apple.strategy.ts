import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt'; // Using JWT extraction model matching Apple auth handshakes

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  private static isAppleEnabled(): boolean {
    const clientID = process.env.APPLE_CLIENT_ID;
    const teamID = process.env.APPLE_TEAM_ID;
    const privateKey = process.env.APPLE_PRIVATE_KEY;

    if (!clientID || !teamID || !privateKey) return false;
    if (clientID.includes('placeholder') || teamID.includes('placeholder')) return false;

    return true;
  }

  constructor() {
    // Standard Passport initializations require base verification strategy config
    super({
      jwtFromRequest: (req: any) => null, // Stubs for Apple token exchange validation
      ignoreExpiration: true,
      secretOrKey: (() => {
        if (!process.env.APPLE_PRIVATE_KEY) {
          throw new Error('APPLE_PRIVATE_KEY environment variable is required');
        }
        return process.env.APPLE_PRIVATE_KEY;
      })(),
    });

    if (!AppleStrategy.isAppleEnabled()) {
      console.log('ℹ️  [Terraflow Auth]: Apple Sign-In is disabled by default. Production client keys are missing.');
    }
  }

  // Active validation gate check triggered when routing redirects are requested
  validateAppleGate() {
    if (!AppleStrategy.isAppleEnabled()) {
      throw new ServiceUnavailableException(
        'Apple Sign-In is currently disabled. Please supply production client developer credentials in environment variables to activate.'
      );
    }
  }
}
