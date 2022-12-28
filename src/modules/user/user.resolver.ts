import { Logger } from '@nestjs/common';
import { UserService } from './user.service';

export class UserResolver {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(private readonly userService: UserService) {}

  findAll() {
    return this.userService.findAll();
  }
}
