import { Controller, Get } from '@nestjs/common';
import { GetHelloUseCase } from '../../application/use-cases/get-hello.use-case.js';

@Controller()
export class AppController {
  constructor(private readonly getHelloUseCase: GetHelloUseCase) {}

  @Get()
  getHello(): string {
    return this.getHelloUseCase.execute();
  }
}
