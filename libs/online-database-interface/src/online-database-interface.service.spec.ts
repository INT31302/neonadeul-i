import { Test, TestingModule } from '@nestjs/testing';
import { OnlineDatabaseInterfaceService } from './online-database-interface.service';

describe('OnlineDatabaseInterfaceService', () => {
  let service: OnlineDatabaseInterfaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnlineDatabaseInterfaceService],
    }).compile();

    service = module.get<OnlineDatabaseInterfaceService>(OnlineDatabaseInterfaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
