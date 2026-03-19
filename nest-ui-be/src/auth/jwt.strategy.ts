import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

export interface JwtPayload {
  sub: string; // user id
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // constructor(private authService: AuthService) {
  //   const secret = process.env.JWT_SECRET;
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'FATAL ERROR: JWT_SECRET environment variable is not defined. The application cannot start without it.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // Validar que el usuario existe
    const user = await this.authService.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Retornar datos del usuario (se agregan a request.user)
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
