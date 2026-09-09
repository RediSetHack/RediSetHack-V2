import { Injectable } from '@nestjs/common';
import { GetHelloUseCase } from '../use-cases/get-hello.use-case.js';

@Injectable()
export class AppService {
  constructor(private readonly getHelloUseCase: GetHelloUseCase) {}

  getHello(): string {
    return this.getHelloUseCase.execute();
  }
}
