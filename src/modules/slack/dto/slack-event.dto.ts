export class SlackEventDto {
  client_msg_id?: string;
  bot_id?: string;
  type: string;
  text: string;
  user: string;
  ts: string;
  team: string;
  blocks: any[];
  channel: string;
  event_ts: string;
  channel_type: string;
  bot_profile: BotProfile;
}

export class BotProfile {
  id: string;
  deleted: boolean;
  name: string;
  updated: number;
  app_id: string;
  icons: any;
  team_id: string;
}
