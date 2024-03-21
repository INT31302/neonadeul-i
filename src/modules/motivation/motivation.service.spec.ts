import { Test, TestingModule } from '@nestjs/testing';
import { MotivationService } from './motivation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@src/modules/user/entities/user.entity';
import { Motivation } from '@src/modules/motivation/entities/motivation.entity';
import { Holiday } from '@src/modules/holiday/entities/holiday.entity';
import { Repository } from 'typeorm';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const mockRepository = () => ({
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockReturnThis(),
    execute: jest.fn().mockReturnThis(),
  }),
  findOneOrFail: jest.fn(),
  find: jest.fn(),
});
describe('MotivationService', () => {
  let service: MotivationService;
  let userRepository: MockRepository<User>;
  let motivationRepository: MockRepository<Motivation>;
  let holidayRepository: MockRepository<Holiday>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MotivationService,
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        { provide: getRepositoryToken(Motivation), useValue: mockRepository() },
        { provide: getRepositoryToken(Holiday), useValue: mockRepository() },
      ],
    }).compile();

    service = module.get<MotivationService>(MotivationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
