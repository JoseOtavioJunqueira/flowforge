import { Injectable } from '@nestjs/common';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  // Placeholder em memória apenas para fins de demonstração.
  private readonly users: UserEntity[] = [];

  async findByEmail(email: string): Promise<UserEntity | undefined> {
    return this.users.find((u) => u.email === email);
  }

  async create(user: UserEntity): Promise<UserEntity> {
    this.users.push(user);
    return user;
  }
}

