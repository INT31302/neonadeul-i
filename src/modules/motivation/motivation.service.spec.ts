import { Test, TestingModule } from '@nestjs/testing';
import { MotivationService } from './motivation.service';
import { CategoryType } from './movitation.type';
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
  it('test', () => {
    const result = new Map<CategoryType, number>();
    const map = service.weightedRandom({
      cheering: 10,
      motivation: 10,
      consolation: 0,
      name: '',
      channelId: '',
      jerry: false,
      isSubscribe: false,
      modernText: false,
      pushTime: '',
      id: '',
    });
    console.log(map);
    for (let i = 0; i < 10000; i++) {
      const randomCategory = service.getRandomCategory(map);
      if (result.has(randomCategory)) {
        result.set(randomCategory, result.get(randomCategory) + 1);
      } else {
        result.set(randomCategory, 1);
      }
    }

    console.log(result);
    for (const r of result) {
      console.log(r[0], r[1] * 0.01);
    }
  });
});
