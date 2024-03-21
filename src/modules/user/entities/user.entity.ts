import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn({
    comment: 'ID',
  })
  id: string;

  @Column({
    comment: '사용자명',
    nullable: false,
  })
  name: string;

  @Column({
    comment: '채널 ID',
    nullable: false,
  })
  channelId: string;

  @Column({
    comment: '구독 여부',
    type: 'boolean',
    default: false,
  })
  isSubscribe: boolean;

  @Column({
    comment: '알림 시간',
    default: '11:00',
  })
  pushTime: string;

  @Column({
    comment: '제리 호출 여부',
    default: false,
  })
  jerry: boolean;

  @Column({
    comment: '응원 선호도',
    default: 10,
  })
  cheering: number;

  @Column({
    comment: '동기부여 선호도',
    default: 10,
  })
  motivation: number;

  @Column({
    comment: '위로 선호도',
    default: 10,
  })
  consolation: number;

  @Column({
    comment: '현대인 어록 구독 여부',
    default: false,
    name: 'modernText',
  })
  isModernText: boolean;
}
