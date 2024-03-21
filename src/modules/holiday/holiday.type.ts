export type HolidayType = {
  dateKind: string;
  dateName: string;
  isHoliday: string;
  locdate: number;
  seq: number;
};

export type OpenApiHolidayResponseType = {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: HolidayType[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
};
