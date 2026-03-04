import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() credentials: { username: string; password: string }) {
    // Validar que se envíen las credenciales
    if (!credentials.username || !credentials.password) {
      throw new HttpException(
        {
          success: false,
          message: 'Username and password are required',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validación simple (reemplazar con lógica real)
    if (
      credentials.username === 'admin' &&
      credentials.password === 'admin123'
    ) {
      return {
        success: true,
        token: 'jwt-token-here',
        user: {
          username: credentials.username,
          role: 'admin',
        },
      };
    }

    // Credenciales inválidas
    throw new HttpException(
      {
        success: false,
        message: 'Invalid username or password',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
