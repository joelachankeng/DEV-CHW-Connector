import { InMemoryCache } from "@apollo/client/cache/inmemory/inMemoryCache.js";
import {
  ApolloClient,
  DefaultOptions,
} from "@apollo/client/core/ApolloClient.js";
import { createHttpLink } from "@apollo/client/link/http/createHttpLink.js";
import { setContext } from "@apollo/client/link/context/context.cjs";
import { APP_KEYS } from "~/session.server";

export const WPCredentials = btoa(
  `${APP_KEYS.PRIVATE.WP_ADMIN_USERNAME}:${APP_KEYS.PRIVATE.WP_ADMIN_PASSWORD}`,
);

const link = createHttpLink({
  uri: APP_KEYS.PRIVATE.GRAPHQL_URL,
  credentials: "include",
});

const authLink = setContext((_: any, { headers }: any) => {
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      Authorization: "Basic " + WPCredentials,
    },
  };
});

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: "no-cache",
  },
  query: {
    fetchPolicy: "no-cache",
  },
};

export const client = new ApolloClient({
  ssrMode: true,
  cache: new InMemoryCache(),
  link: authLink.concat(link),
  defaultOptions: defaultOptions,
});
