export type iMemberClicksError = {
  error: string;
  error_description: string;
};

export type iMemberClicksProfilesResult = {
  totalCount: number;
  count: number;
  pageNumber: number;
  pageSize: number;
  totalPageCount: number;
  firstPageUrl: string;
  previousPageUrl?: string;
  nextPageUrl?: string;
  lastPageUrl: string;
  profiles: iMemberClicksProfileAttributes[];
};

export type iMemberClicksProfileAttributes = {
  "[Profile ID]": number;
  "[Name | Prefix]": string;
  "[Name | First]": string;
  "[Name | Middle]": string;
  "[Name | Last]": string;
  "[Name | Suffix]": string;
  "[Contact Name]": string;
  "[Email | Primary]": string;
  "[Email | Work]": string;
  "[Email | Home]": string;
  "[Address | Primary | Line 1]": string;
  "[Address | Primary | Line 2]": string;
  "[Address | Primary | City]": string;
  "[Address | Primary | State]": string;
  "[Address | Primary | Zip]": string;
  "[Address | Primary | Country]": string;
  "[Address | Business | Line 1]": string;
  "[Address | Business | Line 2]": string;
  "[Address | Business | City]": string;
  "[Address | Business | State]": string;
  "[Address | Business | Zip]": string;
  "[Address | Business | Country]": string;
  "[Address | Home | Line 1]": string;
  "[Address | Home | Line 2]": string;
  "[Address | Home | City]": string;
  "[Address | Home | State]": string;
  "[Address | Home | Zip]": string;
  "[Address | Home | Country]": string;
  "[Address | Mailing | Line 1]": string;
  "[Address | Mailing | Line 2]": string;
  "[Address | Mailing | City]": string;
  "[Address | Mailing | State]": string;
  "[Address | Mailing | Zip]": string;
  "[Address | Mailing | Country]": string;
  "[Phone | Primary]": string;
  "[Phone | Home]": string;
  "[Phone | Mobile]": string;
  "[Phone | Office]": string;
  "[Phone | Fax]": string;
  "[Organization]": string;
  Birthday: string;
  "Board Position": string[];
  Certificate: string;
  Country: string[];
  Gender: string[];
  "Graduation Year": string;
  Image: string;
  Notes: string;
  School: string;
  Sports: string[];
  State: string[];
  Website: string;
  "[Created Date]": string;
  "[Expiration Date]": string;
  "[Group]": string[];
  "[Join Date]": string;
  "[Last Renewal Date]": string;
  "[Last Modified Date]": string;
  "[Member Status]": string;
  "[Member Number]": number;
  "[Member Type]": string;
  "[Username]": string;
  "[Deleted]": boolean;
  "[Profile URL]": string;
  [key: string]: any;
};

export type iMemberClicksProfileSearchResult = {
  timestamp: number;
  status: number;
  message: string;
  id: string;
  url: string;
  item: {
    id: string;
    expireDate: string;
    [key: string]: any;
  };
  profilesUrl: string;
};

export type iMemberClicksProfileSearchError = {
  timestamp: number;
  status: number;
  error: string;
  message: string;
  messageDetails: {
    field: string;
    message: string;
  }[];
  path: string;
  parameters: any;
};

export type iMemberClicksAccessTokenResponse = {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: string;
  scope: string;
  serviceId: string;
  userId: string;
  jti: string;
};
