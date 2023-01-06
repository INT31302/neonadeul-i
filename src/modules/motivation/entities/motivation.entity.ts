import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CategoryType } from '@src/modules/motivation/movitation.type';

@Entity()
export class Motivation {
  @PrimaryGeneratedColumn({
    comment: 'ID',
    type: 'integer',
    unsigned: true,
  })
  id: number;

  @Column({
    comment: '내용',
  })
  contents: string;

  @Column({
    comment: '카테고리',
    enum: CategoryType,
    default: CategoryType.기타,
    type: 'enum',
  })
  category: CategoryType;
}
