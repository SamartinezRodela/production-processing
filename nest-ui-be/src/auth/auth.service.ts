import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserResponse } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly usersFilePath = path.join(
    process.cwd(),
    'data',
    'users.json',
  );
  private users: User[] = [];

  constructor(private jwtService: JwtService) {}

  async onModuleInit() {
    await this.loadUsers();
    await this.createDefaultAdmin();
  }

  // ==========================================
  // GESTIÓN DE USUARIOS
  // ==========================================

  private async loadUsers(): Promise<void> {
    try {
      // Crear carpeta data si no existe
      const dataDir = path.dirname(this.usersFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Cargar usuarios si el archivo existe
      if (fs.existsSync(this.usersFilePath)) {
        const data = fs.readFileSync(this.usersFilePath, 'utf-8');
        this.users = JSON.parse(data);
      } else {
        this.users = [];
        await this.saveUsers();
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  }

  private async saveUsers(): Promise<void> {
    try {
      fs.writeFileSync(
        this.usersFilePath,
        JSON.stringify(this.users, null, 2),
        'utf-8',
      );
    } catch (error) {
      console.error('Error saving users:', error);
      throw error;
    }
  }

  private async createDefaultAdmin(): Promise<void> {
    const adminExists = this.users.find((u) => u.username === 'admin');

    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const now = new Date().toISOString();

      const admin: User = {
        id: '1',
        username: 'admin',
        passwordHash,
        role: 'admin',
        createdAt: now,
        updatedAt: now,
      };

      this.users.push(admin);
      await this.saveUsers();
      console.log(
        '✅ Default admin user created (username: admin, password: admin123)',
      );
    }
  }

  // ==========================================
  // AUTENTICACIÓN
  // ==========================================

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Buscar usuario
    const user = this.users.find((u) => u.username === username);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Generar token JWT
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async register(registerDto: RegisterDto) {
    const { username, password, role } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = this.users.find((u) => u.username === username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    // Crear nuevo usuario
    const newUser: User = {
      id: (this.users.length + 1).toString(),
      username,
      passwordHash,
      role,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(newUser);
    await this.saveUsers();

    return {
      success: true,
      user: this.sanitizeUser(newUser),
    };
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserResponse | null> {
    const user = this.users.find((u) => u.username === username);

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return this.sanitizeUser(user);
    }

    return null;
  }

  // ==========================================
  // BÚSQUEDA DE USUARIOS
  // ==========================================

  async findUserById(id: string): Promise<UserResponse | null> {
    const user = this.users.find((u) => u.id === id);
    return user ? this.sanitizeUser(user) : null;
  }

  async findUserByUsername(username: string): Promise<UserResponse | null> {
    const user = this.users.find((u) => u.username === username);
    return user ? this.sanitizeUser(user) : null;
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  private sanitizeUser(user: User): UserResponse {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = this.users.find((u) => u.id === userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verificar contraseña antigua
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    // Actualizar contraseña
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date().toISOString();

    await this.saveUsers();

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}
