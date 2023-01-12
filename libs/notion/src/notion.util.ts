import { CategoryType } from '@src/modules/motivation/movitation.type';
import { CreatePageParameters } from '@notionhq/client/build/src/api-endpoints';

export const getMessageSuggestPage = (
  date: string,
  message: string,
  category: CategoryType,
  databaseId: string,
): CreatePageParameters => {
  return {
    parent: { type: 'database_id', database_id: databaseId },
    properties: {
      날짜: {
        title: [
          {
            text: {
              content: date,
            },
          },
        ],
      },
      글귀: {
        rich_text: [
          {
            text: {
              content: message,
            },
          },
        ],
      },
      카테고리: {
        type: 'select',
        select: { name: CategoryType[category] },
      },
    },
  };
};
