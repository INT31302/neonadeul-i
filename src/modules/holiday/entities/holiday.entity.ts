import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Holiday {
  @PrimaryColumn({
    comment: '날짜',
    type: 'varchar',
    length: 8,
  })
  date: string;

  @Column({
    comment: '명칭',
  })
  name: string;
}
