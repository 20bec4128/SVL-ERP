import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { useToast } from "../components/system/ToastProvider";
import logger from "../utils/logger";

export default function QueryProvider({ children }) {
  const { showError, showSuccess } = useToast();

  const [queryClient] = useState(() => {
    const notifyQueryError = (error) => {
      logger.error("Query request error", { error });
      showError("Request failed. Please try again.");
    };

    const notifyMutationError = (error) => {
      logger.error("Mutation request error", { error });
      showError("Action failed. Please try again.");
    };

    const notifyMutationSuccess = () => {
      showSuccess("Action completed successfully.");
    };

    return new QueryClient({
      queryCache: new QueryCache({
        onError: notifyQueryError,
      }),
      mutationCache: new MutationCache({
        onError: notifyMutationError,
        onSuccess: notifyMutationSuccess,
      }),
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          retry: 1,
          keepPreviousData: true,
          refetchOnWindowFocus: false,
          onError: notifyQueryError,
        },
        mutations: {
          retry: 1,
          onError: notifyMutationError,
          onSuccess: notifyMutationSuccess,
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
