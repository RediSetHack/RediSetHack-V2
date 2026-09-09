import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './presentation/controllers/app.controller.js';
import { GetHelloUseCase } from './application/use-cases/get-hello.use-case.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [GetHelloUseCase],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
