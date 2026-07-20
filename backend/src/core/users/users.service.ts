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

  findByEmail(email: string): Promise<UserEntity | undefined> {
    return Promise.resolve(this.users.find((u) => u.email === email));
  }

  create(user: UserEntity): Promise<UserEntity> {
    this.users.push(user);
    return Promise.resolve(user);
  }
}
